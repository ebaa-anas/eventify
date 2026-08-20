import { createHash, randomBytes } from "node:crypto";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const REFRESH_COOKIE_NAME = "refreshToken";
export const REFRESH_COOKIE_PATH = "/v1/auth/refresh";

export const sha256 = (token: string) => createHash("sha256").update(token).digest("hex");

export function generateRefreshToken(): { raw: string; hash: string; expiresAt: Date } {
  const raw = randomBytes(32).toString("base64url");
  return {
    raw,
    hash: sha256(raw),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  };
}