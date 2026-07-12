// backend/src/modules/payment/payment.repository.js
import { prisma } from "../../shared/database/prisma.js";

export const PaymentRepository = {
  create: async (data) => {
    return prisma.payment.create({
      data,
      include: {
        customer: { select: { id: true, fullName: true, customerCode: true } },
        subscription: { select: { id: true, status: true } },
        receivedBy: { select: { id: true, name: true, email: true } },
        transaction: true,
      },
    });
  },

  findById: async (id) => {
    return prisma.payment.findUnique({
      where: { id },
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
        subscription: true,
        receivedBy: { select: { id: true, name: true, email: true } },
        transaction: true,
      },
    });
  },

  findByReceiptNumber: async (receiptNumber) => {
    return prisma.payment.findUnique({
      where: { receiptNumber },
    });
  },

  findMany: async (where, skip, take) => {
    const [data, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: { id: true, fullName: true, customerCode: true },
          },
          subscription: { select: { id: true, status: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]);
    return { data, total };
  },

  update: async (id, data) => {
    return prisma.payment.update({
      where: { id },
      data,
    });
  },

  createTransaction: async (data) => {
    return prisma.transaction.create({ data });
  },

  updateTransaction: async (paymentId, data) => {
    return prisma.transaction.update({
      where: { paymentId },
      data,
    });
  },
};
