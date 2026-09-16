# Smart Parking Recommendation App — Team Agent Playbook

**Project:** Smart Parking Recommendation App (SC2006, Team 1)
**Team Lead:** Min
**Team:** Min, Teik Fei, Xi Fei, Xavier, Moufooza, Nigel

---

## 0. Read This First (Instructions for your AI coding agent)

If you are an AI agent that has just been pointed at this repository:

1. Read this file (`AGENT_PLAYBOOK.md`) in full. It applies to everyone, regardless of who you're working for.
2. Then open `docs/playbook/<your-person>.md` — the file matching the name of the person you are working for — and read it in full.
3. Read `docs/API_CONTRACT.md` and `docs/DB_SCHEMA.md` for the shared interfaces you must code against.
4. Do **not** write code in another person's owned folders (see Section 4). Do not modify `packages/shared-types` or `docs/API_CONTRACT.md` without following the change process in Section 6.
5. Follow the Git workflow in Section 5 for every change.
6. Every task in your person-file lists acceptance criteria tied to SRS requirement IDs (FR/NFR/UC numbers). Do not mark a task done until those criteria are met.
7. If something in your person-file conflicts with this file, this file (the shared rules) wins — flag it to Min rather than silently picking one.

---

## 1. Project Overview

The Smart Parking Recommendation App helps drivers find a suitable carpark near a destination by combining real-time and historical carpark availability, parking cost, traffic-aware driving time, walking distance, weather, EV charging, and user preferences. Full detail is in the project's SRS document (`docs/SRS.md` — copy the team's SRS into the repo under this name so all agents can reference it).

Core flow: user enters a destination → system finds nearby carparks → system scores and ranks them (availability, walking distance, weather) → user filters/selects a carpark → system shows driving + walking routes.

---

## 2. Tech Stack (Locked)

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + **TypeScript** |
| Backend | Node.js + Express + **TypeScript** |
| Database / Auth | Supabase (PostgreSQL + Supabase Auth) |
| Maps / Routing | Google Maps Platform (Places Autocomplete, Directions, Distance Matrix) |
| Carpark / Traffic data | data.gov.sg (Carpark Information, Carpark Availability), LTA DataMall (traffic, EV charging) |
| Weather | data.gov.sg / NEA weather API (2-hour nowcast + forecast) |
| Testing | Vitest + React Testing Library (frontend); Vitest/Jest + Supertest (backend) |
| Package manager | pnpm (workspaces) |
| Deployment | Vercel (frontend), Render or Railway (backend), Supabase (managed DB) |
| Linting/formatting | ESLint + Prettier (repo-root config, applies to both apps) |

**Why TypeScript everywhere:** with 6 people building in parallel against a shared contract, TypeScript + `packages/shared-types` is what prevents integration bugs (mismatched field names/types) from surfacing only at merge time. Strict mode is on. Do not use `any` without a `// justified:` comment explaining why.

---

## 3. Monorepo Structure

```
smart-parking/
├── apps/
│   ├── frontend/
│   │   └── src/
│   │       ├── features/
│   │       │   ├── search/        (Min)
│   │       │   ├── carparks/      (Min — list/details UI; Xi Fei — filter UI, availability badge)
│   │       │   ├── auth/          (Teik Fei)
│   │       │   ├── favourites/    (Teik Fei)
│   │       │   ├── navigation/    (Xavier)
│   │       │   └── weather/       (Moufooza — banner component only)
│   │       ├── components/        (shared, cross-feature UI primitives — see Section 4 rules)
│   │       ├── lib/                (shared frontend utils, API client)
│   │       └── pages/              (route-level pages, owned per Section 4 table)
│   └── backend/
│       └── src/
│           ├── modules/
│           │   ├── auth/           (Teik Fei)
│           │   ├── favourites/     (Teik Fei)
│           │   ├── carparks/       (Moufooza — static data + ingestion)
│           │   ├── availability/   (Xi Fei — real-time + filtering + alerts)
│           │   ├── routing/        (Xavier — driving/walking/traffic)
│           │   ├── weather/        (Moufooza)
│           │   ├── recommendation/ (Nigel — scoring engine)
│           │   └── search/         (Min — destination search proxy + nearby-carparks orchestrator)
│           ├── lib/
│           │   └── errors/         (Nigel — standard error format, used by all modules)
│           └── db/                 (migrations — see DB_SCHEMA.md, each module owns its own migration file)
├── packages/
│   └── shared-types/
│       └── src/
│           ├── carpark.ts
│           ├── destination.ts
│           ├── recommendation.ts
│           ├── user.ts
│           ├── route.ts
│           ├── weather.ts
│           └── api-error.ts
├── docs/
│   ├── SRS.md
│   ├── API_CONTRACT.md
│   ├── DB_SCHEMA.md
│   └── playbook/
│       ├── min.md
│       ├── teik-fei.md
│       ├── xi-fei.md
│       ├── xavier.md
│       ├── moufooza.md
│       └── nigel.md
└── data/
    └── historical/     (your pre-generated historical availability CSVs go here)
```

