import { buildAvailabilityInfo } from "./availability.service.js";
import { getCachedAvailability } from "./availability.cache.js";

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
