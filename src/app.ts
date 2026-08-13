import express from "express";
import { healthRouter } from "./routes/health.routes.ts";
import { eventsRouter } from "./routes/events.routes.ts";
import { errorHandler } from "./middleware/errorHandler.ts";

export const app = express();

app.use(express.json());
app.use(healthRouter);
app.use(eventsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);
