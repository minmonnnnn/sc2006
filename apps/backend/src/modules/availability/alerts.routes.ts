import { Router } from "express";
import { createAlert, setAlertEnabled } from "./alerts.repository.js";
import { getAvailabilityByCarParkNo } from "./repository.js";

const router: Router = Router();

router.post("/", (req, res) => {
  const { carParkNo } = req.body as {
    carParkNo?: unknown;
  };

  if (typeof carParkNo !== "string" || carParkNo.trim() === "") {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: "carParkNo must be provided",
      },
    });
  }

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
  const id = Number(req.params.id);

  const { enabled } = req.body as {
    enabled?: unknown;
  };

  if (!Number.isInteger(id) || typeof enabled !== "boolean") {
    return res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: "Valid alert id and enabled value are required",
      },
    });
  }

  const alert = setAlertEnabled(id, enabled);

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
