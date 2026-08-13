import { Router } from "express";
import { readFile } from "node:fs/promises";
import type { Event } from "../domain.ts";

export const eventsRouter = Router();

let cachedEvents: Event[] | null = null;

async function loadEvents(): Promise<Event[]> {
  if (cachedEvents) {
    return cachedEvents;
  }

  try {
    const raw = await readFile("data/events.json", "utf8");
    cachedEvents = JSON.parse(raw) as Event[];
    return cachedEvents;
  } catch (err) {
    throw new Error("Failed to load events from data/events.json", { cause: err });
  }
}

eventsRouter.get("/events", async (_req, res) => {
  try {
    const events = await loadEvents();
    res.status(200).json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});
