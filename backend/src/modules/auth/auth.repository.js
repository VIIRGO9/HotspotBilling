import { prisma } from "../../shared/database/prisma.js";

export const AuthRepository = {
  findUserByEmail: async (email) => {
    return prisma.user.findUnique({
      where: { email },
      include: { customer: true },
    });
  },

  createUser: async (userData) => {
    return prisma.user.create({
      data: userData,
    });
  },

  createCustomerProfile: async (userId, customerData) => {
    return prisma.customer.create({
      data: {
        userId,
        customerCode: `CUST-${Date.now()}`,
        customerType: "REGISTERED",
        ...customerData,
      },
    });
  },

  updateLastLogin: async (userId) => {
    return prisma.user.update({
      where: { id: userId },
      data: { updatedAt: new Date() },
    });
  },

  createAuditLog: async (logData) => {
    return prisma.auditLog.create({
      data: logData,
    });
  },
};
