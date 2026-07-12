import { useEffect, useState, useCallback } from "react";
import { voucherService } from "../services/voucherService";
import VoucherGenerateModal from "../components/VoucherGenerateModal";
import VoucherDisplayModal from "../components/VoucherDisplayModal";
import toast from "react-hot-toast";

const Vouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDisplayModal, setShowDisplayModal] = useState(false);
  const [generatedVouchers, setGeneratedVouchers] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    packageId: "",
    batchNumber: "",
  });

  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.packageId) params.packageId = filters.packageId;
      if (filters.batchNumber) params.batchNumber = filters.batchNumber;

      const response = await voucherService.getVouchers(params);
      setVouchers(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const handleGenerate = async (data) => {
    try {
      setGenerating(true);
      const result = await voucherService.generateVouchers(data);
      toast.success(`${result.quantity} vouchers generated successfully`);
      setShowGenerateModal(false);
      setGeneratedVouchers(result.vouchers);
      setShowDisplayModal(true);
      fetchVouchers();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to generate vouchers",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleCancel = async (id, code) => {
    if (
      !window.confirm(
        `Are you sure you want to cancel voucher "${code}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await voucherService.cancelVoucher(id);
      toast.success("Voucher cancelled successfully");
      fetchVouchers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel voucher");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      GENERATED: "bg-primary-subtle text-primary",
      ACTIVE: "bg-success-subtle text-success",
      USED: "bg-secondary-subtle text-secondary",
      EXPIRED: "bg-warning-subtle text-warning",
      CANCELLED: "bg-danger-subtle text-danger",
    };
    return badges[status] || "bg-light text-dark";
  };

  const getStatusIcon = (status) => {
    const icons = {
      GENERATED: "bi-ticket",
      ACTIVE: "bi-check-circle",
      USED: "bi-check2-all",
      EXPIRED: "bi-clock",
      CANCELLED: "bi-x-circle",
    };
    return icons[status] || "bi-ticket";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStats = () => {
    const stats = {
      total: vouchers.length,
      active: vouchers.filter(
        (v) => v.status === "ACTIVE" || v.status === "GENERATED",
      ).length,
      used: vouchers.filter((v) => v.status === "USED").length,
      expired: vouchers.filter((v) => v.status === "EXPIRED").length,
    };
    return stats;
  };

  const stats = getStats();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Voucher Management</h3>
          <p className="text-muted small mb-0">
            Generate and manage prepaid access vouchers
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowGenerateModal(true)}
        >
          <i className="bi bi-magic me-2"></i>
          Generate Vouchers
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle bg-primary-subtle d-flex align-items-center justify-content-center me-3"
                  style={{ width: "48px", height: "48px" }}
                >
                  <i className="bi bi-ticket-perforated text-primary fs-5"></i>
                </div>
                <div>
                  <div className="text-muted small">Total Vouchers</div>
                  <div className="fs-4 fw-bold">{stats.total}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle bg-success-subtle d-flex align-items-center justify-content-center me-3"
                  style={{ width: "48px", height: "48px" }}
                >
                  <i className="bi bi-check-circle text-success fs-5"></i>
                </div>
                <div>
                  <div className="text-muted small">Available</div>
                  <div className="fs-4 fw-bold text-success">
                    {stats.active}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle bg-secondary-subtle d-flex align-items-center justify-content-center me-3"
                  style={{ width: "48px", height: "48px" }}
                >
                  <i className="bi bi-check2-all text-secondary fs-5"></i>
                </div>
                <div>
                  <div className="text-muted small">Used</div>
                  <div className="fs-4 fw-bold">{stats.used}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle bg-warning-subtle d-flex align-items-center justify-content-center me-3"
                  style={{ width: "48px", height: "48px" }}
                >
                  <i className="bi bi-clock text-warning fs-5"></i>
                </div>
                <div>
                  <div className="text-muted small">Expired</div>
                  <div className="fs-4 fw-bold text-warning">
                    {stats.expired}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label small">Status</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="">All Statuses</option>
                <option value="GENERATED">Generated</option>
                <option value="ACTIVE">Active</option>
                <option value="USED">Used</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small">Batch Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="Filter by batch..."
                value={filters.batchNumber}
                onChange={(e) =>
                  setFilters({ ...filters, batchNumber: e.target.value })
                }
              />
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() =>
                  setFilters({ status: "", packageId: "", batchNumber: "" })
                }
              >
                <i className="bi bi-x-circle me-2"></i>
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Voucher List */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-5">
              <i
                className="bi bi-ticket-perforated text-muted"
                style={{ fontSize: "3rem" }}
              ></i>
              <p className="text-muted mt-3 mb-0">No vouchers found</p>
              <button
                className="btn btn-primary btn-sm mt-3"
                onClick={() => setShowGenerateModal(true)}
              >
                Generate Your First Vouchers
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="ps-3">Voucher Code</th>
                    <th>Package</th>
                    <th>Status</th>
                    <th>Batch</th>
                    <th>Expires</th>
                    <th>Used</th>
                    <th className="pe-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((voucher) => (
                    <tr key={voucher.id}>
                      <td className="ps-3">
                        <code className="fs-6 text-primary fw-bold">
                          {voucher.code}
                        </code>
                      </td>
                      <td>
                        <div className="small fw-medium">
                          {voucher.package.name}
                        </div>
                        <div
                          className="text-muted"
                          style={{ fontSize: "0.75rem" }}
                        >
                          {voucher.package.type}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${getStatusBadge(voucher.status)}`}
                        >
                          <i
                            className={`bi ${getStatusIcon(voucher.status)} me-1`}
                          ></i>
                          {voucher.status}
                        </span>
                      </td>
                      <td className="small text-muted">
                        {voucher.batchNumber || "-"}
                      </td>
                      <td className="small">{formatDate(voucher.expiresAt)}</td>
                      <td className="small text-muted">
                        {voucher.usedAt ? formatDate(voucher.usedAt) : "-"}
                      </td>
                      <td className="pe-3 text-end">
                        {(voucher.status === "GENERATED" ||
                          voucher.status === "ACTIVE") && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              handleCancel(voucher.id, voucher.code)
                            }
                            title="Cancel Voucher"
                          >
                            <i className="bi bi-x-circle"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <VoucherGenerateModal
        show={showGenerateModal}
        onHide={() => setShowGenerateModal(false)}
        onSubmit={handleGenerate}
        loading={generating}
      />

      {generatedVouchers && (
        <VoucherDisplayModal
          show={showDisplayModal}
          onHide={() => {
            setShowDisplayModal(false);
            setGeneratedVouchers(null);
          }}
          vouchers={generatedVouchers}
          batchNumber={generatedVouchers[0]?.batchNumber}
        />
      )}
    </div>
  );
};

export default Vouchers;
