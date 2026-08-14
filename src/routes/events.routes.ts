import { Router } from "express";
import { readFile } from "node:fs/promises";
import { findById, type Event } from "../domain.ts";
import { validateQuery } from "../middleware/validate.ts";
import { eventsQuerySchema } from "../schemas/events.schema.ts";
import type { EventsQuery } from "../schemas/events.schema.ts";
import { HttpError } from "../errors/HttpError.ts";

export const eventsRouter = Router();

let cachedEvents: Event[] | null = null;

async function loadEvents(): Promise<Event[]> {
  if (cachedEvents) {
    return cachedEvents;
  }

  const raw = await readFile("data/events.json", "utf8");
  cachedEvents = JSON.parse(raw) as Event[];
  return cachedEvents;
}

export async function getEventById(id: string): Promise<Event | undefined> {
  const events = await loadEvents();
  return findById(events, id);
}

eventsRouter.get("/events", validateQuery(eventsQuerySchema), async (req, res) => {
  const { page, limit, venue, from, to, sort } = req.validatedQuery as EventsQuery;

  const allEvents = await loadEvents();

  const filtered = allEvents.filter((event) => {
    if (venue && event.venue !== venue) return false;
    if (from && new Date(event.startsAt) < from) return false;
    if (to && new Date(event.startsAt) > to) return false;
    return true;
  });

  if (sort) {
    const direction = sort.endsWith(":asc") ? 1 : -1;
    filtered.sort(
      (a, b) => (new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()) * direction,
    );
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  res.status(200).json({ data, page, limit, total });
});