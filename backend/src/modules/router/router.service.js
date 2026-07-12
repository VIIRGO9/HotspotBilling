// backend/src/modules/router/router.service.js
import { RouterRepository } from "./router.repository.js";
import { AppError } from "../../shared/middleware/error.handler.js";
import { encrypt, decrypt } from "../../shared/utils/encryption.js";

export const RouterService = {
  createRouter: async (data) => {
    // Check unique constraint for IP and Port
    const existing = await RouterRepository.findByIpAndPort(
      data.ipAddress,
      data.apiPort,
    );
    if (existing) {
      throw new AppError(
        "A router with this IP address and API port already exists.",
        409,
        "ROUTER_001",
      );
    }

    // Encrypt the password before saving
    const passwordEncrypted = encrypt(data.password);
    const { password, ...restData } = data;

    // If this router is set as default, clear other defaults
    if (restData.isDefault) {
      await RouterRepository.clearDefaultFlags();
    }

    return RouterRepository.create({
      ...restData,
      passwordEncrypted,
      status: "OFFLINE", // New routers start offline until synced
    });
  },

  getRouters: async (query) => {
    const { page, limit, q, status, type } = query;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(status && { status }),
      ...(type && { type }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { ipAddress: { contains: q, mode: "insensitive" } },
          { location: { contains: q, mode: "insensitive" } },
        ],
      }),
    };

    const { data, total } = await RouterRepository.findMany(where, skip, limit);

    // Decrypt passwords for the response so the frontend can display/mask them if needed
    const sanitizedData = data.map((router) => ({
      ...router,
      password: "********", // Never send decrypted password in list views
      passwordEncrypted: undefined,
    }));

    return {
      data: sanitizedData,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  getRouterById: async (id) => {
    const router = await RouterRepository.findById(id);
    if (!router) throw new AppError("Router not found.", 404, "ROUTER_002");

    return {
      ...router,
      password: "********",
      passwordEncrypted: undefined,
    };
  },

  /**
   * Retrieves the decrypted credentials for internal system use (e.g., Router Adapter).
   * This method must NEVER be exposed directly to an HTTP controller.
   */
  getDecryptedCredentials: async (id) => {
    const router = await RouterRepository.findById(id);
    if (!router) throw new AppError("Router not found.", 404, "ROUTER_002");

    return {
      id: router.id,
      name: router.name,
      type: router.type,
      ipAddress: router.ipAddress,
      apiPort: router.apiPort,
      username: router.username,
      password: decrypt(router.passwordEncrypted),
    };
  },

  updateRouter: async (id, data) => {
    const existing = await RouterRepository.findById(id);
    if (!existing) throw new AppError("Router not found.", 404, "ROUTER_002");

    // Check IP/Port uniqueness if they are being changed
    if (data.ipAddress || data.apiPort) {
      const newIp = data.ipAddress || existing.ipAddress;
      const newPort = data.apiPort || existing.apiPort;
      const conflict = await RouterRepository.findByIpAndPort(newIp, newPort);
      if (conflict && conflict.id !== id) {
        throw new AppError(
          "A router with this IP address and API port already exists.",
          409,
          "ROUTER_001",
        );
      }
    }

    const updateData = { ...data };

    // Encrypt password if a new one is provided
    if (data.password) {
      updateData.passwordEncrypted = encrypt(data.password);
      delete updateData.password;
    }

    // Handle default flag
    if (data.isDefault === true) {
      await RouterRepository.clearDefaultFlags();
    }

    return RouterRepository.update(id, updateData);
  },

  updateStatus: async (id, status) => {
    const existing = await RouterRepository.findById(id);
    if (!existing) throw new AppError("Router not found.", 404, "ROUTER_002");

    const updateData = { status };
    if (status === "ONLINE") {
      updateData.lastSeen = new Date();
    }

    return RouterRepository.update(id, updateData);
  },

  deleteRouter: async (id) => {
    const existing = await RouterRepository.findById(id);
    if (!existing) throw new AppError("Router not found.", 404, "ROUTER_002");

    await RouterRepository.softDelete(id);
  },
};
