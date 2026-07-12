// backend/src/modules/payment/validators/payment.validator.js
import { z } from "zod";

export const recordPaymentSchema = z.object({
  body: z.object({
    customerId: z.string().uuid(),
    subscriptionId: z.string().uuid().optional(),
    amount: z.number().positive(),
    currency: z.enum(["TZS", "USD"]).default("TZS"),
    provider: z.enum([
      "MPESA",
      "AIRTEL_MONEY",
      "TIGOPESA",
      "HALOPESA",
      "BANK",
      "CARD",
      "CASH",
    ]),
    paymentReference: z.string().max(100).optional(), // e.g., Mobile money transaction ID
    providerPhone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/)
      .optional(),
    notes: z.string().max(500).optional(),
    status: z.enum(["PENDING", "SUCCESS", "FAILED"]).default("SUCCESS"), // Manual cash is usually SUCCESS immediately
  }),
});

export const verifyPaymentSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(["SUCCESS", "FAILED", "CANCELLED"]),
    failureReason: z.string().max(255).optional(),
  }),
});

export const searchPaymentSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    customerId: z.string().uuid().optional(),
    subscriptionId: z.string().uuid().optional(),
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
    status: z
      .enum([
        "PENDING",
        "PROCESSING",
        "SUCCESS",
        "FAILED",
        "CANCELLED",
        "REFUNDED",
      ])
      .optional(),
  }),
});
