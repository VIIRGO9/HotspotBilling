import { z } from "zod";

export const updateSettingSchema = z.object({
  params: z.object({ key: z.string().min(2).max(50) }),
  body: z.object({
    value: z.any(),
    description: z.string().max(255).optional(),
  }),
});
