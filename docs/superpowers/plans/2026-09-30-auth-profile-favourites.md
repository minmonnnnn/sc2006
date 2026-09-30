# Auth, Profile, and Favourites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Teik Fei's complete email/password authentication, profile management, account deletion, and favourite-location backend and mobile frontend workstream.

**Architecture:** React calls contract-defined Express endpoints through a bearer-token API client. Express validates input, delegates authentication and persistence to an injected Supabase gateway, and scopes every protected operation to the verified user ID. SQL migrations enforce ownership, duplicate prevention, row-level security, and deletion cascades.

**Tech Stack:** TypeScript, React 19, Vite 8, Express 5, Supabase JS 2, PostgreSQL/Supabase Auth, Vitest 5, Supertest, React Testing Library.

## Global Constraints

- Work only in Teik Fei-owned folders, except the approved shared contract file `packages/shared-types/src/user.ts` and required app/bootstrap configuration.
- Implement email registration only: `{ email, password, name, vehicleType }`.
- Vehicle type is exactly `"EV" | "Petrol" | "Hybrid"`.
- Never store, return, or log plaintext passwords or the Supabase service-role key.
- Backend errors use `{ error: { code, message, details? } }` and never expose secrets.
- Mobile UI is verified at the SRS baseline of 360 by 780 pixels.
- Use TypeScript strict mode; do not add `any` without a `// justified:` comment.
- Keep shared-contract changes in an isolated commit and obtain consumer approval before merge.
- Use Conventional Commit messages and reference FR1-FR2, FR35-FR39, NFR4, NFR6, and UC-10 through UC-13 in the PR.
- Live Supabase credentials are optional for automated tests; all test suites use injected doubles.

---

## Target File Map

### Shared contract

- `packages/shared-types/src/user.ts`: public user, favourite, and auth DTO types.
- `packages/shared-types/src/index.ts`: exports the shared contract.
- `packages/shared-types/package.json`: TypeScript entry points and typecheck script.

### Backend foundation

- `apps/backend/src/config/env.ts`: environment parsing.
- `apps/backend/src/lib/api-error.ts`: temporary contract-compatible exception and middleware boundary.
- `apps/backend/src/lib/supabase.ts`: production Supabase gateway factory.
- `apps/backend/src/types/express.d.ts`: authenticated request augmentation.
- `apps/backend/src/app.ts`: dependency-injected Express composition.
- `apps/backend/src/server.ts`: production startup only.

### Backend auth and profile

- `apps/backend/src/modules/auth/auth.types.ts`: gateway and service interfaces.
- `apps/backend/src/modules/auth/auth.validation.ts`: request parsers.
- `apps/backend/src/modules/auth/auth.service.ts`: registration, login, profile, and deletion rules.
- `apps/backend/src/modules/auth/auth.middleware.ts`: bearer-token verification.
- `apps/backend/src/modules/auth/auth.routes.ts`: auth/profile HTTP endpoints.
- `apps/backend/src/modules/auth/*.test.ts`: unit and Supertest coverage.

### Backend favourites

- `apps/backend/src/modules/favourites/favourites.validation.ts`: create/rename/id parsing.
- `apps/backend/src/modules/favourites/favourites.service.ts`: user-scoped CRUD.
- `apps/backend/src/modules/favourites/favourites.routes.ts`: authenticated HTTP endpoints.
- `apps/backend/src/modules/favourites/*.test.ts`: unit and Supertest coverage.

### Database

- `apps/backend/src/db/migrations/001_profiles.sql`: profile table and policies.
- `apps/backend/src/db/migrations/002_favourite_locations.sql`: favourites table, uniqueness, cascade, and policies.
- `apps/backend/src/db/migrations/migrations.test.ts`: migration text safeguards.

### Frontend auth

- `apps/frontend/src/features/auth/auth.types.ts`: browser session shape.
- `apps/frontend/src/features/auth/authStorage.ts`: session persistence.
- `apps/frontend/src/features/auth/AuthContext.tsx`: auth state and actions.
- `apps/frontend/src/features/auth/PasswordField.tsx`: accessible visibility toggle.
- `apps/frontend/src/features/auth/auth.css`: feature-owned mobile styling.
- `apps/frontend/src/features/auth/*.test.tsx`: auth component/state tests.

