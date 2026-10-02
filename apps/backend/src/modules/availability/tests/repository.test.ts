import { describe, expect, it } from "vitest";
import { replaceAvailabilityCache } from "../cache.js";
import { getAvailabilityByCarParkNo } from "../repository.js";

describe("getAvailabilityByCarParkNo", () => {
  it("returns availability for an existing carpark", () => {
    replaceAvailabilityCache([
      {
        carParkNo: "AK19",
        availableLots: 60,
        totalLots: 100,
        fetchedAt: new Date(),
      },
    ]);

    const result = getAvailabilityByCarParkNo("AK19");

    expect(result).not.toBeNull();
    expect(result?.carParkNo).toBe("AK19");
    expect(result?.status).toBe("High");
  });

  it("returns null for an unknown carpark", () => {
    replaceAvailabilityCache([]);

    const result = getAvailabilityByCarParkNo("ZZ99");

    expect(result).toBeNull();
  });
});
