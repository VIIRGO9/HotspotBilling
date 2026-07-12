// backend/src/modules/report/report.controller.js
import { ReportService } from "./report.service.js";
import { asyncHandler } from "../../shared/utils/async.handler.js";

export const ReportController = {
  getDashboard: asyncHandler(async (req, res) => {
    const metrics = await ReportService.getDashboard();
    res.status(200).json({
      success: true,
      message: "Dashboard metrics retrieved successfully.",
      data: metrics,
    });
  }),

  getSalesReport: asyncHandler(async (req, res) => {
    const report = await ReportService.getSalesReport(req.query);
    res.status(200).json({
      success: true,
      message: "Sales report generated successfully.",
      data: report,
    });
  }),

  getSessionReport: asyncHandler(async (req, res) => {
    const report = await ReportService.getSessionReport(req.query);
    res.status(200).json({
      success: true,
      message: "Session report generated successfully.",
      data: report,
    });
  }),

  exportReport: asyncHandler(async (req, res) => {
    const { type } = req.params;
    const { format } = req.query;

    const { filename, content } = await ReportService.exportReport(
      type,
      req.query,
    );

    // Set headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    res.status(200).send(content);
  }),
};
