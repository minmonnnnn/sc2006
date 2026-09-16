# Playbook — Moufooza

> Read `AGENT_PLAYBOOK.md` at the repo root first — it applies to you too. This file is your specific scope.

## Your Mission

Own the data foundation everyone else builds on top of: static carpark information (ingested from data.gov.sg + LTA EV charging data), the historical availability import (from the CSVs Min already generated), and weather integration. You're an early bottleneck-preventer — your fixture data is what unblocks Xi Fei and Nigel, so prioritise shipping a sample dataset fast, even before the full ingestion pipeline is polished.

## SRS Requirements You Own

- **FR24–FR27** — Retrieve weather info, weather-based recommendation input, sheltered carpark preference, display weather (Section 4.7)
- Carpark static data pipeline (underlies FR8, FR10, FR16 — EV filter, and the class model's `Carpark` entity)
- Historical availability import (underlies FR45, UC-16 — feeds Nigel's engine)
- **UC-05** Get Weather Forecast

## What You're Building

**Backend**
- One-off/scheduled ingestion script pulling data.gov.sg Carpark Information + LTA EV Charging data, merging by postal code, writing into the `carparks` table
- Import script reading the historical CSVs from `data/historical/` into `carpark_availability_historical`, deriving `day_of_week` from each record's date
- `GET /api/weather?lat&lng` — wraps the data.gov.sg/NEA 2-hour nowcast + forecast APIs, returns `rainExpected: boolean` plus a human-readable summary
- Publish `apps/backend/src/db/fixtures/carparks.sample.json` **early** — a small hand-written set of 5–10 realistic carpark records — so Xi Fei and Nigel aren't blocked waiting for your full ingestion pipeline

**Frontend**
- Weather notice banner component (the "bring an umbrella" notice from the SRS's navigation-page mockup) — a small, self-contained component that Xavier slots into the Navigation page

## File/Folder Ownership

`apps/backend/src/modules/weather/`, `apps/backend/src/modules/carparks/`, `data/historical/` import scripts, `apps/frontend/src/features/weather/`

## Dependencies On Others

None to start — data.gov.sg, LTA, and the historical CSVs are all available to you from day one.

## What Others Depend On You For

- **The carpark fixture file** — Xi Fei and Nigel need real-shaped carpark rows to attach availability/scoring data to. Ship this in the first day or two, before the full ingestion pipeline is done.
- `WeatherInfo` type in `packages/shared-types/src/weather.ts` — Nigel's scoring engine consumes `rainExpected` and needs to know whether a given carpark counts as "sheltered" (derived from `car_park_type` — coordinate with Nigel on exactly which `car_park_type` values count as sheltered, e.g. "Covered", "Multi-storey", "Basement" vs "Surface").

## Step-by-Step Task Breakdown

1. Draft `packages/shared-types/src/weather.ts`.
2. Hand-write `carparks.sample.json` (5–10 records matching the real data.gov.sg schema) and publish it immediately — this is your highest-priority first deliverable since it unblocks two teammates.
3. Create the `carparks` and `carpark_availability_historical` migrations.
4. Build the CSV import script for historical data — validate that `available_lots`/`total_lots` are sane (drop invalid rows per UC-16.EX.2), derive `day_of_week` and hour bucket from each record's timestamp.
5. Build the full data.gov.sg Carpark Information + LTA EV Charging ingestion script, merging on postal code, writing into `carparks`. Decide how it's triggered (manual script run for the course project is fine — no need for a production cron scheduler unless you want one).
6. Build `GET /api/weather`.
7. Define — in writing, in a short comment in your weather module — exactly which `car_park_type` values are treated as "sheltered" for FR26's rain-preference rule, since Nigel's scoring needs this and the SRS doesn't specify it explicitly.
8. Build the weather banner frontend component (static content first, then wire to the real endpoint).
9. Re-run the full ingestion against live APIs and confirm `carparks` table row count/shape is sane before the integration week.

## API Endpoints You Own

See `docs/API_CONTRACT.md` section "Weather." (Carpark static data isn't exposed as your own endpoint — Min's `GET /api/carparks/:carParkNo` and `GET /api/carparks/nearby` read directly from your `carparks` table.)

## Acceptance Criteria / Definition of Done

- [ ] FR24: current/forecast weather retrieved for the destination
- [ ] FR25–FR26: rain forecast correctly flags sheltered carparks for preference (verify against Nigel's consumption of this data)
- [ ] FR27: weather info displayed to the user
- [ ] Carpark static data pipeline populates `carparks` with real data.gov.sg + LTA EV records, correctly merged by postal code
- [ ] Historical CSVs import cleanly into `carpark_availability_historical`, invalid rows dropped per UC-16.EX.2
- [ ] Sample fixture file published early enough that Xi Fei/Nigel weren't blocked
- [ ] All Section 9 (Definition of Done) checklist items from the root playbook

## Suggested First Commands

```bash
pnpm install
pnpm --filter backend dev
```
Your very first task should be the sample fixture file — do that before anything else.