### Frontend favourites and pages

- `apps/frontend/src/lib/apiClient.ts`: JSON and bearer-token HTTP client.
- `apps/frontend/src/features/favourites/favouritesApi.ts`: favourites requests.
- `apps/frontend/src/features/favourites/useFavouriteDeletion.ts`: delayed deletion/Undo state.
- `apps/frontend/src/features/favourites/favourites.css`: feature-owned styling.
- `apps/frontend/src/pages/SignInPage.tsx`, `SignUpPage.tsx`, `ProfilePage.tsx`, `FavouritesPage.tsx`: route-level pages.
- `apps/frontend/src/pages/pages.test.tsx`: page interaction coverage.
- `apps/frontend/src/App.tsx`: minimal owned-page route switch until Min integrates the shared app shell.

---

### Task 1: Shared User and Favourite Contract

**Files:**
- Create: `packages/shared-types/src/user.ts`
- Create: `packages/shared-types/src/index.ts`
- Modify: `packages/shared-types/package.json`

**Interfaces:**
- Produces: `VehicleType`, `User`, `FavouriteLocation`, `RegisterRequest`, `RegisterResponse`, `LoginRequest`, `LoginResponse`, `UpdateProfileRequest`, `CreateFavouriteRequest`, and `RenameFavouriteRequest`.

- [ ] **Step 1: Add the contract compile test**

Create `packages/shared-types/src/user.type-test.ts`:

```ts
import type {
  CreateFavouriteRequest,
  FavouriteLocation,
  LoginResponse,
  RegisterRequest,
  User,
} from './user.js'

const registration: RegisterRequest = {
  email: 'driver@example.com',
  password: 'StrongPass1!',
  name: 'Driver',
  vehicleType: 'EV',
}
const login: LoginResponse = { userId: 'user-1', token: 'token' }
const user: User = {
  id: login.userId,
  email: registration.email,
  name: registration.name,
  vehicleType: registration.vehicleType,
  createdAt: '2026-09-30T00:00:00.000Z',
}
const input: CreateFavouriteRequest = {
  locationName: 'Home',
  address: '1 Example Road',
  latitude: 1.3521,
  longitude: 103.8198,
}
const favourite: FavouriteLocation = {
  id: 1,
  userId: user.id,
  ...input,
  createdAt: user.createdAt,
}
void favourite
```

- [ ] **Step 2: Run the package typecheck and verify failure**

Run: `pnpm --filter @smart-parking/shared-types exec tsc --noEmit`

Expected: FAIL because `src/user.ts` does not exist.

- [ ] **Step 3: Add the exact shared contract**

Create `packages/shared-types/src/user.ts` with:

```ts
export type VehicleType = 'EV' | 'Petrol' | 'Hybrid'

export interface User {
  id: string
  email: string
  name: string
  vehicleType: VehicleType
  createdAt: string
}

export interface FavouriteLocation {
  id: number
  userId: string
  locationName: string
  address: string
  latitude: number
  longitude: number
  createdAt: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  vehicleType: VehicleType
}
export type RegisterResponse = Pick<User, 'email' | 'name'> & { userId: string }
export interface LoginRequest { email: string; password: string }
export interface LoginResponse { userId: string; token: string }
export type UpdateProfileRequest = Partial<Pick<User, 'name' | 'vehicleType'>>
export type CreateFavouriteRequest = Pick<FavouriteLocation,
  'locationName' | 'address' | 'latitude' | 'longitude'>
export type RenameFavouriteRequest = Pick<FavouriteLocation, 'locationName'>

```

Export it from `src/index.ts` and set `main`, `types`, `exports`, `scripts.typecheck`, and `scripts.test` in the package manifest to use `src/index.ts` during workspace development. Both `typecheck` and `test` run `tsc --noEmit`, replacing the scaffold's intentionally failing test command.

