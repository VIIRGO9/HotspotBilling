// backend/src/shared/utils/distributedLock.js
import { redisClient } from "../database/redis.js";
import { logger } from "./logger.js";

/**
 * Attempts to acquire a distributed lock.
 * @param {string} lockKey - Unique identifier for the job.
 * @param {number} ttlSeconds - Time to live for the lock in seconds.
 * @returns {Promise<boolean>} True if the lock was acquired, false otherwise.
 */
export const acquireLock = async (lockKey, ttlSeconds = 300) => {
  if (!redisClient.isReady) return true; // Fallback to run if Redis is down

  try {
    const result = await redisClient.set(lockKey, "locked", {
      EX: ttlSeconds,
      NX: true,
    });
    return result === "OK";
  } catch (error) {
    logger.error({ error, lockKey }, "Error acquiring distributed lock");
    return true; // Fail-open: allow execution if Redis fails
  }
};

/**
 * Releases a distributed lock.
 * @param {string} lockKey - Unique identifier for the job.
 */
export const releaseLock = async (lockKey) => {
  if (!redisClient.isReady) return;
  try {
    await redisClient.del(lockKey);
  } catch (error) {
    logger.error({ error, lockKey }, "Error releasing distributed lock");
  }
};
