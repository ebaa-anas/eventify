import { prisma } from "../src/infra/db.ts";
import { signAccessToken } from "../src/security/jwt.ts";
import type { Role } from "../src/generated/prisma/index.ts";

// wipes every table so each test starts from a clean db
// order matters here because of foreign keys - children before parents
export async function resetDb(): Promise<void> {
  await prisma.booking.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
}

type SeedOptions = {
  capacity?: number;
  role?: Role;
};

// creates one organizer, one event owned by them, and one attendee user
// the attendee is the one we usually book with in tests
export async function seedUserAndEvent(options: SeedOptions = {}) {
  const capacity = options.capacity ?? 10;

  const organizer = await prisma.user.create({
    data: {
      email: `organizer-${Date.now()}@test.com`,
      name: "Test Organizer",
      passwordHash: "not-used-in-tests",
      role: "ORGANIZER",
    },
  });

  const user = await prisma.user.create({
    data: {
      email: `attendee-${Date.now()}@test.com`,
      name: "Test Attendee",
      passwordHash: "not-used-in-tests",
      role: options.role ?? "ATTENDEE",
    },
  });

  const event = await prisma.event.create({
    data: {
      title: "Test Event",
      description: "seeded for integration tests",
      venue: "Test Venue",
      startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      capacity,
      priceCents: 1000,
      organizerId: organizer.id,
    },
  });

  return { organizer, user, event };
}

// signs a real JWT the same way login would, so requireAuth accepts it
export function authHeader(user: { id: string; role: Role }) {
  const token = signAccessToken({ sub: user.id, role: user.role });
  return { Authorization: `Bearer ${token}` };
}