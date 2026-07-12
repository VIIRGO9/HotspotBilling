import { PrismaClient } from "@prisma/client";
import { env } from "../../config/env.js";
import { logger } from "../utils/logger.js";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handling
process.on("beforeExit", async () => {
  await prisma.$disconnect();
  logger.info("Prisma client disconnected gracefully");
});
