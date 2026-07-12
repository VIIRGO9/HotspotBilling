import { Prisma } from "@prisma/client";
import { logger } from "../utils/logger.js";
import { env } from "../../config/env.js";

export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let code = err.code || "INTERNAL_ERROR";

  // Handle Prisma specific errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = 409;
      message = `Duplicate entry for field: ${err.meta?.target}`;
      code = "DUPLICATE_ENTRY";
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Record not found";
      code = "NOT_FOUND";
    }
  }

  // Handle Zod validation errors
  if (err.name === "ZodError") {
    statusCode = 400;
    message = "Validation failed";
    code = "VALIDATION_ERROR";
  }

  logger.error(
    {
      err,
      request: {
        method: req.method,
        url: req.url,
        body: req.body,
        userId: req.user?.id,
      },
    },
    message,
  );

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
