import { fetchCarparkAvailability } from "./api.js";
import { replaceAvailabilityCache } from "./cache.js";
import { checkAvailabilityAlerts } from "./alerts.service.js";

const POLL_INTERVAL_MS = 60 * 1000;

async function refreshAvailability(): Promise<void> {
  try {
    const latestData = await fetchCarparkAvailability();

    replaceAvailabilityCache(latestData);

    checkAvailabilityAlerts();
  } catch (error) {
    console.error("Failed to refresh carpark availability:", error);
  }
}

export function startAvailabilityPoller(): () => void {
  // Fetch once immediately when backend starts
  void refreshAvailability();

  // Continue refreshing once per minute
  const intervalId = setInterval(() => {
    void refreshAvailability();
  }, POLL_INTERVAL_MS);

  return () => {
    clearInterval(intervalId);
  };
}
