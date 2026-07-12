// backend/src/modules/voucher/voucher.service.js
import { VoucherRepository } from "./voucher.repository.js";
import { PackageRepository } from "../package/package.repository.js";
import { AppError } from "../../shared/middleware/error.handler.js";
import { generateVoucherCode } from "../../shared/utils/voucherCodeGenerator.js";

export const VoucherService = {
  generateVouchers: async (data, generatedById) => {
    const { packageId, quantity, expiresInDays, batchNumber } = data;

    // 1. Verify package exists and is active (SRS FR-013)
    const pkg = await PackageRepository.findById(packageId);
    if (!pkg) {
      throw new AppError("Package not found.", 404, "PACKAGE_002");
    }
    if (pkg.status !== "ACTIVE" || !pkg.isActive) {
      throw new AppError(
        "Cannot generate vouchers for an inactive or disabled package.",
        400,
        "VOUCHER_001",
      );
    }

    // 2. Calculate expiration date if provided
    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // 3. Generate unique, cryptographically secure codes (SRS FR-013, NFR-004)
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
      status: "GENERATED",
      expiresAt,
      batchNumber: finalBatchNumber,
    }));

    // 5. Save to database
    await VoucherRepository.createMany(vouchersData);

    // 6. Fetch and return the created records
    const createdVouchers = await VoucherRepository.findByCodes(
      Array.from(generatedCodes),
    );

    return {
      batchNumber: finalBatchNumber,
      quantity: createdVouchers.length,
      vouchers: createdVouchers,
    };
  },

  validateVoucher: async (code) => {
    const voucher = await VoucherRepository.findByCode(code);

    if (!voucher) {
      throw new AppError("Invalid voucher code.", 404, "VOUCHER_002");
    }

    // Validation checks as per SRS FR-014
    if (voucher.status === "USED") {
      throw new AppError("Voucher has already been used.", 400, "VOUCHER_003");
    }

    if (voucher.status === "CANCELLED") {
      throw new AppError("Voucher has been cancelled.", 400, "VOUCHER_004");
    }

    if (voucher.expiresAt && new Date() > voucher.expiresAt) {
      if (voucher.status !== "EXPIRED") {
        await VoucherRepository.updateStatus(voucher.id, { status: "EXPIRED" });
      }
      throw new AppError("Voucher has expired.", 400, "VOUCHER_005");
    }

    if (voucher.package.status !== "ACTIVE") {
      throw new AppError(
        "The package associated with this voucher is no longer available.",
        400,
        "VOUCHER_006",
      );
    }

    return {
      valid: true,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        status: voucher.status,
        package: voucher.package,
        expiresAt: voucher.expiresAt,
      },
    };
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
        "VOUCHER_007",
      );
    }

    return VoucherRepository.updateStatus(id, { status: "CANCELLED" });
  },
};
