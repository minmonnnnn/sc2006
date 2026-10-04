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
    expect(typeof response.body.alertId).toBe("string");
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

  it.each([
    {},
    { carParkNo: "" },
    { carParkNo: "   " },
    { carParkNo: 123 },
    { carParkNo: null },
    [],
  ])("rejects an invalid POST body: %j", async (body) => {
    const response = await request(app).post("/api/alerts").send(body);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects POST without a body", async () => {
    const response = await request(app).post("/api/alerts");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("trims the carpark identifier", async () => {
    replaceAvailabilityCache([
      {
        carParkNo: "AK19",
        availableLots: 60,
        totalLots: 100,
        fetchedAt: new Date(),
      },
    ]);

    const response = await request(app)
      .post("/api/alerts")
      .send({ carParkNo: " AK19 " });

    expect(response.status).toBe(201);
    expect(response.body.carParkNo).toBe("AK19");
    expect(response.body.enabled).toBe(true);
  });

  it.each(["0", "-1", "1.5", "abc", "1e2", "9007199254740992"])(
    "rejects invalid alert id %s",
    async (id) => {
      const response = await request(app)
        .patch(`/api/alerts/${id}`)
        .send({ enabled: false });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    },
  );

  it.each([{}, { enabled: "false" }, { enabled: 0 }, { enabled: null }, []])(
    "rejects an invalid PATCH body: %j",
    async (body) => {
      const response = await request(app).patch("/api/alerts/1").send(body);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    },
  );

  it("rejects PATCH without a body", async () => {
    const response = await request(app).patch("/api/alerts/1");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns NOT_FOUND for an unknown alert", async () => {
    const response = await request(app)
      .patch("/api/alerts/2147483647")
      .send({ enabled: false });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("can re-enable a disabled alert", async () => {
    replaceAvailabilityCache([
      {
        carParkNo: "AK19",
        availableLots: 60,
        totalLots: 100,
        fetchedAt: new Date(),
      },
    ]);

    const created = await request(app)
      .post("/api/alerts")
      .send({ carParkNo: "AK19" });

    expect(created.status).toBe(201);

    const alertId = String(created.body.alertId);

    const disabled = await request(app)
      .patch(`/api/alerts/${alertId}`)
      .send({ enabled: false });

    expect(disabled.status).toBe(200);
    expect(disabled.body.enabled).toBe(false);

    const enabled = await request(app)
      .patch(`/api/alerts/${alertId}`)
      .send({ enabled: true });

    expect(enabled.status).toBe(200);
    expect(enabled.body.enabled).toBe(true);
  });
});
