# Playbook — Teik Fei

> Read `AGENT_PLAYBOOK.md` at the repo root first — it applies to you too. This file is your specific scope.

## Your Mission

Own everything related to who the user is: registration, login, profile management, and saved favourite locations. This workstream is fully self-contained — you don't need anyone else's module to finish yours.

## SRS Requirements You Own

- **FR1–FR2** — User registration/login, manage profile (Section 4.1)
- **FR35–FR39** — Save, view, select, rename, delete favourite locations (Section 4.10)
- **NFR4** — Secure password hashing (handled by Supabase Auth — verify it's actually being used correctly, don't roll your own)
- **NFR6** — Account deletion removes associated personal data
- **UC-10** Save Favourite Location, **UC-11** Manage Saved Locations, **UC-12** Register/Login, **UC-13** Manage User Profile

## What You're Building

**Frontend**
- Sign In page (with password-visibility eye icon per the SRS HCI notes)
- Sign Up page (same password-visibility affordance)
- Profile page: view/edit name, vehicle type, delete-account flow with confirmation
- Favourites page: list of saved locations, tap to search from a favourite, rename, delete (with undo-toast per the SRS's error-recovery HCI note), "location saved to favourites" toast on save

**Backend**
- `POST /api/auth/register`, `POST /api/auth/login` — via Supabase Auth SDK
- `GET/PUT /api/users/me`, `DELETE /api/users/me`
- `GET/POST/PATCH/DELETE /api/favourites`

## File/Folder Ownership

`apps/frontend/src/features/auth/`, `apps/frontend/src/pages/SignIn*`, `SignUp*`, `Profile*`, `Favourites*`, `apps/backend/src/modules/auth/`, `apps/backend/src/modules/favourites/`

## Dependencies On Others

None for core functionality — Supabase Auth + your own `profiles`/`favourite_locations` tables are independent of everyone else's work. You only need Min's `theme.ts` for consistent styling (use placeholder styling until it's published, then swap in).

## What Others Depend On You For

- The `User` type in `packages/shared-types/src/user.ts` — draft this early since the auth token/user ID shape affects how other modules identify "the current user" (e.g. Xi Fei's alerts are per-user).
- Auth middleware (`apps/backend/src/modules/auth/middleware.ts`) that other backend modules import to protect authenticated-only routes (favourites, alerts, profile).

## Step-by-Step Task Breakdown

1. Set up the Supabase project's Auth settings (or confirm Min has already done this as part of repo bootstrap) and the `profiles` table migration (`apps/backend/src/db/migrations/001_profiles.sql`).
2. Draft `packages/shared-types/src/user.ts`.
3. Build `POST /api/auth/register` and `POST /api/auth/login`, with unit tests for validation edge cases (duplicate email, weak password, wrong credentials).
4. Build the Sign Up / Sign In pages, wired to the above.
5. Build `GET/PUT /api/users/me` and the Profile page.
6. Build `DELETE /api/users/me` including the confirm-before-delete UX (UC-13.AC.3) and verify cascading deletion of favourites/alerts tied to that user (NFR6).
7. Create `favourite_locations` migration (`002_favourite_locations.sql`).
8. Build the favourites CRUD endpoints, with the "already saved" duplicate check (UC-10.AC.2).
9. Build the Favourites page: list, rename, delete-with-undo-toast, tap-to-search.
10. Build the auth middleware other modules will import; document how to use it in a short comment block at the top of the file.

## API Endpoints You Own

See `docs/API_CONTRACT.md` sections "Auth & Profile" and "Favourites."

## Acceptance Criteria / Definition of Done

- [ ] FR1: user can register with email/phone + password
- [ ] FR2: user can view and update profile info
- [ ] FR35: user can save a destination as a favourite
- [ ] FR36: saved favourites are listed
- [ ] FR37: selecting a favourite starts a new carpark search using that location
- [ ] FR38: favourites can be renamed
- [ ] FR39: favourites can be deleted
- [ ] NFR4: passwords are never stored or logged in plaintext (confirm via Supabase dashboard, not a custom hash)
- [ ] NFR6: account deletion removes the user's personal data (profile, favourites, alerts)
- [ ] UC-10.AC.2: duplicate favourite save is handled gracefully, not silently duplicated
- [ ] All Section 9 (Definition of Done) checklist items from the root playbook

## Suggested First Commands

```bash
pnpm install
pnpm --filter backend dev
```
Start with the `profiles` migration and `user.ts` shared type before writing endpoint code.
