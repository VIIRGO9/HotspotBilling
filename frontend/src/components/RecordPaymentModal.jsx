import { useState, useEffect, useRef } from "react";
import { customerService } from "../services/customerService";
import toast from "react-hot-toast";

const RecordPaymentModal = ({ show, onHide, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    customerId: "",
    amount: "",
    provider: "CASH",
    paymentReference: "",
    providerPhone: "",
    notes: "",
    status: "SUCCESS",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);

  // Auto-set status to PENDING if Mobile Money is selected
  useEffect(() => {
    const mobileProviders = ["MPESA", "AIRTEL_MONEY", "TIGOPESA", "HALOPESA"];
    if (
      mobileProviders.includes(formData.provider) &&
      formData.status === "SUCCESS"
    ) {
      setFormData((prev) => ({ ...prev, status: "PENDING" }));
    } else if (formData.provider === "CASH" && formData.status !== "SUCCESS") {
      setFormData((prev) => ({ ...prev, status: "SUCCESS" }));
    }
  }, [formData.provider]);

  // Debounced customer search
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setSelectedCustomer(null);
    setFormData((prev) => ({ ...prev, customerId: "" }));

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value || value.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await customerService.getCustomers({ q: value, limit: 10 });
        const customers = res.data || [];
        setSearchResults(customers);
        setShowDropdown(customers.length > 0);
      } catch {
        setSearchResults([]);
        setShowDropdown(false);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSearchTerm(`${customer.fullName} (${customer.customerCode})`);
    setFormData((prev) => ({ ...prev, customerId: customer.id }));
    setShowDropdown(false);
    setSearchResults([]);
  };

  const clearSelection = () => {
    setSelectedCustomer(null);
    setSearchTerm("");
    setFormData((prev) => ({ ...prev, customerId: "" }));
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customerId) {
      toast.error("Please select a customer first");
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    onSubmit(formData);
  };

  const resetForm = () => {
    setFormData({
      customerId: "",
      amount: "",
      provider: "CASH",
      paymentReference: "",
      providerPhone: "",
      notes: "",
      status: "SUCCESS",
    });
    setSelectedCustomer(null);
    setSearchTerm("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  useEffect(() => {
    if (show) resetForm();
  }, [show]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false);
    if (showDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showDropdown]);

  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="bi bi-cash-coin me-2"></i>Record Payment
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onHide}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Customer Search with Dropdown */}
              <div className="mb-3 position-relative">
                <label className="form-label">Search Customer *</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type name, phone, or code..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() =>
                      searchResults.length > 0 && setShowDropdown(true)
                    }
                    autoComplete="off"
                  />
                  {selectedCustomer && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={clearSelection}
                      title="Clear selection"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                  {searching && (
                    <span className="input-group-text">
                      <span className="spinner-border spinner-border-sm"></span>
                    </span>
                  )}
                </div>

                {selectedCustomer && (
                  <div className="alert alert-success py-2 mt-2 small mb-0">
                    <i className="bi bi-check-circle-fill me-1"></i>
                    Selected: <strong>{selectedCustomer.fullName}</strong>
                    <span className="text-muted ms-1">
                      ({selectedCustomer.customerCode})
                    </span>
                  </div>
                )}

                {/* Search Results Dropdown */}
                {showDropdown && (
                  <div
                    className="position-absolute w-100 bg-white border rounded shadow-sm mt-1"
                    style={{
                      zIndex: 1050,
                      maxHeight: "250px",
                      overflowY: "auto",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {searchResults.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        className="dropdown-item text-start py-2 px-3 border-bottom"
                        onClick={() => selectCustomer(customer)}
                        style={{ whiteSpace: "normal" }}
                      >
                        <div className="fw-medium small">
                          {customer.fullName}
                        </div>
                        <div
                          className="text-muted"
                          style={{ fontSize: "0.75rem" }}
                        >
                          {customer.customerCode}
                          {customer.phone && ` • ${customer.phone}`}
                          {customer.email && ` • ${customer.email}`}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Amount (TZS) *</label>
                <input
                  type="number"
                  className="form-control form-control-lg fw-bold"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Payment Method *</label>
                <select
                  className="form-select"
                  name="provider"
                  value={formData.provider}
                  onChange={handleChange}
                  required
                >
                  <option value="CASH">Cash</option>
                  <option value="MPESA">M-Pesa</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                  <option value="TIGOPESA">Tigo Pesa</option>
                  <option value="HALOPESA">HaloPesa</option>
                  <option value="BANK">Bank Transfer</option>
                </select>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Provider Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    name="providerPhone"
                    value={formData.providerPhone}
                    onChange={handleChange}
                    placeholder="e.g. +2557..."
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Provider Ref ID</label>
                  <input
                    type="text"
                    className="form-control"
                    name="paymentReference"
                    value={formData.paymentReference}
                    onChange={handleChange}
                    placeholder="e.g. MPESA_CODE"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="PENDING">Pending Verification</option>
                  <option value="SUCCESS">Success</option>
                  <option value="FAILED">Failed</option>
                </select>
                <div className="form-text small">
                  Mobile Money is usually "Pending" until callback received.
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="2"
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onHide}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !formData.customerId}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-1"></i>Record Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RecordPaymentModal;
