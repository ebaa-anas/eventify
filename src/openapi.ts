import { createDocument } from "zod-openapi";
import { eventsQuerySchema, createEventSchema, updateEventSchema } from "./schemas/events.schema.ts";
import { createVenueSchema, updateVenueSchema, listVenuesQuerySchema } from "./schemas/venue.schema.ts";
import { createBookingSchema } from "./schemas/bookings.schema.ts";
import { signupSchema, loginSchema } from "./schemas/auth.schema.ts";

export const openApiDocument = createDocument({
  openapi: "3.1.0",
  info: { title: "Eventify API", version: "1.0.0" },
  paths: {
    "/v1/events": {
      get: {
        summary: "List events",
        requestParams: { query: eventsQuerySchema },
        responses: { "200": { description: "OK" } },
      },
      post: {
        summary: "Create event",
        requestBody: { content: { "application/json": { schema: createEventSchema } } },
        responses: { "201": { description: "Created" } },
      },
    },
    "/v1/events/{id}": {
      get: { summary: "Get event by id", responses: { "200": { description: "OK" } } },
      patch: {
        summary: "Update event",
        requestBody: { content: { "application/json": { schema: updateEventSchema } } },
        responses: { "200": { description: "OK" } },
      },
      delete: { summary: "Delete event", responses: { "204": { description: "No content" } } },
    },
    "/v1/venues": {
      get: {
        summary: "List venues",
        requestParams: { query: listVenuesQuerySchema },
        responses: { "200": { description: "OK" } },
      },
      post: {
        summary: "Create venue",
        requestBody: { content: { "application/json": { schema: createVenueSchema } } },
        responses: { "201": { description: "Created" } },
      },
    },
    "/v1/venues/{id}": {
      get: { summary: "Get venue by id", responses: { "200": { description: "OK" } } },
      patch: {
        summary: "Update venue",
        requestBody: { content: { "application/json": { schema: updateVenueSchema } } },
        responses: { "200": { description: "OK" } },
      },
      delete: { summary: "Delete venue", responses: { "204": { description: "No content" } } },
    },
    "/v1/bookings": {
      post: {
        summary: "Create booking",
        requestBody: { content: { "application/json": { schema: createBookingSchema } } },
        responses: { "201": { description: "Created" } },
      },
    },
    "/v1/bookings/{id}": {
      get: { summary: "Get booking by id", responses: { "200": { description: "OK" } } },
      delete: { summary: "Cancel booking", responses: { "200": { description: "OK" } } },
    },
    "/v1/auth/signup": {
      post: {
        summary: "Sign up",
        requestBody: { content: { "application/json": { schema: signupSchema } } },
        responses: { "201": { description: "Created" } },
      },
    },
    "/v1/auth/login": {
      post: {
        summary: "Log in",
        requestBody: { content: { "application/json": { schema: loginSchema } } },
        responses: { "200": { description: "OK" }, "429": { description: "Too many requests" } },
      },
    },
  },
});