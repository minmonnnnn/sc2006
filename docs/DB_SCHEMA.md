# Database Schema (Supabase / PostgreSQL)

Derived from the SRS Appendix A data dictionary. Each table lists its owner — that person writes and maintains its migration file under `apps/backend/src/db/migrations/`. Changing a table you don't own follows the same change process as shared types (Section 6 of the playbook).

---

## `profiles` — owner: Teik Fei
Extends Supabase's built-in `auth.users`. One row per registered user.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | FK → `auth.users.id` |
| `name` | `text` | |
| `vehicle_type` | `text` | `EV` \| `Petrol` \| `Hybrid` — influences EV-charging-aware recommendations |
| `created_at` | `timestamptz` | default `now()` |

Password hashing is handled by Supabase Auth (satisfies NFR4) — do not store raw or custom-hashed passwords in this table.

---

## `favourite_locations` — owner: Teik Fei

| Column | Type | Notes |
|---|---|---|
| `favourite_id` | `serial` PK | |
| `user_id` | `uuid` FK → `profiles.id` | |
| `location_name` | `text` | user-given label, e.g. "Home", "Office" |
| `address` | `text` | |
| `latitude` | `double precision` | |
| `longitude` | `double precision` | |
| `created_at` | `timestamptz` | default `now()` |

---

## `carparks` — owner: Moufooza
Static carpark information, ingested from data.gov.sg Carpark Information + LTA EV Charging data.

| Column | Type | Notes |
|---|---|---|
| `car_park_no` | `text` PK | HDB-assigned identifier, e.g. `AK19` |
| `address` | `text` | |
| `latitude` | `double precision` | |
| `longitude` | `double precision` | |
| `car_park_type` | `text` | Surface / Basement / Multi-storey / Covered |
| `total_lots` | `integer` | |
| `free_parking` | `text` | free-text condition, e.g. "SUN & PH FR 7AM-10:30PM" |
| `night_parking` | `text` | `YES` / `NO` with conditions |
| `has_ev_charging` | `boolean` | |
| `parking_system` | `text` | Electronic / Coupon |
| `postal_code` | `text` | used to cross-reference EV charging data |
| `parking_cost` | `numeric` | hourly/daily rate in SGD |
| `updated_at` | `timestamptz` | |

---

## `carpark_availability_historical` — owner: Moufooza
Populated by importing the historical CSVs Min already generated. Consumed by Nigel's engine (FR45, UC-16).

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` PK | |
| `car_park_no` | `text` FK → `carparks.car_park_no` | |
| `recorded_date` | `date` | actual calendar date of the snapshot |
| `day_of_week` | `smallint` | 0=Sunday .. 6=Saturday, derived from `recorded_date` at import time |
| `time_bucket_start` | `time` | hour bucket, e.g. `15:00` for the 3–4pm bucket |
| `available_lots` | `integer` | |
| `total_lots` | `integer` | |
| `created_at` | `timestamptz` | default `now()` |

Index on `(car_park_no, day_of_week, time_bucket_start)` — this is the exact lookup Nigel's `getHistoricalAvailabilityRatio` uses.

---

## `carpark_availability_cache` — owner: Xi Fei
Real-time cache, refreshed every 1 minute (FR14) by a background poll of data.gov.sg/LTA.

| Column | Type | Notes |
|---|---|---|
| `car_park_no` | `text` PK, FK → `carparks.car_park_no` | |
| `available_lots` | `integer` | |
| `total_lots` | `integer` | |
| `status` | `text` | `High` \| `Moderate` \| `Low` \| `Unavailable` — derived, see FR13 |
| `fetched_at` | `timestamptz` | used to compute `isStale` in the API response |

---

## `alerts` — owner: Xi Fei

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` PK | |
| `user_id` | `uuid` FK → `profiles.id` | |
| `car_park_no` | `text` FK → `carparks.car_park_no` | |
| `last_known_status` | `text` | used to detect "significant change" per FR40 |
| `enabled` | `boolean` | default `true` |
| `created_at` | `timestamptz` | |

---

## Notes for everyone

- Every table lives in one Supabase project (see repo setup guide for creating it). Don't create a second database.
- Migrations are plain `.sql` files under `apps/backend/src/db/migrations/`, one file per table/change, numbered sequentially (e.g. `001_profiles.sql`, `002_favourite_locations.sql`). Run them in order against your local/dev Supabase instance.
- Foreign keys to `carparks.car_park_no` mean your table can't be meaningfully populated until Moufooza's `carparks` table has rows — for local dev, seed a small fixture set of 5–10 fake carparks (matching the shape of real data.gov.sg records) so you're not blocked. Moufooza should publish this fixture early (`apps/backend/src/db/fixtures/carparks.sample.json`) for everyone to use.
