# Session 1 Homework - Tasks

- [x] Task 1: Create src/domain.ts — User, Event, Booking interfaces + Role/Status literal unions + generic findById
- [x] Task 2: Add GET /events route with hardcoded events (keep /health, JSON 404 fallback)
- [x] Task 3: Load events from data/events.json asynchronously (async/await, try/catch, 500 on failure)
- [x] Task 4: PR description covering what was built, how to run it, and AI-assistance notes

## Session 2 Homework - Tasks

- [x] HW1: /v1/bookings (POST/GET/DELETE) — service handles 404 unknown eventId, 409 duplicate, 409 capacity
- [x] HW2: Pagination on GET /v1/events — page/limit + { data, page, limit, total } envelope
- [x] HW3: Filtering on GET /v1/events — venue, from/to on startsAt, applied before pagination
- [x] HW4: Consistency pass — validate/validateQuery everywhere, one HttpError middleware, no res.status(500)
- [x] Stretch (optional): WAITLISTED at capacity, ?sort=startsAt:asc|desc
- [x] PR description: what/how to run, AI usage + one bug fixed

# Session 3 Homework — Tasks

- [x] Set up PostgreSQL + Redis via Docker
- [x] Create Prisma schema (User, Event, Booking models)
- [x] Run initial migration
- [x] Task 1: Convert /events repository to Prisma (with pagination/filtering)
- [x] Task 1: Convert /bookings repository to Prisma
- [x] Task 2: Implement transactional booking (Serializable isolation, capacity check, rebooking flip, P2002 -> 409)
- [x] Task 3: Write idempotent seed script (organizer, admin, 20 attendees, capacity-5 event)
- [x] Task 4: Prove index impact with EXPLAIN ANALYZE before/after


# Session 4 Homework - Tasks

- [x] passwordHash column + argon2id hashing
- [x] Task 1: signup/login + requireAuth/requireRole + route matrix
- [x] Task 2: BOLA ownership checks (events + bookings)
- [x] Task 3: Refresh-token rotation — blocked on session-4-starter
- [ ] Task 4: AI security audit in PR description

# Session 5 Homework — Tasks

- [x] Waitlist promotion (Option A): full events → WAITLISTED, cancel confirmed → promote via BullMQ worker
- [x] Cache metrics: hit/miss/ratio logged every 60s or 100 lookups
- [x] Redis rate limiting on login (per-IP) and bookings (per-user), proven with script
- [x] Deploy prep: Neon, Upstash, Render accounts ready
- [x] OpenAPI spec generated with zod-openapi, served at /openapi.json