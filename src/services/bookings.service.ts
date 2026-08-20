import { Prisma } from "../generated/prisma/client.ts";
import { prisma } from "../infra/db.ts";
import { HttpError } from "../errors/HttpError.ts";

export async function createBooking(eventId: string, userId: string) {
  try {
    return await prisma.$transaction(
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
          // let the unique constraint fire below -> mapped to 409
          throw Object.assign(new Error("duplicate"), { code: "P2002_MANUAL" });
        }

        if (existing?.status === "CANCELLED") {
          if (confirmedCount >= event.capacity) {
            throw new HttpError(409, "Event is full");
          }
          return tx.booking.update({
            where: { id: existing.id },
            data: { status: "CONFIRMED" },
          });
        }

        // existing?.status === "WAITLISTED" or no existing row at all
        if (existing?.status === "WAITLISTED") {
          return existing; // Session 5's job to promote — leave as is
        }

        if (confirmedCount >= event.capacity) {
          throw new HttpError(409, "Event is full");
        }

        return tx.booking.create({
          data: { userId, eventId, status: "CONFIRMED" },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
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

export async function getBookingById(id: string) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }
  return booking;
}

export async function cancelBooking(id: string) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }
  return prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
}