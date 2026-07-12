// backend/src/modules/subscription/subscription.controller.js
import { SubscriptionService } from "./subscription.service.js";
import { asyncHandler } from "../../shared/utils/async.handler.js";

export const SubscriptionController = {
  create: asyncHandler(async (req, res) => {
    const sub = await SubscriptionService.createSubscription(
      req.validatedData.body,
    );
    res.status(201).json({
      success: true,
      message: "Subscription created successfully.",
      data: sub,
    });
  }),

  getAll: asyncHandler(async (req, res) => {
    const result = await SubscriptionService.getSubscriptions(
      req.validatedData.query,
    );
    res.status(200).json({
      success: true,
      message: "Subscriptions retrieved successfully.",
      ...result,
    });
  }),

  getById: asyncHandler(async (req, res) => {
    const sub = await SubscriptionService.getSubscriptionById(req.params.id);
    res.status(200).json({
      success: true,
      message: "Subscription retrieved successfully.",
      data: sub,
    });
  }),

  activate: asyncHandler(async (req, res) => {
    const sub = await SubscriptionService.activateSubscription(req.params.id);
    res.status(200).json({
      success: true,
      message: "Subscription activated successfully.",
      data: sub,
    });
  }),

  cancel: asyncHandler(async (req, res) => {
    const sub = await SubscriptionService.cancelSubscription(req.params.id);
    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully.",
      data: sub,
    });
  }),

  renew: asyncHandler(async (req, res) => {
    const sub = await SubscriptionService.renewSubscription(req.params.id);
    res.status(200).json({
      success: true,
      message: "Subscription renewed successfully.",
      data: sub,
    });
  }),
};
