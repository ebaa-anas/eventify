import argon2 from 'argon2';

// OWASP baseline (2026): argon2id, 19 MiB memory, 2 iterations, 1 lane
const OPTS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export const hashPassword = (plain: string) => argon2.hash(plain, OPTS);

export async function verifyPassword(hash: string, plain: string) {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false; // malformed hash = failed login, never a 500
  }
}