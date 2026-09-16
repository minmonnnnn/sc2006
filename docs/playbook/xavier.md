# Playbook — Xavier

> Read `AGENT_PLAYBOOK.md` at the repo root first — it applies to you too. This file is your specific scope.

## Your Mission

Own everything about getting from A to B: traffic-aware driving time estimates, walking time, and the full route/navigation experience once a carpark is selected. Entirely dependent on external Google/LTA APIs, not on any teammate's module — you can start immediately.

## SRS Requirements You Own

- **FR21–FR23** — Retrieve traffic info, traffic-aware driving time, traffic status (Section 4.6)
- **FR28–FR29** — Calculate driving time, display combined driving + walking time (Section 4.8)
- **FR30–FR34** — Display route, route to carpark, walking route, route info, alternative routes (Section 4.9)
- **UC-03** Calculate Driving Time, **UC-04** Calculate Walking Distance and Time, **UC-09** View Route to Carpark and Destination

## What You're Building

**Backend**
- `GET /api/routes/driving` — wraps Google Distance Matrix/Directions, incorporates LTA traffic data, classifies traffic as Light/Moderate/Heavy, supports alternative routes
- `GET /api/routes/walking` — wraps Google Directions (walking mode)
- Expose both as **importable functions**, not just HTTP handlers — Min's orchestrator and Nigel's scoring engine call these directly for each candidate carpark, so avoid an unnecessary internal HTTP round-trip

**Frontend**
- Navigation page: map with the driving route polyline to the selected carpark and the walking route polyline from carpark to destination, travel time/distance summary, alternative-route picker, "cancel navigation" button (per the SRS's user-control HCI note)
- Weather notice slot on the navigation page (Moufooza supplies the actual weather banner component — you just leave a slot for it, don't build the weather logic yourself)

## File/Folder Ownership

`apps/backend/src/modules/routing/`, `apps/frontend/src/features/navigation/`, `apps/frontend/src/pages/Navigation*`

## Dependencies On Others

None for your core logic — Google Maps Platform + LTA DataMall are external. You only need a destination + carpark coordinate pair to compute a route, which you can supply as test fixtures without waiting on anyone.

## What Others Depend On You For

- `DrivingRoute` and `WalkingRoute` types in `packages/shared-types/src/route.ts` — draft early; Nigel's scoring engine needs `etaMinutes` and Min's orchestrator needs the full route objects.
- Your two routing functions are called once per candidate carpark inside Min's orchestrator (could be 5–10 calls per search) — be mindful of Google Maps API rate limits/cost; consider batching via Distance Matrix where possible instead of one Directions call per carpark.

## Step-by-Step Task Breakdown

1. Get a Google Maps Platform API key (Directions API, Distance Matrix API, Places API enabled) — coordinate with Min since this may be a shared project-level key stored in backend secrets, not per-person.
2. Draft `packages/shared-types/src/route.ts` (`DrivingRoute`, `WalkingRoute`).
3. Build `GET /api/routes/driving` against a fixed test origin/destination pair first, without traffic classification, to confirm the Google integration works end to end.
4. Add LTA DataMall traffic data integration and the Light/Moderate/Heavy classification logic (define your own thresholds since the SRS doesn't specify exact cutoffs — document them).
5. Add alternative-routes support (FR34).
6. Build `GET /api/routes/walking`.
7. Build the Navigation page UI against fixture route data (hardcoded polyline/time/distance) so you're not blocked on your own backend being fully wired.
8. Wire the Navigation page to the real endpoints.
9. Add the alternative-route picker UI.
10. Add the "cancel navigation" flow (UC-09 doesn't specify exact behaviour beyond returning control to the user — confirm with Min whether this should route back to carpark details or the home screen).

## API Endpoints You Own

See `docs/API_CONTRACT.md` section "Routing & Navigation."

## Acceptance Criteria / Definition of Done

- [ ] FR21–FR23: traffic info retrieved, driving time reflects current traffic, traffic status displayed
- [ ] FR28–FR29: driving time calculated, combined driving+walking time displayed
- [ ] FR30–FR33: route displayed on map, route to carpark, walking route, time/distance info all present
- [ ] FR34: alternative routes offered when available
- [ ] UC-09.EX.1/EX.2/EX.3: driving route unavailable, walking route unavailable, and routing service down are all handled with clear user messaging, not a blank screen
- [ ] All Section 9 (Definition of Done) checklist items from the root playbook

## Suggested First Commands

```bash
pnpm install
pnpm --filter backend dev
```
Get your Google Maps key working against a single hardcoded route before touching the UI.
