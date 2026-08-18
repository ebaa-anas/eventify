import type { Request, Response } from "express";
import { createBooking, getBookingById, cancelBooking } from "../services/bookings.service.ts";

const CURRENT_USER_ID = "01a01660-dafc-75ea-a430-f0dab85ac5b6";

export async function createBookingHandler(req: Request, res: Response) {
  const booking = await createBooking(req.body.eventId, CURRENT_USER_ID);
  res.status(201).json(booking);
}

export function getBookingHandler(req: Request, res: Response) {
  const booking = getBookingById(req.params.id as string);
  res.status(200).json(booking);
}

export function cancelBookingHandler(req: Request, res: Response) {
  const booking = cancelBooking(req.params.id as string);
  res.status(200).json(booking);
}