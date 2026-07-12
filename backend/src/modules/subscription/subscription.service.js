// backend/src/modules/subscription/subscription.service.js
import { SubscriptionRepository } from "./subscription.repository.js";
import { CustomerRepository } from "../customer/customer.repository.js";
import { PackageRepository } from "../package/package.repository.js";
import { AppError } from "../../shared/middleware/error.handler.js";

/**
 * Calculates the exact end date based on package duration and validity unit.
 */
const calculateEndDate = (startDate, duration, unit) => {
  const end = new Date(startDate);
  switch (unit) {
    case "MINUTE":
      end.setMinutes(end.getMinutes() + duration);
      break;
    case "HOUR":
      end.setHours(end.getHours() + duration);
      break;
    case "DAY":
      end.setDate(end.getDate() + duration);
      break;
    case "WEEK":
      end.setDate(end.getDate() + duration * 7);
      break;
    case "MONTH":
      end.setMonth(end.getMonth() + duration);
      break;
    default:
      throw new AppError("Invalid validity unit.", 400, "SUB_005");
  }
  return end;
};

export const SubscriptionService = {
  createSubscription: async (data) => {
    const customer = await CustomerRepository.findById(data.customerId);
    if (!customer)
      throw new AppError("Customer not found.", 404, "CUSTOMER_003");
    if (customer.status !== "ACTIVE")
      throw new AppError(
        "Cannot create subscription for an inactive customer.",
        400,
        "SUB_001",
      );

    const pkg = await PackageRepository.findById(data.packageId);
    if (!pkg) throw new AppError("Package not found.", 404, "PACKAGE_002");
    if (pkg.status !== "ACTIVE")
      throw new AppError(
        "Cannot subscribe to an inactive package.",
        400,
        "SUB_002",
      );

    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const endDate = calculateEndDate(startDate, pkg.duration, pkg.validityUnit);

    return SubscriptionRepository.create({
      customerId: data.customerId,
      packageId: data.packageId,
      startDate,
      endDate,
      status: "PENDING",
      autoRenew: data.autoRenew || false,
    });
  },

  getSubscriptions: async (query) => {
    const { page, limit, customerId, packageId, status } = query;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(customerId && { customerId }),
      ...(packageId && { packageId }),
      ...(status && { status }),
    };

    const { data, total } = await SubscriptionRepository.findMany(
      where,
      skip,
      limit,
    );

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  getSubscriptionById: async (id) => {
    const sub = await SubscriptionRepository.findById(id);
    if (!sub) throw new AppError("Subscription not found.", 404, "SUB_003");
    return sub;
  },

  activateSubscription: async (id) => {
    const sub = await SubscriptionRepository.findById(id);
    if (!sub) throw new AppError("Subscription not found.", 404, "SUB_003");
    if (sub.status !== "PENDING") {
      throw new AppError(
        `Cannot activate a subscription with status ${sub.status}.`,
        400,
        "SUB_004",
      );
    }

    return SubscriptionRepository.update(id, {
      status: "ACTIVE",
      activatedAt: new Date(),
    });
  },

  cancelSubscription: async (id) => {
    const sub = await SubscriptionRepository.findById(id);
    if (!sub) throw new AppError("Subscription not found.", 404, "SUB_003");
    if (sub.status === "CANCELLED" || sub.status === "EXPIRED") {
      throw new AppError(
        `Cannot cancel a subscription with status ${sub.status}.`,
        400,
        "SUB_006",
      );
    }

    return SubscriptionRepository.update(id, {
      status: "CANCELLED",
      expiredAt: new Date(),
    });
  },

  renewSubscription: async (id) => {
    const sub = await SubscriptionRepository.findById(id);
    if (!sub) throw new AppError("Subscription not found.", 404, "SUB_003");

    // If active, extend from current endDate to preserve remaining time.
    // If expired/pending, extend from now.
    const extendFrom = sub.status === "ACTIVE" ? sub.endDate : new Date();

    const pkg = await PackageRepository.findById(sub.packageId);
    const newEndDate = calculateEndDate(
      extendFrom,
      pkg.duration,
      pkg.validityUnit,
    );

    return SubscriptionRepository.update(id, {
      status: "ACTIVE",
      endDate: newEndDate,
      activatedAt: sub.activatedAt || new Date(),
      expiredAt: null,
    });
  },
};
