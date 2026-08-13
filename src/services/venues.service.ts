import { randomUUID } from "node:crypto";
import { HttpError } from "../errors/HttpError.ts";
import type { Venue } from "../domain.ts";
import type { CreateVenueBody, UpdateVenueBody } from "../schemas/venue.schema.ts";

const venues = new Map<string, Venue>();

function assertNameAvailable(name: string, excludeId?: string): void {
  for (const venue of venues.values()) {
    if (venue.name === name && venue.id !== excludeId) {
      throw HttpError.conflict("Venue name already exists");
    }
  }
}

export function createVenue(input: CreateVenueBody): Venue {
  assertNameAvailable(input.name);

  const venue: Venue = {
    id: randomUUID(),
    name: input.name,
    address: input.address,
    capacity: input.capacity,
    contactEmail: input.contactEmail,
    createdAt: new Date().toISOString(),
  };

  venues.set(venue.id, venue);
  return venue;
}

export function listVenues(limit: number): Venue[] {
  return Array.from(venues.values()).slice(0, limit);
}

export function getVenueById(id: string): Venue {
  const venue = venues.get(id);
  if (!venue) {
    throw HttpError.notFound("Venue not found");
  }
  return venue;
}

export function updateVenue(id: string, patch: UpdateVenueBody): Venue {
  const existing = getVenueById(id);

  if (patch.name !== undefined && patch.name !== existing.name) {
    assertNameAvailable(patch.name, id);
  }

  const updated: Venue = { ...existing, ...patch };
  venues.set(id, updated);
  return updated;
}

export function deleteVenue(id: string): void {
  getVenueById(id);
  venues.delete(id);
}
