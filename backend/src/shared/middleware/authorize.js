// backend/src/shared/middleware/authorize.js
import { AppError } from './error.handler.js';

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Skip authorization for CORS preflight requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'AUTH_005'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Forbidden: Insufficient permissions to perform this action.', 403, 'AUTH_009'));
    }

    next();
  };
};
