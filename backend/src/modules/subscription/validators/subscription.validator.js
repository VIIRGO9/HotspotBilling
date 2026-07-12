// backend/src/modules/subscription/validators/subscription.validator.js
import { z } from "zod";

export const createSubscriptionSchema = z.object({
  body: z.object({
    customerId: z.string().uuid(),
    packageId: z.string().uuid(),
    startDate: z.string().datetime().optional(),
    autoRenew: z.boolean().optional().default(false),
  }),
});

export const getSubscriptionsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    customerId: z.string().uuid().optional(),
    packageId: z.string().uuid().optional(),
    status: z
      .enum(["PENDING", "ACTIVE", "EXPIRED", "SUSPENDED", "CANCELLED"])
      .optional(),
  }),
});

export const subscriptionIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
