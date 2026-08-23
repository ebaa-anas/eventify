import { prisma } from "../infra/db.ts";

export const refreshTokenRepository = {
  create: (data: { userId: string; tokenHash: string; expiresAt: Date }) =>
    prisma.refreshToken.create({ data }),

  findByHash: (tokenHash: string) => prisma.refreshToken.findUnique({ where: { tokenHash } }),

  // Atomic rotation: revoke the old row + link it to the new one, in one transaction.
  rotate: (oldId: string, newRow: { userId: string; tokenHash: string; expiresAt: Date }) =>
    prisma.$transaction(async (tx) => {
      const created = await tx.refreshToken.create({ data: newRow });
      await tx.refreshToken.update({
        where: { id: oldId },
        data: { revokedAt: new Date(), replacedById: created.id },
      });
      return created;
    }),
};