- [ ] **Step 4: Run typecheck and verify success**

Run: `pnpm --filter @smart-parking/shared-types exec tsc --noEmit`

Expected: PASS with no diagnostics.

- [ ] **Step 5: Commit the isolated shared contract**

```bash
git add packages/shared-types
git commit -m "feat(shared-types): define auth profile and favourite contracts"
```

Pause for Min/Xi Fei approval of the shared contract before merge.

---

### Task 2: Backend Test and Application Foundation

**Files:**
- Modify: `apps/backend/package.json`
- Modify: `apps/backend/tsconfig.json`
- Create: `apps/backend/src/config/env.ts`
- Create: `apps/backend/src/lib/api-error.ts`
- Create: `apps/backend/src/app.ts`
- Create: `apps/backend/src/server.ts`
- Test: `apps/backend/src/config/env.test.ts`
- Test: `apps/backend/src/app.test.ts`

**Interfaces:**
- Produces: `loadEnv(source): BackendEnv`, `ApiException`, `errorHandler`, and `createApp(dependencies): Express`.

- [ ] **Step 1: Configure executable scripts**

Set backend scripts to:

```json
{
  "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
  "build": "tsc --noEmit",
  "typecheck": "tsc --noEmit",
  "test": "vitest run"
}
```

Set `rootDir` to `src`, include Node and Vitest types, and include `src/**/*.ts` in `tsconfig.json`.

- [ ] **Step 2: Write failing environment and health tests**

```ts
it('rejects missing Supabase configuration', () => {
  expect(() => loadEnv({ PORT: '4000' })).toThrow('SUPABASE_URL')
})

it('serves health without constructing live Supabase dependencies', async () => {
  await request(createApp(fakeDependencies)).get('/health').expect(200, { ok: true })
})
```

- [ ] **Step 3: Run the focused tests and verify failure**

Run: `pnpm --filter backend test -- src/config/env.test.ts src/app.test.ts`

Expected: FAIL because foundation modules do not exist.

- [ ] **Step 4: Implement environment parsing, error boundary, and app composition**

`loadEnv` must trim values, require `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, and parse `PORT` as an integer from 1 through 65535. `ApiException` carries `status`, `code`, and optional `details`. `errorHandler` serializes known exceptions and returns `INTERNAL_ERROR` for unknown errors. `createApp` adds JSON parsing, `/health`, feature routers, a 404 handler, and the final error middleware. `server.ts` is the only file that reads `process.env` and starts listening.

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter backend test -- src/config/env.test.ts src/app.test.ts`

Expected: PASS.

Run: `pnpm --filter backend typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/package.json apps/backend/tsconfig.json apps/backend/src
git commit -m "chore(backend): establish tested Express foundation"
```

---

### Task 3: Database Migrations

**Files:**
- Create: `apps/backend/src/db/migrations/001_profiles.sql`
- Create: `apps/backend/src/db/migrations/002_favourite_locations.sql`
- Test: `apps/backend/src/db/migrations/migrations.test.ts`

**Interfaces:**
- Produces: `public.profiles` and `public.favourite_locations` matching `docs/DB_SCHEMA.md`.

- [ ] **Step 1: Write migration safeguard tests**

Read both SQL files and assert the profiles file contains `references auth.users(id) on delete cascade`, the vehicle constraint, RLS enablement, and owner policies. Assert favourites contains `references public.profiles(id) on delete cascade`, `unique (user_id, latitude, longitude)`, coordinate checks, RLS, and `auth.uid() = user_id` policies.

- [ ] **Step 2: Run the test and verify failure**

Run: `pnpm --filter backend test -- src/db/migrations/migrations.test.ts`

Expected: FAIL because migration files do not exist.

- [ ] **Step 3: Create `001_profiles.sql`**

Use UUID `id` referencing `auth.users`, nonblank `name`, constrained `vehicle_type`, `created_at default now()`, RLS, and select/update policies scoped to `auth.uid() = id`. Do not add password columns.

- [ ] **Step 4: Create `002_favourite_locations.sql`**

