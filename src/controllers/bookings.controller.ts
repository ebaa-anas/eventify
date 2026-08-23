import type { Request, Response } from "express";
import { createBooking, getBookingById, cancelBooking } from "../services/bookings.service.ts";

export async function createBookingHandler(req: Request, res: Response) {
  const booking = await createBooking(req.body.eventId, req.user!.sub);
  res.status(201).json(booking);
}

export async function getBookingHandler(req: Request, res: Response) {
  const booking = await getBookingById(req.params.id as string, req.user!.sub);
  res.status(200).json(booking);
}

export async function cancelBookingHandler(req: Request, res: Response) {
  const booking = await cancelBooking(req.params.id as string, req.user!.sub);
  res.status(200).json(booking);
}