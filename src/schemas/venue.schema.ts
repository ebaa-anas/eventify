import { z } from "zod";

export const createVenueSchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().min(1),
  capacity: z.number().int().positive(),
  contactEmail: z.email(),
});

export const updateVenueSchema = createVenueSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field required",
  });

export const listVenuesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateVenueBody = z.infer<typeof createVenueSchema>;
export type UpdateVenueBody = z.infer<typeof updateVenueSchema>;
export type ListVenuesQuery = z.infer<typeof listVenuesQuerySchema>;
