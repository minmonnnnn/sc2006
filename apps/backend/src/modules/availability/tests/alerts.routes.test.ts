import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import alertRouter from "../alerts.routes.js";
import { replaceAvailabilityCache } from "../cache.js";

const app = express();

app.use(express.json());
app.use("/api/alerts", alertRouter);

describe("availability alert routes", () => {
  it("creates an alert for a valid carpark", async () => {
    replaceAvailabilityCache([
      {
        carParkNo: "AK19",
        availableLots: 60,
        totalLots: 100,
        fetchedAt: new Date(),
      },
    ]);

    const response = await request(app).post("/api/alerts").send({
      carParkNo: "AK19",
    });

    expect(response.status).toBe(201);
    expect(response.body.carParkNo).toBe("AK19");
    expect(response.body.enabled).toBe(true);
    expect(response.body.alertId).toBeDefined();
  });

  it("returns 404 when creating an alert for an unknown carpark", async () => {
    replaceAvailabilityCache([]);

    const response = await request(app).post("/api/alerts").send({
      carParkNo: "ZZ99",
    });

    expect(response.status).toBe(404);
  });

  it("can disable an alert", async () => {
    replaceAvailabilityCache([
      {
        carParkNo: "BK25",
        availableLots: 30,
        totalLots: 100,
        fetchedAt: new Date(),
      },
    ]);

    const createResponse = await request(app).post("/api/alerts").send({
      carParkNo: "BK25",
    });

    const alertId = createResponse.body.alertId;

    const patchResponse = await request(app)
      .patch(`/api/alerts/${alertId}`)
      .send({
        enabled: false,
      });

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.enabled).toBe(false);
  });
});
