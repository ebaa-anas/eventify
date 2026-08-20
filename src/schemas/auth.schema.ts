import { z } from "zod";

export const signupSchema = z.strictObject({
  email: z.email(),
  name: z.string().min(1),
  password: z.string().min(12),
});

export const loginSchema = z.strictObject({
  email: z.email(),
  password: z.string().min(1),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;