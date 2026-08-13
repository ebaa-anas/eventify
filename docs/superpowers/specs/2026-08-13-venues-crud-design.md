# /v1/venues CRUD — Design

Date: 2026-08-13

## Goal

Add a `/v1/venues` CRUD resource to Eventify, and in the process introduce the
project's first Express 5 + Zod 4 layered backend conventions (routes →
controller → service, `HttpError` + centralized error middleware,
`validate`/`validateQuery` input middleware, in-memory `Map` store), which
future resources will follow.

## Context

Eventify currently runs on raw `node:http` (`src/server.ts`), with no Express,
no Zod, and no layered structure — `/health` and `/events` are both handled
inline in one request handler. None of the conventions this task assumes
(`HttpError`, error middleware, `validate`/`validateQuery`) exist yet, so this
design builds them from scratch alongside the venues resource, and rehosts the
existing two endpoints on the new Express app unchanged (same paths, same
logic, no refactor).

New dependencies: `express`, `zod`, `@types/express`.

## File layout

```
src/
  app.ts                      # Express app: middleware, routes, error handler (no listen())
  server.ts                   # imports app, calls app.listen(3000)
  domain.ts                   # existing — Venue type added here
  errors/
    HttpError.ts              # HttpError class + static helpers
  middleware/
    validate.ts                # validate(schema) — body; validateQuery(schema) — query
    errorHandler.ts            # centralized Express error-handling middleware
  schemas/
    venue.schema.ts            # Zod schemas: create, update (partial), list-query
  routes/
    venues.routes.ts           # GET/POST /v1/venues, GET/PATCH/DELETE /v1/venues/:id
    events.routes.ts           # existing /events logic, rehosted as-is
    health.routes.ts           # existing /health logic, rehosted as-is
  controllers/
    venues.controller.ts       # req/res glue only — calls service, sends response
  services/
    venues.service.ts          # in-memory Map, business logic (uniqueness, CRUD)
```

`app.ts`/`server.ts` are split so the app can be built without binding a port
(useful for future tests).

## HttpError + centralized error middleware

`src/errors/HttpError.ts`:

```ts
export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = "HttpError";
  }
  static badRequest(message: string, details?: unknown) { return new HttpError(400, message, details); }
  static notFound(message: string) { return new HttpError(404, message); }
  static conflict(message: string) { return new HttpError(409, message); }
}
```

`src/middleware/errorHandler.ts` is a 4-arg Express error middleware, mounted
last in `app.ts`:

- `err instanceof HttpError` → `res.status(err.status).json({ error: { message: err.message, ...(err.details ? { details: err.details } : {}) } })`
- otherwise → `console.error(err)`, then `500` with `{ error: { message: "Internal server error" } }` — never leak internals

No route or controller ever calls `res.status(...)` for an error path; code
just `throw`s an `HttpError`. Express 5 auto-forwards rejected promises from
async route handlers to the error middleware, so no `try/catch` wrapper is
needed in routes/controllers.

## validate / validateQuery middleware

`src/middleware/validate.ts`:

```ts
export function validate(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(HttpError.badRequest("Invalid request body", result.error.flatten()));
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(HttpError.badRequest("Invalid query parameters", result.error.flatten()));
    }
    req.validatedQuery = result.data;
    next();
  };
}
```

- `validate` overwrites `req.body` directly (writable in Express 5), so
  downstream code sees the parsed/coerced/defaulted value.
- `validateQuery` cannot overwrite `req.query` — Express 5 exposes it as a
  read-only getter with no setter. Instead it assigns to `req.validatedQuery`,
  declared once via Express namespace augmentation in this file:
  ```ts
  declare global {
    namespace Express {
      interface Request { validatedQuery?: unknown }
    }
  }
  ```
  Controllers cast it to the specific schema's output type when reading it
  (e.g. `req.validatedQuery as ListVenuesQuery`).
