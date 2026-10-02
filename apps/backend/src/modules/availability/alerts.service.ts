import type { AvailabilityStatus } from "./service.js";
import { getAvailabilityByCarParkNo } from "./repository.js";
import {
  getEnabledAlerts,
  updateAlertLastKnownStatus,
} from "./alerts.repository.js";

export function hasSignificantAvailabilityChange(
  previousStatus: AvailabilityStatus,
  currentStatus: AvailabilityStatus,
): boolean {
  return previousStatus !== currentStatus;
}

export function checkAvailabilityAlerts(): void {
  const enabledAlerts = getEnabledAlerts();

  for (const alert of enabledAlerts) {
    const availability = getAvailabilityByCarParkNo(alert.carParkNo);

    if (!availability) {
      continue;
    }

    const changed = hasSignificantAvailabilityChange(
      alert.lastKnownStatus,
      availability.status,
    );

    if (changed) {
      updateAlertLastKnownStatus(alert.id, availability.status);
      console.log(
        `Availability alert: ${alert.carParkNo} changed from ${alert.lastKnownStatus} to ${availability.status}`,
      );
    }
  }
}
