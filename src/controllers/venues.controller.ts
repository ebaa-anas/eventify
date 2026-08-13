import type { Request, Response } from "express";
import * as venuesService from "../services/venues.service.ts";
import type { CreateVenueBody, UpdateVenueBody, ListVenuesQuery } from "../schemas/venue.schema.ts";

export function create(req: Request, res: Response): void {
  const venue = venuesService.createVenue(req.body as CreateVenueBody);
  res.status(201).json(venue);
}

export function list(req: Request, res: Response): void {
  const { limit } = req.validatedQuery as ListVenuesQuery;
  res.status(200).json(venuesService.listVenues(limit));
}

export function getById(req: Request, res: Response): void {
  const venue = venuesService.getVenueById(req.params.id as string);
  res.status(200).json(venue);
}

export function update(req: Request, res: Response): void {
  const venue = venuesService.updateVenue(req.params.id as string, req.body as UpdateVenueBody);
  res.status(200).json(venue);
}

export function remove(req: Request, res: Response): void {
  venuesService.deleteVenue(req.params.id as string);
  res.status(204).send();
}
