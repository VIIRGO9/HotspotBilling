// backend/src/shared/database/redis.js
import { createClient } from "redis";
import { env } from "../../config/env.js";
import { logger } from "../utils/logger.js";

const redisClient = createClient({
  url: env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => logger.error({ err }, "Redis Client Error"));
redisClient.on("connect", () => logger.info("Redis client connected"));

// Connect to Redis if a URL is provided
if (env.REDIS_URL) {
  redisClient.connect().catch((err) => {
    logger.error(
      { err },
      "Failed to connect to Redis. Background workers may fail.",
    );
  });
}

export { redisClient };
