// backend/src/modules/report/validators/report.validator.js
import { z } from "zod";

export const dashboardSchema = z.object({
  query: z.object({}).default({}),
});

export const salesReportSchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    packageId: z.string().uuid().optional(),
    provider: z
      .enum([
        "MPESA",
        "AIRTEL_MONEY",
        "TIGOPESA",
        "HALOPESA",
        "BANK",
        "CARD",
        "CASH",
      ])
      .optional(),
  }),
});

export const sessionReportSchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    routerId: z.string().uuid().optional(),
  }),
});

export const exportReportSchema = z.object({
  params: z.object({
    type: z.enum(["sales", "sessions", "customers"]),
  }),
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    format: z.enum(["csv"]).default("csv"), // Extensible for PDF/Excel in future
  }),
});
