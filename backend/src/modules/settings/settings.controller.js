import { SettingsService } from "./settings.service.js";
import { asyncHandler } from "../../shared/utils/async.handler.js";

export const SettingsController = {
  getAll: asyncHandler(async (req, res) => {
    const settings = await SettingsService.getAll();
    res.status(200).json({ success: true, data: settings });
  }),
  update: asyncHandler(async (req, res) => {
    const setting = await SettingsService.update(req.params.key, req.body);
    res
      .status(200)
      .json({ success: true, message: "Setting updated.", data: setting });
  }),
};
