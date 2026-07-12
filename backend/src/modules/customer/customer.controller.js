// backend/src/modules/customer/customer.controller.js
import { CustomerService } from "./customer.service.js";
import { asyncHandler } from "../../shared/utils/async.handler.js";

export const CustomerController = {
  create: asyncHandler(async (req, res) => {
    const customer = await CustomerService.createCustomer(
      req.validatedData.body,
    );
    res.status(201).json({
      success: true,
      message: "Customer created successfully.",
      data: customer,
    });
  }),

  getAll: asyncHandler(async (req, res) => {
    const result = await CustomerService.searchCustomers(
      req.validatedData.query,
    );
    res.status(200).json({
      success: true,
      message: "Customers retrieved successfully.",
      ...result,
    });
  }),

  getById: asyncHandler(async (req, res) => {
    const customer = await CustomerService.getCustomerById(req.params.id);
    res.status(200).json({
      success: true,
      message: "Customer retrieved successfully.",
      data: customer,
    });
  }),

  update: asyncHandler(async (req, res) => {
    const customer = await CustomerService.updateCustomer(
      req.params.id,
      req.validatedData.body,
    );
    res.status(200).json({
      success: true,
      message: "Customer updated successfully.",
      data: customer,
    });
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const { status } = req.validatedData.body;
    const customer = await CustomerService.updateStatus(req.params.id, status);
    res.status(200).json({
      success: true,
      message: `Customer status updated to ${status}.`,
      data: customer,
    });
  }),

  delete: asyncHandler(async (req, res) => {
    await CustomerService.deleteCustomer(req.params.id);
    res.status(200).json({
      success: true,
      message: "Customer archived successfully.",
      data: null,
    });
  }),
};
