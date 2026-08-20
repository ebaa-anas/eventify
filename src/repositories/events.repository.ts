import { prisma } from "../infra/db.ts";

export const eventRepository = {
  list: (params: {
    page: number;
    limit: number;
    venue?: string;
    from?: Date;
    to?: Date;
    sort?: "startsAt:asc" | "startsAt:desc";
  }) => {
    const { page, limit, venue, from, to, sort } = params;

    const where = {
      ...(venue ? { venue } : {}),
      ...(from || to
        ? {
            startsAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const orderBy = sort
      ? { startsAt: (sort.endsWith(":asc") ? "asc" : "desc") as "asc" | "desc" }
      : undefined;

    return Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);
  },

   findById: (id: string) => prisma.event.findUnique({ where: { id } }),

  create: (organizerId: string, data: {
    title: string;
    description: string;
    venue?: string;
    startsAt: Date;
    capacity: number;
    priceCents: number;
  }) => prisma.event.create({ data: { ...data, organizerId } }),

  update: (id: string, data: Partial<{
    title: string;
    description: string;
    venue: string;
    startsAt: Date;
    capacity: number;
    priceCents: number;
  }>) => prisma.event.update({ where: { id }, data }),

  remove: (id: string) => prisma.event.delete({ where: { id } }),
};
