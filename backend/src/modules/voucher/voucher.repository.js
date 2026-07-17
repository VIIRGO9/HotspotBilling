// backend/src/modules/voucher/voucher.repository.js
import { prisma } from "../../shared/database/prisma.js";

export const VoucherRepository = {
  createMany: async (vouchersData) => {
    return prisma.voucher.createMany({ data: vouchersData });
  },

  findByCodes: async (codes) => {
    return prisma.voucher.findMany({
      where: { code: { in: codes }, deletedAt: null },
      include: { package: true },
    });
  },

  findByCode: async (code) => {
    return prisma.voucher.findFirst({
      where: { code, deletedAt: null },
      include: { package: true },
    });
  },

  findById: async (id) => {
    return prisma.voucher.findFirst({
      where: { id, deletedAt: null },
      include: {
        package: true,
        generatedBy: { select: { id: true, name: true, email: true } },
      },
    });
  },

  findByCode: async (code) => {
    return prisma.voucher.findUnique({
      where: { code },
      include: {
        package: true
      },
    });
  },

  findAll: async (filters = {}) => {
    return prisma.voucher.findMany({
      where: { deletedAt: null, ...filters },
      include: { package: { select: { id: true, name: true, type: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  updateStatus: async (id, status) => {
    return prisma.voucher.update({
      where: { id },
      data: { status },
    });
  },
};




