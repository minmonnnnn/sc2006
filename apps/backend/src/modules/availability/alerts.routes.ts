import { Router } from "express";
import { createAlert, setAlertEnabled } from "./alerts.repository.js";
import { getAvailabilityByCarParkNo } from "./repository.js";

const router: Router = Router();

router.post("/", (req, res) => {
  const { carParkNo } = req.body;

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
    alertId: alert.id,
    carParkNo: alert.carParkNo,
    enabled: alert.enabled,
  });
});

router.patch("/:id", (req, res) => {
  const id = Number(req.params.id);
  const { enabled } = req.body;

  const alert = setAlertEnabled(id, enabled);

  if (!alert) {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Alert not found",
      },
    });
  }

  return res.status(200).json(alert);
});

export default router;