---

## 4. Folder & File Ownership (avoid collisions)

Only the listed owner edits inside these paths. If you need something changed in another person's folder, open an issue/PR against them — don't edit it yourself.

| Path | Owner |
|---|---|
| `apps/frontend/src/features/search/`, `apps/frontend/src/pages/Home*, Search*, CarparkList*, CarparkDetails*` | Min |
| `apps/backend/src/modules/search/` | Min |
| `apps/frontend/src/features/auth/`, `apps/frontend/src/pages/SignIn*, SignUp*, Profile*, Favourites*` | Teik Fei |
| `apps/backend/src/modules/auth/`, `apps/backend/src/modules/favourites/` | Teik Fei |
| `apps/frontend/src/features/carparks/filters/`, availability badges, alert toggle UI | Xi Fei |
| `apps/backend/src/modules/availability/` | Xi Fei |
| `apps/frontend/src/features/navigation/`, `apps/frontend/src/pages/Navigation*` | Xavier |
| `apps/backend/src/modules/routing/` | Xavier |
| `apps/frontend/src/features/weather/` (banner component only) | Moufooza |
| `apps/backend/src/modules/weather/`, `apps/backend/src/modules/carparks/`, `data/historical/` import scripts | Moufooza |
| `apps/backend/src/modules/recommendation/`, `apps/backend/src/lib/errors/` | Nigel |
| `apps/frontend/src/components/` (shared primitives: Button, Card, Chip, ProgressBar, MapView wrapper) | **Min owns the initial baseline** (per GUI standard colours in the SRS); anyone may propose additions via PR, tagging Min |
| `packages/shared-types/` | Shared — see change process below |
| `docs/API_CONTRACT.md`, `docs/DB_SCHEMA.md` | Shared — see change process below |

---

## 5. Git Workflow (applies to all agents)

