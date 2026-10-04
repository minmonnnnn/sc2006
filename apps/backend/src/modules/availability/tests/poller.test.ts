import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchCarparkAvailability } from "../api.js";
import { getCachedAvailability, replaceAvailabilityCache } from "../cache.js";
import { checkAvailabilityAlerts } from "../alerts.service.js";
import { startAvailabilityPoller } from "../poller.js";

vi.mock("../api.js", () => ({
  fetchCarparkAvailability: vi.fn(),
}));

vi.mock("../alerts.service.js", () => ({
  checkAvailabilityAlerts: vi.fn(),
}));

describe("startAvailabilityPoller", () => {
  let stopPoller: (() => void) | undefined;

  const record = {
    carParkNo: "AK19",
    availableLots: 50,
    totalLots: 100,
    fetchedAt: new Date("2026-10-04T00:00:00Z"),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();

    replaceAvailabilityCache([]);

    vi.mocked(fetchCarparkAvailability).mockResolvedValue([record]);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    stopPoller?.();
    stopPoller = undefined;

    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();

    replaceAvailabilityCache([]);
  });

  it("fetches immediately and updates the cache", async () => {
    stopPoller = startAvailabilityPoller();

    await vi.advanceTimersByTimeAsync(0);

    expect(fetchCarparkAvailability).toHaveBeenCalledTimes(1);
    expect(getCachedAvailability("AK19")).toEqual(record);
    expect(checkAvailabilityAlerts).toHaveBeenCalledTimes(1);
  });

  it("refreshes every minute", async () => {
    stopPoller = startAvailabilityPoller();

    await vi.advanceTimersByTimeAsync(0);

    await vi.advanceTimersByTimeAsync(59_999);
    expect(fetchCarparkAvailability).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(fetchCarparkAvailability).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchCarparkAvailability).toHaveBeenCalledTimes(3);
  });

  it("stops future refreshes when stopped", async () => {
    stopPoller = startAvailabilityPoller();

    await vi.advanceTimersByTimeAsync(0);

    stopPoller();

    await vi.advanceTimersByTimeAsync(120_000);

    expect(fetchCarparkAvailability).toHaveBeenCalledTimes(1);
  });

  it("keeps the previous cache when fetching fails", async () => {
    replaceAvailabilityCache([record]);

    vi.mocked(fetchCarparkAvailability).mockRejectedValueOnce(
      new Error("Service unavailable"),
    );

    stopPoller = startAvailabilityPoller();

    await vi.advanceTimersByTimeAsync(0);

    expect(getCachedAvailability("AK19")).toEqual(record);
    expect(checkAvailabilityAlerts).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it("tries again after a failed refresh", async () => {
    vi.mocked(fetchCarparkAvailability)
      .mockRejectedValueOnce(new Error("Service unavailable"))
      .mockResolvedValueOnce([record]);

    stopPoller = startAvailabilityPoller();

    await vi.advanceTimersByTimeAsync(0);
    expect(getCachedAvailability("AK19")).toBeNull();

    await vi.advanceTimersByTimeAsync(60_000);

    expect(fetchCarparkAvailability).toHaveBeenCalledTimes(2);
    expect(getCachedAvailability("AK19")).toEqual(record);
    expect(checkAvailabilityAlerts).toHaveBeenCalledTimes(1);
  });
});
