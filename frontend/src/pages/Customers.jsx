import { useEffect, useState, useCallback } from "react";
import { customerService } from "../services/customerService";
import CustomerFormModal from "../components/CustomerFormModal";
import toast from "react-hot-toast";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    customerType: "",
  });

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.q) params.q = filters.q;
      if (filters.status) params.status = filters.status;
      if (filters.customerType) params.customerType = filters.customerType;

      const response = await customerService.getCustomers(params);
      setCustomers(response.data || []);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCreate = async (customerData) => {
    try {
      setSubmitting(true);
      await customerService.createCustomer(customerData);
      toast.success("Customer added successfully");
      setShowModal(false);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add customer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (customerData) => {
    try {
      setSubmitting(true);
      await customerService.updateCustomer(editingCustomer.id, customerData);
      toast.success("Customer updated successfully");
      setShowModal(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update customer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await customerService.updateCustomerStatus(id, newStatus);
      toast.success(`Customer status updated to ${newStatus}`);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `Are you sure you want to archive "${name}"? This will remove all their data.`,
      )
    ) {
      return;
    }

    try {
      await customerService.deleteCustomer(id);
      toast.success("Customer archived successfully");
      fetchCustomers();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to archive customer",
      );
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchCustomers();
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: "bg-success-subtle text-success",
      INACTIVE: "bg-secondary-subtle text-secondary",
      SUSPENDED: "bg-warning-subtle text-warning",
      ARCHIVED: "bg-danger-subtle text-danger",
    };
    return badges[status] || "bg-light text-dark";
  };

  const getTypeBadge = (type) => {
    return type === "REGISTERED"
      ? "bg-primary-subtle text-primary"
      : "bg-info-subtle text-info";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Customer Management</h3>
          <p className="text-muted small mb-0">
            Manage customer accounts and profiles
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <i className="bi bi-person-plus me-2"></i>
          Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label small">Search</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Name, email, phone, or code..."
                    value={filters.q}
                    onChange={(e) =>
                      setFilters({ ...filters, q: e.target.value })
                    }
                  />
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-search"></i>
                  </button>
                </div>
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
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small">Customer Type</label>
                <select
                  className="form-select"
                  value={filters.customerType}
                  onChange={(e) =>
                    setFilters({ ...filters, customerType: e.target.value })
                  }
                >
                  <option value="">All Types</option>
                  <option value="REGISTERED">Registered</option>
                  <option value="VOUCHER">Voucher</option>
                </select>
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100"
                  onClick={() => {
                    setFilters({ q: "", status: "", customerType: "" });
                    setPagination({ ...pagination, page: 1 });
                  }}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Clear
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Customer List */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-5">
              <i
                className="bi bi-people text-muted"
                style={{ fontSize: "3rem" }}
              ></i>
              <p className="text-muted mt-3 mb-0">No customers found</p>
              <button
                className="btn btn-primary btn-sm mt-3"
                onClick={openCreateModal}
              >
                Add Your First Customer
              </button>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3">Customer</th>
                      <th>Contact</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th className="pe-3 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id}>
                        <td className="ps-3">
                          <div className="fw-medium">{customer.fullName}</div>
                          <div className="text-muted small">
                            {customer.customerCode}
                          </div>
                        </td>
                        <td>
                          {customer.email && (
                            <div className="small">
                              <i className="bi bi-envelope me-1"></i>
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="small">
                              <i className="bi bi-telephone me-1"></i>
                              {customer.phone}
                            </div>
                          )}
                          {!customer.email && !customer.phone && (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge ${getTypeBadge(customer.customerType)}`}
                          >
                            {customer.customerType}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${getStatusBadge(customer.status)}`}
                          >
                            {customer.status}
                          </span>
                        </td>
                        <td className="small text-muted">
                          {formatDate(customer.createdAt)}
                        </td>
                        <td className="pe-3 text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => openEditModal(customer)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            {customer.status === "ACTIVE" ? (
                              <button
                                className="btn btn-outline-warning"
                                onClick={() =>
                                  handleStatusChange(customer.id, "SUSPENDED")
                                }
                                title="Suspend"
                              >
                                <i className="bi bi-pause-circle"></i>
                              </button>
                            ) : customer.status === "SUSPENDED" ? (
                              <button
                                className="btn btn-outline-success"
                                onClick={() =>
                                  handleStatusChange(customer.id, "ACTIVE")
                                }
                                title="Activate"
                              >
                                <i className="bi bi-play-circle"></i>
                              </button>
                            ) : null}
                            <button
                              className="btn btn-outline-danger"
                              onClick={() =>
                                handleDelete(customer.id, customer.fullName)
                              }
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

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="card-footer bg-white border-top">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-muted small">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total,
                      )}{" "}
                      of {pagination.total} customers
                    </div>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li
                          className={`page-item ${pagination.page === 1 ? "disabled" : ""}`}
                        >
                          <button
                            className="page-link"
                            onClick={() =>
                              setPagination({
                                ...pagination,
                                page: pagination.page - 1,
                              })
                            }
                          >
                            Previous
                          </button>
                        </li>
                        {Array.from(
                          { length: Math.min(5, pagination.totalPages) },
                          (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <li
                                key={pageNum}
                                className={`page-item ${pagination.page === pageNum ? "active" : ""}`}
                              >
                                <button
                                  className="page-link"
                                  onClick={() =>
                                    setPagination({
                                      ...pagination,
                                      page: pageNum,
                                    })
                                  }
                                >
                                  {pageNum}
                                </button>
                              </li>
                            );
                          },
                        )}
                        <li
                          className={`page-item ${pagination.page === pagination.totalPages ? "disabled" : ""}`}
                        >
                          <button
                            className="page-link"
                            onClick={() =>
                              setPagination({
                                ...pagination,
                                page: pagination.page + 1,
                              })
                            }
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <CustomerFormModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setEditingCustomer(null);
        }}
        onSubmit={editingCustomer ? handleUpdate : handleCreate}
        initialData={editingCustomer}
        loading={submitting}
      />
    </div>
  );
};

export default Customers;
