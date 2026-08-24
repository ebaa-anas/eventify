import { Prisma } from "../generated/prisma/client.ts";
import { prisma } from "../infra/db.ts";
import { HttpError } from "../errors/HttpError.ts"; 
import { emailQueue } from "../jobs/email.queue.ts";
import { waitlistQueue } from "../jobs/waitlist.queue.ts";

export async function createBooking(eventId: string, userId: string) {
  try {
    const booking = await prisma.$transaction(
      async (tx) => {
        const event = await tx.event.findUnique({ where: { id: eventId } });
        if (!event) {
          throw new HttpError(404, "Event not found");
        }

        const confirmedCount = await tx.booking.count({
          where: { eventId, status: "CONFIRMED" },
        });

        const existing = await tx.booking.findUnique({
          where: { userId_eventId: { userId, eventId } },
        });

        if (existing?.status === "CONFIRMED") {
          throw Object.assign(new Error("duplicate"), { code: "P2002_MANUAL" });
        }

        if (existing?.status === "CANCELLED") {
          if (confirmedCount >= event.capacity) {
            return tx.booking.update({
              where: { id: existing.id },
              data: { status: "WAITLISTED" },
            });
          }
          return tx.booking.update({
            where: { id: existing.id },
            data: { status: "CONFIRMED" },
          });
        }

        if (existing?.status === "WAITLISTED") {
          return existing;
        }

        if (confirmedCount >= event.capacity) {
          return tx.booking.create({
            data: { userId, eventId, status: "WAITLISTED" },
          });
        }

        return tx.booking.create({
          data: { userId, eventId, status: "CONFIRMED" },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    // outside the transaction — never enqueue on data that might roll back
    if (booking.status === "CONFIRMED") {
      await emailQueue.add("confirmation", { bookingId: booking.id });
    }

    return booking;
  } catch (err) {
    if (
      (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") ||
      (err as { code?: string }).code === "P2002_MANUAL"
    ) {
      throw new HttpError(409, "You already have a booking for this event");
    }
    throw err;
  }
}

export async function getBookingById(id: string, userId: string) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }
  if (booking.userId !== userId) {
    throw HttpError.forbidden("You do not own this booking");
  }
  return booking;
}

export async function cancelBooking(id: string, userId: string) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }
  if (booking.userId !== userId) {
    throw HttpError.forbidden("You do not own this booking");
  }

  const wasConfirmed = booking.status === "CONFIRMED";

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  // a confirmed seat just opened up — try to promote someone from the waitlist
  if (wasConfirmed) {
    await waitlistQueue.add("waitlist-promote", { eventId: booking.eventId });
  }

  return updated;
}