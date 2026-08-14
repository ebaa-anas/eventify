# Session 1 Homework Tasks

- [x] Task 1: Create src/domain.ts — User, Event, Booking interfaces + Role/Status literal unions + generic findById
- [x] Task 2: Add GET /events route with hardcoded events (keep /health, JSON 404 fallback)
- [x] Task 3: Load events from data/events.json asynchronously (async/await, try/catch, 500 on failure)
- [x] Task 4: PR description covering what was built, how to run it, and AI-assistance notes

## Session 2

- [ ] HW1: /v1/bookings (POST/GET/DELETE) — service handles 404 unknown eventId, 409 duplicate, 409 capacity
- [ ] HW2: Pagination on GET /v1/events — page/limit + { data, page, limit, total } envelope
- [ ] HW3: Filtering on GET /v1/events — venue, from/to on startsAt, applied before pagination
- [ ] HW4: Consistency pass — validate/validateQuery everywhere, one HttpError middleware, no res.status(500)
- [ ] Stretch (optional): WAITLISTED at capacity, ?sort=startsAt:asc|desc
- [ ] PR description: what/how to run, AI usage + one bug fixed, exit-ticket answer