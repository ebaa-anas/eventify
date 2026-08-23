import { z } from "zod";

export const eventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  venue: z.string().min(1).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sort: z.enum(["startsAt:asc", "startsAt:desc"]).optional(),
});

export type EventsQuery = z.infer<typeof eventsQuerySchema>;

export const createEventSchema = z.strictObject({
  title: z.string().min(1),
  description: z.string().min(1),
  venue: z.string().min(1).optional(),
  startsAt: z.coerce.date(),
  capacity: z.number().int().min(1),
  priceCents: z.number().int().min(0),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial();

export type UpdateEventInput = z.infer<typeof updateEventSchema>;