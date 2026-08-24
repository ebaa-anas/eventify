import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app.ts";
import { resetDb, seedUserAndEvent, authHeader } from "./helpers.ts";

describe("POST /v1/bookings", () => {
  beforeEach(resetDb);

  it("confirms a booking, then rejects the duplicate", async () => {
    const { user, event } = await seedUserAndEvent({ capacity: 1 });

    const res = await request(app)
      .post("/v1/bookings")
      .set(authHeader(user))
      .send({ eventId: event.id })
      .expect(201);

    expect(res.body.status).toBe("CONFIRMED");

    // same user booking the same event again should hit the unique constraint
    await request(app)
      .post("/v1/bookings")
      .set(authHeader(user))
      .send({ eventId: event.id })
      .expect(409);
  });
});