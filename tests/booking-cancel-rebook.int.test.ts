import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app.ts";
import { resetDb, seedUserAndEvent, authHeader } from "./helpers.ts";

describe("Cancel then rebook — soft-cancel flip-back", () => {
  beforeEach(resetDb);

  it("lets a user rebook the same event after cancelling, with status CONFIRMED", async () => {
    const { user, event } = await seedUserAndEvent({ capacity: 5 });
    const headers = authHeader(user);

    const firstBooking = await request(app)
      .post("/v1/bookings")
      .set(headers)
      .send({ eventId: event.id })
      .expect(201);
    expect(firstBooking.body.status).toBe("CONFIRMED");

    // cancel it - this is a soft delete, the row stays with status CANCELLED
    await request(app)
      .delete(`/v1/bookings/${firstBooking.body.id}`)
      .set(headers)
      .expect(200);

    // rebook the same event - the CANCELLED row should flip back to
    // CONFIRMED, not hit the unique(userId, eventId) constraint as a 409
    const rebooking = await request(app)
      .post("/v1/bookings")
      .set(headers)
      .send({ eventId: event.id })
      .expect(201);

    expect(rebooking.body.status).toBe("CONFIRMED");
  });
});