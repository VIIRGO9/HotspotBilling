// backend/src/modules/customer/validators/customer.validator.js
import { z } from "zod";

export const createCustomerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(100),
    email: z.string().email().optional().nullable(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/)
      .optional()
      .nullable(),
    address: z.string().max(255).optional().nullable(),
    nationalId: z.string().max(50).optional().nullable(),
    dateOfBirth: z.string().datetime().optional().nullable(),
    gender: z.enum(["MALE", "FEMALE"]).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
    customerType: z.enum(["REGISTERED", "VOUCHER"]).default("REGISTERED"),
    userId: z.string().uuid().optional().nullable(),
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    fullName: z.string().min(2).max(100).optional(),
    email: z.string().email().optional().nullable(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/)
      .optional()
      .nullable(),
    address: z.string().max(255).optional().nullable(),
    nationalId: z.string().max(50).optional().nullable(),
    dateOfBirth: z.string().datetime().optional().nullable(),
    gender: z.enum(["MALE", "FEMALE"]).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
  }),
});

export const updateCustomerStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "ARCHIVED"]),
  }),
});

export const searchCustomerSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    q: z.string().optional(), // Search string for name, email, phone, or code
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "ARCHIVED"]).optional(),
    customerType: z.enum(["REGISTERED", "VOUCHER"]).optional(),
  }),
});
