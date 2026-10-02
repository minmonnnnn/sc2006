import { fetchCarparkAvailability } from "./availability.api.js";

export function startAvailabilityPoller() {
  const intervalMs = 60 * 1000;

  setInterval(async () => {
    try {
      const latestData = await fetchCarparkAvailability();
      console.log(`Fetched ${latestData.length} carpark availability records`);
    } catch (error) {
      console.error("Failed to refresh carpark availability: ", error);
    }
  }, intervalMs);
}
