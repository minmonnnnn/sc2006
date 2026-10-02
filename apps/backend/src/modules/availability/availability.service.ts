export type AvailabilityStatus = "High" | "Moderate" | "Low" | "Unavailable";

export interface AvailabilityInfo {
  availableLots: number;
  totalLots: number;
  status: AvailabilityStatus;
  lastUpdated: string;
  isStale: boolean;
}

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

export function isAvailabilityStale(
  fetchedAt: Date,
  staleAfterMinutes = 5,
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
