import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app.ts";
import { redis } from "../src/infra/redis.ts";
import { resetDb, seedUserAndEvent, authHeader } from "./helpers.ts";

describe("Cache invalidation on event update", () => {
  beforeEach(async () => {
    await resetDb();
    // clear any leftover cache keys from a previous test run
    await redis.flushDb();
  });

  it("serves fresh data after a write, not the stale cached version", async () => {
    const { organizer, event } = await seedUserAndEvent();
    const headers = authHeader(organizer);

    // first read - this is a cache miss, and it fills the cache
    const firstRead = await request(app)
      .get(`/v1/events/${event.id}`)
      .expect(200);
    expect(firstRead.body.title).toBe(event.title);

    // update the event - this should invalidate the event:<id> cache key
    const newTitle = "Updated Title After Write";
    await request(app)
      .patch(`/v1/events/${event.id}`)
      .set(headers)
      .send({ title: newTitle })
      .expect(200);

    // second read must show the new title, not what was cached before
    const secondRead = await request(app)
      .get(`/v1/events/${event.id}`)
      .expect(200);
    expect(secondRead.body.title).toBe(newTitle);
  });
});