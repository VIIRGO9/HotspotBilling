// backend/src/modules/voucher/voucher.controller.js
import { VoucherService } from "./voucher.service.js";
import { asyncHandler } from "../../shared/utils/async.handler.js";

export const VoucherController = {
  generate: asyncHandler(async (req, res) => {
    const data = req.validatedData.body;
    const result = await VoucherService.generateVouchers(data, req.user.id);

    res.status(201).json({
      success: true,
      message: "Vouchers generated successfully.",
      data: result,
    });
  }),

  validate: asyncHandler(async (req, res) => {
    const { code } = req.validatedData.body;
    const result = await VoucherService.validateVoucher(code);

    res.status(200).json({
      success: true,
      message: "Voucher is valid.",
      data: result,
    });
  }),

  getAll: asyncHandler(async (req, res) => {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.packageId) filters.packageId = req.query.packageId;
    if (req.query.batchNumber) filters.batchNumber = req.query.batchNumber;

    const vouchers = await VoucherService.getVouchers(filters);

    res.status(200).json({
      success: true,
      message: "Vouchers retrieved successfully.",
      data: vouchers,
    });
  }),

  getByCode: asyncHandler(async (req, res) => {
    const { code } = req.validatedData.params;
    const voucher = await VoucherService.getVoucherByCode(code);

    res.status(200).json({
      success: true,
      message: "Voucher retrieved successfully.",
      data: voucher,
    });
  }),

  cancel: asyncHandler(async (req, res) => {
    const { id } = req.validatedData.params;
    const voucher = await VoucherService.cancelVoucher(id);

    res.status(200).json({
      success: true,
      message: "Voucher cancelled successfully.",
      data: voucher,
    });
  }),
};
