import { describe, expect, it, vi } from "vitest";
import { fetchCarparkAvailability } from "./availability.api.js";
import { startAvailabilityPoller } from "./availability.poller.js";

vi.mock("./availability.api.js", () => ({
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
