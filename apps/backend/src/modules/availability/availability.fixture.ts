import { getCachedAvailability } from "./availability.cache.js";
import { buildAvailabilityInfo } from "./availability.service.js";

export function getAvailabilityByCarParkNo(carParkNo: string) {
  const item = getCachedAvailability(carParkNo);

  if (!item) {
    return null;
  }

  return {
    carParkNo: item.carParkNo,
    ...buildAvailabilityInfo(
      item.availableLots,
      item.totalLots,
      item.fetchedAt,
    ),
  };
}
