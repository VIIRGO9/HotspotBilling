import { useEffect, useState, useCallback } from "react";
import { routerService } from "../services/routerService";
import RouterFormModal from "../components/RouterFormModal";
import toast from "react-hot-toast";

const Routers = () => {
  const [routers, setRouters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRouter, setEditingRouter] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    q: "",
  });

  const fetchRouters = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.q) params.q = filters.q;

      const response = await routerService.getRouters(params);
      setRouters(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load routers");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRouters();
  }, [fetchRouters]);

  const handleCreate = async (routerData) => {
    try {
      setSubmitting(true);
      await routerService.createRouter(routerData);
      toast.success("Router added successfully");
      setShowModal(false);
      fetchRouters();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add router");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (routerData) => {
    try {
      setSubmitting(true);
      await routerService.updateRouter(editingRouter.id, routerData);
      toast.success("Router updated successfully");
      setShowModal(false);
      setEditingRouter(null);
      fetchRouters();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update router");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await routerService.updateRouterStatus(id, newStatus);
      toast.success(`Router status updated to ${newStatus}`);
      fetchRouters();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to archive "${name}"? This will remove the router from the system.`,
      )
    ) {
      return;
    }

    try {
      await routerService.deleteRouter(id);
      toast.success("Router archived successfully");
      fetchRouters();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to archive router");
    }
  };

  const openEditModal = (router) => {
    setEditingRouter(router);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingRouter(null);
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      ONLINE: "bg-success-subtle text-success",
      OFFLINE: "bg-danger-subtle text-danger",
      MAINTENANCE: "bg-warning-subtle text-warning",
    };
    return badges[status] || "bg-light text-dark";
  };

  const getStatusIcon = (status) => {
    const icons = {
      ONLINE: "bi-wifi",
      OFFLINE: "bi-wifi-off",
      MAINTENANCE: "bi-tools",
    };
    return icons[status] || "bi-router";
  };

  const getTypeBadge = (type) => {
    const badges = {
      MIKROTIK: "bg-primary-subtle text-primary",
      OPENWRT: "bg-info-subtle text-info",
      OTHER: "bg-secondary-subtle text-secondary",
    };
    return badges[type] || "bg-light text-dark";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStats = () => {
    return {
      total: routers.length,
      online: routers.filter((r) => r.status === "ONLINE").length,
      offline: routers.filter((r) => r.status === "OFFLINE").length,
      maintenance: routers.filter((r) => r.status === "MAINTENANCE").length,
    };
  };

  const stats = getStats();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Router Management</h3>
          <p className="text-muted small mb-0">
            Register and monitor network routers
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <i className="bi bi-router me-2"></i>
          Add Router
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
                  <i className="bi bi-router text-primary fs-5"></i>
                </div>
                <div>
                  <div className="text-muted small">Total Routers</div>
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
                  <i className="bi bi-wifi text-success fs-5"></i>
                </div>
                <div>
                  <div className="text-muted small">Online</div>
                  <div className="fs-4 fw-bold text-success">
                    {stats.online}
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
                  className="rounded-circle bg-danger-subtle d-flex align-items-center justify-content-center me-3"
                  style={{ width: "48px", height: "48px" }}
                >
                  <i className="bi bi-wifi-off text-danger fs-5"></i>
                </div>
                <div>
                  <div className="text-muted small">Offline</div>
                  <div className="fs-4 fw-bold text-danger">
                    {stats.offline}
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
                  <i className="bi bi-tools text-warning fs-5"></i>
                </div>
                <div>
                  <div className="text-muted small">Maintenance</div>
                  <div className="fs-4 fw-bold text-warning">
                    {stats.maintenance}
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
              <label className="form-label small">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Name, IP, or location..."
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small">Status</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="">All Statuses</option>
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">Offline</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small">Type</label>
              <select
                className="form-select"
                value={filters.type}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value })
                }
              >
                <option value="">All Types</option>
                <option value="MIKROTIK">MikroTik</option>
                <option value="OPENWRT">OpenWrt</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => setFilters({ status: "", type: "", q: "" })}
              >
                <i className="bi bi-x-circle me-1"></i>
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Router List */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : routers.length === 0 ? (
            <div className="text-center py-5">
              <i
                className="bi bi-router text-muted"
                style={{ fontSize: "3rem" }}
              ></i>
              <p className="text-muted mt-3 mb-0">No routers found</p>
              <button
                className="btn btn-primary btn-sm mt-3"
                onClick={openCreateModal}
              >
                Add Your First Router
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="ps-3">Router</th>
                    <th>Type</th>
                    <th>IP:Port</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Last Seen</th>
                    <th>Sessions</th>
                    <th className="pe-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {routers.map((router) => (
                    <tr key={router.id}>
                      <td className="ps-3">
                        <div className="d-flex align-items-center">
                          {router.isDefault && (
                            <span
                              className="badge bg-warning text-dark me-2"
                              title="Default Router"
                            >
                              <i className="bi bi-star-fill"></i>
                            </span>
                          )}
                          <div>
                            <div className="fw-medium">{router.name}</div>
                            {router.modelName && (
                              <div className="text-muted small">
                                {router.modelName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getTypeBadge(router.type)}`}>
                          {router.type}
                        </span>
                      </td>
                      <td className="font-monospace small">
                        {router.ipAddress}:{router.apiPort}
                      </td>
                      <td className="small">{router.location || "-"}</td>
                      <td>
                        <span
                          className={`badge ${getStatusBadge(router.status)}`}
                        >
                          <i
                            className={`bi ${getStatusIcon(router.status)} me-1`}
                          ></i>
                          {router.status}
                        </span>
                      </td>
                      <td className="small text-muted">
                        {formatDate(router.lastSeen)}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          <i className="bi bi-people me-1"></i>
                          {router._count?.sessions || 0}
                        </span>
                      </td>
                      <td className="pe-3 text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => openEditModal(router)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          {router.status === "OFFLINE" && (
                            <button
                              className="btn btn-outline-success"
                              onClick={() =>
                                handleStatusChange(router.id, "ONLINE")
                              }
                              title="Mark Online"
                            >
                              <i className="bi bi-play-circle"></i>
                            </button>
                          )}
                          {router.status === "ONLINE" && (
                            <>
                              <button
                                className="btn btn-outline-warning"
                                onClick={() =>
                                  handleStatusChange(router.id, "MAINTENANCE")
                                }
                                title="Maintenance"
                              >
                                <i className="bi bi-tools"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() =>
                                  handleStatusChange(router.id, "OFFLINE")
                                }
                                title="Mark Offline"
                              >
                                <i className="bi bi-stop-circle"></i>
                              </button>
                            </>
                          )}
                          {router.status === "MAINTENANCE" && (
                            <button
                              className="btn btn-outline-success"
                              onClick={() =>
                                handleStatusChange(router.id, "ONLINE")
                              }
                              title="Bring Online"
                            >
                              <i className="bi bi-play-circle"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDelete(router.id, router.name)}
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

      <RouterFormModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setEditingRouter(null);
        }}
        onSubmit={editingRouter ? handleUpdate : handleCreate}
        initialData={editingRouter}
        loading={submitting}
      />
    </div>
  );
};

export default Routers;
