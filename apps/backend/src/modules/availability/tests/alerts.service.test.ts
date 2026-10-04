import { describe, expect, it } from "vitest";
import {
  hasSignificantAvailabilityChange,
  checkAvailabilityAlerts,
} from "../alerts.service.js";
import {
  createAlert,
  getEnabledAlerts,
  setAlertEnabled,
} from "../alerts.repository.js";
import { replaceAvailabilityCache } from "../cache.js";

describe("alerts service", () => {
  it("detects a significant status change", () => {
    expect(hasSignificantAvailabilityChange("High", "Moderate")).toBe(true);
  });

  it("does not detect a change when status is unchanged", () => {
    expect(hasSignificantAvailabilityChange("High", "High")).toBe(false);
  });

  it("updates lastKnownStatus after a significant change", () => {
    const alert = createAlert("AK19", "High");

    replaceAvailabilityCache([
      {
        carParkNo: "AK19",
        availableLots: 30,
        totalLots: 100,
        fetchedAt: new Date(),
      },
    ]);

    checkAvailabilityAlerts();

    const updatedAlert = getEnabledAlerts().find(
      (item) => item.id === alert.id,
    );

    expect(updatedAlert?.lastKnownStatus).toBe("Moderate");
  });

  it("does not trigger again after lastKnownStatus is updated", () => {
    const alert = createAlert("AK19", "High");

    replaceAvailabilityCache([
      {
        carParkNo: "AK19",
        availableLots: 30,
        totalLots: 100,
        fetchedAt: new Date(),
      },
    ]);

    // High -> Moderate
    checkAvailabilityAlerts();

    const updatedAlert = getEnabledAlerts().find(
      (item) => item.id === alert.id,
    );

    expect(updatedAlert?.lastKnownStatus).toBe("Moderate");

    // Run again with the same Moderate status
    checkAvailabilityAlerts();

    expect(updatedAlert?.lastKnownStatus).toBe("Moderate");
  });

  it("does not process disabled alerts", () => {
    const alert = createAlert("BK25", "High");

    setAlertEnabled(alert.id, false);

    replaceAvailabilityCache([
      {
        carParkNo: "BK25",
        availableLots: 5,
        totalLots: 100,
        fetchedAt: new Date(),
      },
    ]);

    checkAvailabilityAlerts();

    expect(getEnabledAlerts()).not.toContainEqual(
      expect.objectContaining({
        id: alert.id,
      }),
    );
  });
});
