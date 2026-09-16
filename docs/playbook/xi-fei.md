# Playbook — Xi Fei

> Read `AGENT_PLAYBOOK.md` at the repo root first — it applies to you too. This file is your specific scope.

## Your Mission

Own the "is there actually a space" side of the app: real-time carpark availability, the filtering system, and availability-change alerts. This is a mostly-backend-heavy workstream with a couple of focused frontend components.

## SRS Requirements You Own

- **FR11–FR15** — Retrieve, display, and refresh real-time availability; handle stale/unavailable data (Section 4.4)
- **FR16–FR20** — Filter by EV charging, cost, availability; multiple filters; clear filters (Section 4.5)
- **FR40** — Availability change alerts (Section 4.11)
- **UC-02** Get Real-Time Carpark Information, **UC-07** Filter Carparks, **UC-14** Receive Availability Alert

## What You're Building

**Backend**
- A background poller that hits data.gov.sg Carpark Availability + LTA DataMall every 1 minute, writes results into `carpark_availability_cache`
- `GET /api/carparks/:carParkNo/availability` — reads the cache, computes `status` (High/Moderate/Low/Unavailable) and `isStale`
- Filter logic consumed by Min's `carparks/nearby` orchestrator (EV/cost/availability query params, AND-combined, clearable)
- `POST /api/alerts`, `PATCH /api/alerts/:id` — subscribe/unsubscribe, plus a job that checks for "significant" availability changes and triggers notifications

**Frontend**
- Filter chip menu component (the "Search with filter" mockup in the SRS) — chips for EV charging, cost range, availability level
- Availability badge / progress bar component (used on both the results list and details page) — this fills in the `ProgressBar` shell Min seeds in the shared component library
- Alert toggle control on the carpark details page

## File/Folder Ownership

`apps/backend/src/modules/availability/`, `apps/frontend/src/features/carparks/filters/`, availability badge component, alert toggle UI

## Dependencies On Others

You need `carparks.car_park_no` values to attach availability records to. Don't wait for Moufooza's real ingestion — use the sample carpark fixture (`apps/backend/src/db/fixtures/carparks.sample.json`) she publishes early (flag her if it's not there by day 2–3) or create your own 5–10 fake carpark rows locally in the meantime.

## What Others Depend On You For

- The `AvailabilityInfo` shape in `packages/shared-types/src/carpark.ts` (or a dedicated `availability.ts`) — draft early, Min's orchestrator and Nigel's scoring engine both consume it.
- Your filter query param spec — documented in `docs/API_CONTRACT.md`, needed by Min's orchestrator.

## Step-by-Step Task Breakdown

1. Draft `AvailabilityInfo` type and the filter query-param shape; get sign-off from Min and Nigel.
2. Create `carpark_availability_cache` and `alerts` migrations.
3. Build a stub/fixture version of the poller first (hardcoded fake data written into the cache on an interval) so downstream consumers (Min, Nigel) have something real to hit immediately.
4. Wire the poller to the real data.gov.sg/LTA APIs, replacing the fixture.
5. Build `GET /api/carparks/:carParkNo/availability`, including the High/Moderate/Low/Unavailable status calculation (define your own sensible thresholds, e.g. >30% = High, 10–30% = Moderate, <10% = Low, 0 = Unavailable — document your thresholds in the endpoint's JSDoc since the SRS doesn't specify exact cutoffs).
6. Build the "stale" detection — if `fetched_at` is older than a threshold (e.g. 5 minutes), mark `isStale: true` and surface FR15's "unavailable/outdated" messaging.
7. Build the filter chip UI, wired to local component state first, then to the orchestrator's query params once Min's endpoint accepts them.
8. Build the availability badge/progress bar frontend component.
9. Build `POST /api/alerts` / `PATCH /api/alerts/:id` and the alert-check background job (compare new cache value to `last_known_status`, trigger on significant change — again, define "significant" explicitly, e.g. a status-tier change, and document it).
10. Build the alert toggle UI on the details page.

## API Endpoints You Own

See `docs/API_CONTRACT.md` sections "Availability & Filtering & Alerts."

## Acceptance Criteria / Definition of Done

- [ ] FR11–FR12: real-time availability retrieved and displayed
- [ ] FR13: availability status (High/Moderate/Low/Unavailable) shown
- [ ] FR14: cache refreshes every 1 minute
- [ ] FR15: stale/unavailable data is clearly indicated to the user, not silently shown as current
- [ ] FR16–FR18: EV, cost, and availability filters work individually
- [ ] FR19: multiple filters combine correctly (AND logic)
- [ ] FR20: clearing filters restores the unfiltered list
- [ ] FR40: alert triggers on a significant availability change, and only then
- [ ] UC-14.AC.2: disabling an alert actually stops notifications
- [ ] All Section 9 (Definition of Done) checklist items from the root playbook

## Suggested First Commands

```bash
pnpm install
pnpm --filter backend dev
```
Start with the fixture-backed poller so Min and Nigel aren't blocked on real API integration timing.
