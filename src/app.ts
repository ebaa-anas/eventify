import express from "express";
import cookieParser from "cookie-parser";
import { healthRouter } from "./routes/health.routes.ts";
import { eventsRouter } from "./routes/events.routes.ts";
import { venuesRouter } from "./routes/venues.routes.ts";
import { bookingsRouter } from "./routes/bookings.routes.ts";
import { authRouter } from "./routes/auth.routes.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { openApiDocument } from "./openapi.ts";

export const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(healthRouter);
app.get("/openapi.json", (_req, res) => res.status(200).json(openApiDocument));
app.use("/v1", eventsRouter);
app.use("/v1/venues", venuesRouter);
app.use("/v1/bookings", bookingsRouter);
app.use("/v1/auth", authRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);