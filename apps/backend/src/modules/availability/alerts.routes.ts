import { Router } from "express";
import { createAlert, setAlertEnabled } from "./alerts.repository.js";
import { getAvailabilityByCarParkNo } from "./repository.js";

const router: Router = Router();

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

router.post("/", (req, res) => {
  const body: unknown = req.body;

  if (
    !isObject(body) ||
    typeof body.carParkNo !== "string" ||
    body.carParkNo.trim() === ""
  ) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "carParkNo must be a non-empty string",
      },
    });
  }

  const carParkNo = body.carParkNo.trim();
  const availability = getAvailabilityByCarParkNo(carParkNo);

  if (!availability) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Carpark availability not found",
      },
    });
  }

  const alert = createAlert(carParkNo, availability.status);

  return res.status(201).json({
    alertId: String(alert.id),
    carParkNo: alert.carParkNo,
    enabled: alert.enabled,
  });
});

router.patch("/:id", (req, res) => {
  const rawId = req.params.id;
  const id = Number(rawId);
  const body: unknown = req.body;

  if (
    !/^[1-9]\d*$/.test(rawId) ||
    !Number.isSafeInteger(id) ||
    !isObject(body) ||
    typeof body.enabled !== "boolean"
  ) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "A positive integer alert id and boolean enabled are required",
      },
    });
  }

  const alert = setAlertEnabled(id, body.enabled);

  if (!alert) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Alert not found",
      },
    });
  }

  return res.status(200).json({
    alertId: String(alert.id),
    carParkNo: alert.carParkNo,
    enabled: alert.enabled,
  });
});

export default router;
