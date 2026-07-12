// backend/src/modules/customer/customer.repository.js
import { prisma } from "../../shared/database/prisma.js";

export const CustomerRepository = {
  create: async (data) => {
    return prisma.customer.create({ data });
  },

  findById: async (id) => {
    return prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, email: true, role: true } },
        subscriptions: {
          where: { deletedAt: null },
          include: {
            package: { select: { id: true, name: true, type: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5, // Limit history for performance
        },
      },
    });
  },

  findByUserId: async (userId) => {
    return prisma.customer.findFirst({
      where: { userId, deletedAt: null },
    });
  },

  findMany: async (where, skip, take) => {
    const [data, total] = await prisma.$transaction([
      prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, email: true } },
          _count: { select: { subscriptions: true, sessions: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return { data, total };
  },

  update: async (id, data) => {
    return prisma.customer.update({ where: { id }, data });
  },

  softDelete: async (id) => {
    return prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date(), status: "ARCHIVED" },
    });
  },
};
