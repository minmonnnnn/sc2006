import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import availabilityRouter from "./availability.routes.js";

const app = express();

app.use(express.json());
app.use("/api/carparks", availabilityRouter);

describe("availability routes", () => {
  it("returns availability for an existing carpark", async () => {
    const response = await request(app).get("/api/carparks/AK19/availability");

    expect(response.status).toBe(200);
    expect(response.body.carParkNo).toBe("AK19");
    expect(response.body.status).toBe("High");
  });

  it("returns 404 for an unknown carpark", async () => {
    const response = await request(app).get("/api/carparks/ZZ99/availability");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });
});
