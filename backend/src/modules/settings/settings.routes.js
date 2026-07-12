import { Router } from "express";
import { SettingsController } from "./settings.controller.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { authorize } from "../../shared/middleware/authorize.js";
import { validate } from "../../shared/middleware/validate.js";
import { audit } from "../../shared/middleware/audit.js";
import { updateSettingSchema } from "./validators/settings.validator.js";

const router = Router();
router.use(authenticate, authorize("ADMIN"));

router.get("/", SettingsController.getAll);
router.put(
  "/:key",
  validate(updateSettingSchema),
  audit("UPDATE", "SYSTEM_SETTING"),
  SettingsController.update,
);

export default router;
