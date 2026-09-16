# API Contract

This is the source of truth for every backend endpoint. Update this file **before** implementing or changing an endpoint, following the change process in `AGENT_PLAYBOOK.md` Section 6. Frontend agents should build against this document (via mocks) even before the real endpoint exists.

All responses use the shared `ApiError` shape (see `packages/shared-types/src/api-error.ts`) on failure. All request/response bodies are JSON. Base URL: `/api`.

---

## Auth & Profile — owner: Teik Fei

### `POST /api/auth/register`
Registers a user via Supabase Auth and creates a matching `profiles` row.
- **Request:** `{ email: string; password: string; name: string; vehicleType: "EV" | "Petrol" | "Hybrid" }`
- **Response 201:** `{ userId: string; email: string; name: string }`
- **Errors:** `VALIDATION_ERROR`, `409 ACCOUNT_ALREADY_EXISTS`
- **FR:** FR1

### `POST /api/auth/login`
- **Request:** `{ email: string; password: string }`
- **Response 200:** `{ userId: string; token: string }`
- **Errors:** `401 UNAUTHORIZED` (incorrect credentials)
- **FR:** FR1

### `GET /api/users/me`
Requires auth token. Returns the current user's profile.
- **Response 200:** `User` (see shared-types `user.ts`)
- **FR:** FR2

### `PUT /api/users/me`
- **Request:** `Partial<{ name: string; vehicleType: "EV" | "Petrol" | "Hybrid" }>`
- **Response 200:** updated `User`
- **FR:** FR2

### `DELETE /api/users/me`
Deletes the account and associated personal data.
- **Response 204**
- **FR:** NFR6, UC-13

---

## Favourites — owner: Teik Fei

### `GET /api/favourites`
- **Response 200:** `FavouriteLocation[]`
- **FR:** FR36

### `POST /api/favourites`
- **Request:** `{ locationName: string; address: string; latitude: number; longitude: number }`
- **Response 201:** `FavouriteLocation`
- **Errors:** `409` if an identical location is already saved (UC-10.AC.2)
- **FR:** FR35

### `PATCH /api/favourites/:id`
Rename.
- **Request:** `{ locationName: string }`
- **Response 200:** updated `FavouriteLocation`
- **FR:** FR38

### `DELETE /api/favourites/:id`
- **Response 204**
- **FR:** FR39

---

## Destination Search & Orchestration — owner: Min

### `GET /api/destinations/search?query=<text>`
Thin proxy to Google Places Autocomplete.
- **Response 200:** `DestinationSuggestion[]` — `{ placeId: string; name: string; address: string }[]`
- **FR:** FR3, FR4

### `GET /api/destinations/:placeId/resolve`
Resolves a chosen suggestion to coordinates.
- **Response 200:** `Destination` (see shared-types) — `{ placeId, name, address, latitude, longitude }`
- **Errors:** `DESTINATION_NOT_FOUND`
- **FR:** FR5, FR6

