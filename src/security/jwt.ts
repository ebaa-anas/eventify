import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config.ts";

const ACCESS_TOKEN_TTL = "15m";

// Never cast a decoded JWT — parse it, so a forged/tampered payload is rejected.
const accessTokenPayloadSchema = z.object({
  sub: z.string(),
  role: z.enum(["ATTENDEE", "ORGANIZER", "ADMIN"]),
});

export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    algorithm: "HS256",
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET, {
    algorithms: ["HS256"],
  });
  return accessTokenPayloadSchema.parse(decoded);
}