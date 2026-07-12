// backend/src/modules/session/session.service.js
import { SessionRepository } from "./session.repository.js";
import { CustomerRepository } from "../customer/customer.repository.js";
import { VoucherRepository } from "../voucher/voucher.repository.js";
import { SubscriptionRepository } from "../subscription/subscription.repository.js";
import { RouterAdapterService } from "../router/router.adapter.service.js";
import { AppError } from "../../shared/middleware/error.handler.js";

export const SessionService = {
  startSession: async (data) => {
    let customerId = data.customerId;
    let voucherId = data.voucherId;
    let subscriptionId = null;
    let packageData = null;

    // 1. Validate Identity (Account vs Voucher)
    if (voucherId) {
      const voucher = await VoucherRepository.findByCode(voucherId); // Note: findByCode expects code, we need findById for internal logic
      const voucherRecord = await prismaFindById("voucher", voucherId);
      // Simplified: Fetching voucher directly via Prisma for internal service use
      const voucherObj = await VoucherRepository.findById(voucherId);
      if (!voucherObj)
        throw new AppError("Voucher not found.", 404, "VOUCHER_002");
      if (voucherObj.status !== "ACTIVE" && voucherObj.status !== "GENERATED") {
        throw new AppError("Voucher is not valid for use.", 400, "SESSION_001");
      }
      packageData = voucherObj.package;
    } else if (customerId) {
      const customer = await CustomerRepository.findById(customerId);
      if (!customer)
        throw new AppError("Customer not found.", 404, "CUSTOMER_003");
      if (customer.status !== "ACTIVE")
        throw new AppError(
          "Customer account is not active.",
          400,
          "SESSION_002",
        );

      // Find active subscription for this customer
      const activeSubs = await SubscriptionRepository.findMany(
        { customerId, status: "ACTIVE", deletedAt: null },
        0,
        1,
      );
      if (activeSubs.total === 0) {
        throw new AppError(
          "Customer has no active subscription.",
          403,
          "SESSION_003",
        );
      }
      const subscription = activeSubs.data[0];
      subscriptionId = subscription.id;
      packageData = subscription.package;
    }

    // 2. Enforce Device Limit (SRS FR-026)
    const activeSessions =
      await SessionRepository.findActiveByCustomerOrVoucher(
        customerId,
        voucherId,
      );
    if (activeSessions.length >= packageData.deviceLimit) {
      throw new AppError(
        `Device limit exceeded. Maximum ${packageData.deviceLimit} devices allowed for this package.`,
        403,
        "SESSION_004",
      );
    }

    // 3. Create Session Record
    const newSession = await SessionRepository.create({
      customerId,
      voucherId,
      subscriptionId,
      routerId: data.routerId,
      macAddress: data.macAddress,
      ipAddress: data.ipAddress,
      username: data.username || data.macAddress,
      status: "ACTIVE",
      loginTime: new Date(),
    });

    // 4. Update Voucher Status if applicable (Mark as used upon first connection)
    if (voucherId) {
      await VoucherRepository.updateStatus(voucherId, {
        status: "USED",
        usedAt: new Date(),
      });
    }

    // 5. Push Auth Rule to Router (Adapter Layer)
    await RouterAdapterService.authorizeAccess(data.routerId, {
      sessionId: newSession.id,
      macAddress: data.macAddress,
      ipAddress: data.ipAddress,
      speedLimit: packageData.downloadSpeedMbps, // Simplified
    });

    return newSession;
  },

  stopSession: async (id, stopData, terminatedBy = "SYSTEM") => {
    const session = await SessionRepository.findById(id);
    if (!session) throw new AppError("Session not found.", 404, "SESSION_005");
    if (session.status !== "ACTIVE") {
      throw new AppError("Session is already terminated.", 400, "SESSION_006");
    }

    const totalBytes =
      (stopData.uploadBytes || 0) + (stopData.downloadBytes || 0);

    // Determine final status based on cause
    let finalStatus = "DISCONNECTED";
    if (
      stopData.terminateCause === "TIME_EXPIRED" ||
      stopData.terminateCause === "DATA_EXHAUSTED"
    ) {
      finalStatus = "EXPIRED";
    } else if (stopData.terminateCause === "ADMIN_DISCONNECT") {
      finalStatus = "TERMINATED";
    }

    // 1. Update Session Record
    const updatedSession = await SessionRepository.update(id, {
      status: finalStatus,
      logoutTime: new Date(),
      uploadBytes: stopData.uploadBytes || 0,
      downloadBytes: stopData.downloadBytes || 0,
      totalBytes,
      terminateCause: stopData.terminateCause || "MANUAL_DISCONNECT",
      disconnectReason:
        terminatedBy === "ADMIN"
          ? "Disconnected by Administrator"
          : stopData.terminateCause,
    });

    // 2. Execute Disconnect on Router (Adapter Layer)
    await RouterAdapterService.disconnectUser(
      session.routerId,
      id,
      session.macAddress,
    );

    return updatedSession;
  },

  getSessions: async (query) => {
    const { page, limit, status, customerId, voucherId, routerId, macAddress } =
      query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(voucherId && { voucherId }),
      ...(routerId && { routerId }),
      ...(macAddress && { macAddress }),
    };

    const { data, total } = await SessionRepository.findMany(
      where,
      skip,
      limit,
    );

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  getSessionById: async (id) => {
    const session = await SessionRepository.findById(id);
    if (!session) throw new AppError("Session not found.", 404, "SESSION_005");
    return session;
  },

  getActiveSessionsCount: async () => {
    return SessionRepository.countActive();
  },
};

// Helper to avoid circular dependency issues if VoucherRepository doesn't have findById exposed cleanly
const prismaFindById = async (type, id) => {
  // Fallback handled by VoucherRepository.findById in the actual flow
  return null;
};
