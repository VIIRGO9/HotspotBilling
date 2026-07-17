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

  /**
   * Terminates an active session.
   * Accessible by Admins, Customers, or the system (e.g., for expiry).
   */
  stop: asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Extract termination reason from body (e.g., "USER_REQUEST", "MANUAL_DISCONNECT")
    // Defaults to "MANUAL_DISCONNECT" if not provided by the frontend
    const disconnectReason = req.validatedData?.body?.reason || "MANUAL_DISCONNECT";

    const session = await SessionService.stopSession(id, disconnectReason);
    const sanitizedSession = {
      ...session,
      uploadBytes: session.uploadBytes ? session.uploadBytes.toString() : "0",
      downloadBytes: session.downloadBytes ? session.downloadBytes.toString() : "0",
      totalBytes: session.totalBytes ? session.totalBytes.toString() : "0",
    };

    res.status(200).json({
      success: true,
      message: "Session terminated successfully.",
      data: sanitizedSession,
    });
  }),

  getAll: asyncHandler(async (req, res) => {
    const result = await SessionService.getSessions(req.validatedData.query);
    const sanitizedData = result.data.map((session) => ({
      ...session,
      uploadBytes: session.uploadBytes ? session.uploadBytes.toString() : "0",
      downloadBytes: session.downloadBytes ? session.downloadBytes.toString() : "0",
      totalBytes: session.totalBytes ? session.totalBytes.toString() : "0",
    }));
    res.status(200).json({
      success: true,
      message: "Sessions retrieved successfully.",
      ...result,
      data: sanitizedData,
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