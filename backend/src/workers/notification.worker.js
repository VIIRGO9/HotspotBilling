// backend/src/workers/notification.worker.js
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../shared/utils/logger.js";

const connection = new IORedis(env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "notifications",
  async (job) => {
    const { type, paymentId, customerId } = job.data;
    logger.info(
      `[NotificationWorker] Processing ${type} for customer ${customerId}`,
    );

    // TODO: Integrate actual SMS/Email providers (e.g., Twilio, SendGrid, AWS SNS)
    // Example: await smsProvider.send(customerPhone, "Your payment was successful.");

    return { success: true, message: `Notification ${type} processed (Stub)` };
  },
  { connection },
);

worker.on("completed", (job) =>
  logger.debug(`[NotificationWorker] Job ${job.id} completed`),
);
