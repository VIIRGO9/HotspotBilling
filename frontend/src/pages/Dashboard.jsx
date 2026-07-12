import { useEffect, useState, useCallback } from "react";
import { dashboardService } from "../services/dashboardService";
import StatCard from "../components/StatCard";

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "TZS 0";
  return `TZS ${Number(amount).toLocaleString("en-US")}`;
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hr ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);
      const data = await dashboardService.getDashboardMetrics();
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  if (loading && !metrics) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="card border-danger" style={{ maxWidth: "400px" }}>
          <div className="card-body text-center">
            <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
            <h5 className="card-title">Unable to Load Dashboard</h5>
            <p className="text-muted small">{error}</p>
            <button className="btn btn-primary btn-sm" onClick={fetchMetrics}>
              <i className="bi bi-arrow-clockwise me-1"></i> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const routerStats = metrics?.routerStatusSummary || {};

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Dashboard</h3>
          <p className="text-muted small mb-0">
            Welcome back, here's what's happening today.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {lastUpdated && (
            <span className="text-muted small d-none d-md-inline">
              Updated {formatTime(lastUpdated)}
            </span>
          )}
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={fetchMetrics}
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise ${loading ? "spin" : ""}`}></i>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="row">
        <StatCard
          icon="bi-people-fill"
          label="Total Customers"
          value={metrics?.totalCustomers?.toLocaleString() || 0}
          color="primary"
        />
        <StatCard
          icon="bi-check-circle-fill"
          label="Active Subscriptions"
          value={metrics?.activeSubscriptions?.toLocaleString() || 0}
          color="success"
        />
        <StatCard
          icon="bi-wifi"
          label="Active Sessions"
          value={metrics?.activeSessions?.toLocaleString() || 0}
          color="info"
        />
        <StatCard
          icon="bi-cash-stack"
          label="Today's Revenue"
          value={formatCurrency(metrics?.todayRevenue)}
          color="warning"
        />
      </div>

      {/* Second Row */}
      <div className="row">
        <div className="col-lg-8 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 pt-3">
              <h5 className="card-title mb-0">Recent Transactions</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3">Receipt</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Provider</th>
                      <th>Status</th>
                      <th className="pe-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics?.recentTransactions?.length > 0 ? (
                      metrics.recentTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="ps-3 fw-medium small">
                            {tx.receiptNumber}
                          </td>
                          <td className="small">
                            {tx.customer?.fullName || "Unknown"}
                            <div
                              className="text-muted"
                              style={{ fontSize: "0.75rem" }}
                            >
                              {tx.customer?.customerCode}
                            </div>
                          </td>
                          <td className="fw-medium small">
                            {formatCurrency(tx.amount)}
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border small">
                              {tx.provider}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                tx.status === "SUCCESS"
                                  ? "bg-success-subtle text-success"
                                  : tx.status === "PENDING"
                                    ? "bg-warning-subtle text-warning"
                                    : "bg-danger-subtle text-danger"
                              } small`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="pe-3 text-muted small">
                            {formatTime(tx.createdAt)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center text-muted py-4">
                          No transactions yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Router Status */}
        <div className="col-lg-4 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pt-3">
              <h5 className="card-title mb-0">Router Status</h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <span
                    className="rounded-circle me-2"
                    style={{
                      width: "10px",
                      height: "10px",
                      backgroundColor: "#198754",
                      display: "inline-block",
                    }}
                  ></span>
                  <span className="small">Online</span>
                </div>
                <span className="fw-bold">{routerStats.ONLINE || 0}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <span
                    className="rounded-circle me-2"
                    style={{
                      width: "10px",
                      height: "10px",
                      backgroundColor: "#dc3545",
                      display: "inline-block",
                    }}
                  ></span>
                  <span className="small">Offline</span>
                </div>
                <span className="fw-bold">{routerStats.OFFLINE || 0}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <span
                    className="rounded-circle me-2"
                    style={{
                      width: "10px",
                      height: "10px",
                      backgroundColor: "#ffc107",
                      display: "inline-block",
                    }}
                  ></span>
                  <span className="small">Maintenance</span>
                </div>
                <span className="fw-bold">{routerStats.MAINTENANCE || 0}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted small">Total Routers</span>
                <span className="fw-bold">
                  {(routerStats.ONLINE || 0) +
                    (routerStats.OFFLINE || 0) +
                    (routerStats.MAINTENANCE || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "var(--bs-success-bg-subtle)",
                    color: "var(--bs-success)",
                  }}
                >
                  <i className="bi bi-wallet2 fs-5"></i>
                </div>
                <div>
                  <div className="text-muted small text-uppercase fw-medium">
                    Total Revenue (All Time)
                  </div>
                  <div className="fs-4 fw-bold text-success">
                    {formatCurrency(metrics?.totalRevenue)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
