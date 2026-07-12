// backend/src/modules/package/validators/package.validator.js
import { z } from "zod";

export const createPackageSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    type: z.enum(["TIME", "DATA", "UNLIMITED", "HYBRID"]),
    price: z.number().positive().multipleOf(0.01),
    duration: z.number().int().positive(),
    validityUnit: z
      .enum(["MINUTE", "HOUR", "DAY", "WEEK", "MONTH"])
      .default("DAY"),
    downloadSpeedMbps: z.number().int().positive().optional(),
    uploadSpeedMbps: z.number().int().positive().optional(),
    dataLimitGB: z.number().positive().optional(),
    deviceLimit: z.number().int().min(1).default(1),
  }),
});

export const updatePackageSchema = z.object({
  body: createPackageSchema.shape.body.partial(),
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(["ACTIVE", "DISABLED", "ARCHIVED"]),
  }),
});
