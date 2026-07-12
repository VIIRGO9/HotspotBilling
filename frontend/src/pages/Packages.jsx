import { useEffect, useState, useCallback } from "react";
import { packageService } from "../services/packageService";
import PackageFormModal from "../components/PackageFormModal";
import toast from "react-hot-toast";

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    active: "",
  });

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.active) params.active = filters.active;

      const response = await packageService.getPackages(params);
      setPackages(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load packages");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleCreate = async (packageData) => {
    try {
      setSubmitting(true);
      await packageService.createPackage(packageData);
      toast.success("Package created successfully");
      setShowModal(false);
      fetchPackages();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create package");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (packageData) => {
    try {
      setSubmitting(true);
      await packageService.updatePackage(editingPackage.id, packageData);
      toast.success("Package updated successfully");
      setShowModal(false);
      setEditingPackage(null);
      fetchPackages();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update package");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await packageService.updatePackageStatus(id, newStatus);
      toast.success(`Package status updated to ${newStatus}`);
      fetchPackages();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to archive "${name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await packageService.deletePackage(id);
      toast.success("Package archived successfully");
      fetchPackages();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to archive package");
    }
  };

  const openEditModal = (pkg) => {
    setEditingPackage(pkg);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingPackage(null);
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: "bg-success-subtle text-success",
      DISABLED: "bg-warning-subtle text-warning",
      ARCHIVED: "bg-secondary-subtle text-secondary",
    };
    return badges[status] || "bg-light text-dark";
  };

  const getTypeBadge = (type) => {
    const badges = {
      TIME: "bg-info-subtle text-info",
      DATA: "bg-primary-subtle text-primary",
      HYBRID: "bg-purple-subtle text-purple",
      UNLIMITED: "bg-success-subtle text-success",
    };
    return badges[type] || "bg-light text-dark";
  };

  const formatCurrency = (amount) => {
    return `TZS ${Number(amount).toLocaleString("en-US")}`;
  };

  const formatDuration = (duration, unit) => {
    const units = {
      MINUTE: "min",
      HOUR: "hr",
      DAY: "day",
      WEEK: "week",
      MONTH: "month",
    };
    return `${duration} ${units[unit] || unit}${duration > 1 ? "s" : ""}`;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Package Management</h3>
          <p className="text-muted small mb-0">
            Create and manage internet access packages
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <i className="bi bi-plus-circle me-2"></i>
          Create Package
        </button>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label small">Filter by Status</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DISABLED">Disabled</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small">Show Only</label>
              <select
                className="form-select"
                value={filters.active}
                onChange={(e) =>
                  setFilters({ ...filters, active: e.target.value })
                }
              >
                <option value="">All Packages</option>
                <option value="true">Active Only</option>
              </select>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => setFilters({ status: "", active: "" })}
              >
                <i className="bi bi-x-circle me-2"></i>
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-5">
              <i
                className="bi bi-box text-muted"
                style={{ fontSize: "3rem" }}
              ></i>
              <p className="text-muted mt-3 mb-0">No packages found</p>
              <button
                className="btn btn-primary btn-sm mt-3"
                onClick={openCreateModal}
              >
                Create Your First Package
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="ps-3">Package Name</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Duration</th>
                    <th>Speed</th>
                    <th>Devices</th>
                    <th>Status</th>
                    <th className="pe-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => (
                    <tr key={pkg.id}>
                      <td className="ps-3">
                        <div className="fw-medium">{pkg.name}</div>
                        {pkg.description && (
                          <div className="text-muted small">
                            {pkg.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${getTypeBadge(pkg.type)}`}>
                          {pkg.type}
                        </span>
                      </td>
                      <td className="fw-medium">{formatCurrency(pkg.price)}</td>
                      <td className="small">
                        {formatDuration(pkg.duration, pkg.validityUnit)}
                      </td>
                      <td className="small">
                        {pkg.downloadSpeedMbps ? (
                          <>
                            <i className="bi bi-arrow-down text-success"></i>{" "}
                            {pkg.downloadSpeedMbps} Mbps
                            {pkg.uploadSpeedMbps && (
                              <>
                                <br />
                                <i className="bi bi-arrow-up text-primary"></i>{" "}
                                {pkg.uploadSpeedMbps} Mbps
                              </>
                            )}
                          </>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          <i className="bi bi-device-hdd me-1"></i>
                          {pkg.deviceLimit}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(pkg.status)}`}>
                          {pkg.status}
                        </span>
                      </td>
                      <td className="pe-3 text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => openEditModal(pkg)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          {pkg.status === "ACTIVE" ? (
                            <button
                              className="btn btn-outline-warning"
                              onClick={() =>
                                handleStatusChange(pkg.id, "DISABLED")
                              }
                              title="Disable"
                            >
                              <i className="bi bi-pause-circle"></i>
                            </button>
                          ) : pkg.status === "DISABLED" ? (
                            <button
                              className="btn btn-outline-success"
                              onClick={() =>
                                handleStatusChange(pkg.id, "ACTIVE")
                              }
                              title="Enable"
                            >
                              <i className="bi bi-play-circle"></i>
                            </button>
                          ) : null}
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDelete(pkg.id, pkg.name)}
                            title="Archive"
                          >
                            <i className="bi bi-archive"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <PackageFormModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setEditingPackage(null);
        }}
        onSubmit={editingPackage ? handleUpdate : handleCreate}
        initialData={editingPackage}
        loading={submitting}
      />
    </div>
  );
};

export default Packages;
