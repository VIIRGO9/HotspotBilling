// backend/src/modules/router/router.adapter.service.js
import { RouterAdapterFactory } from "./adapters/RouterAdapterFactory.js";
import { RouterRepository } from "./router.repository.js";
import { decrypt } from "../../shared/utils/encryption.js";
import { AppError } from "../../shared/middleware/error.handler.js";
import { logger } from "../../shared/utils/logger.js";

export const RouterAdapterService = {
  /**
   * Internal helper to fetch router and decrypt credentials.
   */
  _getDecryptedCredentials: async (routerId) => {
    const router = await RouterRepository.findById(routerId);
    if (!router) {
      throw new AppError(
        "Router not found for adapter execution.",
        404,
        "ROUTER_ADAPTER_003",
      );
    }
    if (router.status !== "ONLINE") {
      logger.warn(
        { routerId },
        "[RouterAdapter] Attempted to execute command on an OFFLINE router.",
      );
      // Depending on strictness, this could throw an error. For now, it logs a warning and proceeds.
    }

    return {
      id: router.id,
      type: router.type,
      ipAddress: router.ipAddress,
      apiPort: router.apiPort,
      username: router.username,
      password: decrypt(router.passwordEncrypted),
    };
  },

  authorizeAccess: async (routerId, sessionData) => {
    const credentials =
      await RouterAdapterService._getDecryptedCredentials(routerId);
    const adapter = RouterAdapterFactory.getAdapter(credentials.type);

    return adapter.authorizeAccess(credentials, sessionData);
  },

  disconnectUser: async (routerId, sessionId, macAddress) => {
    const credentials =
      await RouterAdapterService._getDecryptedCredentials(routerId);
    const adapter = RouterAdapterFactory.getAdapter(credentials.type);

    return adapter.disconnectUser(credentials, sessionId, macAddress);
  },
};
