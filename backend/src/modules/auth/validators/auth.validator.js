import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/)
      .optional(),
    password: z.string().min(8).max(100),
    role: z
      .enum(["ADMIN", "OPERATOR", "CUSTOMER"])
      .optional()
      .default("CUSTOMER"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});
