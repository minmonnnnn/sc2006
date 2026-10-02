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

    // Move fake time forward by 1 minute
    await vi.advanceTimersByTimeAsync(60 * 1000);

    expect(fetchCarparkAvailability).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
