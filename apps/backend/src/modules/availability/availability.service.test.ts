import { describe, expect, it } from "vitest";
import {
  getAvailabilityStatus,
  isAvailabilityStale,
  buildAvailabilityInfo,
} from "./availability.service.js";

describe("getAvailabilityStatus", () => {
  it("returns High when at least 50% of lots are available", () => {
    expect(getAvailabilityStatus(50, 100)).toBe("High");
  });

  it("returns Moderate when availability is between 20% and 50%", () => {
    expect(getAvailabilityStatus(30, 100)).toBe("Moderate");
  });

  it("returns Low when availability is below 20%", () => {
    expect(getAvailabilityStatus(10, 100)).toBe("Low");
  });

  it("returns Unavailable when no lots are available", () => {
    expect(getAvailabilityStatus(0, 100)).toBe("Unavailable");
  });
});

describe("isAvailabilityStale", () => {
  it("returns false for recent data", () => {
    const fetchedAt = new Date(Date.now() - 2 * 60 * 1000);

    expect(isAvailabilityStale(fetchedAt)).toBe(false);
  });

  it("returns true for data older than 5 minutes", () => {
    const fetchedAt = new Date(Date.now() - 10 * 60 * 1000);

    expect(isAvailabilityStale(fetchedAt)).toBe(true);
  });
});

describe("buildAvailabilityInfo", () => {
  it("builds an availability response", () => {
    const fetchedAt = new Date();

    const result = buildAvailabilityInfo(60, 100, fetchedAt);

    expect(result.availableLots).toBe(60);
    expect(result.totalLots).toBe(100);
    expect(result.status).toBe("High");
    expect(result.lastUpdated).toBe(fetchedAt.toISOString());
    expect(result.isStale).toBe(false);
  });
});
