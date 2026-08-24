import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app.ts";
import { resetDb, seedUserAndEvent, authHeader } from "./helpers.ts";

describe("POST /v1/events — role gate", () => {
  beforeEach(resetDb);

  const newEvent = {
    title: "New Conference",
    description: "a test event created in the integration suite",
    venue: "Test Hall",
    startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    capacity: 50,
    priceCents: 2000,
  };

  it("lets an ORGANIZER create an event", async () => {
    const { organizer } = await seedUserAndEvent();

    const res = await request(app)
      .post("/v1/events")
      .set(authHeader(organizer))
      .send(newEvent)
      .expect(201);

    expect(res.body.title).toBe(newEvent.title);
  });

  it("blocks an ATTENDEE from creating an event with 403", async () => {
    const { user } = await seedUserAndEvent();

    await request(app)
      .post("/v1/events")
      .set(authHeader(user))
      .send(newEvent)
      .expect(403);
  });
});