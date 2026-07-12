// backend/src/modules/report/report.routes.js
import { Router } from "express";
import { ReportController } from "./report.controller.js";
import { validate } from "../../shared/middleware/validate.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { authorize } from "../../shared/middleware/authorize.js";
import {
  dashboardSchema,
  salesReportSchema,
  sessionReportSchema,
  exportReportSchema,
} from "./validators/report.validator.js";

const router = Router();

// All reporting routes require authentication and Admin/Operator roles
router.use(authenticate, authorize("ADMIN", "OPERATOR"));

router.get(
  "/dashboard",
  validate(dashboardSchema),
  ReportController.getDashboard,
);
router.get(
  "/sales",
  validate(salesReportSchema),
  ReportController.getSalesReport,
);
router.get(
  "/sessions",
  validate(sessionReportSchema),
  ReportController.getSessionReport,
);
router.get(
  "/export/:type",
  validate(exportReportSchema),
  ReportController.exportReport,
);

export default router;
