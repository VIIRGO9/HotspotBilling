// backend/src/workers/paymentRetry.worker.js
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../shared/utils/logger.js";
import { prisma } from "../shared/database/prisma.js";

const connection = new IORedis(env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const paymentRetryQueue = new Queue("payment-retry", { connection });

const worker = new Worker(
  "payment-retry",
  async (job) => {
    const { paymentId, attempt } = job.data;
    logger.info(
      `[PaymentRetry] Processing attempt ${attempt} for payment ${paymentId}`,
    );

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment || payment.status !== "PENDING") return;

    // Payment provider verification is deferred to the live provider integration.
    const isVerified = false; // Placeholder for provider API call

    if (isVerified) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "SUCCESS", paidAt: new Date() },
      });
      logger.info(`[PaymentRetry] Payment ${paymentId} verified successfully.`);
      // Add to notification queue
      await notificationQueue.add("send-receipt", { paymentId });
    } else {
      if (attempt >= 3) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: "FAILED" },
        });
        logger.warn(
          `[PaymentRetry] Payment ${paymentId} failed after 3 attempts.`,
        );
      } else {
        // Exponential backoff: 1 min, 5 mins, 30 mins
        const delays = [60000, 300000, 1800000];
        await paymentRetryQueue.add(
          "retry",
          { paymentId, attempt: attempt + 1 },
          { delay: delays[attempt] },
        );
      }
    }
  },
  { connection },
);

worker.on("failed", (job, err) =>
  logger.error({ err, jobId: job?.id }, "[PaymentRetry] Job failed"),
);

// Export notification queue for use in other workers
export const notificationQueue = new Queue("notifications", { connection });
