// backend/src/modules/payment/payment.service.js
import crypto from "crypto";
import { PaymentRepository } from "./payment.repository.js";
import { CustomerRepository } from "../customer/customer.repository.js";
import { SubscriptionRepository } from "../subscription/subscription.repository.js";
import { SubscriptionService } from "../subscription/subscription.service.js";
import { AppError } from "../../shared/middleware/error.handler.js";

/**
 * Generates a unique, sequential-looking receipt number.
 * Format: RCPT-YYYYMMDD-XXXXXX
 */
const generateReceiptNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `RCPT-${date}-${randomStr}`;
};

export const PaymentService = {
  recordPayment: async (data, receivedById) => {
    const customer = await CustomerRepository.findById(data.customerId);
    if (!customer)
      throw new AppError("Customer not found.", 404, "CUSTOMER_003");

    let subscription = null;
    if (data.subscriptionId) {
      subscription = await SubscriptionRepository.findById(data.subscriptionId);
      if (!subscription)
        throw new AppError("Subscription not found.", 404, "SUB_003");
      if (subscription.customerId !== data.customerId) {
        throw new AppError(
          "Subscription does not belong to the specified customer.",
          400,
          "PAY_001",
        );
      }
    }

    const receiptNumber = await generateUniqueReceipt();

    // Create Payment Record
    const payment = await PaymentRepository.create({
      customerId: data.customerId,
      subscriptionId: data.subscriptionId,
      amount: data.amount,
      currency: data.currency,
      provider: data.provider,
      status: data.status,
      receiptNumber,
      paymentReference: data.paymentReference,
      providerPhone: data.providerPhone,
      notes: data.notes,
      receivedById,
      paidAt: data.status === "SUCCESS" ? new Date() : null,
    });

    // Create linked Transaction Record (Financial Audit Trail)
    await PaymentRepository.createTransaction({
      paymentId: payment.id,
      providerReference: data.paymentReference || receiptNumber,
      status: data.status === "SUCCESS" ? "SUCCESS" : "PENDING",
    });

    // Business Rule: If payment is successful and linked to a subscription, activate/renew it
    if (data.status === "SUCCESS" && subscription) {
      if (subscription.status === "PENDING") {
        await SubscriptionService.activateSubscription(subscription.id);
      } else if (
        subscription.status === "EXPIRED" ||
        subscription.status === "SUSPENDED"
      ) {
        await SubscriptionService.renewSubscription(subscription.id);
      }
    }

    return payment;
  },

  verifyPayment: async (id, verificationData) => {
    const payment = await PaymentRepository.findById(id);
    if (!payment) throw new AppError("Payment not found.", 404, "PAY_002");

    if (payment.status !== "PENDING" && payment.status !== "PROCESSING") {
      throw new AppError(
        `Cannot verify a payment with status ${payment.status}.`,
        400,
        "PAY_003",
      );
    }

    const updateData = {
      status: verificationData.status,
      paidAt: verificationData.status === "SUCCESS" ? new Date() : null,
    };

    await PaymentRepository.update(id, updateData);

    // Update Transaction status
    const txStatus =
      verificationData.status === "SUCCESS"
        ? "SUCCESS"
        : verificationData.status === "FAILED"
          ? "FAILED"
          : "PENDING";

    await PaymentRepository.updateTransaction(id, {
      status: txStatus,
      failureReason: verificationData.failureReason,
      processedAt: new Date(),
    });

    // Trigger subscription activation if verified as successful
    if (verificationData.status === "SUCCESS" && payment.subscriptionId) {
      const subscription = await SubscriptionRepository.findById(
        payment.subscriptionId,
      );
      if (
        subscription &&
        (subscription.status === "PENDING" || subscription.status === "EXPIRED")
      ) {
        if (subscription.status === "PENDING") {
          await SubscriptionService.activateSubscription(subscription.id);
        } else {
          await SubscriptionService.renewSubscription(subscription.id);
        }
      }
    }

    return PaymentRepository.findById(id);
  },

  getPayments: async (query) => {
    const { page, limit, customerId, subscriptionId, provider, status } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(customerId && { customerId }),
      ...(subscriptionId && { subscriptionId }),
      ...(provider && { provider }),
      ...(status && { status }),
    };

    const { data, total } = await PaymentRepository.findMany(
      where,
      skip,
      limit,
    );

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  getPaymentById: async (id) => {
    const payment = await PaymentRepository.findById(id);
    if (!payment) throw new AppError("Payment not found.", 404, "PAY_002");
    return payment;
  },
};

/**
 * Helper to ensure receipt number uniqueness
 */
const generateUniqueReceipt = async () => {
  let receipt = generateReceiptNumber();
  let exists = await PaymentRepository.findByReceiptNumber(receipt);
  while (exists) {
    receipt = generateReceiptNumber();
    exists = await PaymentRepository.findByReceiptNumber(receipt);
  }
  return receipt;
};
