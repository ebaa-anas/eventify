import { Router } from "express";
import { validate } from "../middleware/validate.ts";
import { requireAuth } from "../middleware/requireAuth.ts";
import { createBookingSchema } from "../schemas/bookings.schema.ts";
import {
  createBookingHandler,
  getBookingHandler,
  cancelBookingHandler,
} from "../controllers/bookings.controller.ts";

export const bookingsRouter = Router();

// Any authenticated user can book — no role restriction beyond being logged in.
bookingsRouter.post("/", requireAuth, validate(createBookingSchema), createBookingHandler);
bookingsRouter.get("/:id", requireAuth, getBookingHandler);
bookingsRouter.delete("/:id", requireAuth, cancelBookingHandler);