import { fetchCarparkAvailability } from "./api.js";
import { replaceAvailabilityCache } from "./cache.js";
import { checkAvailabilityAlerts } from "./alerts.service.js";

export function startAvailabilityPoller() {
  const intervalMs = 60 * 1000;

  setInterval(async () => {
    try {
      const latestData = await fetchCarparkAvailability();

      replaceAvailabilityCache(latestData);
      checkAvailabilityAlerts();

      console.log(`Fetched ${latestData.length} carpark availability records`);
    } catch (error) {
      console.error("Failed to refresh carpark availability: ", error);
    }
  }, intervalMs);
}
