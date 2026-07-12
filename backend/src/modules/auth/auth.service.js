import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AuthRepository } from "./auth.repository.js";
import { AppError } from "../../shared/middleware/error.handler.js";
import { logger } from "../../shared/utils/logger.js";

export const AuthService = {
  register: async (userData) => {
    const existingUser = await AuthRepository.findUserByEmail(userData.email);
    if (existingUser) {
      throw new AppError("Email already registered", 409, "AUTH_001");
    }

    const saltRounds = env.BCRYPT_SALT_ROUNDS;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    const newUser = await AuthRepository.createUser({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      password: passwordHash,
      role: userData.role,
      status: "ACTIVE",
    });

    // Create associated customer profile for non-admin users
    if (userData.role !== "ADMIN") {
      await AuthRepository.createCustomerProfile(newUser.id, {
        fullName: userData.name,
        email: userData.email,
        phone: userData.phone,
      });
    }

    await AuthRepository.createAuditLog({
      userId: newUser.id,
      action: "CREATE",
      entity: "USER",
      entityId: newUser.id,
      description: `New user registered: ${userData.email}`,
      success: true,
    });

    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },

  login: async (email, password) => {
    const user = await AuthRepository.findUserByEmail(email);

    if (!user) {
      throw new AppError("Invalid email or password", 401, "AUTH_002");
    }

    if (user.status !== "ACTIVE") {
      throw new AppError("Account is suspended or inactive", 403, "AUTH_003");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401, "AUTH_002");
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    await AuthRepository.createAuditLog({
      userId: user.id,
      action: "LOGIN",
      entity: "USER",
      entityId: user.id,
      description: "User logged in successfully",
      success: true,
    });

    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword,
    };
  },
};
