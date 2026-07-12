import { AuthService } from "./auth.service.js";
import { asyncHandler } from "../../shared/utils/async.handler.js";

export const AuthController = {
  register: asyncHandler(async (req, res) => {
    const userData = req.validatedData.body;
    const newUser = await AuthService.register(userData);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: newUser,
    });
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.validatedData.body;
    const authData = await AuthService.login(email, password);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: authData,
    });
  }),
};
