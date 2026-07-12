// backend/src/modules/voucher/validators/voucher.validator.js
import { z } from "zod";

export const generateVoucherSchema = z.object({
  body: z.object({
    packageId: z.string().uuid(),
    quantity: z.number().int().min(1).max(1000),
    expiresInDays: z.number().int().positive().optional(),
    batchNumber: z.string().max(50).optional(),
  }),
});

export const validateVoucherSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(30),
  }),
});

export const getVoucherSchema = z.object({
  params: z.object({
    code: z.string().min(1).max(30),
  }),
});

export const cancelVoucherSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
