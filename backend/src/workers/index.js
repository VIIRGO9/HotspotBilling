// backend/src/workers/index.js
import { startVoucherExpirationWorker } from "./voucherExpiration.worker.js";
import { startSubscriptionExpirationWorker } from "./subscriptionExpiration.worker.js";
import "./paymentRetry.worker.js"; // Initializes BullMQ worker
import "./notification.worker.js"; // Initializes BullMQ worker
import { logger } from "../shared/utils/logger.js";

export const initializeWorkers = () => {
  logger.info("Initializing background workers...");
  startVoucherExpirationWorker();
  startSubscriptionExpirationWorker();
  logger.info(
    "All background workers (Cron & BullMQ) initialized successfully.",
  );
};
