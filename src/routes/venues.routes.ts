import { Router } from "express";
import { validate, validateQuery } from "../middleware/validate.ts";
import { createVenueSchema, updateVenueSchema, listVenuesQuerySchema } from "../schemas/venue.schema.ts";
import * as venuesController from "../controllers/venues.controller.ts";

export const venuesRouter = Router();

venuesRouter.post("/", validate(createVenueSchema), venuesController.create);
venuesRouter.get("/", validateQuery(listVenuesQuerySchema), venuesController.list);
venuesRouter.get("/:id", venuesController.getById);
venuesRouter.patch("/:id", validate(updateVenueSchema), venuesController.update);
venuesRouter.delete("/:id", venuesController.remove);
