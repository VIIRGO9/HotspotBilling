import { prisma } from "../../shared/database/prisma.js";

export const RouterRepository = {
  create: async (data) => {
    return prisma.router.create({ data });
  },

  findMany: async (where, skip, limit) => {
    // Build the query options dynamically
    const queryOptions = {
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            sessions: true,
          },
        },
      },
    };

    // Only add skip/take if they are valid integers to prevent Prisma validation errors
    if (Number.isInteger(skip)) queryOptions.skip = skip;
    if (Number.isInteger(limit)) queryOptions.take = limit;

    const [data, total] = await Promise.all([
      prisma.router.findMany(queryOptions),
      prisma.router.count({ where }),
    ]);

    return { data, total };
  },

  findById: async (id) => {
    return prisma.router.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sessions: true,
          },
        },
      },
    });
  },

  findDefault: async () => {
    return prisma.router.findFirst({
      where: { isDefault: true, deletedAt: null },
    });
  },

  findByIpAndPort: async (ip, port) => {
    return prisma.router.findFirst({
      where: {
        ipAddress: ip,
        apiPort: port,
        deletedAt: null, // Crucial: Ignore archived routers when checking for duplicates
      },
    });
  },

  clearDefaultFlags: async () => {
    return prisma.router.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  },

  update: async (id, data) => {
    return prisma.router.update({
      where: { id },
      data,
    });
  },

  softDelete: async (id) => {
    return prisma.router.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  restore: async (id) => {
    return prisma.router.update({
      where: { id },
      data: { deletedAt: null, status: "OFFLINE" },
    });
  },

  permanentDelete: async (id) => {
    return prisma.router.delete({
      where: { id },
    });
  },
};