// backend/src/modules/payment/payment.controller.js
import { PaymentService } from "./payment.service.js";
import { asyncHandler } from "../../shared/utils/async.handler.js";

export const PaymentController = {
  record: asyncHandler(async (req, res) => {
    const payment = await PaymentService.recordPayment(
      req.validatedData.body,
      req.user.id,
    );
    res.status(201).json({
      success: true,
      message: "Payment recorded successfully.",
      data: payment,
    });
  }),

  verify: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const payment = await PaymentService.verifyPayment(
      id,
      req.validatedData.body,
    );
    res.status(200).json({
      success: true,
      message: `Payment status updated to ${payment.status}.`,
      data: payment,
    });
  }),

  getAll: asyncHandler(async (req, res) => {
    const result = await PaymentService.getPayments(req.validatedData.query);
    res.status(200).json({
      success: true,
      message: "Payments retrieved successfully.",
      ...result,
    });
  }),

  getById: asyncHandler(async (req, res) => {
    const payment = await PaymentService.getPaymentById(req.params.id);
    res.status(200).json({
      success: true,
      message: "Payment retrieved successfully.",
      data: payment,
    });
  }),
};
