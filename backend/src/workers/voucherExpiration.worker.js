// backend/src/workers/voucherExpiration.worker.js
import cron from "node-cron";
import { prisma } from "../shared/database/prisma.js";
import { acquireLock, releaseLock } from "../shared/utils/distributedLock.js";
import { logger } from "../shared/utils/logger.js";

const LOCK_KEY = "worker:voucher_expiration";

const processExpiredVouchers = async () => {
  const locked = await acquireLock(LOCK_KEY, 300); // 5 min lock
  if (!locked) {
    logger.debug(
      "Voucher expiration worker skipped: Lock held by another instance.",
    );
    return;
  }

  try {
    const now = new Date();
    const result = await prisma.voucher.updateMany({
      where: {
        status: { in: ["GENERATED", "ACTIVE"] },
        expiresAt: { not: null, lt: now },
        deletedAt: null,
      },
      data: { status: "EXPIRED" },
    });

    if (result.count > 0) {
      logger.info(`[Worker] Expired ${result.count} unused vouchers.`);
    }
  } catch (error) {
    logger.error({ error }, "[Worker] Failed to process expired vouchers");
  } finally {
    await releaseLock(LOCK_KEY);
  }
};

export const startVoucherExpirationWorker = () => {
  // Run every hour at minute 0
  cron.schedule("0 * * * *", processExpiredVouchers);
  logger.info("[Worker] Voucher Expiration Worker scheduled (Hourly).");
};
