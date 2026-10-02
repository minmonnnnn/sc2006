export interface AvailabilityAlert {
  id: number;
  carParkNo: string;
  enabled: boolean;
  lastKnownStatus: "High" | "Moderate" | "Low" | "Unavailable";
}

const alerts: AvailabilityAlert[] = [];

let nextId = 1;

export function createAlert(
  carParkNo: string,
  lastKnownStatus: AvailabilityAlert["lastKnownStatus"],
): AvailabilityAlert {
  const alert: AvailabilityAlert = {
    id: nextId++,
    carParkNo,
    enabled: true,
    lastKnownStatus,
  };

  alerts.push(alert);

  return alert;
}

export function setAlertEnabled(
  id: number,
  enabled: boolean,
): AvailabilityAlert | null {
  const alert = alerts.find((item) => item.id === id);

  if (!alert) {
    return null;
  }

  alert.enabled = enabled;

  return alert;
}

export function getEnabledAlerts(): AvailabilityAlert[] {
  return alerts.filter((alert) => alert.enabled);
}

export function updateAlertLastKnownStatus(
  id: number,
  status: AvailabilityAlert["lastKnownStatus"],
): AvailabilityAlert | null {
  const alert = alerts.find((item) => item.id === id);

  if (!alert) {
    return null;
  }

  alert.lastKnownStatus = status;

  return alert;
}
