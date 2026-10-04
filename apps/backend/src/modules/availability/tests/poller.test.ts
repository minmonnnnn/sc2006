import { describe, expect, it, vi } from "vitest";
import { fetchCarparkAvailability } from "../api.js";
import { startAvailabilityPoller } from "../poller.js";

vi.mock("../api.js", () => ({
  fetchCarparkAvailability: vi.fn(),
}));

describe("startAvailabilityPoller", () => {
  it("fetches availability every minute", async () => {
    vi.useFakeTimers();

    vi.mocked(fetchCarparkAvailability).mockResolvedValue([
      {
        carParkNo: "AK19",
        availableLots: 50,
        totalLots: 100,
        fetchedAt: new Date(),
      },
    ]);

    startAvailabilityPoller();
  });

  it("fetches availability immediately and every minute", async () => {
    vi.useFakeTimers();

    vi.mocked(fetchCarparkAvailability).mockResolvedValue([
      {
        carParkNo: "AK19",
        availableLots: 50,
        totalLots: 100,
        fetchedAt: new Date(),
      },
    ]);

    const stopPoller = startAvailabilityPoller();
    await vi.runAllTicks();
    expect(fetchCarparkAvailability).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(60 * 1000);
    expect(fetchCarparkAvailability).toHaveBeenCalledTimes(2);

    stopPoller();
    vi.useRealTimers();
  });
});
