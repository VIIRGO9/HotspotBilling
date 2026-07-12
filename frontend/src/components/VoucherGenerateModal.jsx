import { useState, useEffect } from "react";
import { packageService } from "../services/packageService";

const VoucherGenerateModal = ({ show, onHide, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    packageId: "",
    quantity: 10,
    expiresInDays: 30,
    batchNumber: "",
  });
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);

  useEffect(() => {
    if (show) {
      fetchPackages();
      setFormData({
        packageId: "",
        quantity: 10,
        expiresInDays: 30,
        batchNumber: `BATCH-${Date.now()}`,
      });
    }
  }, [show]);

  const fetchPackages = async () => {
    try {
      setLoadingPackages(true);
      const response = await packageService.getPackages({ active: "true" });
      setPackages(response.data || []);
    } catch (error) {
      console.error("Failed to load packages");
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "quantity" || name === "expiresInDays" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-ticket-perforated me-2"></i>
              Generate Vouchers
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onHide}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Select Package *</label>
                {loadingPackages ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm"></div>
                  </div>
                ) : (
                  <select
                    className="form-select"
                    name="packageId"
                    value={formData.packageId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Choose a package...</option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} - TZS {Number(pkg.price).toLocaleString()}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Quantity *</label>
                <input
                  type="number"
                  className="form-control"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  max="1000"
                  required
                />
                <div className="form-text">
                  Generate between 1 and 1000 vouchers
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Expires In (Days)</label>
                <input
                  type="number"
                  className="form-control"
                  name="expiresInDays"
                  value={formData.expiresInDays}
                  onChange={handleChange}
                  min="1"
                />
                <div className="form-text">
                  Vouchers will expire after this many days
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Batch Number</label>
                <input
                  type="text"
                  className="form-control"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleChange}
                  placeholder="Optional batch identifier"
                />
                <div className="form-text">
                  Group vouchers for tracking purposes
                </div>
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
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-magic me-2"></i>
                    Generate Vouchers
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

export default VoucherGenerateModal;
