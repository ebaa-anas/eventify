import { HttpError } from "../errors/HttpError.ts";
import { getEventById } from "../routes/events.routes.ts";
import type { Booking, BookingStatus } from "../domain.ts";


const bookings = new Map<string, Booking>();

export async function createBooking(eventId: string, userId: string): Promise<Booking> {
  const event = await getEventById(eventId);
  if (!event) {
    throw new HttpError(404, "Event not found");
  }

  const duplicate = [...bookings.values()].find(
    (b) => b.userId === userId && b.eventId === eventId,
  );
  if (duplicate) {
    throw new HttpError(409, "You already have a booking for this event");
  }

 const confirmedCount = [...bookings.values()].filter(
    (b) => b.eventId === eventId && b.status === "CONFIRMED",
  ).length;
  const status: BookingStatus = confirmedCount >= event.capacity ? "WAITLISTED" : "CONFIRMED";

  const booking: Booking = {
    id: crypto.randomUUID(),
    userId,
    eventId,
    status,
    createdAt: new Date(),
  };
  bookings.set(booking.id, booking);
  return booking;
}

export function getBookingById(id: string): Booking {
  const booking = bookings.get(id);
  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }
  return booking;
}

export function cancelBooking(id: string): Booking {
  const booking = bookings.get(id);
  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }
  booking.status = "CANCELLED";
  return booking;
}