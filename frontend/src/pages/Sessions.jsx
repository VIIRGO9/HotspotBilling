import { useEffect, useState, useCallback, useMemo } from "react";
import { sessionService } from "../services/sessionService";
import toast from "react-hot-toast";

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [filters, setFilters] = useState({
    status: "ACTIVE",
    customerId: "",
    routerId: "",
  });

  // Memoize filters to prevent unnecessary re-renders
  const filtersKey = useMemo(
    () => JSON.stringify(filters),
    [filters.status, filters.customerId, filters.routerId],
  );

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.customerId) params.customerId = filters.customerId;
      if (filters.routerId) params.routerId = filters.routerId;

      const response = await sessionService.getSessions(params);
      setSessions(response.data || []);
    } catch (error) {
      console.error("Failed to load sessions:", error);
      toast.error(error.response?.data?.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  const fetchActiveCount = useCallback(async () => {
    try {
      const count = await sessionService.getActiveSessionsCount();
      setActiveCount(count);
    } catch (error) {
      console.error("Failed to fetch active count:", error);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchActiveCount();

    // Auto-refresh every 30 seconds only when viewing active sessions
    const interval =
      filters.status === "ACTIVE" ? setInterval(fetchSessions, 30000) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchSessions, fetchActiveCount, filters.status]);

  const handleDisconnect = async (id, macAddress) => {
    if (!window.confirm(`Disconnect this session?\nMAC: ${macAddress}`)) return;

    try {
      await sessionService.stopSession(id, {
        terminateCause: "ADMIN_DISCONNECT",
      });
      toast.success("Session disconnected");
      fetchSessions();
      fetchActiveCount();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to disconnect");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: "bg-success-subtle text-success",
      DISCONNECTED: "bg-secondary-subtle text-secondary",
      EXPIRED: "bg-warning-subtle text-warning",
      TERMINATED: "bg-danger-subtle text-danger",
    };
    return badges[status] || "bg-light text-dark";
  };

  const getStatusIcon = (status) => {
    const icons = {
      ACTIVE: "bi-wifi",
      DISCONNECTED: "bi-wifi-off",
      EXPIRED: "bi-clock",
      TERMINATED: "bi-x-circle",
    };
    return icons[status] || "bi-wifi";
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0s";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const stats = useMemo(
    () => ({
      active: sessions.filter((s) => s.status === "ACTIVE").length,
      totalBandwidth: sessions.reduce((acc, s) => acc + (s.totalBytes || 0), 0),
      totalUpload: sessions.reduce((acc, s) => acc + (s.uploadBytes || 0), 0),
      totalDownload: sessions.reduce(
        (acc, s) => acc + (s.downloadBytes || 0),
        0,
      ),
    }),
    [sessions],
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Session Management</h3>
          <p className="text-muted small mb-0">
            Monitor and control active network sessions
          </p>
        </div>
        <div className="badge bg-success fs-6 px-3 py-2">
          <i className="bi bi-wifi me-2"></i>
          {activeCount} Active Sessions
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle bg-success-subtle d-flex align-items-center justify-content-center me-3"
                  style={{ width: "48px", height: "48px" }}
                >
                  <i className="bi bi-wifi text-success fs-5"></i>
                </div>
                <div>
                  <div className="text-muted small">Active Sessions</div>
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
                  className="rounded-circle bg-primary-subtle d-flex align-items-center justify-content-center me-3"
                  style={{ width: "48px", height: "48px" }}
                >
                  <i className="bi bi-arrow-down-up text-primary fs-5"></i>
                </div>
                <div>
                  <div className="text-muted small">Total Bandwidth</div>
                  <div className="fs-5 fw-bold">
                    {formatBytes(stats.totalBandwidth)}
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
                  className="rounded-circle bg-info-subtle d-flex align-items-center justify-content-center me-3"
                  style={{ width: "48px", height: "48px" }}
                >
                  <i className="bi bi-arrow-up text-info fs-5"></i>
                </div>
                <div>
                  <div className="text-muted small">Upload</div>
                  <div className="fs-5 fw-bold">
                    {formatBytes(stats.totalUpload)}
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
                  className="rounded-circle bg-warning-subtle d-flex align-items-center justify-content-center me-3"
                  style={{ width: "48px", height: "48px" }}
                >
                  <i className="bi bi-arrow-down text-warning fs-5"></i>
                </div>
                <div>
                  <div className="text-muted small">Download</div>
                  <div className="fs-5 fw-bold">
                    {formatBytes(stats.totalDownload)}
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
                <option value="ACTIVE">Active Only</option>
                <option value="">All Sessions</option>
                <option value="DISCONNECTED">Disconnected</option>
                <option value="EXPIRED">Expired</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small">Customer ID</label>
              <input
                type="text"
                className="form-control"
                placeholder="Filter by customer ID..."
                value={filters.customerId}
                onChange={(e) =>
                  setFilters({ ...filters, customerId: e.target.value })
                }
              />
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() =>
                  setFilters({ status: "ACTIVE", customerId: "", routerId: "" })
                }
              >
                <i className="bi bi-x-circle me-1"></i>
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Session List */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-5">
              <i
                className="bi bi-wifi-off text-muted"
                style={{ fontSize: "3rem" }}
              ></i>
              <p className="text-muted mt-3 mb-0">No sessions found</p>
              {filters.status === "ACTIVE" && (
                <p className="text-muted small">
                  No users are currently connected
                </p>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="ps-3">User</th>
                    <th>Device</th>
                    <th>Router</th>
                    <th>IP Address</th>
                    <th>Duration</th>
                    <th>Bandwidth</th>
                    <th>Status</th>
                    <th>Login Time</th>
                    <th className="pe-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td className="ps-3">
                        {session.customer ? (
                          <>
                            <div className="fw-medium small">
                              {session.customer.fullName}
                            </div>
                            <div
                              className="text-muted"
                              style={{ fontSize: "0.7rem" }}
                            >
                              {session.customer.customerCode}
                            </div>
                          </>
                        ) : session.voucher ? (
                          <>
                            <div className="fw-medium small">Voucher User</div>
                            <div
                              className="text-muted"
                              style={{ fontSize: "0.7rem" }}
                            >
                              {session.voucher.code}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted">Unknown</span>
                        )}
                      </td>
                      <td>
                        <div className="font-monospace small">
                          {session.macAddress}
                        </div>
                        {session.username &&
                          session.username !== session.macAddress && (
                            <div
                              className="text-muted"
                              style={{ fontSize: "0.7rem" }}
                            >
                              {session.username}
                            </div>
                          )}
                      </td>
                      <td className="small">{session.router?.name || "-"}</td>
                      <td className="font-monospace small">
                        {session.ipAddress || "-"}
                      </td>
                      <td className="small">
                        {formatDuration(session.sessionTime)}
                      </td>
                      <td>
                        <div className="small">
                          <div className="d-flex align-items-center">
                            <i
                              className="bi bi-arrow-down-up text-primary me-1"
                              style={{ fontSize: "0.75rem" }}
                            ></i>
                            <span className="fw-medium">
                              {formatBytes(session.totalBytes)}
                            </span>
                          </div>
                          <div
                            className="text-muted"
                            style={{ fontSize: "0.7rem" }}
                          >
                            ↑ {formatBytes(session.uploadBytes)} / ↓{" "}
                            {formatBytes(session.downloadBytes)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${getStatusBadge(session.status)}`}
                        >
                          <i
                            className={`bi ${getStatusIcon(session.status)} me-1`}
                          ></i>
                          {session.status}
                        </span>
                      </td>
                      <td className="small text-muted">
                        {formatDate(session.loginTime)}
                      </td>
                      <td className="pe-3 text-end">
                        {session.status === "ACTIVE" && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              handleDisconnect(session.id, session.macAddress)
                            }
                            title="Disconnect Session"
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
    </div>
  );
};

export default Sessions;
