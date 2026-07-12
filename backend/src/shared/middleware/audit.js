// backend/src/shared/middleware/audit.js
import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";

/**
 * Centralized Audit Middleware.
 * Usage: router.post('/', audit('CREATE', 'PACKAGE'), controller.create)
 */
export const audit = (action, entity) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      // Only log if the request was successful (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = req.params.id || body?.data?.id || null;

        // Asynchronous fire-and-forget audit logging
        prisma.auditLog
          .create({
            data: {
              userId: req.user?.id || null,
              action,
              entity,
              entityId,
              description: `${action} ${entity}`,
              ipAddress: req.ip || req.socket.remoteAddress,
              userAgent: req.get("user-agent") || "unknown",
              success: true,
            },
          })
          .catch((err) => {
            logger.error({ err }, "Failed to write audit log");
          });
      }
      return originalJson(body);
    };

    next();
  };
};
