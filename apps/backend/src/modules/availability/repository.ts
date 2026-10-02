import { buildAvailabilityInfo } from "./service.js";
import { getCachedAvailability } from "./cache.js";

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
