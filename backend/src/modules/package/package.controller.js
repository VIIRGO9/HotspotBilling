// backend/src/modules/package/package.controller.js
import { PackageService } from "./package.service.js";
import { asyncHandler } from "../../shared/utils/async.handler.js";

export const PackageController = {
  create: asyncHandler(async (req, res) => {
    const packageData = req.validatedData.body;
    const newPackage = await PackageService.createPackage(packageData);

    res.status(201).json({
      success: true,
      message: "Internet package created successfully.",
      data: newPackage,
    });
  }),

  getAll: asyncHandler(async (req, res) => {
    // If query param ?active=true is passed, only return active packages
    const isActiveOnly = req.query.active === "true";
    const packages = await PackageService.getAllPackages(isActiveOnly);

    res.status(200).json({
      success: true,
      message: "Packages retrieved successfully.",
      data: packages,
    });
  }),

  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const pkg = await PackageService.getPackageById(id);

    res.status(200).json({
      success: true,
      message: "Package retrieved successfully.",
      data: pkg,
    });
  }),

  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.validatedData.body;
    const updatedPackage = await PackageService.updatePackage(id, updateData);

    res.status(200).json({
      success: true,
      message: "Package updated successfully.",
      data: updatedPackage,
    });
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.validatedData.body;
    const updatedPackage = await PackageService.updatePackageStatus(id, status);

    res.status(200).json({
      success: true,
      message: `Package status updated to ${status} successfully.`,
      data: updatedPackage,
    });
  }),

  delete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    await PackageService.deletePackage(id);

    res.status(200).json({
      success: true,
      message: "Package archived (soft deleted) successfully.",
      data: null,
    });
  }),
};
