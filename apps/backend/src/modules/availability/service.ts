export type AvailabilityStatus = "High" | "Moderate" | "Low" | "Unavailable";

export interface AvailabilityInfo {
  availableLots: number;
  totalLots: number;
  status: AvailabilityStatus;
  lastUpdated: string;
  isStale: boolean;
}

/**
 * High: at least 50% of lots available.
 * Moderate: at least 20%, but below 50%.
 * Low: above 0%, but below 20%.
 * Unavailable: no available lots or non-positive capacity.
 */
export function getAvailabilityStatus(
  availableLots: number,
  totalLots: number,
): AvailabilityStatus {
  if (availableLots <= 0 || totalLots <= 0) {
    return "Unavailable";
  }

  const ratio = availableLots / totalLots;

  if (ratio >= 0.5) {
    return "High";
  }

  if (ratio >= 0.2) {
    return "Moderate";
  }

  return "Low";
}

/**
 * Data is stale when its source timestamp is more than
 * three minutes old. Exactly three minutes is still fresh.
 * Availability considered stale after 3min to allow for
 * tolerance for delayed or failed 1-minute refreshes :)
 */
export function isAvailabilityStale(
  fetchedAt: Date,
  staleAfterMinutes = 3,
): boolean {
  const now = new Date();

  const differenceInMs = now.getTime() - fetchedAt.getTime();
  const staleAfterMs = staleAfterMinutes * 60 * 1000;

  return differenceInMs > staleAfterMs;
}

export function buildAvailabilityInfo(
  availableLots: number,
  totalLots: number,
  fetchedAt: Date,
): AvailabilityInfo {
  return {
    availableLots,
    totalLots,
    status: getAvailabilityStatus(availableLots, totalLots),
    lastUpdated: fetchedAt.toISOString(),
    isStale: isAvailabilityStale(fetchedAt),
  };
}
