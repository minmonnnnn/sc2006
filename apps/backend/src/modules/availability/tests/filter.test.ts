import { describe, expect, it } from "vitest";
import { filterCarparks } from "../filter.js";

const carparks = [
  {
    carParkNo: "A1",
    hasEvCharging: true,
    parkingCost: 1.5,
    availabilityStatus: "High" as const,
    isSheltered: false,
  },
  {
    carParkNo: "B1",
    hasEvCharging: false,
    parkingCost: 2.5,
    availabilityStatus: "Moderate" as const,
    isSheltered: true,
  },
  {
    carParkNo: "C1",
    hasEvCharging: true,
    parkingCost: 1.0,
    availabilityStatus: "Low" as const,
    isSheltered: true,
  },
];

describe("filterCarparks", () => {
  it("filters by EV charging", () => {
    const result = filterCarparks(carparks, {
      evChargingOnly: true,
    });

    expect(result.map((carpark) => carpark.carParkNo)).toEqual(["A1", "C1"]);
  });

  it("filters by maximum cost", () => {
    const result = filterCarparks(carparks, {
      maxCost: 1.5,
    });

    expect(result.map((carpark) => carpark.carParkNo)).toEqual(["A1", "C1"]);
  });

  it("filters by minimum availability", () => {
    const result = filterCarparks(carparks, {
      minAvailability: "Moderate",
    });

    expect(result.map((carpark) => carpark.carParkNo)).toEqual(["A1", "B1"]);
  });

  it("filters by sheltered carpark", () => {
    const result = filterCarparks(carparks, {
      shelteredOnly: true,
    });

    expect(result.map((carpark) => carpark.carParkNo)).toEqual(["B1", "C1"]);
  });
});

it("combines multiple filters using AND logic", () => {
  const result = filterCarparks(carparks, {
    evChargingOnly: true,
    maxCost: 1.5,
    minAvailability: "Moderate",
  });

  expect(result.map((carpark) => carpark.carParkNo)).toEqual(["A1"]);
});

it("returns all carparks when no filters are applied", () => {
  const result = filterCarparks(carparks, {});

  expect(result).toEqual(carparks);
});
