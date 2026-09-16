# Playbook — Min (Team Lead)

> Read `AGENT_PLAYBOOK.md` at the repo root first — it applies to you too. This file is your specific scope.

## Your Mission

Own the core "find and see carparks" user experience: the home screen, destination search, the carpark results list, and the carpark details page — the screens a driver spends the most time in. You also own the `carparks/nearby` orchestrator endpoint that ties everyone else's modules together, and the shared UI theme baseline.

## SRS Requirements You Own

- **FR3–FR7** — Destination search, suggestions, selection, map display, current location (Section 4.2)
- **FR8–FR10** — Nearby carpark identification, distance sorting, carpark details display *(UI layer — availability/routing data itself comes from Xi Fei/Xavier)* (Section 4.3)
- **UC-01** Search Destination and View Recommended Carparks, **UC-06** View Carpark Details, **UC-08** Select Carpark

## What You're Building

**Frontend**
- Home page: search bar entry point, side-nav hamburger for favourites access
- Search page: text input with live destination suggestions (debounced calls to your search endpoint)
- Search-with-filter page: hosts Xi Fei's filter chips (you build the layout container; she builds the chip components — see integration note below)
- Search results / carpark list page: displays `RankedCarpark[]` from your orchestrator endpoint, sorted nearest-first by default, showing distance, availability badge (Xi Fei's component), cost, EV badge
- Carpark details page: full detail view — address, distance, driving time, cost, availability, EV charging (conditional on user's vehicle type), "Save to favourite" and "Navigate" actions
- Shared theme baseline (`apps/frontend/src/components/theme.ts`): CSS variables for the SRS colour palette, typography scale, spacing — everyone else imports this rather than hardcoding colours
- Shared UI primitives you seed: `Button`, `Card`, `Chip` shell (Xi Fei fills in filter-specific behaviour), `ProgressBar` shell (Xi Fei uses for availability)

**Backend**
- `GET /api/destinations/search` — thin proxy to Google Places Autocomplete
- `GET /api/destinations/:placeId/resolve` — resolve a selection to coordinates
- `GET /api/carparks/nearby` — **the orchestrator.** Calls (in order): Moufooza's static carpark lookup by proximity → Xi Fei's real-time availability + filters → Xavier's driving/walking ETA → Nigel's recommendation scoring → returns ranked list
- `GET /api/carparks/:carParkNo` — static + current details for one carpark (calls Moufooza + Xi Fei's modules)

## File/Folder Ownership

`apps/frontend/src/features/search/`, `apps/frontend/src/pages/Home*`, `Search*`, `CarparkList*`, `CarparkDetails*`, `apps/frontend/src/components/theme.ts`, `apps/backend/src/modules/search/`

## Dependencies On Others (and how to stay unblocked)

You depend on Moufooza (carpark static data), Xi Fei (availability/filters), Xavier (ETAs), and Nigel (scoring) for your orchestrator endpoint's *real* data. Do not wait for them:

1. Build `GET /api/carparks/nearby` against `docs/API_CONTRACT.md` returning realistic **mock data** (a hardcoded array of 5–8 `RankedCarpark` objects) for the first 1–2 weeks.
2. Build all frontend screens against that mock endpoint using MSW if you want the frontend fully decoupled from even your own backend during early development.
3. During integration week, replace each mocked call inside the orchestrator with the real module import, one at a time (carparks → availability → routing → recommendation), testing after each swap.

## What Others Depend On You For

- The exact shape of `RankedCarpark` and `Destination` in `packages/shared-types` — draft these first (Day 0–1) since Nigel, Xi Fei, and Xavier all need to know what fields flow into/out of the orchestrator.
- The `theme.ts` colour tokens — publish early so nobody hardcodes hex values.
- As team lead, you also review most PRs — keep your review turnaround fast so others aren't blocked on merges.

## Step-by-Step Task Breakdown

1. Draft `packages/shared-types/src/destination.ts` and `.../carpark.ts` (`Carpark`, `RankedCarpark`, `AvailabilityInfo` shapes) — get quick sign-off from Xi Fei, Xavier, Nigel, Moufooza since they all consume these.
2. Build `theme.ts` with the SRS colour palette + base typography.
3. Scaffold Home page + Search page UI with static/dummy content first (no API calls) to nail the layout against the 360×780 mobile viewport.
4. Wire Search page to `GET /api/destinations/search` (build this endpoint — it's a simple Google Places proxy, low complexity, good to ship early).
5. Build `GET /api/carparks/nearby` returning mock data; wire the results list page to it.
6. Build the carpark details page against `GET /api/carparks/:carParkNo` (mocked initially).
7. Add current-location support (FR7) using the browser Geolocation API with a permission-denied fallback state.
8. Add distance-sorted display logic (FR9) — should already fall out of how the orchestrator returns data, but verify.
9. During integration week: swap orchestrator's mocked sub-calls for real ones from Moufooza/Xi Fei/Xavier/Nigel.
10. Polish: loading states, empty states ("no carparks found" — ties to Nigel's `NO_CARPARKS_FOUND` error), error states (`EXTERNAL_SERVICE_UNAVAILABLE` partial-data banner per UC-01.EX.3).

## API Endpoints You Own

See `docs/API_CONTRACT.md` sections "Destination Search & Orchestration."

## Acceptance Criteria / Definition of Done

- [ ] FR3–FR5: user can type a destination, see suggestions, select one
- [ ] FR6: selected destination appears on the map
- [ ] FR7: "use current location" works, with a clear fallback if permission is denied
- [ ] FR8–FR9: nearby carparks display, sorted nearest-first by default
- [ ] FR10: carpark details show address, distance, driving time, cost, availability, EV charging (conditional)
- [ ] NFR1: `carparks/nearby` responds within 2 seconds under normal conditions (measure once real modules are wired in)
- [ ] Mobile portrait layout matches the 360×780 baseline from the SRS mockups
- [ ] All Section 9 (Definition of Done) checklist items from the root playbook

## Suggested First Commands

```bash
pnpm install
pnpm --filter frontend dev
pnpm --filter backend dev
```
Then start with shared-types drafts before writing any UI code.
