import { z } from "zod";

const envSchema = z.object({
  JWT_ACCESS_SECRET: z.string().min(32),
  WEB_ORIGIN: z.string().min(1),
});

export const config = envSchema.parse(process.env);