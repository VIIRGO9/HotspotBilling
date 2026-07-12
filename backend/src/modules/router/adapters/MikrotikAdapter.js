// backend/src/modules/router/adapters/MikrotikAdapter.js
import { RouterOSClient } from "routeros-client";
import { logger } from "../../../shared/utils/logger.js";
import { decrypt } from "../../../shared/utils/encryption.js";

export class MikrotikAdapter {
  /**
   * Establishes a secure connection to the MikroTik Router.
   * @param {Object} credentials - Decrypted router credentials.
   * @returns {Promise<RouterOSClient>} The connected client instance.
   */
  async connect(credentials) {
    const { ipAddress, apiPort, username, password } = credentials;

    const client = new RouterOSClient({
      host: ipAddress,
      port: apiPort,
      user: username,
      password: password,
      timeout: 10, // 10 seconds connection timeout
    });

    try {
      await client.connect();
      logger.debug(`[MikrotikAdapter] Connected to router at ${ipAddress}`);
      return client;
    } catch (error) {
      logger.error(
        { error, ipAddress },
        "[MikrotikAdapter] Failed to connect to MikroTik router",
      );
      throw new Error(
        `Failed to connect to router ${ipAddress}: ${error.message}`,
      );
    }
  }

  /**
   * Authorizes network access by ensuring the MAC address/Username exists
   * in the MikroTik Hotspot User database with the correct profile/limits.
   */
  async authorizeAccess(credentials, sessionData) {
    const client = await this.connect(credentials);
    try {
      const { macAddress, speedLimit } = sessionData;

      // 1. Check if user already exists in Hotspot
      const existingUsers = await client.command("/ip/hotspot/user/print", {
        "?name": macAddress,
      });

      if (existingUsers.length === 0) {
        // 2. Create new Hotspot user if they don't exist
        await client.command("/ip/hotspot/user/add", {
          name: macAddress,
          password: macAddress, // Default password is the MAC address for MAC-cookie auth
          "mac-address": macAddress,
          profile: "default", // Assumes a 'default' hotspot profile exists on the router
          "limit-uptime": "0", // No time limit enforced at router level; managed by SeneteBilling
        });
        logger.info(
          `[MikrotikAdapter] Created hotspot user for MAC: ${macAddress}`,
        );
      } else {
        // 3. Update existing user if limits or profiles changed
        const userId = existingUsers[0][".id"];
        await client.command("/ip/hotspot/user/set", {
          ".id": userId,
          profile: "default",
        });
      }

      logger.info(`[MikrotikAdapter] Access authorized for MAC: ${macAddress}`);
      return { success: true, message: "Access authorized on MikroTik router" };
    } catch (error) {
      logger.error({ error }, "[MikrotikAdapter] Failed to authorize access");
      throw new Error(`MikroTik authorization failed: ${error.message}`);
    } finally {
      await this.disconnect(client);
    }
  }

  /**
   * Disconnects an active session by removing the user from the Hotspot Active database.
   */
  async disconnectUser(credentials, sessionId, macAddress) {
    const client = await this.connect(credentials);
    try {
      // 1. Find the active session by MAC address
      const activeSessions = await client.command("/ip/hotspot/active/print", {
        "?mac-address": macAddress,
      });

      if (activeSessions.length > 0) {
        // 2. Remove each active session found for this MAC
        for (const session of activeSessions) {
          await client.command("/ip/hotspot/active/remove", {
            ".id": session[".id"],
          });
        }
        logger.info(
          `[MikrotikAdapter] Disconnected ${activeSessions.length} active session(s) for MAC: ${macAddress}`,
        );
      } else {
        logger.debug(
          `[MikrotikAdapter] No active sessions found for MAC: ${macAddress}`,
        );
      }

      return {
        success: true,
        message: "User disconnected from MikroTik router",
      };
    } catch (error) {
      logger.error({ error }, "[MikrotikAdapter] Failed to disconnect user");
      throw new Error(`MikroTik disconnection failed: ${error.message}`);
    } finally {
      await this.disconnect(client);
    }
  }

  /**
   * Safely closes the connection to the router.
   */
  async disconnect(client) {
    if (client && client.isConnected()) {
      try {
        await client.close();
        logger.debug("[MikrotikAdapter] Router connection closed gracefully");
      } catch (error) {
        logger.error(
          { error },
          "[MikrotikAdapter] Error closing router connection",
        );
      }
    }
  }
}
