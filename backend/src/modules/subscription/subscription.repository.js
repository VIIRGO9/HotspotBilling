// backend/src/modules/subscription/subscription.repository.js
import { prisma } from "../../shared/database/prisma.js";

export const SubscriptionRepository = {
  create: async (data) => {
    return prisma.subscription.create({
      data,
      include: {
        customer: { select: { id: true, fullName: true, customerCode: true } },
        package: {
          select: {
            id: true,
            name: true,
            type: true,
            duration: true,
            validityUnit: true,
          },
        },
      },
    });
  },

  findById: async (id) => {
    return prisma.subscription.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            customerCode: true,
            email: true,
            phone: true,
          },
        },
        package: true,
        payments: { orderBy: { createdAt: "desc" }, take: 5 },
        sessions: { orderBy: { loginTime: "desc" }, take: 5 },
      },
    });
  },

  findMany: async (where, skip, take) => {
    const [data, total] = await prisma.$transaction([
      prisma.subscription.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: { id: true, fullName: true, customerCode: true },
          },
          package: { select: { id: true, name: true, type: true } },
        },
      }),
      prisma.subscription.count({ where }),
    ]);
    return { data, total };
  },

  update: async (id, data) => {
    return prisma.subscription.update({
      where: { id },
      data,
    });
  },
};
