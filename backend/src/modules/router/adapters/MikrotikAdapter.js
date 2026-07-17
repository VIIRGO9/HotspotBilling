import axios from "axios";
import https from "https";
import { logger } from "../../../shared/utils/logger.js";

export class MikrotikAdapter {
  /**
   * Establishes a secure connection to the MikroTik Router.
   */
  createClient(credentials) {
    const { ipAddress, username, password } = credentials;

    return axios.create({
      baseURL: `http://${ipAddress}:8088/rest`,
      auth: {
        username,
        password,
      },
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
  }

  /**
   * Authorizes network access by ensuring the MAC address exists in the Hotspot.
   */
  async authorizeAccess(credentials, sessionData) {
    const client = this.createClient(credentials);

    try {
      const safeMac = (
        sessionData.macAddress || "00:00:00:00:00:00"
      ).toUpperCase();

      logger.info(
        `[MikrotikAdapter] Attempting to authorize MAC: ${safeMac}`
      );

      // Query only the matching user
      const { data: users } = await client.post(
        "/ip/hotspot/user/print",
        {
          ".query": [`name=${safeMac}`],
        }
      );

      if (users.length === 0) {
        await client.put("/ip/hotspot/user", {
          name: safeMac,
          password: safeMac,
          "mac-address": safeMac,
          profile: "default",
          comment: "SeneteBilling_Voucher",
        });

        logger.info(
          `[MikrotikAdapter] Created hotspot user for ${safeMac}`
        );
      } else {
        await client.patch(
          `/ip/hotspot/user/${encodeURIComponent(users[0][".id"])}`,
          {
            disabled: "false",
            profile: "default",
          }
        );

        logger.info(
          `[MikrotikAdapter] Updated hotspot user ${safeMac}`
        );
      }

      return {
        success: true,
        message: "Access authorized on MikroTik router",
      };
    } catch (error) {
      logger.error(
        {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
        },
        "[MikrotikAdapter] REST ERROR"
      );

      throw error;

      // throw new Error(
      //   error.response?.data?.message || error.message
      // );
    }
  }

  /**
   * Disconnects an active session and removes the user from the Hotspot database.
   */
  async disconnectUser(credentials, sessionId, macAddress) {
   const client = this.createClient(credentials);

   try {
    const safeMac = (
      macAddress || "00:00:00:00:00:00"
    ).toUpperCase();

    logger.info(
      `[MikrotikAdapter] Attempting to disconnect MAC: ${safeMac}`
    );

    // 1. Find active hotspot sessions
    const { data: activeSessions } = await client.post(
      "/ip/hotspot/active/print",
      {
        ".query": [
          `mac-address=${safeMac}`,
        ],
      }
    );

    // 2. Remove active sessions (force logout)
    if (activeSessions.length > 0) {
      for (const session of activeSessions) {
        await client.delete(
          `/ip/hotspot/active/${encodeURIComponent(session[".id"])}`
        );
      }

      logger.info(
        `[MikrotikAdapter] Disconnected ${activeSessions.length} active session(s) for ${safeMac}`
      );
    }

    // 3. Find hotspot user
    const { data: hotspotUsers } = await client.post(
      "/ip/hotspot/user/print",
      {
        ".query": [
          `name=${safeMac}`,
        ],
      }
    );

    // 4. Remove hotspot user record
    if (hotspotUsers.length > 0) {
      for (const user of hotspotUsers) {
        await client.delete(
          `/ip/hotspot/user/${encodeURIComponent(user[".id"])}`
        );
      }

      logger.info(
        `[MikrotikAdapter] Removed hotspot user record for ${safeMac}`
      );
    }

    return {
      success: true,
      message:
        "User disconnected and cleaned up from MikroTik router",
    };

  } catch (error) {
    logger.error(
      {
        error: error.response?.data || error.message,
      },
      "[MikrotikAdapter] Failed to disconnect user"
    );

    return {
      success: false,
      message:
        `MikroTik disconnection warning: ${error.response?.data?.message || error.message
        }`,
    };
    }
  }
}