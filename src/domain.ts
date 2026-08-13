export type Role = "ATTENDEE" | "ORGANIZER" | "ADMIN";
export type BookingStatus = "CONFIRMED" | "CANCELLED" | "WAITLISTED";
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  venue: string;
  time: Date;
  capacity: number;
  organizerId: string;
}

export interface Booking {
  id: string;
  userId: string;
  eventId: string;
  status: BookingStatus;
  createdAt: Date;
}

export function findById<T extends { id: string }>(
  rows: T[],
  id: string,
): T | undefined {
  return rows.find((r) => r.id === id);
}