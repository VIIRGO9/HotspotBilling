// backend/src/modules/session/session.repository.js
import { prisma } from "../../shared/database/prisma.js";

export const SessionRepository = {
  create: async (data) => {
    return prisma.session.create({
      data,
      include: {
        customer: { select: { id: true, fullName: true, customerCode: true } },
        voucher: { select: { id: true, code: true } },
        router: { select: { id: true, name: true } },
        subscription: { select: { id: true, package: true } },
      },
    });
  },

  findById: async (id) => {
    return prisma.session.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, fullName: true, customerCode: true } },
        voucher: { select: { id: true, code: true, package: true } },
        router: { select: { id: true, name: true } },
        subscription: { include: { package: true } },
      },
    });
  },

  /**
   * Finds all ACTIVE sessions for a specific customer OR voucher.
   * Crucial for enforcing device limits (SRS FR-026).
   */
  findActiveByCustomerOrVoucher: async (customerId, voucherId) => {
    const where = { status: "ACTIVE" };
    if (customerId) where.customerId = customerId;
    if (voucherId) where.voucherId = voucherId;

    return prisma.session.findMany({
      where,
      select: { id: true, macAddress: true },
    });
  },

  findMany: async (where, skip, take) => {
    const [data, total] = await prisma.$transaction([
      prisma.session.findMany({
        where,
        skip,
        take,
        orderBy: { loginTime: "desc" },
        include: {
          customer: { select: { id: true, fullName: true } },
          voucher: { select: { id: true, code: true } },
          router: { select: { id: true, name: true } },
        },
      }),
      prisma.session.count({ where }),
    ]);
    return { data, total };
  },

  update: async (id, data) => {
    return prisma.session.update({
      where: { id },
      data,
    });
  },

  countActive: async () => {
    return prisma.session.count({ where: { status: "ACTIVE" } });
  },
};