- Both failure paths respond `400` with Zod's `.flatten()` shape
  (`{ formErrors, fieldErrors }`) as `details`, routed through the one error
  handler via `HttpError.badRequest`.

## Venue schemas

`src/schemas/venue.schema.ts`:

```ts
export const createVenueSchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().min(1),
  capacity: z.number().int().positive(),
  contactEmail: z.string().email(),
});

export const updateVenueSchema = createVenueSchema
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, "At least one field required");

export const listVenuesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
```

`capacity` and `limit` coerce/validate to positive integers; non-numeric or
`<= 0` values fail validation and produce a `400` automatically. `limit`
defaults to `20` when omitted and is capped at `100`.

## Domain type

Added to `src/domain.ts`:

```ts
export type Venue = {
  id: string;
  name: string;
  address: string;
  capacity: number;
  contactEmail: string;
  createdAt: string; // ISO timestamp
};
```

## Venue service (in-memory Map store)

`src/services/venues.service.ts` holds a module-scoped
`const venues = new Map<string, Venue>();`. All business rules live here —
controllers never touch the Map directly.

- `createVenue(input)`: scans `venues.values()` for a case-sensitive exact
  `name` match → `throw HttpError.conflict("Venue name already exists")`;
  else generates `id = crypto.randomUUID()`,
  `createdAt = new Date().toISOString()`, stores, returns the venue.
- `listVenues(limit)`: returns the first `limit` venues from
  `venues.values()` (insertion order).
- `getVenueById(id)`: returns the venue or
  `throw HttpError.notFound("Venue not found")`.
- `updateVenue(id, patch)`: looks up the existing venue (`404` if missing);
  if `patch.name` is present and differs from the current name, re-runs the
  uniqueness check against *other* venues (`409` on conflict); merges the
  patch onto the existing venue, keeping the original `id`/`createdAt`;
  stores and returns the result.
- `deleteVenue(id)`: `404` if missing, else `venues.delete(id)`, returns
  `void`.

## Endpoints

All mounted under `/v1/venues` in `venues.routes.ts`, wired to
`venues.controller.ts`, whose methods do only: read validated input → call
service → send response (no try/catch — thrown `HttpError`s are caught by
Express 5's built-in async-error forwarding).

| Method | Path | Middleware | Success | Errors |
|---|---|---|---|---|
| POST | `/v1/venues` | `validate(createVenueSchema)` | `201` + venue | `400` invalid body, `409` duplicate name |
| GET | `/v1/venues` | `validateQuery(listVenuesQuerySchema)` | `200` + venue array | `400` invalid `limit` |
| GET | `/v1/venues/:id` | — | `200` + venue | `404` not found |
| PATCH | `/v1/venues/:id` | `validate(updateVenueSchema)` | `200` + updated venue | `400` invalid body/empty patch, `404` not found, `409` duplicate name |
| DELETE | `/v1/venues/:id` | — | `204` no body | `404` not found |

## Existing routes (rehosted, not refactored)

`/health` and `/events` move into `routes/health.routes.ts` and
`routes/events.routes.ts` respectively, mounted on the same Express `app`,
with their current logic and response shapes unchanged (unversioned paths,
existing manual 500 handling for `/events` stays as-is — not migrated to
`HttpError`).

## Verification plan

No test framework exists in the repo yet (only `tsc --noEmit`), so none is
added here. Verification is manual:

- `npm run typecheck` passes (strict TS, no `any`, explicit `.ts` extensions
  on relative imports, per `CLAUDE.md`)
- `npm run dev`, then exercise each endpoint with curl: create → list → get
  by id → duplicate-name create (`409`) → patch → patch to duplicate name
  (`409`) → patch nonexistent id (`404`) → delete → get after delete (`404`)
  → bad body (`400`) → bad `limit` (`400`)
- Confirm `/health` and `/events` still behave exactly as before on the new
  Express app
