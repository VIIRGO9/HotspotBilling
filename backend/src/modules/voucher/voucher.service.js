import { VoucherRepository } from "./voucher.repository.js";
import { PackageRepository } from "../package/package.repository.js";
import { SubscriptionRepository } from "../subscription/subscription.repository.js";
import { SessionRepository } from "../session/session.repository.js";
import { RouterRepository } from "../router/router.repository.js";
import { RouterAdapterService } from "../router/router.adapter.service.js";
import { AppError } from "../../shared/middleware/error.handler.js";
import { generateVoucherCode } from "../../shared/utils/voucherCodeGenerator.js";
import { prisma } from "../../shared/database/prisma.js";
import { logger } from "../../shared/utils/logger.js";

const PLACEHOLDER_MAC = "00:00:00:00:00:00";
const MAC_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

const normalizeMacAddress = (mac) => mac.toUpperCase().replace(/-/g, ":");

export const VoucherService = {
  /**
   * Generates a batch of unique, cryptographically secure vouchers.
   * Aligns with SRS FR-013, NFR-004 (Voucher entropy protection).
   */
  generateVouchers: async (data, generatedById) => {
    const { packageId, quantity, expiresInDays, batchNumber } = data;

    // 1. Verify package exists and is active
    const pkg = await PackageRepository.findById(packageId);
    if (!pkg) {
      throw new AppError("Package not found.", 404, "PACKAGE_002");
    }
    if (pkg.status !== "ACTIVE") {
      throw new AppError(
        "Cannot generate vouchers for an inactive or disabled package.",
        400,
        "VOUCHER_001"
      );
    }

    // 2. Calculate expiration date if provided
    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // 3. Generate unique, cryptographically secure codes
    const generatedCodes = new Set();
    while (generatedCodes.size < quantity) {
      generatedCodes.add(generateVoucherCode());
    }

    // 4. Prepare data for bulk insert
    const finalBatchNumber = batchNumber || `BATCH-${Date.now()}`;
    const vouchersData = Array.from(generatedCodes).map((code) => ({
      code,
      packageId,
      generatedById,
      status: "ACTIVE", // SRS Enum Standard: ACTIVE, not GENERATED
      expiresAt,
      batchNumber: finalBatchNumber,
    }));

    // 5. Save to database
    await VoucherRepository.createMany(vouchersData);

    // 6. Fetch and return the created records
    const createdVouchers = await VoucherRepository.findByCodes(
      Array.from(generatedCodes)
    );

    return {
      batchNumber: finalBatchNumber,
      quantity: createdVouchers.length,
      vouchers: createdVouchers,
    };
  },

  /**
   * Pure validation: Checks if a voucher is valid WITHOUT activating it.
   * Useful for UI previews or pre-checks.
   */
  validateVoucher: async (code) => {
    const voucher = await VoucherRepository.findByCode(code);



    if (!voucher) {
      throw new AppError("Invalid voucher code.", 404, "VOUCHER_002");
    }

    if (voucher.status === "USED") {
      throw new AppError("Voucher has already been used.", 400, "VOUCHER_003");
    }

    if (voucher.status === "CANCELLED") {
      throw new AppError("Voucher has been cancelled.", 400, "VOUCHER_004");
    }

    if (voucher.expiresAt && new Date() > voucher.expiresAt) {
      if (voucher.status !== "EXPIRED") {
        await VoucherRepository.updateStatus(voucher.id, "EXPIRED");
      }
      throw new AppError("Voucher has expired.", 400, "VOUCHER_005");
    }

    if (voucher.package.status !== "ACTIVE") {
      throw new AppError(
        "The package associated with this voucher is no longer available.",
        400,
        "VOUCHER_006"
      );
    }

    return {
      valid: true,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        status: voucher.status,
        packageName: voucher.package.name,
        expiresAt: voucher.expiresAt,
      },
    };
  },

  /**
   * Validates AND activates a voucher by creating a subscription and session.
   * Uses Prisma transactions with row-level locking to ensure atomicity.
   */
  validateAndActivateVoucher: async (code, clientIp, clientMac, routerId) => {
    // A captive portal may identify its router explicitly.  Otherwise use the
    // configured default router so voucher activation still reaches MikroTik.
    const router = routerId
      ? await RouterRepository.findById(routerId)
      : await RouterRepository.findDefault();
    if (routerId && !router) {
      throw new AppError("Router not found.", 404, "ROUTER_ADAPTER_003");
    }
    const resolvedRouterId = router?.id || null;
    const macAddress = typeof clientMac === "string" && MAC_REGEX.test(clientMac)
      ? normalizeMacAddress(clientMac)
      : null;

    if (resolvedRouterId && (!macAddress || macAddress === PLACEHOLDER_MAC)) {
      throw new AppError(
        "A valid client MAC address is required to authorize this voucher on the router.",
        400,
        "VOUCHER_010"
      );
    }

    const activation = await prisma.$transaction(
      async (tx) => {
        // Use Prisma's findUnique with row-level locking instead of raw SQL
        const voucher = await tx.voucher.findUnique({
          where: { code },
          include: { package: true },
        });

        if (!voucher) {
          throw new AppError("Invalid voucher code.", 404, "VOUCHER_002");
        }

        const pkg = voucher.package;

        // Validation checks
        if (voucher.status === "USED") {
          throw new AppError("Voucher has already been used.", 400, "VOUCHER_003");
        }
        if (voucher.status === "CANCELLED") {
          throw new AppError("Voucher has been cancelled.", 400, "VOUCHER_004");
        }
        if (voucher.expiresAt && new Date() > voucher.expiresAt) {
          await tx.voucher.update({
            where: { id: voucher.id },
            data: { status: "EXPIRED" },
          });
          throw new AppError("Voucher has expired.", 400, "VOUCHER_005");
        }
        if (!pkg) {
          throw new AppError("Voucher is missing package configuration.", 500, "VOUCHER_009");
        }
        if (pkg.status !== "ACTIVE") {
          throw new AppError(
            "The package associated with this voucher is no longer available.",
            400,
            "VOUCHER_006"
          );
        }

        // Check device limit
        const activeSessionsCount = await tx.session.count({
          where: {
            voucherId: voucher.id,
            status: "ACTIVE",
          },
        });

        if (activeSessionsCount >= pkg.deviceLimit) {
          throw new AppError(
            `Device limit of ${pkg.deviceLimit} reached for this voucher.`,
            403,
            "VOUCHER_008"
          );
        }

        // Mark voucher as USED
        await tx.voucher.update({
          where: { id: voucher.id },
          data: {
            status: "USED",
            usedAt: new Date(),
          },
        });

        // Create Subscription (Calculate endDate based on validityUnit)
        const startDate = new Date();
        let endDate = null;

        if (pkg.duration && pkg.validityUnit) {
          const duration = pkg.duration;
          const unit = pkg.validityUnit;

          endDate = new Date(startDate);
          if (unit === "MINUTE") endDate.setMinutes(endDate.getMinutes() + duration);
          else if (unit === "HOUR") endDate.setHours(endDate.getHours() + duration);
          else if (unit === "DAY") endDate.setDate(endDate.getDate() + duration);
          else if (unit === "WEEK") endDate.setDate(endDate.getDate() + (duration * 7));
          else if (unit === "MONTH") endDate.setMonth(endDate.getMonth() + duration);
        }

        const subscription = await tx.subscription.create({
          data: {
            customerId: null,
            packageId: voucher.packageId,
            voucherId: voucher.id,
            startDate,
            endDate,
            status: "ACTIVE",
          },
        });

        const session = await tx.session.create({
          data: {
            customerId: null,
            subscriptionId: subscription.id,
            voucherId: voucher.id,
            routerId: resolvedRouterId,
            ipAddress: clientIp || "0.0.0.0",
            macAddress: macAddress || PLACEHOLDER_MAC,
            loginTime: new Date(),
            status: "ACTIVE",
            totalBytes: 0,
            uploadBytes: 0,
            downloadBytes: 0,
          },
        });

        if (resolvedRouterId) {
          try {
            await RouterAdapterService.authorizeAccess(resolvedRouterId, {
              sessionId: session.id,
              macAddress,
              ipAddress: clientIp || "0.0.0.0",
              speedLimit: pkg.downloadSpeedMbps ? `${pkg.downloadSpeedMbps} Mbps` : "Unlimited",
            });
          } catch (error) {
            logger.error(
              { error, routerId: resolvedRouterId, voucherCode: code },
              "[VoucherService] Router authorization failed; rolling back voucher activation"
            );
            throw new AppError(
              "Router synchronization failed. Your voucher was not activated and remains available. Please try again in a moment.",
              503,
              "VOUCHER_011"
            );
          }
        }

        return {
          success: true,
          message: "Authentication successful. Internet access granted.",
          data: {
            sessionId: session.id,
            subscriptionId: subscription.id,
            voucherCode: voucher.code,
            packageName: pkg.name,
            expiresAt: endDate,
            dataLimit: pkg.dataLimitGB ? `${pkg.dataLimitGB} GB` : "Unlimited",
            speedLimit: pkg.downloadSpeedMbps ? `${pkg.downloadSpeedMbps} Mbps` : "Unlimited",
          },
        };
      },
      {
        isolationLevel: "Serializable",
        timeout: 30000, // 30 second timeout for transaction
      }
    );

    return activation;
  },

  getVouchers: async (filters) => {
    return VoucherRepository.findAll(filters);
  },

  getVoucherByCode: async (code) => {
    const voucher = await VoucherRepository.findByCode(code);
    if (!voucher) {
      throw new AppError("Voucher not found.", 404, "VOUCHER_002");
    }
    return voucher;
  },

  cancelVoucher: async (id) => {
    const voucher = await VoucherRepository.findById(id);
    if (!voucher) {
      throw new AppError("Voucher not found.", 404, "VOUCHER_002");
    }

    if (voucher.status === "USED") {
      throw new AppError(
        "Cannot cancel a voucher that has already been used.",
        400,
        "VOUCHER_007"
      );
    }

    return VoucherRepository.updateStatus(id, "CANCELLED");
  },
};
