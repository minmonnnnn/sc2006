import { fetchCarparkAvailability } from "./availability.api.js";
import { replaceAvailabilityCache } from "./availability.cache.js";

export function startAvailabilityPoller() {
  const intervalMs = 60 * 1000;

  setInterval(async () => {
    try {
      const latestData = await fetchCarparkAvailability();
      console.log(`Fetched ${latestData.length} carpark availability records`);
      replaceAvailabilityCache(latestData);
    } catch (error) {
      console.error("Failed to refresh carpark availability: ", error);
    }
  }, intervalMs);
}
