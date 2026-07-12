// backend/src/modules/session/validators/session.validator.js
import { z } from "zod";

// Regex for MAC address validation
const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

export const startSessionSchema = z.object({
  body: z
    .object({
      customerId: z.string().uuid().optional().nullable(),
      voucherId: z.string().uuid().optional().nullable(),
      routerId: z.string().uuid(),
      macAddress: z.string().regex(macRegex, "Invalid MAC address format"),
      ipAddress: z.string().min(1).max(45).optional(), // Supports IPv4 and IPv6
      username: z.string().max(100).optional(),
    })
    .refine((data) => data.customerId || data.voucherId, {
      message:
        "Either customerId or voucherId must be provided to start a session.",
    }),
});

export const stopSessionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    terminateCause: z.string().max(255).optional(), // e.g., 'TIME_EXPIRED', 'ADMIN_DISCONNECT', 'DATA_EXHAUSTED'
    uploadBytes: z.number().int().min(0).optional(),
    downloadBytes: z.number().int().min(0).optional(),
  }),
});

export const searchSessionSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z
      .enum(["ACTIVE", "DISCONNECTED", "EXPIRED", "TERMINATED"])
      .optional(),
    customerId: z.string().uuid().optional(),
    voucherId: z.string().uuid().optional(),
    routerId: z.string().uuid().optional(),
    macAddress: z.string().optional(),
  }),
});
