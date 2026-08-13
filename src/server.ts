import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import type { Event } from "./domain.ts";

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

const server = createServer(async (req, res) =>  {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
    return;
  }
  
  if (req.method === "GET" && req.url === "/events") {
  try {
    const events = await loadEvents();
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(events));
  } catch (err) {
    console.error(err);
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
  return;
}
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => console.log("Eventify on :3000"));