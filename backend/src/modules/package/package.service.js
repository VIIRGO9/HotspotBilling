// backend/src/modules/package/package.service.js
import { PackageRepository } from "./package.repository.js";
import { AppError } from "../../shared/middleware/error.handler.js";

export const PackageService = {
  createPackage: async (packageData) => {
    // Business Rule: Ensure package name is unique among active packages
    const existingPackages = await PackageRepository.findAll({
      name: packageData.name,
    });
    if (existingPackages.length > 0) {
      throw new AppError(
        "A package with this name already exists.",
        409,
        "PACKAGE_001",
      );
    }

    return PackageRepository.create(packageData);
  },

  getAllPackages: async (isActiveOnly = false) => {
    const filters = isActiveOnly ? { status: "ACTIVE" } : {};
    return PackageRepository.findAll(filters);
  },

  getPackageById: async (id) => {
    const pkg = await PackageRepository.findById(id);
    if (!pkg) {
      throw new AppError("Package not found.", 404, "PACKAGE_002");
    }
    return pkg;
  },

  updatePackage: async (id, updateData) => {
    const existingPkg = await PackageRepository.findById(id);
    if (!existingPkg) {
      throw new AppError("Package not found.", 404, "PACKAGE_002");
    }

    // Prevent modification of archived packages
    if (existingPkg.status === "ARCHIVED") {
      throw new AppError(
        "Cannot modify an archived package.",
        400,
        "PACKAGE_003",
      );
    }

    return PackageRepository.update(id, updateData);
  },

  updatePackageStatus: async (id, status) => {
    const existingPkg = await PackageRepository.findById(id);
    if (!existingPkg) {
      throw new AppError("Package not found.", 404, "PACKAGE_002");
    }

    const isActive = status === "ACTIVE";
    return PackageRepository.update(id, { status, isActive });
  },

  deletePackage: async (id) => {
    const existingPkg = await PackageRepository.findById(id);
    if (!existingPkg) {
      throw new AppError("Package not found.", 404, "PACKAGE_002");
    }

    // Soft delete implementation
    await PackageRepository.softDelete(id);
  },
};
