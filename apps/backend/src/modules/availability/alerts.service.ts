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

    const previousStatus = alert.lastKnownStatus;

    const changed = hasSignificantAvailabilityChange(
      previousStatus,
      availability.status,
    );

    if (!changed) {
      continue;
    }

    updateAlertLastKnownStatus(alert.id, availability.status);

    console.log(
      `Availability alert: ${alert.carParkNo} changed from ${previousStatus} to ${availability.status}`,
    );
  }
}