Use `bigint generated by default as identity` for `favourite_id`, UUID `user_id`, nonblank name/address checks, latitude `[-90,90]`, longitude `[-180,180]`, the per-user coordinate uniqueness constraint, `created_at`, RLS, and select/insert/update/delete policies scoped to `auth.uid() = user_id`.

- [ ] **Step 5: Run safeguards**

Run: `pnpm --filter backend test -- src/db/migrations/migrations.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/db/migrations
git commit -m "feat(db): add profile and favourite migrations"
```

---

### Task 4: Registration, Login, and Authentication Middleware

**Files:**
- Create: `apps/backend/src/lib/supabase.ts`
- Create: `apps/backend/src/types/express.d.ts`
- Create: `apps/backend/src/modules/auth/auth.types.ts`
- Create: `apps/backend/src/modules/auth/auth.validation.ts`
- Create: `apps/backend/src/modules/auth/auth.service.ts`
- Create: `apps/backend/src/modules/auth/auth.middleware.ts`
- Create: `apps/backend/src/modules/auth/auth.routes.ts`
- Test: `apps/backend/src/modules/auth/auth.validation.test.ts`
- Test: `apps/backend/src/modules/auth/auth.routes.test.ts`

**Interfaces:**
- Consumes: Task 1 DTOs and Task 2 error/app boundaries.
- Produces: `AuthGateway`, `createAuthService(gateway)`, `createRequireAuth(gateway)`, and `createAuthRouter(dependencies)`.

- [ ] **Step 1: Write failing validator tests**

Cover normalized lowercase email, required nonblank name, the three vehicle values, password minimum eight characters with uppercase/lowercase/number, missing fields, and rejecting unknown body shapes.

- [ ] **Step 2: Implement pure validators**

Expose:

```ts
export function parseRegisterRequest(value: unknown): RegisterRequest
export function parseLoginRequest(value: unknown): LoginRequest
export function parseUpdateProfileRequest(value: unknown): UpdateProfileRequest
```

Throw `ApiException(400, 'VALIDATION_ERROR', safeMessage)` for invalid values and never include the password in details.

- [ ] **Step 3: Write failing route tests**

Test `POST /api/auth/register` returns 201, maps duplicate email to 409 `ACCOUNT_ALREADY_EXISTS`, removes a newly created auth identity if profile creation fails, and never returns a token. Test login returns `{ userId, token }`, maps bad credentials to 401, and maps gateway outages to 503. Test middleware rejects missing/malformed/invalid bearer tokens and sets `req.auth.userId` on success.

- [ ] **Step 4: Implement the gateway and service**

Define only the operations the domain needs:

```ts
export interface AuthGateway {
  register(input: RegisterRequest): Promise<{ userId: string }>
  createProfile(userId: string, input: Pick<RegisterRequest, 'name' | 'vehicleType'>): Promise<void>
  removeAuthUser(userId: string): Promise<void>
  login(input: LoginRequest): Promise<{ userId: string; token: string }>
  verifyToken(token: string): Promise<{ userId: string } | null>
}
```

The production adapter wraps Supabase error objects and converts them into gateway-specific typed failures without exposing raw messages to clients.

- [ ] **Step 5: Implement routes and middleware**

Register returns 201 `{ userId, email, name }`. Login returns 200 `{ userId, token }`. Authentication accepts exactly one nonblank bearer token and attaches a typed `{ userId }` object.

- [ ] **Step 6: Run focused and full backend checks**

Run: `pnpm --filter backend test -- src/modules/auth`

Expected: PASS.

Run: `pnpm --filter backend typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/backend/src/lib/supabase.ts apps/backend/src/types apps/backend/src/modules/auth apps/backend/src/app.ts
git commit -m "feat(auth): add registration login and bearer middleware"
```

---

### Task 5: Profile Retrieval, Update, and Account Deletion

**Files:**
- Modify: `apps/backend/src/modules/auth/auth.types.ts`
- Modify: `apps/backend/src/modules/auth/auth.service.ts`
- Modify: `apps/backend/src/modules/auth/auth.routes.ts`
- Test: `apps/backend/src/modules/auth/profile.routes.test.ts`

