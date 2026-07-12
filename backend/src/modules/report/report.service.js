// backend/src/modules/report/report.service.js
import { ReportRepository } from "./report.repository.js";
import { AppError } from "../../shared/middleware/error.handler.js";

/**
 * Utility to convert JSON array to CSV string.
 */
const convertToCSV = (data) => {
  if (!data || data.length === 0) return "";

  // Flatten nested objects for CSV (e.g., customer.fullName)
  const flattenedData = data.map((item) => {
    const flat = {};
    for (const key in item) {
      if (
        item[key] !== null &&
        typeof item[key] === "object" &&
        !(item[key] instanceof Date)
      ) {
        for (const subKey in item[key]) {
          flat[`${key}_${subKey}`] = item[key][subKey];
        }
      } else {
        flat[key] = item[key];
      }
    }
    return flat;
  });

  const headers = Object.keys(flattenedData[0]);
  const csvRows = [
    headers.join(","),
    ...flattenedData.map((row) =>
      headers
        .map((header) => {
          let val = row[header];
          if (val === null || val === undefined) return "";
          if (val instanceof Date) val = val.toISOString();
          val = String(val).replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(","),
    ),
  ];
  return csvRows.join("\n");
};

export const ReportService = {
  getDashboard: async () => {
    const [
      totalCustomers,
      activeSubscriptions,
      activeSessions,
      todaySalesResult,
      totalRevenueResult,
      routerStats,
      recentTransactions,
    ] = await ReportRepository.getDashboardMetrics();

    // Format Router Stats into a clean object
    const routerStatusSummary = routerStats.reduce((acc, curr) => {
      acc[curr.status] = curr._count.id;
      return acc;
    }, {});

    return {
      totalCustomers,
      activeSubscriptions,
      activeSessions,
      todayRevenue: todaySalesResult._sum.amount || 0,
      totalRevenue: totalRevenueResult._sum.amount || 0,
      routerStatusSummary,
      recentTransactions,
    };
  },

  getSalesReport: async (filters) => {
    return ReportRepository.getSalesReport(filters);
  },

  getSessionReport: async (filters) => {
    return ReportRepository.getSessionReport(filters);
  },

  exportReport: async (type, filters) => {
    const data = await ReportRepository.getExportData(type, filters);
    if (data.length === 0) {
      throw new AppError(
        "No data found for the specified criteria.",
        404,
        "REPORT_001",
      );
    }

    const csvString = convertToCSV(data);
    return {
      filename: `${type}_report_${new Date().toISOString().split("T")[0]}.csv`,
      content: csvString,
    };
  },
};
