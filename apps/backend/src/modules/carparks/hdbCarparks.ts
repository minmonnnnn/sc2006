export type CarparkType = 'Surface' | 'Basement' | 'Multi-storey' | 'Covered'
export type ParkingSystem = 'Electronic' | 'Coupon'
export interface HdbCarparkRow {
  car_park_no: string
  address: string
  x_coord: string | number
  y_coord: string | number
  car_park_type: string
  type_of_parking_system: string
  free_parking?: string
  night_parking?: string
  [other: string]: unknown
}

/** Only static fields! Never send null placeholders that might overwrite enrichment fields. */
export interface StaticCarparkUpdate {
  car_park_no: string
  address: string
  latitude: number
  longitude: number
  car_park_type: CarparkType
  free_parking: string | null
  night_parking: string | null
  parking_system: ParkingSystem
  updated_at: string
}

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;
const A = 6378137;
const F = 1 / 298.257223563;
const E2 = 2 * F - F * F;
const EP2 = E2 / (1 - E2);
const LAT0 = 1.36666666666667 * DEG;
const LON0 = 103.833333333333 * DEG;
const E0 = 28001.642;
const N0 = 38744.572;
const K0 = 1;

function meridianArc(phi: number): number {
  const e4 = E2 * E2;
  const e6 = e4 * E2;
  return A * ((1 - E2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * phi
    - (3 * E2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * phi)
    + (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * phi)
    - (35 * e6 / 3072) * Math.sin(6 * phi));
}

/** Convert Singapore SVY21 easting/northing (EPSG:3414) to WGS84 lat/lng. */
export function svy21ToWgs84(easting: number, northing: number): { latitude: number; longitude: number } {
  if (!Number.isFinite(easting) || !Number.isFinite(northing)) {
    throw new Error('Invalid SVY21 coordinates');
  }
  const M = meridianArc(LAT0) + (northing - N0) / K0;
  const e4 = E2 * E2;
  const e6 = e4 * E2;
  const mu = M / (A * (1 - E2 / 4 - 3 * e4 / 64 - 5 * e6 / 256));
  const e1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2));
  const e13 = e1 ** 3;
  const e14 = e1 ** 4;
  const phi = mu
    + (3 * e1 / 2 - 27 * e13 / 32) * Math.sin(2 * mu)
    + (21 * e1 ** 2 / 16 - 55 * e14 / 32) * Math.sin(4 * mu)
    + (151 * e13 / 96) * Math.sin(6 * mu)
    + (1097 * e14 / 512) * Math.sin(8 * mu);
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const T = Math.tan(phi) ** 2;
  const C = EP2 * cosPhi ** 2;
  const N = A / Math.sqrt(1 - E2 * sinPhi ** 2);
  const R = A * (1 - E2) / (1 - E2 * sinPhi ** 2) ** 1.5;
  const D = (easting - E0) / (N * K0);
  const latitude = (phi - N * Math.tan(phi) / R * (
    D ** 2 / 2 - (5 + 3 * T + 10 * C - 4 * C ** 2 - 9 * EP2) * D ** 4 / 24
    + (61 + 90 * T + 298 * C + 45 * T ** 2 - 252 * EP2 - 3 * C ** 2) * D ** 6 / 720
  )) * RAD;
  const longitude = (LON0 + (
    D - (1 + 2 * T + C) * D ** 3 / 6
    + (5 - 2 * C + 28 * T - 3 * C ** 2 + 8 * EP2 + 24 * T ** 2) * D ** 5 / 120
  ) / cosPhi) * RAD;
  if (latitude < 1.0 || latitude > 1.6 || longitude < 103.4 || longitude > 104.3) {
    throw new Error('Converted coordinates are outside the expected Singapore bounds');
  }
  return { latitude, longitude };
}


export function normaliseCarparkType(raw: string): CarparkType {
  const type = raw.toUpperCase().trim()
  // Mixed surface/multi-storey locations must not be advertised as fully sheltered.
  if (type.includes('SURFACE')) return 'Surface'
  if (type.includes('BASEMENT')) return 'Basement'
  if (type.includes('MULTI-STOREY') || type.includes('MULTISTOREY')) return 'Multi-storey'
  if (type.includes('COVERED')) return 'Covered'
  throw new Error(`Unrecognised HDB carpark type: ${raw}`)
}