- **Never commit directly to `main`.** All work happens on a branch.
- **Branch naming:** `feature/<firstname>-<short-description>`, e.g. `feature/xifei-availability-filtering`.
- **One PR per feature slice** — keep PRs small and scoped to one or two FR numbers where possible.
- **PR description must reference the FR/UC numbers implemented**, e.g. "Implements FR16–FR20, UC-07."
- **Rebase on `main` before opening a PR.** Resolve your own conflicts; don't push merge commits into a feature branch.
- **At least one review required before merge.** Min reviews everyone's PRs; Min's own PRs get reviewed by whoever is free (rotate — don't let Min self-merge).
- **Commit messages:** Conventional Commits — `feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`. Example: `feat(availability): add EV/cost/availability filter query params (FR16-19)`.
- **CI must pass** (lint + typecheck + tests) before merge — see repo setup guide for how this is wired.

---

## 6. Shared Contract Rules (this is what makes parallel work possible)

1. **All cross-module types live in `packages/shared-types`.** No module redefines a type another module owns. Import from `@smart-parking/shared-types`.
2. **Every backend endpoint must be documented in `docs/API_CONTRACT.md` before you build the frontend against it** — method, path, request shape, response shape, error cases, owner, FR references. The contract is the source of truth; implementation follows it, not the other way round.
3. **Changing a shared type or the contract:** open a PR touching *only* `packages/shared-types` and/or `docs/API_CONTRACT.md`, tag every person whose module consumes that type/endpoint, get their explicit approval, then merge before anyone builds on top of the change. Do not silently widen/narrow a shared type.
4. **Never blocked, never silent-guess:** if the person whose endpoint you depend on hasn't shipped it yet, don't wait — mock it.
   - **Frontend:** use MSW (Mock Service Worker) with a mock handler that matches the exact shape in `docs/API_CONTRACT.md`. Put mocks in `apps/frontend/src/mocks/`.
   - **Backend-to-backend (e.g. Nigel depending on Moufooza's historical data):** write a fixture function returning realistic fake data matching the shared type, swap the real import in once it exists.
5. Once a real implementation lands, remove the mock/fixture in the same PR that wires it in — don't let dead mocks linger.

---

## 7. Coding Standards

- TypeScript strict mode, both apps. No `any` without a `// justified:` comment.
- Run `pnpm lint` and `pnpm typecheck` before every commit (or configure a pre-commit hook — see repo setup guide).
- Environment variables via `.env`, never committed. Each app maintains a `.env.example` listing required vars with placeholder values.
- **API keys (Google Maps, LTA DataMall, data.gov.sg) are backend-only.** Never reference them in frontend code, never fetch external APIs directly from the browser.
- Component/file naming: PascalCase for React components, camelCase for functions/variables, kebab-case for non-component file names.
- Keep UI colours/spacing consistent with the SRS GUI standard: primary `#FFC768` (orange), secondary `#2563EB` (blue), success `#10B981` (green), primary text `#111827`, secondary text `#4B5563`/`#9CA3AF`, background `#FFFFFF`. These should be defined once as CSS variables/theme tokens by Min in `apps/frontend/src/components/theme.ts` — everyone imports them, nobody hardcodes hex values.
- Mobile-first: the SRS specifies a 360×780px portrait viewport baseline. Design and test at that size first.

---

## 8. Error Handling Standard (owned by Nigel, used by every backend module)

Every backend endpoint returns errors in this shape (implements FR41–FR43):

```ts
// packages/shared-types/src/api-error.ts
export interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;      // human-readable, safe to show the user
    details?: unknown;    // optional debug info, omitted in production responses
  };
}

export type ApiErrorCode =
  | "DESTINATION_NOT_FOUND"     // FR41
  | "NO_CARPARKS_FOUND"         // FR42
  | "EXTERNAL_SERVICE_UNAVAILABLE" // FR43 — data.gov.sg/LTA/weather/maps down
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";
```

Nigel builds the Express middleware (`apps/backend/src/lib/errors/`) that catches thrown `ApiException` instances and formats this response with the right HTTP status. Every other module throws `ApiException` rather than raw `Error` for anything user-facing. Details in `docs/playbook/nigel.md`.

---

## 9. Testing Requirements — Definition of Done

For **every** FR/task you implement, before marking it done:

- [ ] Unit test covering the core logic (pure functions, especially scoring/formatting/validation)
- [ ] Integration test for the API endpoint (Supertest) **or** component test (React Testing Library) as appropriate
- [ ] Manually verified against the acceptance criteria listed in your person-file
- [ ] PR description references the FR/UC numbers implemented
- [ ] No leftover `console.log`/debug code
- [ ] `docs/API_CONTRACT.md` updated if you added or changed an endpoint
- [ ] `docs/DB_SCHEMA.md` updated if you added or changed a table

---

## 10. Communication Cadence

- Daily async standup in the team chat: **what I finished / what I'm doing next / any blockers**. Keep it short.
- If you're blocked more than ~30 minutes by an ambiguity in this playbook or the API contract, say so in the team chat rather than guessing and building on an assumption someone else has to unwind later.
- Min reviews and merges the majority of PRs; if Min is unavailable, the next most-recently-merged teammate reviews instead so nothing stalls.

---

## 11. Team Directory & Responsibility Map

| Name | Feature Area | SRS Requirements Owned | Playbook File |
|---|---|---|---|
| Min (Lead) | Destination search, home/search UI, carpark list & details UI, orchestration | FR3–FR10 (UI layer), UC-01, UC-06, UC-08 | `docs/playbook/min.md` |
| Teik Fei | Auth, profile, favourites | FR1–FR2, FR35–FR39, NFR4, NFR6, UC-10 to UC-13 | `docs/playbook/teik-fei.md` |
| Xi Fei | Real-time availability, filtering, alerts | FR11–FR20, FR40, UC-02, UC-07, UC-14 | `docs/playbook/xi-fei.md` |
| Xavier | Traffic, driving/walking time, routing & navigation | FR21–FR23, FR28–FR34, UC-03, UC-04, UC-09 | `docs/playbook/xavier.md` |
| Moufooza | Weather, static carpark/EV data, historical data ingestion | FR24–FR27, UC-05, carpark data pipeline | `docs/playbook/moufooza.md` |
| Nigel | Recommendation/ranking engine, error-handling standard | FR41–FR49, UC-15, UC-16 | `docs/playbook/nigel.md` |

---

## 12. Suggested Milestones

| Week | Focus |
|---|---|
| 0 | Min completes repo bootstrap (see separate repo setup guide). Everyone clones, reads this playbook + their file, sets up local `.env`. |
| 1 | Everyone builds their module against the API contract using mocks/fixtures where needed. Scaffolding, DB migrations, first endpoints. |
| 2 | Core feature logic complete per person-file task lists. Unit + integration tests written alongside. |
| 3 | Cross-module wiring: Min's orchestrator endpoint calls real modules instead of mocks; Nigel's recommendation engine consumes real availability/routing/weather data. |
| 4 | Integration testing across the full flow (search → recommend → filter → navigate), bug fixing, polish, NFR checks (2s search response, mobile viewport, styling consistency). |
| 5 | Buffer, demo prep, documentation cleanup. |

Adjust week count to your actual semester timeline.
