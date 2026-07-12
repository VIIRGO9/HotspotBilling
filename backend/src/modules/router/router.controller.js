// backend/src/modules/router/router.controller.js
import { RouterService } from "./router.service.js";
import { asyncHandler } from "../../shared/utils/async.handler.js";

export const RouterController = {
  create: asyncHandler(async (req, res) => {
    const router = await RouterService.createRouter(req.validatedData.body);
    res.status(201).json({
      success: true,
      message: "Router registered successfully.",
      data: { ...router, password: "********", passwordEncrypted: undefined },
    });
  }),

  getAll: asyncHandler(async (req, res) => {
    const result = await RouterService.getRouters(req.validatedData.query);
    res.status(200).json({
      success: true,
      message: "Routers retrieved successfully.",
      ...result,
    });
  }),

  getById: asyncHandler(async (req, res) => {
    const router = await RouterService.getRouterById(req.params.id);
    res.status(200).json({
      success: true,
      message: "Router retrieved successfully.",
      data: router,
    });
  }),

  update: asyncHandler(async (req, res) => {
    const router = await RouterService.updateRouter(
      req.params.id,
      req.validatedData.body,
    );
    res.status(200).json({
      success: true,
      message: "Router updated successfully.",
      data: { ...router, password: "********", passwordEncrypted: undefined },
    });
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const { status } = req.validatedData.body;
    const router = await RouterService.updateStatus(req.params.id, status);
    res.status(200).json({
      success: true,
      message: `Router status updated to ${status}.`,
      data: router,
    });
  }),

  delete: asyncHandler(async (req, res) => {
    await RouterService.deleteRouter(req.params.id);
    res.status(200).json({
      success: true,
      message: "Router archived successfully.",
      data: null,
    });
  }),
};
