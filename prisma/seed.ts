import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { hashPassword } from "../src/security/password.ts";

// reads DATABASE_URL from the environment - point it at Neon before
// running this against production, at the local db otherwise
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Every seeded account shares this password, for easy local testing.
const SEED_PASSWORD = "seed-password-12345";

async function main() {
  const passwordHash = await hashPassword(SEED_PASSWORD);

  const organizer = await prisma.user.upsert({
    where: { email: "organizer@example.com" },
    update: {},
    create: { email: "organizer@example.com", name: "Ahmad Organizer", role: "ORGANIZER", passwordHash },
  });

  // Second organizer — needed to prove BOLA: organizer2 must NOT be able to
  // edit/delete organizer's events.
  const organizer2 = await prisma.user.upsert({
    where: { email: "organizer2@example.com" },
    update: {},
    create: { email: "organizer2@example.com", name: "Layla Organizer", role: "ORGANIZER", passwordHash },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { email: "admin@example.com", name: "Site Admin", role: "ADMIN", passwordHash },
  });

  const attendees = [];
  for (let i = 1; i <= 20; i++) {
    const user = await prisma.user.upsert({
      where: { email: `attendee${i}@example.com` },
      update: {},
      create: { email: `attendee${i}@example.com`, name: `Attendee ${i}`, role: "ATTENDEE", passwordHash },
    });
    attendees.push(user);
  }

  const capacityFiveEvent = await prisma.event.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      title: "Tiny Room Meetup",
      description: "Capacity-5 event used by the parallel-bookings concurrency script.",
      venue: "The Broom Closet",
      startsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      capacity: 5,
      priceCents: 900,
      organizerId: organizer.id,
    },
  });

  const otherEvents = [
    { title: "Tech Meetup Istanbul", venue: "Kolektif House", capacity: 50 },
    { title: "Startup Pitch Night", venue: "Impact Hub", capacity: 30 },
    { title: "AI & Backend Workshop", venue: "Zorlu Center", capacity: 40 },
    { title: "Career Fair", venue: "Convention Hall", capacity: 200 },
  ];

  for (const [i, e] of otherEvents.entries()) {
    await prisma.event.upsert({
      where: { id: `00000000-0000-0000-0000-00000000000${i + 2}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-00000000000${i + 2}`,
        title: e.title,
        description: `Auto-seeded event: ${e.title}`,
        venue: e.venue,
        startsAt: new Date(Date.now() + (i + 5) * 24 * 60 * 60 * 1000),
        capacity: e.capacity,
        priceCents: 1500,
        organizerId: organizer.id,
      },
    });
  }

  for (const attendee of attendees.slice(0, 2)) {
    await prisma.booking.upsert({
      where: { userId_eventId: { userId: attendee.id, eventId: capacityFiveEvent.id } },
      update: {},
      create: { userId: attendee.id, eventId: capacityFiveEvent.id, status: "CONFIRMED" },
    });
  }

  console.log("Seed complete.");
  console.log("Shared password for all seeded accounts:", SEED_PASSWORD);
  console.log("Organizer 1 (owns all events):", organizer.email);
  console.log("Organizer 2 (owns nothing — for BOLA test):", organizer2.email);
  console.log("Admin:", admin.email);
  console.log("Capacity-5 event id:", capacityFiveEvent.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });