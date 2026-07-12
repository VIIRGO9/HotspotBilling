import { useEffect, useState, useCallback } from "react";
import { paymentService } from "../services/paymentService";
import RecordPaymentModal from "../components/RecordPaymentModal";
import toast from "react-hot-toast";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recording, setRecording] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: "",
    provider: "",
  });

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: pagination.limit };
      if (filters.status) params.status = filters.status;
      if (filters.provider) params.provider = filters.provider;

      const res = await paymentService.getPayments(params);
      setPayments(res.data || []);
      setPagination((prev) => ({ ...prev, total: res.pagination?.total || 0 }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleRecord = async (data) => {
    try {
      setRecording(true);
      await paymentService.recordPayment(data);
      toast.success("Payment recorded successfully");
      setShowRecordModal(false);
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to record payment");
    } finally {
      setRecording(false);
    }
  };

  const handleVerify = async (id) => {
    if (!confirm("Confirm payment as verified and SUCCESS?")) return;
    try {
      await paymentService.verifyPayment(id, { status: "SUCCESS" });
      toast.success("Payment verified");
      fetchPayments();
    } catch (error) {
      toast.error("Verification failed");
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      SUCCESS: "bg-success-subtle text-success",
      PENDING: "bg-warning-subtle text-warning",
      FAILED: "bg-danger-subtle text-danger",
      REFUNDED: "bg-info-subtle text-info",
    };
    return map[status] || "bg-light text-dark";
  };

  const formatCurrency = (amt) => `TZS ${Number(amt).toLocaleString()}`;

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Payment Management</h3>
          <p className="text-muted small mb-0">
            Record transactions and track revenue
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowRecordModal(true)}
        >
          <i className="bi bi-plus-circle me-2"></i>Record Payment
        </button>
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
                <option value="SUCCESS">Success</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small">Payment Method</label>
              <select
                className="form-select"
                value={filters.provider}
                onChange={(e) =>
                  setFilters({ ...filters, provider: e.target.value })
                }
              >
                <option value="">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="MPESA">M-Pesa</option>
                <option value="AIRTEL_MONEY">Airtel Money</option>
                <option value="TIGOPESA">Tigo Pesa</option>
                <option value="HALOPESA">HaloPesa</option>
                <option value="BANK">Bank Transfer</option>
              </select>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => setFilters({ status: "", provider: "" })}
              >
                <i className="bi bi-x-circle me-1"></i>Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-5">
              <i
                className="bi bi-receipt text-muted"
                style={{ fontSize: "3rem" }}
              ></i>
              <p className="text-muted mt-3">No transactions found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="ps-3">Receipt</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Status</th>
                    <th className="pe-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="ps-3 fw-medium small">
                        {p.receiptNumber}
                      </td>
                      <td className="small text-muted">
                        {formatDate(p.paidAt || p.createdAt)}
                      </td>
                      <td className="small">
                        <div>{p.customer?.fullName || "Unknown"}</div>
                        <div
                          className="text-muted"
                          style={{ fontSize: "0.7rem" }}
                        >
                          {p.customer?.customerCode}
                        </div>
                      </td>
                      <td className="fw-bold small">
                        {formatCurrency(p.amount)}
                      </td>
                      <td>
                        <span
                          className={`badge bg-light text-dark border ${p.provider === "CASH" ? "text-success" : "text-primary"}`}
                        >
                          {p.provider}
                        </span>
                      </td>
                      <td className="small text-muted font-monospace">
                        {p.paymentReference || "-"}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="pe-3 text-end">
                        {p.status === "PENDING" && (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleVerify(p.id)}
                            title="Verify Payment"
                          >
                            <i className="bi bi-check-lg"></i>
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
        {pagination.total > 0 && (
          <div className="card-footer bg-white border-top d-flex justify-content-center">
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li
                  className={`page-item ${pagination.page === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                  >
                    Previous
                  </button>
                </li>
                <li className="page-item active">
                  <span className="page-link">{pagination.page}</span>
                </li>
                <li
                  className={`page-item ${pagination.page * pagination.limit >= pagination.total ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      <RecordPaymentModal
        show={showRecordModal}
        onHide={() => setShowRecordModal(false)}
        onSubmit={handleRecord}
        loading={recording}
      />
    </div>
  );
};

export default Payments;
