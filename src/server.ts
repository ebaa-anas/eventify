import { createServer } from "node:http";
import type { Event } from "./domain.ts";

const events: Event[] = [
  {
    id: "1",
    title: "Tech Meetup Istanbul",
    venue: "Kolektif House",
    time: new Date("2026-09-01T18:00:00"),
    capacity: 50,
    organizerId: "org-1",
  },
  {
    id: "2",
    title: "Startup Pitch Night",
    venue: "Impact Hub",
    time: new Date("2026-09-10T19:00:00"),
    capacity: 30,
    organizerId: "org-1",
  },
  {
    id: "3",
    title: "AI & Backend Workshop",
    venue: "Zorlu Center",
    time: new Date("2026-09-15T17:00:00"),
    capacity: 40,
    organizerId: "org-2",
  },
];

const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
    return;
  }
  
  if (req.method === "GET" && req.url === "/events") {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify(events));
  return;
}

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => console.log("Eventify on :3000"));