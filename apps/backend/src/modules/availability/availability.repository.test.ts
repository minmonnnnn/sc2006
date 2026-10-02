import { describe, expect, it } from "vitest";
import { getAvailabilityByCarParkNo } from "./availability.repository.js";

describe("getAvailabilityByCarParkNo", () => {
  it("returns availability for an existing carpark", () => {
    const result = getAvailabilityByCarParkNo("AK19");

    expect(result).not.toBeNull();
    expect(result?.carParkNo).toBe("AK19");
    expect(result?.status).toBe("High");
  });

  it("returns null for a carpark that does not exist", () => {
    const result = getAvailabilityByCarParkNo("ZZ99");

    expect(result).toBeNull();
  });
});

// okconsole.log(getAvailabilityByCarParkNo("AK19"));
