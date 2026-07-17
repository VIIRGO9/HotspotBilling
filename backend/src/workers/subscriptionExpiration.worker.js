// backend/src/workers/subscriptionExpiration.worker.js
import cron from "node-cron";
import { prisma } from "../shared/database/prisma.js";
import { acquireLock, releaseLock } from "../shared/utils/distributedLock.js";
import { logger } from "../shared/utils/logger.js";

const LOCK_KEY = "worker:subscription_expiration";

const processExpiredSubscriptions = async () => {
  const locked = await acquireLock(LOCK_KEY, 300);
  if (!locked) {
    logger.debug(
      "Subscription expiration worker skipped: Lock held by another instance.",
    );
    return;
  }

  try {
    const now = new Date();

    // Find subscriptions that are ACTIVE but past their end date
    const expiredSubs = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        endDate: { lt: now }
      },
      select: {
        id: true,
        autoRenew: true,
        customerId: true,
        package: { select: { price: true } },
        payments: {
          select: { provider: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (expiredSubs.length === 0) return;

    const expiredIds = expiredSubs.map((sub) => sub.id);

    // Batch update status to EXPIRED
    await prisma.subscription.updateMany({
      where: { id: { in: expiredIds } },
      data: {
        status: "EXPIRED",
        expiredAt: now,
      },
    });

    logger.info(`[Worker] Expired ${expiredSubs.length} subscriptions.`);

    const renewalPayments = expiredSubs
      .filter((sub) => sub.autoRenew && sub.customerId)
      .map((sub) => ({
        customerId: sub.customerId,
        subscriptionId: sub.id,
        amount: sub.package.price,
        provider: sub.payments[0]?.provider ?? "CASH",
        status: "PENDING",
        notes: "Auto-renewal payment",
      }));

    if (renewalPayments.length > 0) {
      await prisma.payment.createMany({ data: renewalPayments });
      logger.info(
        `[Worker] Created ${renewalPayments.length} auto-renewal payments.`,
      );
    }
  } catch (error) {
    logger.error({ error }, "[Worker] Failed to process expired subscriptions");
  } finally {
    await releaseLock(LOCK_KEY);
  }
};

export const startSubscriptionExpirationWorker = () => {
  // Run every 15 minutes
  cron.schedule("*/15 * * * *", processExpiredSubscriptions);
  logger.info(
    "[Worker] Subscription Expiration Worker scheduled (Every 15 mins).",
  );
};


