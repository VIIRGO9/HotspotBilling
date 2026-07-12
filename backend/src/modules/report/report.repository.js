// backend/src/modules/report/report.repository.js
import { prisma } from "../../shared/database/prisma.js";

export const ReportRepository = {
  getDashboardMetrics: async () => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return prisma.$transaction([
      // 1. Total Customers
      prisma.customer.count({ where: { deletedAt: null } }),

      // 2. Active Subscriptions
      prisma.subscription.count({
        where: { status: "ACTIVE", deletedAt: null },
      }),

      // 3. Active Sessions
      prisma.session.count({ where: { status: "ACTIVE" } }),

      // 4. Today's Revenue
      prisma.payment.aggregate({
        where: {
          status: "SUCCESS",
          paidAt: { gte: startOfToday },
          deletedAt: null,
        },
        _sum: { amount: true },
      }),

      // 5. Total Revenue (All Time)
      prisma.payment.aggregate({
        where: { status: "SUCCESS", deletedAt: null },
        _sum: { amount: true },
      }),

      // 6. Router Status Summary
      prisma.router.groupBy({
        by: ["status"],
        where: { deletedAt: null },
        _count: { id: true },
      }),

      // 7. Recent Transactions
      prisma.payment.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          customer: { select: { fullName: true, customerCode: true } },
          subscription: { select: { id: true } },
        },
      }),
    ]);
  },

  getSalesReport: async (filters) => {
    const where = {
      status: "SUCCESS",
      deletedAt: null,
      ...(filters.startDate && {
        paidAt: { gte: new Date(filters.startDate) },
      }),
      ...(filters.endDate && { paidAt: { lte: new Date(filters.endDate) } }),
      ...(filters.provider && { provider: filters.provider }),
      ...(filters.subscriptionId && { subscriptionId: filters.subscriptionId }),
    };

    // Group by Payment Provider
    const byProvider = await prisma.payment.groupBy({
      by: ["provider"],
      where,
      _count: { id: true },
      _sum: { amount: true },
    });

    // Total Summary
    const summary = await prisma.payment.aggregate({
      where,
      _count: { id: true },
      _sum: { amount: true },
    });

    return { byProvider, summary };
  },

  getSessionReport: async (filters) => {
    const where = {
      ...(filters.startDate && {
        loginTime: { gte: new Date(filters.startDate) },
      }),
      ...(filters.endDate && { loginTime: { lte: new Date(filters.endDate) } }),
      ...(filters.routerId && { routerId: filters.routerId }),
    };

    // Group by Router
    const byRouter = await prisma.session.groupBy({
      by: ["routerId"],
      where,
      _count: { id: true },
      _sum: { uploadBytes: true, downloadBytes: true, totalBytes: true },
    });

    // Total Summary
    const summary = await prisma.session.aggregate({
      where,
      _count: { id: true },
      _sum: { uploadBytes: true, downloadBytes: true, totalBytes: true },
    });

    return { byRouter, summary };
  },

  getExportData: async (type, filters) => {
    const dateFilter = {
      ...(filters.startDate && {
        createdAt: { gte: new Date(filters.startDate) },
      }),
      ...(filters.endDate && { createdAt: { lte: new Date(filters.endDate) } }),
    };

    if (type === "sales") {
      return prisma.payment.findMany({
        where: { status: "SUCCESS", deletedAt: null, ...dateFilter },
        include: {
          customer: { select: { fullName: true, customerCode: true } },
        },
        orderBy: { paidAt: "desc" },
      });
    }

    if (type === "sessions") {
      return prisma.session.findMany({
        where: { ...dateFilter },
        include: {
          customer: { select: { fullName: true } },
          router: { select: { name: true } },
        },
        orderBy: { loginTime: "desc" },
      });
    }

    if (type === "customers") {
      return prisma.customer.findMany({
        where: { deletedAt: null, ...dateFilter },
        orderBy: { createdAt: "desc" },
      });
    }

    return [];
  },
};