**Interfaces:**
- Produces: `getProfile(userId): Promise<User>`, `updateProfile(userId, patch): Promise<User>`, and `deleteAccount(userId): Promise<void>`.

- [ ] **Step 1: Write failing profile endpoint tests**

Test authentication on all three routes. Test GET returns the mapped camelCase `User`; PUT accepts a nonempty partial name/vehicle patch and rejects `{}`; DELETE returns 204 and calls only `removeAuthUser(userId)`, relying on database cascades. Test missing profile as 404 and gateway outage as 503. Verify failed deletion does not report 204.

- [ ] **Step 2: Extend the gateway interface**

Add:

```ts
getProfile(userId: string): Promise<User | null>
updateProfile(userId: string, patch: UpdateProfileRequest): Promise<User | null>
```

Use explicit snake_case-to-camelCase mapping in the production adapter.

- [ ] **Step 3: Implement service and routes**

Expose `GET /api/users/me`, `PUT /api/users/me`, and `DELETE /api/users/me` behind `requireAuth`. Reject empty updates. Keep authentication state untouched on backend failure.

- [ ] **Step 4: Verify**

Run: `pnpm --filter backend test -- src/modules/auth/profile.routes.test.ts`

Expected: PASS.

Run: `pnpm --filter backend typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/auth
git commit -m "feat(profile): add authenticated profile lifecycle"
```

---

### Task 6: Favourite Location CRUD

**Files:**
- Create: `apps/backend/src/modules/favourites/favourites.validation.ts`
- Create: `apps/backend/src/modules/favourites/favourites.service.ts`
- Create: `apps/backend/src/modules/favourites/favourites.routes.ts`
- Test: `apps/backend/src/modules/favourites/favourites.validation.test.ts`
- Test: `apps/backend/src/modules/favourites/favourites.routes.test.ts`
- Modify: `apps/backend/src/app.ts`

**Interfaces:**
- Consumes: authenticated `req.auth.userId` and Task 1 favourite DTOs.
- Produces: `FavouriteGateway`, `createFavouritesService(gateway)`, and authenticated `/api/favourites` routes.

- [ ] **Step 1: Write failing validation tests**

Cover nonblank name/address, finite latitude/longitude within legal bounds, positive integer URL IDs, and rename requests containing exactly one nonblank `locationName`.

- [ ] **Step 2: Implement parsers**

Expose `parseCreateFavouriteRequest`, `parseRenameFavouriteRequest`, and `parseFavouriteId`, all throwing `VALIDATION_ERROR` for malformed input.

- [ ] **Step 3: Write failing CRUD route tests**

Cover unauthenticated rejection; GET returning only the authenticated user's rows; POST 201; duplicate POST 409 `FAVOURITE_ALREADY_EXISTS`; PATCH 200; DELETE 204; and PATCH/DELETE of a missing or other user's row returning 404 without revealing ownership.

- [ ] **Step 4: Implement user-scoped gateway and service**

Every operation accepts `userId`. Update/delete filters include both favourite ID and user ID. Database unique violation `23505` maps to the duplicate error; other database failures map to service unavailable.

- [ ] **Step 5: Mount and verify routes**

Run: `pnpm --filter backend test -- src/modules/favourites`

Expected: PASS.

Run: `pnpm --filter backend typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/favourites apps/backend/src/app.ts
git commit -m "feat(favourites): add authenticated location CRUD"
```

---

### Task 7: Frontend Test Foundation, API Client, and Session State

**Files:**
- Modify: `apps/frontend/package.json`
- Modify: `apps/frontend/vite.config.ts`
- Create: `apps/frontend/src/test/setup.ts`
- Create: `apps/frontend/src/lib/apiClient.ts`
- Create: `apps/frontend/src/features/auth/auth.types.ts`
- Create: `apps/frontend/src/features/auth/authStorage.ts`
- Create: `apps/frontend/src/features/auth/AuthContext.tsx`
- Test: `apps/frontend/src/features/auth/AuthContext.test.tsx`
- Test: `apps/frontend/src/lib/apiClient.test.ts`

