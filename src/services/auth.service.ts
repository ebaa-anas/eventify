import { prisma } from "../infra/db.ts";
import { HttpError } from "../errors/HttpError.ts";
import { hashPassword, verifyPassword } from "../security/password.ts";
import { generateRefreshToken, sha256 } from "../security/refreshToken.ts";
import { refreshTokenRepository } from "../repositories/refreshToken.repository.ts";
import type { SignupInput, LoginInput } from "../schemas/auth.schema.ts";

// Same message for "no such email" AND "wrong password" — no user enumeration.
const INVALID_CREDENTIALS = "Invalid email or password";

export async function signup(input: SignupInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw HttpError.conflict("Email already in use");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
    },
  });

  return toSafeUser(user);
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    // Still hash something, so a real lookup and a "user not found" path
    // take roughly the same amount of time (basic timing-attack mitigation).
    await hashPassword(input.password);
    throw HttpError.unauthorized(INVALID_CREDENTIALS);
  }

  const valid = await verifyPassword(user.passwordHash, input.password);
  if (!valid) {
    throw HttpError.unauthorized(INVALID_CREDENTIALS);
  }

  return toSafeUser(user);
}

// Issues + stores a fresh refresh token for this user. Called right after
// signup/login. The raw value goes in the cookie; only its hash is stored.
export async function issueRefreshToken(userId: string) {
  const { raw, hash, expiresAt } = generateRefreshToken();
  await refreshTokenRepository.create({ userId, tokenHash: hash, expiresAt });
  return { raw, expiresAt };
}

const INVALID_REFRESH_TOKEN = "Invalid or expired refresh token";

// Implements rotation-flow.md step 3-4: look up, validate, rotate atomically,
// and treat reuse of an already-revoked token as a theft signal (401).
export async function refreshTokens(rawToken: string) {
  const hash = sha256(rawToken);
  const existing = await refreshTokenRepository.findByHash(hash);

  if (!existing) {
    throw HttpError.unauthorized(INVALID_REFRESH_TOKEN);
  }
  if (existing.expiresAt < new Date()) {
    throw HttpError.unauthorized(INVALID_REFRESH_TOKEN);
  }
  if (existing.revokedAt) {
    // Reuse of a rotated token — same generic 401, no oracle.
    throw HttpError.unauthorized(INVALID_REFRESH_TOKEN);
  }

  const { raw, hash: newHash, expiresAt } = generateRefreshToken();
  await refreshTokenRepository.rotate(existing.id, {
    userId: existing.userId,
    tokenHash: newHash,
    expiresAt,
  });

  const user = await prisma.user.findUnique({ where: { id: existing.userId } });
  if (!user) {
    throw HttpError.unauthorized(INVALID_REFRESH_TOKEN);
  }

  return { user: toSafeUser(user), refreshToken: { raw, expiresAt } };
}

// Explicit allowlist DTO — passwordHash must never cross the wire.
function toSafeUser(user: { id: string; email: string; name: string; role: string }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}