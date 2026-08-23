import { Worker, UnrecoverableError } from "bullmq";
import { Prisma } from "./generated/prisma/client.ts";
import { connection } from "./infra/queue-backend.ts";
import { prisma } from "./infra/db.ts";
import nodemailer from "nodemailer";
import { mailerPromise } from "./infra/mailer.ts";
import { emailQueue } from "./jobs/email.queue.ts";

// --- Worker 1: send booking confirmation emails ---
new Worker<{ bookingId: string }>(
  "booking-email",
  async (job) => {
    const booking = await prisma.booking.findUnique({
      where: { id: job.data.bookingId },
      include: { user: true, event: true },
    });

    if (!booking) {
      throw new UnrecoverableError(`booking ${job.data.bookingId} not found`);
    }

    const mailer = await mailerPromise;
    const info = await mailer.sendMail({
      from: "eventify@example.com",
      to: booking.user.email,
      subject: `Booking confirmed: ${booking.event.title}`,
      text: `See you at ${booking.event.venue}, ${booking.event.startsAt.toISOString()}`,
    });

    // print the Ethereal preview URL so we can open it in a browser
    console.log("Confirmation email sent, preview:", nodemailer.getTestMessageUrl(info));
  },
  { connection, concurrency: 5 },
);

// --- Worker 2: promote the oldest waitlisted booking when a seat opens up ---
new Worker<{ eventId: string }>(
  "waitlist-promote",
  async (job) => {
    const promoted = await prisma.$transaction(
      async (tx) => {
        const event = await tx.event.findUnique({ where: { id: job.data.eventId } });
        if (!event) return null;

        const confirmedCount = await tx.booking.count({
          where: { eventId: job.data.eventId, status: "CONFIRMED" },
        });
        if (confirmedCount >= event.capacity) {
          return null; // seat filled by someone else already — do nothing
        }

        const oldest = await tx.booking.findFirst({
          where: { eventId: job.data.eventId, status: "WAITLISTED" },
          orderBy: { createdAt: "asc" },
        });
        if (!oldest) return null; // idempotent: re-running finds nothing left to promote

        return tx.booking.update({
          where: { id: oldest.id },
          data: { status: "CONFIRMED" },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if (promoted) {
      await emailQueue.add("confirmation", { bookingId: promoted.id });
    }
  },
  { connection, concurrency: 5 },
);

console.log("Worker started — listening for booking-email and waitlist-promote jobs");