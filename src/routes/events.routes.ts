import { Router } from "express";
import { validateQuery } from "../middleware/validate.ts";
import { eventsQuerySchema } from "../schemas/events.schema.ts";
import type { EventsQuery } from "../schemas/events.schema.ts";
import { eventRepository } from "../repositories/events.repository.ts";

export const eventsRouter = Router();

eventsRouter.get("/events", validateQuery(eventsQuerySchema), async (req, res) => {
  const { page, limit, venue, from, to, sort } = req.validatedQuery as EventsQuery;

  const [data, total] = await eventRepository.list({ page, limit, venue, from, to, sort });

  res.status(200).json({ data, page, limit, total });
});

eventsRouter.get("/events/:id", async (req, res) => {
  const event = await eventRepository.findById(req.params.id);
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.status(200).json(event);
});

export async function getEventById(id: string) {
  return eventRepository.findById(id);
}