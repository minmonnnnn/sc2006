import { buildAvailabilityInfo } from "./availability.service.js";
import { fakeAvailabilityData } from "./availability.fixture.js";

export function getAllAvailability() {
  return fakeAvailabilityData.map((item) => ({
    carParkNo: item.carParkNo,
    ...buildAvailabilityInfo(
      item.availableLots,
      item.totalLots,
      item.fetchedAt,
    ),
  }));
}

export function getAvailabilityByCarParkNo(carParkNo: string) {
  const item = fakeAvailabilityData.find(
    (entry) => entry.carParkNo === carParkNo,
  );

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

getAvailabilityByCarParkNo("AK19");
