import { redis } from "../infra/redis.ts";
import { eventRepository } from "../repositories/events.repository.ts";
import type { EventsQuery, UpdateEventInput } from "../schemas/events.schema.ts";

const DETAIL_TTL = 60;

// --- cache metrics ---
let hits = 0;
let misses = 0;
let lookups = 0;

function recordHit() {
  hits++;
  lookups++;
  maybeLog();
}

function recordMiss() {
  misses++;
  lookups++;
  maybeLog();
}

function maybeLog() {
  if (lookups % 100 === 0) {
    logMetrics();
  }
}

function logMetrics() {
  const ratio = hits + misses === 0 ? 0 : hits / (hits + misses);
  console.log(JSON.stringify({ hits, misses, ratio: Number(ratio.toFixed(2)) }));
}

setInterval(logMetrics, 60_000);

// --- cache-aside ---

export async function getEvent(id: string) {
  const key = `event:${id}`;
  const cached = await redis.get(key);
  if (cached) {
    recordHit();
    return JSON.parse(cached);
  }
  recordMiss();

  const event = await eventRepository.findById(id);
  if (!event) return null; // TODO: negative caching later

  const jitter = Math.floor(Math.random() * 15);
  await redis.set(key, JSON.stringify(event), { EX: DETAIL_TTL + jitter });
  return event;
}

export async function listEvents(params: EventsQuery) {
  const v = (await redis.get("events:list:v")) ?? "0";
  const key = `events:list:${v}:${params.page}`;

  const cached = await redis.get(key);
  if (cached) {
    recordHit();
    return JSON.parse(cached);
  }
  recordMiss();

  const [data, total] = await eventRepository.list(params);
  const result = { data, total };

  const jitter = Math.floor(Math.random() * 15);
  await redis.set(key, JSON.stringify(result), { EX: DETAIL_TTL + jitter });
  return result;
}

export async function updateEvent(id: string, data: UpdateEventInput) {
  const updated = await eventRepository.update(id, data);
  await redis.del(`event:${id}`);
  await redis.incr("events:list:v");
  return updated;
}