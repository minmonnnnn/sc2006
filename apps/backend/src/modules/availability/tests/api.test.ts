import { describe, expect, it } from "vitest";
import { fetchCarparkAvailability } from "../api.js";

describe("fetchCarparkAvailability", () => {
  it("fetches and transforms carpark availability data", async () => {
    const result = await fetchCarparkAvailability();

    expect(result.length).toBeGreaterThan(0);

    expect(result[0]).toHaveProperty("carParkNo");
    expect(result[0]).toHaveProperty("availableLots");
    expect(result[0]).toHaveProperty("totalLots");
    expect(result[0]).toHaveProperty("fetchedAt");
  });
});