### `GET /api/carparks/nearby`
**Orchestrator endpoint.** Calls Moufooza's carpark static data, Xi Fei's real-time availability, Xavier's driving-time module, and Nigel's recommendation engine, then returns the ranked list. Build this against mocks of each dependency first; wire in real calls as each module ships.
- **Query params:** `destinationLat, destinationLng, originLat?, originLng?, vehicleType?, filters?` (see Xi Fei's filter spec below)
- **Response 200:** `RankedCarpark[]` — each item: `{ carpark: Carpark; distanceMeters: number; drivingEtaMinutes: number; walkingEtaMinutes: number; availability: AvailabilityInfo; recommendationScore: number }`
- **Errors:** `DESTINATION_NOT_FOUND`, `NO_CARPARKS_FOUND`, `EXTERNAL_SERVICE_UNAVAILABLE` (partial — indicate which sub-service failed and return partial results, per FR43/UC-01.EX.3)
- **FR:** FR8–FR10, FR44–FR49 (via Nigel's engine), UC-01

### `GET /api/carparks/:carParkNo`
Static + current details for one carpark, used by the details page.
- **Response 200:** `CarparkDetails` — carpark static fields + current `AvailabilityInfo`
- **FR:** FR10

---

## Availability & Filtering & Alerts — owner: Xi Fei

### `GET /api/carparks/:carParkNo/availability`
- **Response 200:** `AvailabilityInfo` — `{ availableLots: number; totalLots: number; status: "High" | "Moderate" | "Low" | "Unavailable"; lastUpdated: string; isStale: boolean }`
- **FR:** FR11–FR15

Availability is refreshed by a background job (poll data.gov.sg/LTA) every 1 minute per FR14 — implement as a scheduled task, cache results (see `DB_SCHEMA.md` → `carpark_availability_cache`).

### Filter query params (consumed by `GET /api/carparks/nearby`)
`filters` object: `{ evChargingOnly?: boolean; maxCost?: number; minAvailability?: "High" | "Moderate" | "Low" }`. Multiple filters combine with AND logic. Empty/absent object = unfiltered.
- **FR:** FR16–FR20

### `POST /api/alerts`
Subscribe to availability-change alerts for a carpark.
- **Request:** `{ carParkNo: string }`
- **Response 201:** `{ alertId: string; carParkNo: string; enabled: true }`
- **FR:** FR40

### `PATCH /api/alerts/:id`
- **Request:** `{ enabled: boolean }`
- **Response 200**
- **FR:** FR40, UC-14.AC.2

---

## Routing & Navigation — owner: Xavier

### `GET /api/routes/driving?originLat&originLng&destLat&destLng`
- **Response 200:** `DrivingRoute` — `{ polyline: string; distanceMeters: number; durationMinutes: number; trafficStatus: "Light" | "Moderate" | "Heavy"; alternatives?: DrivingRoute[] }`
- **Errors:** `EXTERNAL_SERVICE_UNAVAILABLE` (routing service down)
- **FR:** FR21–FR23, FR28, FR30, FR31, FR34

### `GET /api/routes/walking?originLat&originLng&destLat&destLng`
- **Response 200:** `WalkingRoute` — `{ polyline: string; distanceMeters: number; durationMinutes: number }`
- **FR:** FR29, FR32

Note: `GET /api/carparks/nearby` internally calls these two for each candidate carpark to compute ETAs used in ranking — expose them as internally-callable functions, not just HTTP handlers, so Nigel/Min can import them directly without an HTTP round-trip.

---

## Weather — owner: Moufooza

### `GET /api/weather?lat&lng`
- **Response 200:** `WeatherInfo` — `{ condition: string; rainExpected: boolean; forecastSummary: string; retrievedAt: string }`
- **Errors:** `EXTERNAL_SERVICE_UNAVAILABLE`
- **FR:** FR24, FR27

---

## Recommendation Engine — owner: Nigel

Not exposed as its own HTTP endpoint by default — it's an internal module (`apps/backend/src/modules/recommendation/`) called by Min's `GET /api/carparks/nearby` orchestrator. Documented here so its inputs/outputs are a stable contract.

### `calculateRecommendationScore(input: RecommendationInput): RecommendationResult`
- **Input:** `{ realTimeAvailabilityRatio: number | null; historicalAvailabilityRatio: number | null; etaMinutes: number; walkingDistanceMeters: number; rainExpected: boolean; isSheltered: boolean }`
- **Output:** `{ availabilityScore: number; walkingScore: number; baseScore: number; finalScore: number }`
- **FR:** FR44–FR49 — implements the exact formulas from the SRS (see `docs/playbook/nigel.md` for the formulas)

### `getHistoricalAvailabilityRatio(carParkNo: string, arrivalDayOfWeek: number, arrivalHour: number): number | null`
Returns `null` (insufficient data) if fewer than 4 distinct historical days exist for that day-of-week/hour bucket, per UC-16.
- **FR:** FR45, UC-16

---

## Contract Change Log

Record changes here as they happen, so everyone can see what shifted since they last read this file.

| Date | Change | Author | Approved by |
|---|---|---|---|
| _(repo bootstrap date)_ | Initial contract drafted from SRS | Min | Whole team |
