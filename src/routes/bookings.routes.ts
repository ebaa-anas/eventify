import { Router } from "express";
import { validate } from "../middleware/validate.ts";
import { createBookingSchema } from "../schemas/bookings.schema.ts";
import {
  createBookingHandler,
  getBookingHandler,
  cancelBookingHandler,
} from "../controllers/bookings.controller.ts";

export const bookingsRouter = Router();

bookingsRouter.post("/", validate(createBookingSchema), createBookingHandler);
bookingsRouter.get("/:id", getBookingHandler);
bookingsRouter.delete("/:id", cancelBookingHandler);