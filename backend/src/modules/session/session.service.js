import { SessionRepository } from "./session.repository.js";
import { CustomerRepository } from "../customer/customer.repository.js";
import { VoucherRepository } from "../voucher/voucher.repository.js";
import { SubscriptionRepository } from "../subscription/subscription.repository.js";
import { RouterAdapterService } from "../router/router.adapter.service.js";
import { AppError } from "../../shared/middleware/error.handler.js";

export const SessionService = {
  /**
   * Starts a new internet session after validating identity and limits.
   */
  startSession: async (data) => {
    // Use customerId to strictly match the Prisma schema
    let customerId = data.customerId || data.userId; 
    let voucherId = data.voucherId;
    let subscriptionId = null;
    let packageData = null;

    // 1. Validate Identity (Account vs Voucher)
    if (voucherId) {
      const voucherObj = await VoucherRepository.findById(voucherId);
      if (!voucherObj) {
        throw new AppError("Voucher not found.", 404, "VOUCHER_002");
      }
      if (voucherObj.status !== "ACTIVE") {
        throw new AppError("Voucher is not valid for use.", 400, "SESSION_001");
      }
      packageData = voucherObj.package;
    } else if (customerId) {
      const customer = await CustomerRepository.findById(customerId);
      if (!customer) {
        throw new AppError("Customer not found.", 404, "CUSTOMER_003");
      }
      if (customer.status !== "ACTIVE") {
        throw new AppError("Customer account is not active.", 400, "SESSION_002");
      }

      // Find active subscription for this customer
      const activeSubs = await SubscriptionRepository.findMany(
        { customerId, status: "ACTIVE", deletedAt: null },
        0,
        1
      );

      if (activeSubs.total === 0) {
        throw new AppError("Customer has no active subscription.", 403, "SESSION_003");
      }

      const subscription = activeSubs.data[0];
      subscriptionId = subscription.id;
      packageData = subscription.package;
    } else {
      throw new AppError("Either customerId or voucherId must be provided.", 400, "SESSION_007");
    }

    // 2. Enforce Device Limit (FR-026)
    const activeSessions = await SessionRepository.findActiveByCustomerOrVoucher(customerId, voucherId);
    if (activeSessions.length >= packageData.deviceLimit) {
      throw new AppError(
        `Device limit exceeded. Maximum ${packageData.deviceLimit} devices allowed for this package.`,
        403,
        "SESSION_004"
      );
    }

    // 3. Create Session Record (Aligned with Prisma Schema)
    const newSession = await SessionRepository.create({
      customerId,
      voucherId,
      subscriptionId,
      routerId: data.routerId,
      macAddress: data.macAddress,
      ipAddress: data.ipAddress,
      status: "ACTIVE",
      loginTime: new Date(),
      disconnectReason: null, 
    });

    // 4. Update Voucher Status if applicable
    if (voucherId) {
      await VoucherRepository.updateStatus(voucherId, "USED");
    }

    // 5. Push Auth Rule to Router (Adapter Layer - FR-028)
    if (data.routerId) {
      try {
        await RouterAdapterService.authorizeAccess(data.routerId, {
          sessionId: newSession.id,
          macAddress: data.macAddress,
          ipAddress: data.ipAddress,
          speedLimit: packageData.downloadSpeedMbps,
        });
      } catch (error) {
        console.error(`[SessionService] Router authorization failed:`, error.message);
        // Rollback session creation and voucher status if router authorization fails
        await SessionRepository.delete(newSession.id);
        if (voucherId) {
          await VoucherRepository.updateStatus(voucherId, "ACTIVE");
        }
        throw new AppError("Router authorization failed. Session creation rolled back.", 500, "SESSION_008");
      }
    }

    return newSession;
  },

  /**
   * Terminates an active session (SRS FR-025).
   * Can be triggered by system (expiry), admin, or customer (Captive Portal).
   */
  stopSession: async (sessionId, disconnectReason = "MANUAL_DISCONNECT") => {
    const session = await SessionRepository.findById(sessionId);

    if (!session) {
      throw new AppError("Session not found.", 404, "SESSION_005");
    }

    if (session.status !== "ACTIVE") {
      throw new AppError("Session is already terminated or expired.", 400, "SESSION_006");
    }

    // 1. Update Session Record in Database
    const updatedSession = await SessionRepository.update(sessionId, {
      status: "TERMINATED",
      logoutTime: new Date(),
      disconnectReason: disconnectReason, // Matches schema exactly
    });

    // 2. Execute Disconnect on Router (Adapter Layer - FR-028)
    if (session.routerId && session.macAddress) {
      try {
        await RouterAdapterService.disconnectUser(
          session.routerId,
          session.id,
          session.macAddress,
        );
      } catch (error) {
        // Log the error but don't fail the database update, as the session is already terminated logically
        console.error(`[SessionService] Failed to disconnect user from router ${session.routerId}:`, error.message);
      }
    }

    return updatedSession;
  },

  getSessions: async (query) => {
    const { page, limit, status, customerId, voucherId, routerId, macAddress } = query;
    const skip = ((parseInt(page, 10) || 1) - 1) * (parseInt(limit, 10) || 20);

    const where = {
      ...(status && { status }),
      ...(customerId && { customerId }), 
      ...(voucherId && { voucherId }),
      ...(routerId && { routerId }),
      ...(macAddress && { macAddress }),
    };

    const { data, total } = await SessionRepository.findMany(where, skip, parseInt(limit, 10) || 20);

    return {
      data,
      pagination: {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20,
        total,
        totalPages: Math.ceil(total / (parseInt(limit, 10) || 20))
      },
    };
  },

  getSessionById: async (id) => {
    const session = await SessionRepository.findById(id);
    if (!session) {
      throw new AppError("Session not found.", 404, "SESSION_005");
    }
    return session;
  },

  getActiveSessionsCount: async () => {
    return SessionRepository.countActive();
  },
};