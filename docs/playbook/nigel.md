# Playbook — Nigel

> Read `AGENT_PLAYBOOK.md` at the repo root first — it applies to you too. This file is your specific scope.

## Your Mission

Own the core intelligence of the app: the recommendation/ranking algorithm that turns raw availability, walking distance, and weather data into a ranked carpark list. Also own the standard error-handling format every backend module uses. This is pure-logic-heavy work — you can build and fully unit-test it before any other module is finished, using synthetic inputs.

## SRS Requirements You Own

- **FR41–FR43** — Error handling: invalid destination, no nearby carparks, data source failure (Section 4.12)
- **FR44–FR49** — Recommendation scoring formulas (Section 4.13) — the most detail-critical part of the whole system
- **UC-15** Generate Carpark Recommendations, **UC-16** Get Historical Carpark Availability

## The Exact Formulas You're Implementing (from the SRS — do not deviate without team sign-off)

**FR44 — Real-time availability ratio:**
```
realTimeRatio = availableLots / totalLots
```

**FR45 — Historical availability ratio:**
For the same day-of-week and same 1-hour bucket as the estimated arrival time, average the ratio (`available/total`) across all matching historical records. **At least 4 distinct historical days are required** for the value to be considered reliable — otherwise treat it as insufficient (returns `null`, triggers the FR46 fallback).

**FR46 — Availability score (time-dependent weighting):**
```
w = 0.5 ^ (ETA / 15)
availabilityScore = w * realTimeRatio + (1 - w) * historicalRatio
```
Where `ETA` is the traffic-aware estimated arrival time in minutes (from Xavier's driving route). At `ETA = 15`, real-time and historical are weighted equally. As `ETA` increases, historical weighting increases (current availability becomes less representative of availability at actual arrival time). **If historical data is unavailable/insufficient, use `realTimeRatio` alone as the availability score** — don't multiply by `w` in that fallback case.

**FR47 — Walking distance score:**
```
walkingScore = max(0, 1 - (walkingDistance / maxAcceptableWalkingDistance))
```
`maxAcceptableWalkingDistance` isn't specified numerically in the SRS — pick a reasonable default (e.g. 800m, roughly a 10-minute walk) and document your choice; flag it to the team as a config value that might need tuning after user testing.

**FR48 — Base recommendation score:**
```
baseScore = 0.6 * availabilityScore + 0.4 * walkingScore
```

**FR49 — Additional factors (not separate formulas, but rules layered on top):**
- Traffic: already folded into `ETA` (via Xavier's module) before it reaches FR46 — don't apply it again here.
- EV charging / other mandatory filters: applied as a hard exclusion *before* scoring (Xi Fei's filter logic, upstream of you) — don't re-filter inside the scoring function.
- Parking cost: same — a filter upstream, not part of the score itself.
- Weather: when rain is forecast, suitable **sheltered** carparks get additional preference. The SRS doesn't specify an exact bonus formula — implement this as a documented, tunable bonus (e.g. `finalScore = baseScore * 1.1` for sheltered carparks when `rainExpected` is true, capped so it can't exceed 1.0) and flag this choice explicitly in your PR description and to the team, since it's an interpretation of an underspecified rule.

## What You're Building

**Backend (no dedicated HTTP endpoint — internal module, consumed by Min's orchestrator)**
- `calculateRecommendationScore(input): RecommendationResult` — pure function implementing FR46–FR49
- `getHistoricalAvailabilityRatio(carParkNo, dayOfWeek, hour): number | null` — implements FR45/UC-16, reads Moufooza's `carpark_availability_historical` table
- `rankCarparks(candidates[]): RankedCarpark[]` — applies the above to a candidate list and sorts descending by `finalScore`
- The shared error-handling middleware and `ApiException` class (`apps/backend/src/lib/errors/`) — implements FR41–FR43, used by every other backend module

## File/Folder Ownership

`apps/backend/src/modules/recommendation/`, `apps/backend/src/lib/errors/`

## Dependencies On Others

You need real-time ratio, historical ratio, ETA, walking distance, and weather/sheltered-status as inputs. **Don't wait for the real modules** — write your own synthetic test fixtures covering edge cases (ETA=0, ETA=60+, historical data present/insufficient/absent, walking distance at/beyond the max threshold, rain forecast on/off) and build + fully unit-test your scoring logic against those. Swap in real calls to Xi Fei/Xavier/Moufooza's modules only once your formulas are proven correct in isolation.

## What Others Depend On You For

- The error-handling standard (Section 8 of the root playbook) — build this early since every other backend module should be throwing `ApiException` instead of raw errors from the start, not retrofitting it later.
- `RecommendationResult` type in `packages/shared-types/src/recommendation.ts` — Min's orchestrator needs this shape to build `RankedCarpark`.

## Step-by-Step Task Breakdown

1. Build the error-handling middleware + `ApiException` class first — this is a small, self-contained piece everyone else needs early. Publish it and tell the team it's ready to use.
2. Draft `packages/shared-types/src/recommendation.ts`.
3. Implement `calculateRecommendationScore` with the exact FR46–FR48 formulas, unit-tested against hand-calculated expected values for several input combinations (do the maths by hand for 2–3 cases and assert your function matches).
4. Implement the sheltered-carpark weather bonus (FR49), documented and flagged as an interpreted rule per above.
5. Implement `getHistoricalAvailabilityRatio` against Moufooza's schema — write this against her documented table shape even before her import script has real data; use a hand-seeded test dataset in `carpark_availability_historical` for your own tests.
6. Implement the "insufficient historical data" fallback path (fewer than 4 distinct days → `null` → FR46's real-time-only fallback).
7. Implement `rankCarparks`, including the FR49 exclusion behaviour: if essential data is missing for a carpark such that no score can be calculated, exclude it from ranking rather than crashing (UC-15.EX.1/EX.2); if *no* carparks can be scored, this should surface as `NO_CARPARKS_FOUND` for the orchestrator to return.
8. Write integration tests combining `rankCarparks` with realistic multi-carpark input sets.
9. Once Xi Fei, Xavier, and Moufooza have real endpoints/modules, help Min wire them into the orchestrator's calls into your `rankCarparks` function (coordinate — this is shared integration work, not solely yours).

## Acceptance Criteria / Definition of Done

- [ ] FR44–FR45: real-time and historical ratios calculated exactly as specified, including the 4-distinct-day reliability threshold
- [ ] FR46: time-dependent weighting formula implemented exactly, including the real-time-only fallback when historical data is insufficient
- [ ] FR47: walking score formula implemented, max-distance constant documented and flagged as tunable
- [ ] FR48: base score formula implemented exactly (0.6/0.4 weighting)
- [ ] FR49: EV/cost filters confirmed as upstream exclusions (not duplicated in your scoring code); weather/sheltered bonus implemented and documented as an interpreted rule
- [ ] FR41–FR43: standard error shape returned for invalid destination, no carparks found, and external service failure cases
- [ ] UC-15.EX.1/EX.2: carparks with unscoreable data are excluded gracefully, not crashing the whole ranking
- [ ] UC-16.AC.1/EX.2: insufficient/invalid historical data handled per spec
- [ ] Hand-calculated test cases pass for the scoring formulas
- [ ] All Section 9 (Definition of Done) checklist items from the root playbook

## Suggested First Commands

```bash
pnpm install
pnpm --filter backend dev
```
Start with the error-handling module, then the scoring formulas with hand-written test fixtures — don't wait on anyone else's data.
