// backend/src/modules/session/session.controller.js
import { SessionService } from "./session.service.js";
import { asyncHandler } from "../../shared/utils/async.handler.js";

export const SessionController = {
  start: asyncHandler(async (req, res) => {
    const session = await SessionService.startSession(req.validatedData.body);
    res.status(201).json({
      success: true,
      message: "Session started successfully. Internet access granted.",
      data: session,
    });
  }),

  stop: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const session = await SessionService.stopSession(
      id,
      req.validatedData.body,
      "ADMIN",
    );
    res.status(200).json({
      success: true,
      message: "Session terminated successfully.",
      data: session,
    });
  }),

  getAll: asyncHandler(async (req, res) => {
    const result = await SessionService.getSessions(req.validatedData.query);
    res.status(200).json({
      success: true,
      message: "Sessions retrieved successfully.",
      ...result,
    });
  }),

  getById: asyncHandler(async (req, res) => {
    const session = await SessionService.getSessionById(req.params.id);
    res.status(200).json({
      success: true,
      message: "Session retrieved successfully.",
      data: session,
    });
  }),

  getActiveCount: asyncHandler(async (req, res) => {
    const count = await SessionService.getActiveSessionsCount();
    res.status(200).json({
      success: true,
      message: "Active sessions count retrieved.",
      data: { activeSessions: count },
    });
  }),
};