**Interfaces:**
- Produces: `apiRequest<T>(path, options)`, `AuthProvider`, and `useAuth()` with `register`, `login`, `logout`, `loadProfile`, `updateProfile`, and `deleteAccount`.

- [ ] **Step 1: Add frontend test dependencies and scripts**

Add `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, and `@testing-library/user-event`. Add `test: "vitest run"` and `typecheck: "tsc -b"`. Configure Vitest for `jsdom` and the setup file.

- [ ] **Step 2: Write failing storage/API/context tests**

Verify malformed stored JSON is removed; the API client prefixes `VITE_API_BASE_URL`, applies JSON headers, adds a bearer token when present, handles 204 without JSON parsing, and throws a typed client error for `ApiError`. Verify login stores session, logout clears it, and failed account deletion preserves it.

- [ ] **Step 3: Implement storage and API client**

Use one storage key, `smart-parking.auth`. Store only `{ userId, token }`; never store passwords or the service-role key. Implement an `ApiClientError` containing HTTP status, safe code, and message.

- [ ] **Step 4: Implement `AuthProvider`**

Provider state contains `session`, `profile`, `loading`, and `error`. Registration does not automatically authenticate. Login persists the returned session. Profile requests use the current token. Successful account deletion clears state and storage; failure leaves both intact.

- [ ] **Step 5: Verify**

Run: `pnpm --filter frontend test -- src/features/auth/AuthContext.test.tsx src/lib/apiClient.test.ts`

Expected: PASS.

Run: `pnpm --filter frontend typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/package.json apps/frontend/vite.config.ts apps/frontend/src/test apps/frontend/src/lib apps/frontend/src/features/auth
git commit -m "feat(frontend-auth): add API and session foundation"
```

---

### Task 8: Sign In and Sign Up Pages

**Files:**
- Create: `apps/frontend/src/features/auth/PasswordField.tsx`
- Create: `apps/frontend/src/features/auth/auth.css`
- Create: `apps/frontend/src/pages/SignInPage.tsx`
- Create: `apps/frontend/src/pages/SignUpPage.tsx`
- Test: `apps/frontend/src/pages/auth-pages.test.tsx`

**Interfaces:**
- Consumes: `useAuth().login` and `useAuth().register`.
- Produces: accessible controlled forms and navigation callbacks `onSignedIn`/`onSwitchMode`.

- [ ] **Step 1: Write failing component tests**

Verify labelled inputs, password hidden by default, eye button toggles `type="text"`, submit disabled while pending, validation messages, register payload including vehicle type, safe backend error display, and successful callbacks.

- [ ] **Step 2: Implement `PasswordField`**

Use a labelled input and a `type="button"` control whose accessible name changes between `Show password` and `Hide password`. Do not log or expose the value elsewhere.

- [ ] **Step 3: Implement pages**

Sign In collects email/password. Sign Up collects email/password/name/vehicle type with exactly EV, Petrol, and Hybrid options. Validate before calling context methods. Registration success displays confirmation and changes to sign-in through a callback.

- [ ] **Step 4: Add mobile feature styling**

Style within the auth feature using existing/project CSS variables with fallbacks, max width 360px, visible focus indicators, 44px minimum tap targets, inline error regions with `role="alert"`, and no edits to Min-owned shared components.

- [ ] **Step 5: Verify**

Run: `pnpm --filter frontend test -- src/pages/auth-pages.test.tsx`

Expected: PASS.

Run: `pnpm --filter frontend typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/features/auth apps/frontend/src/pages/SignInPage.tsx apps/frontend/src/pages/SignUpPage.tsx apps/frontend/src/pages/auth-pages.test.tsx
git commit -m "feat(auth-ui): add sign in and registration pages"
```

---

### Task 9: Profile Page

**Files:**
- Create: `apps/frontend/src/pages/ProfilePage.tsx`
- Test: `apps/frontend/src/pages/ProfilePage.test.tsx`
- Modify: `apps/frontend/src/features/auth/auth.css`

**Interfaces:**
- Consumes: `useAuth()` profile lifecycle.
- Produces: profile loading/view/edit states and confirmed account deletion.

- [ ] **Step 1: Write failing profile tests**

Verify initial loading, retryable load failure, populated name/email/vehicle fields, cancel restoring original values, successful update, validation failure, delete confirmation, cancel deletion, successful deletion callback, and failed deletion preserving the visible session.

- [ ] **Step 2: Implement view/edit state**

Email is read-only. Name and vehicle type become editable only after selecting Edit. Save calls `updateProfile`; Cancel resets form state from the loaded profile.

- [ ] **Step 3: Implement deletion confirmation**

Use an accessible dialog with explicit Cancel and `Delete account` actions. Disable repeated submission while pending. Call `deleteAccount`, then invoke `onAccountDeleted` only after success.

- [ ] **Step 4: Verify and commit**

Run: `pnpm --filter frontend test -- src/pages/ProfilePage.test.tsx`

Expected: PASS.

Run: `pnpm --filter frontend typecheck`

Expected: PASS.

```bash
git add apps/frontend/src/features/auth/auth.css apps/frontend/src/pages/ProfilePage.tsx apps/frontend/src/pages/ProfilePage.test.tsx
git commit -m "feat(profile-ui): add profile editing and account deletion"
```

---

### Task 10: Favourites Page with Rename, Selection, and Undo

**Files:**
- Create: `apps/frontend/src/features/favourites/favouritesApi.ts`
- Create: `apps/frontend/src/features/favourites/useFavouriteDeletion.ts`
- Create: `apps/frontend/src/features/favourites/favourites.css`
- Create: `apps/frontend/src/pages/FavouritesPage.tsx`
- Test: `apps/frontend/src/features/favourites/useFavouriteDeletion.test.tsx`
- Test: `apps/frontend/src/pages/FavouritesPage.test.tsx`

**Interfaces:**
- Consumes: bearer token and `FavouriteLocation` contract.
- Produces: `onSelect(favourite: FavouriteLocation)` integration boundary for Min's destination-search flow.

- [ ] **Step 1: Write failing API and Undo tests**

Use fake timers. Verify delete hides an item immediately, Undo within 5000ms restores it without an HTTP call, timer expiry issues one DELETE call, and server failure restores the item with an error.

- [ ] **Step 2: Implement favourites API and delayed deletion hook**

Expose list/create/rename/delete request functions. The hook owns one pending deletion at a time, clears timers on unmount, and returns `scheduleDelete`, `undoDelete`, and `pendingFavourite`.

- [ ] **Step 3: Write failing page tests**

Cover loading, empty state with a search action, list rendering, select callback with coordinates, inline rename/cancel/save, delete confirmation, Undo toast, retrieval failure/retry, and ownership-safe missing-item errors.

- [ ] **Step 4: Implement page and styling**

Render address and custom name, accessible action buttons, inline rename input, confirmation dialog, and `role="status"` Undo toast. Selection calls the integration callback and does not edit Min's search folder.

- [ ] **Step 5: Verify and commit**

Run: `pnpm --filter frontend test -- src/features/favourites src/pages/FavouritesPage.test.tsx`

Expected: PASS.

Run: `pnpm --filter frontend typecheck`

Expected: PASS.

```bash
git add apps/frontend/src/features/favourites apps/frontend/src/pages/FavouritesPage.tsx apps/frontend/src/pages/FavouritesPage.test.tsx
git commit -m "feat(favourites-ui): add saved location management and undo"
```

---

### Task 11: Minimal Page Integration and Acceptance Verification

**Files:**
- Modify: `apps/frontend/src/App.tsx`
- Modify: `apps/frontend/src/App.css`
- Modify: `apps/frontend/src/index.css`
- Test: `apps/frontend/src/App.test.tsx`
- Modify: `apps/backend/.env.example`
- Modify: `apps/frontend/.env.example`

**Interfaces:**
- Consumes: all preceding pages and providers.
- Produces: a demonstrable Teik Fei flow without modifying Min-owned future routes/components.

- [ ] **Step 1: Write failing app-flow test**

Verify an unauthenticated app starts on Sign In, can switch to Sign Up, login opens Profile, Profile can open Favourites, logout returns to Sign In, and favourite selection exposes a clear handoff message/callback for Min's search integration.

- [ ] **Step 2: Replace Vite demo with a minimal local page switch**

Wrap the app in `AuthProvider`. Use an internal discriminated union (`'sign-in' | 'sign-up' | 'profile' | 'favourites'`) rather than introducing a routing dependency. Clearly comment that Min can replace this switch with the project router while preserving the page props.

- [ ] **Step 3: Remove Vite demo-only assets/styles from imports**

Replace the desktop demo layout with a 360px-first app shell. Preserve theme-token fallbacks and do not create shared components under Min's ownership.

- [ ] **Step 4: Verify environment templates**

Backend contains `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `PORT`; frontend contains only `VITE_API_BASE_URL`. Remove frontend Supabase keys because approach 1 never calls Supabase directly from the browser.

