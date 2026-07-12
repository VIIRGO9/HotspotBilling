// backend/src/modules/package/package.repository.js
import { prisma } from "../../shared/database/prisma.js";

export const PackageRepository = {
  create: async (data) => {
    return prisma.package.create({ data });
  },

  findAll: async (filters = {}) => {
    return prisma.package.findMany({
      where: {
        deletedAt: null,
        ...filters,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  findById: async (id) => {
    return prisma.package.findFirst({
      where: { id, deletedAt: null },
    });
  },

  update: async (id, data) => {
    return prisma.package.update({
      where: { id },
      data,
    });
  },

  softDelete: async (id) => {
    return prisma.package.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: "ARCHIVED",
        isActive: false,
      },
    });
  },
};
