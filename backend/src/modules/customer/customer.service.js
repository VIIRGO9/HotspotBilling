// backend/src/modules/customer/customer.service.js
import crypto from "crypto";
import { CustomerRepository } from "./customer.repository.js";
import { AppError } from "../../shared/middleware/error.handler.js";

const generateCustomerCode = () => {
  const timestamp = Date.now().toString().slice(-6);
  const randomStr = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `CUST-${timestamp}-${randomStr}`;
};

export const CustomerService = {
  createCustomer: async (data) => {
    // Ensure unique constraints for email and phone if provided
    if (data.email) {
      const existingEmail = await CustomerRepository.findMany(
        { email: data.email, deletedAt: null },
        0,
        1,
      );
      if (existingEmail.total > 0)
        throw new AppError(
          "Email already associated with a customer.",
          409,
          "CUSTOMER_001",
        );
    }

    if (data.phone) {
      const existingPhone = await CustomerRepository.findMany(
        { phone: data.phone, deletedAt: null },
        0,
        1,
      );
      if (existingPhone.total > 0)
        throw new AppError(
          "Phone number already associated with a customer.",
          409,
          "CUSTOMER_002",
        );
    }

    const customerCode = generateCustomerCode();

    return CustomerRepository.create({
      ...data,
      customerCode,
      status: "ACTIVE",
    });
  },

  getCustomerById: async (id) => {
    const customer = await CustomerRepository.findById(id);
    if (!customer)
      throw new AppError("Customer not found.", 404, "CUSTOMER_003");
    return customer;
  },

  searchCustomers: async (query) => {
    const { page, limit, q, status, customerType } = query;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(status && { status }),
      ...(customerType && { customerType }),
      ...(q && {
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { customerCode: { contains: q, mode: "insensitive" } },
        ],
      }),
    };

    const { data, total } = await CustomerRepository.findMany(
      where,
      skip,
      limit,
    );

    // Standardized pagination response (SDD Section 8.11)
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  updateCustomer: async (id, data) => {
    const existing = await CustomerRepository.findById(id);
    if (!existing)
      throw new AppError("Customer not found.", 404, "CUSTOMER_003");
    if (existing.status === "ARCHIVED")
      throw new AppError(
        "Cannot modify an archived customer.",
        400,
        "CUSTOMER_004",
      );

    return CustomerRepository.update(id, data);
  },

  updateStatus: async (id, status) => {
    const existing = await CustomerRepository.findById(id);
    if (!existing)
      throw new AppError("Customer not found.", 404, "CUSTOMER_003");

    return CustomerRepository.update(id, { status });
  },

  deleteCustomer: async (id) => {
    const existing = await CustomerRepository.findById(id);
    if (!existing)
      throw new AppError("Customer not found.", 404, "CUSTOMER_003");

    await CustomerRepository.softDelete(id);
  },
};