- [ ] **Step 5: Run complete automated verification**

Run: `pnpm lint`

Expected: exit 0.

Run: `pnpm typecheck`

Expected: exit 0.

Run: `pnpm test`

Expected: all workspace suites pass; packages with no runtime tests exit 0.

Run: `pnpm --filter frontend build`

Expected: production build completes.

- [ ] **Step 6: Run manual acceptance checks**

At 360 by 780 pixels verify Sign In, Sign Up, Profile, and Favourites do not scroll horizontally; all buttons are reachable; password toggles work; validation/errors are readable; delete confirmation and Undo work; and empty/loading/error states are present.

With Min's dev credentials, run migrations in order, create a user, confirm `auth.users` and `profiles` rows exist without plaintext passwords, log in, edit profile, create/rename/delete a favourite, create a second user to verify isolation, and delete the first account to confirm profile/favourites cascading removal.

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/src/App.tsx apps/frontend/src/App.css apps/frontend/src/index.css apps/frontend/src/App.test.tsx apps/backend/.env.example apps/frontend/.env.example
git commit -m "feat: integrate auth profile and favourites flow"
```

---

### Task 12: Final Contract, Security, and PR Readiness Audit

**Files:**
- Review: all files changed by Tasks 1-11
- Update only if implementation changed: `docs/API_CONTRACT.md`, `docs/DB_SCHEMA.md`

**Interfaces:**
- Produces: review-ready branch satisfying the playbook definition of done.

- [ ] **Step 1: Inspect the complete diff**

Run: `git diff origin/main...HEAD --stat`

Run: `git diff origin/main...HEAD --check`

Expected: intended owned paths only and no whitespace errors.

- [ ] **Step 2: Scan for prohibited secrets/debugging**

Run: `rg -n "console\.log|SERVICE_ROLE_KEY=.+|password\s*[:=]\s*['\"][^'\"]+" apps packages --glob '!**/*.test.*' --glob '!**/.env.example'`

Expected: no debug logs, committed keys, or hard-coded passwords.

- [ ] **Step 3: Confirm endpoint and schema parity**

Check every implemented path/status/body against `docs/API_CONTRACT.md` and every SQL column against `docs/DB_SCHEMA.md`. If implementation intentionally differs, stop and use the shared-contract approval process before changing docs.

- [ ] **Step 4: Re-run the full verification suite**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm --filter frontend build`

Expected: all commands exit 0.

- [ ] **Step 5: Prepare PR evidence**

Record test output, manual 360 by 780 checks, live Supabase checks if credentials are available, and explicit coverage of FR1-FR2, FR35-FR39, NFR4, NFR6, UC-10.AC.2, UC-11, UC-12, and UC-13. Do not claim live Supabase verification if credentials were unavailable.

- [ ] **Step 6: Commit any verification-only corrections**

```bash
git add -u
git commit -m "fix: address auth profile favourites verification findings"
```

Skip this commit when verification required no changes.
