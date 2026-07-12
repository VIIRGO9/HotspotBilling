// backend/src/modules/router/validators/router.validator.js
import { z } from "zod";

// Regex fallback for IP validation (supports IPv4 and IPv6)
const ipRegex =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

export const createRouterSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    type: z.enum(["MIKROTIK", "OPENWRT", "OTHER"]).default("MIKROTIK"),
    ipAddress: z.string().regex(ipRegex, "Invalid IP address format"),
    apiPort: z.number().int().min(1).max(65535).default(8728),
    username: z.string().min(2).max(50),
    password: z.string().min(4).max(100),
    location: z.string().max(255).optional(),
    routerVersion: z.string().max(50).optional(),
    modelName: z.string().max(100).optional(),
    serialNumber: z.string().max(100).optional(),
    isDefault: z.boolean().default(false),
  }),
});

export const updateRouterSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    ipAddress: z
      .string()
      .regex(ipRegex, "Invalid IP address format")
      .optional(),
    apiPort: z.number().int().min(1).max(65535).optional(),
    username: z.string().min(2).max(50).optional(),
    password: z.string().min(4).max(100).optional(),
    location: z.string().max(255).optional(),
    routerVersion: z.string().max(50).optional(),
    modelName: z.string().max(100).optional(),
    serialNumber: z.string().max(100).optional(),
    isDefault: z.boolean().optional(),
  }),
});

export const updateRouterStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    status: z.enum(["ONLINE", "OFFLINE", "MAINTENANCE"]),
  }),
});

export const searchRouterSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    q: z.string().optional(),
    status: z.enum(["ONLINE", "OFFLINE", "MAINTENANCE"]).optional(),
    type: z.enum(["MIKROTIK", "OPENWRT", "OTHER"]).optional(),
  }),
});
