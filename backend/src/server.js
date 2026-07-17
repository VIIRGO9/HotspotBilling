// backend/src/server.js

// ============================================
// IMPORTS
// ============================================
import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { logger } from "./shared/utils/logger.js";
import { errorHandler, AppError } from "./shared/middleware/error.handler.js";
import { initializeWorkers } from "./workers/index.js";

// Import Routes
import authRoutes from "./modules/auth/auth.routes.js";
import packageRoutes from "./modules/package/package.routes.js";
import voucherRoutes from "./modules/voucher/voucher.routes.js";
import customerRoutes from "./modules/customer/customer.routes.js";
import subscriptionRoutes from "./modules/subscription/subscription.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import routerRoutes from "./modules/router/router.routes.js";
import sessionRoutes from "./modules/session/session.routes.js";
import reportRoutes from "./modules/report/report.routes.js";
import settingsRoutes from "./modules/settings/settings.routes.js";

// ============================================
// APP INITIALIZATION
// ============================================
const app = express();

// ============================================
// 1. SECURITY MIDDLEWARE
// ============================================
app.use(helmet()); // Sets security HTTP headers
app.use(hpp()); // Prevents HTTP Parameter Pollution

// CORS Configuration
app.use(
  cors({
    origin: true, // Reflects request origin (allow all for dev)
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-mac-address",
      "x-ip-address",
      "x-router-id",
    ],
  })
);

// ============================================
// 2. BODY PARSING
// ============================================
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// 3. RATE LIMITING
// ============================================

// Global Rate Limiter (1000 requests per 15 minutes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use(globalLimiter);

// Strict Auth Limiter (10 login attempts per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many login attempts, please try again later.",
  },
});

// Voucher Validation Limiter (30 attempts per 15 minutes)
const voucherLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: "Too many voucher validation attempts.",
  },
});

// ============================================
// 4. LOGGING
// ============================================
const morganFormat = env.NODE_ENV === "development" ? "dev" : "combined";
app.use(
  morgan(morganFormat, {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// ============================================
// 5. HEALTH CHECK
// ============================================
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SeneteBilling API is running",
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    },
  });
});

// ============================================
// 6. API ROUTES
// ============================================

// Apply specific rate limiters to sensitive endpoints
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/vouchers/validate", voucherLimiter);

// Main API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/packages", packageRoutes);
app.use("/api/v1/vouchers", voucherRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/routers", routerRoutes);
app.use("/api/v1/sessions", sessionRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/settings", settingsRoutes);

// ============================================
// 7. API DOCUMENTATION
// ============================================
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ============================================
// 8. 404 HANDLER
// ============================================
app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404, "ROUTE_NOT_FOUND"));
});

// ============================================
// 9. GLOBAL ERROR HANDLER
// ============================================
app.use(errorHandler);

// ============================================
// 10. UNHANDLED REJECTIONS
// ============================================
process.on("unhandledRejection", (reason, promise) => {
  logger.error({ reason, promise }, "Unhandled Rejection at Promise");
});

// ============================================
// EXPORT & START SERVER
// ============================================
export { app };

if (process.env.NODE_ENV !== "test") {
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    initializeWorkers();
  });

  const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}
