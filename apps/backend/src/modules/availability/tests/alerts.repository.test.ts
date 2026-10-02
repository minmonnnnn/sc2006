import { describe, expect, it } from "vitest";
import { createAlert, setAlertEnabled } from "../alerts.repository.js";

describe("availability alert repository", () => {
  it("creates an enabled alert", () => {
    const alert = createAlert("AK19", "High");

    expect(alert.carParkNo).toBe("AK19");
    expect(alert.enabled).toBe(true);
    expect(alert.lastKnownStatus).toBe("High");
  });

  it("can disable an alert", () => {
    const alert = createAlert("BK25", "Moderate");

    const updated = setAlertEnabled(alert.id, false);

    expect(updated).not.toBeNull();
    expect(updated?.enabled).toBe(false);
  });

  it("returns null for an unknown alert", () => {
    const updated = setAlertEnabled(99999, false);

    expect(updated).toBeNull();
  });
});
