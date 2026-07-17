import { RouterRepository } from "./router.repository.js";
import { AppError } from "../../shared/middleware/error.handler.js";
import { encrypt, decrypt } from "../../shared/utils/encryption.js";
import net from "net"; // Built-in Node.js module for TCP connections

// Helper function to test actual network reachability via TCP handshake (FR-027)
const testTcpConnection = (ip, port, timeout = 3000) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);

    socket.connect(port, ip, () => {
      socket.destroy(); // Connection successful, close socket immediately
      resolve(true);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.on("error", () => {
      resolve(false); // Connection refused, host unreachable, etc.
    });
  });
};

export const RouterService = {
  /**
   * Creates a new router after testing network connectivity (FR-027).
   */
  createRouter: async (data) => {
    // 1. Check unique constraint for IP and Port (ignoring soft-deleted routers)
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

    // 2. Test actual network connection to the router's API port
    const isConnected = await testTcpConnection(
      data.ipAddress,
      data.apiPort || 8728,
    );

    // 3. Determine real status based on the TCP handshake (RouterStatus enum)
    const initialStatus = isConnected ? "ONLINE" : "OFFLINE";
    const lastSeen = isConnected ? new Date() : null;

    // 4. Encrypt the password before saving (Security Requirement FR-042)
    const passwordEncrypted = encrypt(data.password);
    const { password, ...restData } = data;

    // 5. If this router is set as default, clear other defaults
    if (restData.isDefault) {
      await RouterRepository.clearDefaultFlags();
    }

    // 6. Save to database with the verified status
    return RouterRepository.create({
      ...restData,
      passwordEncrypted,
      status: initialStatus,
      lastSeen,
    });
  },

  /**
   * Retrieves routers with pagination, filtering, and soft-delete handling.
   */
  getRouters: async (query) => {
    // Safely parse page and limit to prevent Prisma validation errors
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Check if frontend requested archived routers
    const includeArchived = query.includeArchived === "true";

    // Build where clause
    const where = {
      // Only apply deletedAt: null if we are NOT including archived routers (Soft Delete Policy)
      ...(includeArchived ? {} : { deletedAt: null }),
      ...(query.status && { status: query.status }),
      ...(query.type && { type: query.type }),
      ...(query.q && {
        OR: [
          { name: { contains: query.q, mode: "insensitive" } },
          { ipAddress: { contains: query.q, mode: "insensitive" } },
          { location: { contains: query.q, mode: "insensitive" } },
        ],
      }),
    };

    const { data, total } = await RouterRepository.findMany(where, skip, limit);

    // Sanitize passwords for the response (Security Requirement FR-042)
    const sanitizedData = data.map((router) => ({
      ...router,
      password: "********",
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

  getDecryptedCredentials: async (id) => {
    const router = await RouterRepository.findById(id);
    if (!router) throw new AppError("Router not found.", 404, "ROUTER_002");
    if (router.deletedAt) throw new AppError("Router is archived.", 400, "ROUTER_005");

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
    if (existing.deletedAt) throw new AppError("Cannot update an archived router.", 400, "ROUTER_006");

    if (data.ipAddress || data.apiPort) {
      const newIp = data.ipAddress || existing.ipAddress;
      const newPort = data.apiPort || existing.apiPort;
      const conflict = await RouterRepository.findByIpAndPort(newIp, newPort);
      if (conflict && conflict.id !== id) {
        throw new AppError("A router with this IP address and API port already exists.", 409, "ROUTER_001");
      }
    }

    const updateData = { ...data };
    if (data.password) {
      updateData.passwordEncrypted = encrypt(data.password);
      delete updateData.password;
    }

    if (data.isDefault === true) {
      await RouterRepository.clearDefaultFlags();
    }

    return RouterRepository.update(id, updateData);
  },

  /**
   * Updates router status. If setting to ONLINE, it performs a real TCP connection test first.
   */
  updateStatus: async (id, status) => {
    const existing = await RouterRepository.findById(id);
    if (!existing) throw new AppError("Router not found.", 404, "ROUTER_002");
    if (existing.deletedAt) throw new AppError("Cannot change status of an archived router.", 400, "ROUTER_006");

    // CRITICAL: If trying to set to ONLINE, we MUST verify the connection first
    if (status === "ONLINE") {
      const isConnected = await testTcpConnection(existing.ipAddress, existing.apiPort || 8728);

      if (!isConnected) {
        throw new AppError(
          `Connection to router "${existing.name}" (${existing.ipAddress}:${existing.apiPort}) is unreachable or failed. Cannot set to ONLINE.`,
          400,
          "ROUTER_007"
        );
      }
    }

    const updateData = { status };
    if (status === "ONLINE") {
      updateData.lastSeen = new Date();
    }

    return RouterRepository.update(id, updateData);
  },

  /**
   * Soft deletes a router (Database Standard: Soft Delete Policy).
   */
  deleteRouter: async (id) => {
    const existing = await RouterRepository.findById(id);
    if (!existing) throw new AppError("Router not found.", 404, "ROUTER_002");
    if (existing.deletedAt) throw new AppError("Router is already archived.", 400, "ROUTER_003");

    return RouterRepository.softDelete(id);
  },

  /**
   * Restores a soft-deleted router.
   */
  restoreRouter: async (id) => {
    const existing = await RouterRepository.findById(id);
    if (!existing) throw new AppError("Router not found.", 404, "ROUTER_002");
    if (!existing.deletedAt) throw new AppError("Router is not archived.", 400, "ROUTER_003");

    return RouterRepository.restore(id);
  },

  /**
   * Permanently deletes a router from the database.
   */
  permanentDeleteRouter: async (id) => {
    const existing = await RouterRepository.findById(id);
    if (!existing) throw new AppError("Router not found.", 404, "ROUTER_002");
    if (!existing.deletedAt) throw new AppError("Only archived routers can be permanently deleted.", 400, "ROUTER_004");

    return RouterRepository.permanentDelete(id);
  },
};