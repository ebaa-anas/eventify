import { Router } from "express";
import { validate, validateQuery } from "../middleware/validate.ts";
import { requireAuth } from "../middleware/requireAuth.ts";
import { requireRole } from "../middleware/requireRole.ts";
import { HttpError } from "../errors/HttpError.ts";
import {
  eventsQuerySchema,
  createEventSchema,
  updateEventSchema,
} from "../schemas/events.schema.ts";
import type { EventsQuery, CreateEventInput, UpdateEventInput } from "../schemas/events.schema.ts";
import { eventRepository } from "../repositories/events.repository.ts";
import { getEvent, listEvents, updateEvent } from "../services/events.service.ts";

export const eventsRouter = Router();

// Public — anyone can browse events, no account needed.
eventsRouter.get("/events", validateQuery(eventsQuerySchema), async (req, res) => {
  const { page, limit, venue, from, to, sort } = req.validatedQuery as EventsQuery;

  const { data, total } = await listEvents({ page, limit, venue, from, to, sort });

  res.status(200).json({ data, page, limit, total });
});

// Public — event detail pages don't require login either.
eventsRouter.get("/events/:id", async (req, res) => {
  const event = await getEvent(req.params.id as string);
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.status(200).json(event);
});

eventsRouter.post(
  "/events",
  requireAuth,
  requireRole("ORGANIZER", "ADMIN"),
  validate(createEventSchema),
  async (req, res) => {
    const body = req.body as CreateEventInput;
    const event = await eventRepository.create(req.user!.sub, body);
    res.status(201).json(event);
  },
);

eventsRouter.patch(
  "/events/:id",
  requireAuth,
  requireRole("ORGANIZER", "ADMIN"),
  validate(updateEventSchema),
  async (req, res) => {
    const existing = await eventRepository.findById(req.params.id as string);
    if (!existing) {
      throw HttpError.notFound("Event not found");
    }
    // Role check is not an ownership check — ORGANIZER must own the event; ADMIN bypasses.
    if (req.user!.role !== "ADMIN" && existing.organizerId !== req.user!.sub) {
      throw HttpError.forbidden("You do not own this event");
    }
    const event = await updateEvent(req.params.id as string, req.body as UpdateEventInput);
    res.status(200).json(event);
  },
);

eventsRouter.delete(
  "/events/:id",
  requireAuth,
  requireRole("ORGANIZER", "ADMIN"),
  async (req, res) => {
    const existing = await eventRepository.findById(req.params.id as string);
    if (!existing) {
      throw HttpError.notFound("Event not found");
    }
    if (req.user!.role !== "ADMIN" && existing.organizerId !== req.user!.sub) {
      throw HttpError.forbidden("You do not own this event");
    }
    await eventRepository.remove(req.params.id as string);
    res.status(204).send();
  },
);

export async function getEventById(id: string) {
  return eventRepository.findById(id);
}