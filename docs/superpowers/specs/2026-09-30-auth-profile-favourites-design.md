# Auth, Profile, and Favourites Design

## Scope

This design covers Teik Fei's complete owned workstream: email/password registration and login, authenticated profile management, account deletion, favourite-location management, and the corresponding mobile frontend pages. It implements FR1-FR2, FR35-FR39, NFR4, NFR6, and UC-10 through UC-13.

Phone-number registration is outside this implementation because the current API contract defines email registration only. Supabase Auth remains the credential authority and is responsible for password hashing.

## Architecture

The React frontend communicates only with the documented Express API. Express validates requests, verifies bearer tokens, calls Supabase Auth or PostgreSQL through the Supabase SDK, and returns contract-shaped JSON. The frontend never receives the Supabase service-role key.

Production code uses a configured Supabase client. Backend tests inject a mock client so the suite runs without live credentials. Live integration can be enabled after Min provides the shared project's URL and keys.

The implementation stays within the repository ownership structure:

- `apps/backend/src/modules/auth/`: registration, login, profile operations, Supabase client access, and authentication middleware.
- `apps/backend/src/modules/favourites/`: authenticated favourite-location CRUD.
- `apps/backend/src/db/migrations/`: `profiles` and `favourite_locations` migrations.
- `apps/frontend/src/features/auth/`: API calls, session state, reusable form logic, and authenticated request support.
- `apps/frontend/src/features/favourites/`: API calls and favourite-specific interaction logic.
- `apps/frontend/src/pages/`: Sign In, Sign Up, Profile, and Favourites route-level pages.
- `packages/shared-types/src/user.ts`: cross-module user, vehicle, favourite, and auth DTO types, subject to the shared-contract review process.

No Teik Fei implementation is placed in another teammate's owned feature directory or in Min's shared component directory.

## Backend Components

The backend application is split into small units with explicit dependencies:

1. Configuration loads and validates `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `PORT` without exposing secret values.
2. A Supabase client factory creates the privileged server client and can be replaced by a test double.
3. Validation functions parse registration, login, profile-update, and favourite payloads before database calls.
4. Auth services implement registration, login, profile retrieval/update, and account deletion.
5. Authentication middleware reads `Authorization: Bearer <token>`, verifies it with Supabase, and attaches the authenticated user ID to the Express request.
6. Favourite services scope every query to the authenticated user ID and implement list, create, rename, and delete operations.
7. Controllers translate service results into the exact status codes and response shapes documented in `docs/API_CONTRACT.md`.

The module router exposes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`
- `PUT /api/users/me`
- `DELETE /api/users/me`
- `GET /api/favourites`
- `POST /api/favourites`
- `PATCH /api/favourites/:id`
- `DELETE /api/favourites/:id`

## Database Design

`001_profiles.sql` creates `profiles` with a UUID primary key referencing `auth.users(id)`, required `name`, constrained `vehicle_type`, and `created_at`. Row-level security restricts access to the authenticated user's row.

`002_favourite_locations.sql` creates `favourite_locations` with the documented location fields and a foreign key to `profiles(id)` using `ON DELETE CASCADE`. A uniqueness constraint on `(user_id, latitude, longitude)` prevents duplicate saved destinations for one user while allowing different users to save the same destination. Row-level security restricts all operations to rows whose `user_id` matches `auth.uid()`.

Account deletion removes the Supabase Auth identity using the service-role client. Foreign-key cascades remove the profile and favourites. Alerts are owned by Xi Fei; their eventual `user_id` foreign key must also use `ON DELETE CASCADE`, which will be coordinated rather than implemented in Teik Fei's branch.

## Frontend Components and Data Flow

The frontend uses one API client that adds the configured backend base URL, JSON headers, and the current bearer token. Authentication state contains the access token and user identity returned by login. Session persistence uses browser storage so a page refresh does not immediately sign the user out; logout and successful account deletion remove the stored session.

The Sign Up page collects email, password, name, and vehicle type. The Sign In page collects email and password. Both provide a password-visibility toggle and accessible inline validation. Successful registration directs the user to sign in; successful login stores the session and loads the profile.

The Profile page loads `GET /api/users/me`, permits editing name and vehicle type through `PUT /api/users/me`, and includes a confirmation step before `DELETE /api/users/me`. The session is cleared only after successful deletion.

The Favourites page loads the authenticated user's locations, supports inline rename and confirmed deletion, and exposes selection as a callback/navigation boundary for Min's search flow. Because Min owns search pages, this branch does not modify search code. The favourite item provides sufficient destination data for Min to wire into a new search.

Deletion uses a short delayed commit: the item is hidden immediately and an Undo toast is shown. Undo cancels the pending deletion and restores the item. When the delay expires, the frontend sends the DELETE request. A failed request restores the item and displays an error.

## Error Handling

All user-facing failures use the shared `ApiError` shape. Until Nigel's shared error implementation lands, Teik Fei's modules throw through a narrow compatible error interface so the eventual middleware can replace the temporary adapter without changing controllers.

- Malformed input: HTTP 400, `VALIDATION_ERROR`.
- Invalid or expired bearer token: HTTP 401, `UNAUTHORIZED`.
- Incorrect login credentials: HTTP 401, `UNAUTHORIZED`.
- Existing registration or duplicate favourite: HTTP 409 with a safe message.
- Missing or non-owned favourite: HTTP 404, `NOT_FOUND`.
- Supabase unavailable: HTTP 503, `EXTERNAL_SERVICE_UNAVAILABLE`.
- Unexpected failure: HTTP 500, `INTERNAL_ERROR`, without leaking secrets.

Account deletion is treated as successful only when Supabase confirms deletion. If it fails, the session and visible account state remain unchanged.

## Testing Strategy

Implementation follows test-driven development:

- Unit tests cover input validation, bearer-token parsing, duplicate handling, ownership scoping, and response mapping.
- Supertest integration tests cover every endpoint's success path, authentication boundary, validation failures, duplicates, missing resources, and service failures using injected Supabase doubles.
- React Testing Library tests cover password visibility, form validation, sign-in/sign-up submission, profile editing, account-deletion confirmation, favourite loading/renaming/deletion, Undo behavior, empty states, and errors.
- Database migration checks verify constraints, cascades, and row-level security statements.
- Final verification runs repository lint, TypeScript checks, backend/frontend tests, and frontend build.

Manual acceptance checks use the SRS mobile baseline of 360 by 780 pixels and verify that passwords never appear in logs or application database rows.

## Delivery Sequence

1. Establish test tooling, backend application composition, environment validation, and injectable Supabase access.
2. Add shared user/favourite types through the contract-review process.
3. Add profiles and favourite-location migrations.
4. Implement and test registration, login, and authentication middleware.
5. Implement and test profile retrieval, updates, and deletion.
6. Implement and test favourite-location CRUD.
7. Add the frontend API/session layer and authentication pages.
8. Add the Profile and Favourites pages with confirmation and Undo flows.
9. Run integration, mobile-layout, security, and complete repository verification.

Each slice is committed separately with Conventional Commit messages and the relevant FR/UC references recorded in the eventual PR description.