export function normaliseParkingSystem(raw: string): ParkingSystem {
  if (raw.trim().toUpperCase() === 'ELECTRONIC PARKING') return 'Electronic'
  if (raw.trim().toUpperCase() === 'COUPON PARKING') return 'Coupon'
  throw new Error(`Unrecognised parking system: ${raw}`)
}

export function deriveIsSheltered(carParkType: CarparkType): boolean {
  return carParkType === 'Basement' || carParkType === 'Multi-storey' || carParkType === 'Covered'
}

export function transformHdbRow(raw: HdbCarparkRow, timestamp: string): StaticCarparkUpdate {
  const car_park_no = String(raw.car_park_no ?? '').trim()
  const address = String(raw.address ?? '').trim()
  if (!car_park_no || !address) throw new Error('Missing carpark number or address')
  if (raw.x_coord == null || raw.y_coord == null || String(raw.x_coord).trim() === '' || String(raw.y_coord).trim() === '') {
    throw new Error(`Missing SVY21 coordinates for ${car_park_no}`)
  }
  const { latitude, longitude } = svy21ToWgs84(Number(raw.x_coord), Number(raw.y_coord))
  const free = String(raw.free_parking ?? '').trim()
  const night = String(raw.night_parking ?? '').trim()
  return {
    car_park_no, address, latitude, longitude,
    car_park_type: normaliseCarparkType(String(raw.car_park_type ?? '')),
    free_parking: free && free.toUpperCase() !== 'NO' ? free : null,
    night_parking: night || null,
    parking_system: normaliseParkingSystem(String(raw.type_of_parking_system ?? '')),
    updated_at: timestamp,
  }
}

export interface PrepareResult {
  rows: StaticCarparkUpdate[]
  rejected: { id: string; reason: string }[]
}

export function prepareHdbRows(input: unknown[], timestamp = new Date().toISOString()): PrepareResult {
  if (!Array.isArray(input)) throw new Error('Expected HDB records array')
  const accepted = new Map<string, StaticCarparkUpdate>()
  const rejected: PrepareResult['rejected'] = []
  for (const candidate of input) {
    try {
      if (candidate === null || typeof candidate !== 'object' || Array.isArray(candidate)) throw new Error('Invalid row')
      const row = transformHdbRow(candidate as HdbCarparkRow, timestamp)
      accepted.set(row.car_park_no, row)
    } catch (error) {
      const id = candidate && typeof candidate === 'object' && 'car_park_no' in candidate
        ? String(candidate.car_park_no) : '(unknown)'
      rejected.push({ id, reason: error instanceof Error ? error.message : String(error) })
    }
  }
  return { rows: [...accepted.values()], rejected }
}

const DATASET_ID = 'd_23f946fa557947f93a8043bbef41dd09'
/** Paginated official data.gov.sg dataset search; no API key required for small development usage. */
export async function fetchHdbCarparkRows(request: typeof fetch = fetch): Promise<unknown[]> {
  const all: unknown[] = []
  const pageSize = 500
  for (let offset = 0; offset < 50_000; offset += pageSize) {
    const url = `https://data.gov.sg/api/action/datastore_search?resource_id=${DATASET_ID}&limit=${pageSize}&offset=${offset}`
    const response = await request(url, { headers: { accept: 'application/json' } })
    if (!response.ok) throw new Error(`data.gov.sg responded with HTTP ${response.status} (offset ${offset})`)
    const json = await response.json() as { success?: boolean; result?: { records?: unknown[] } }
    if (json.success !== true || !Array.isArray(json.result?.records)) throw new Error('Unexpected data.gov.sg API response')
    all.push(...json.result.records)
    if (json.result.records.length < pageSize) return all
  }
  throw new Error('Too many HDB pages; import stopped to avoid an unbounded fetch')
}
