// backend/src/modules/router/router.repository.js
import { prisma } from "../../shared/database/prisma.js";

export const RouterRepository = {
  create: async (data) => {
    return prisma.router.create({ data });
  },

  findById: async (id) => {
    return prisma.router.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { sessions: true } } },
    });
  },

  findByIpAndPort: async (ipAddress, apiPort) => {
    return prisma.router.findFirst({
      where: { ipAddress, apiPort, deletedAt: null },
    });
  },

  findMany: async (where, skip, take) => {
    const [data, total] = await prisma.$transaction([
      prisma.router.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { sessions: true } } },
      }),
      prisma.router.count({ where }),
    ]);
    return { data, total };
  },

  update: async (id, data) => {
    return prisma.router.update({ where: { id }, data });
  },

  softDelete: async (id) => {
    return prisma.router.update({
      where: { id },
      data: { deletedAt: new Date(), status: "OFFLINE" },
    });
  },

  clearDefaultFlags: async () => {
    // Helper to ensure only one router is marked as default
    return prisma.router.updateMany({
      where: { isDefault: true, deletedAt: null },
      data: { isDefault: false },
    });
  },
};
