import { describe, expect, it } from "vitest";
import {
  createAlert,
  setAlertEnabled,
  getEnabledAlerts,
} from "../alerts.repository.js";

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

  it("excludes disabled alerts and includes them again when re-enabled", () => {
    const alert = createAlert("DISABLED_TEST", "High");

    expect(getEnabledAlerts()).toContainEqual(
      expect.objectContaining({ id: alert.id }),
    );

    setAlertEnabled(alert.id, false);

    expect(getEnabledAlerts()).not.toContainEqual(
      expect.objectContaining({ id: alert.id }),
    );

    setAlertEnabled(alert.id, true);

    expect(getEnabledAlerts()).toContainEqual(
      expect.objectContaining({ id: alert.id }),
    );

    // Leave this test's record disabled.
    setAlertEnabled(alert.id, false);
  });
});
