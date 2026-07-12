import { useState, useEffect } from "react";

const PackageFormModal = ({ show, onHide, onSubmit, initialData, loading }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "TIME",
    price: "",
    duration: "",
    validityUnit: "DAY",
    downloadSpeedMbps: "",
    uploadSpeedMbps: "",
    dataLimitGB: "",
    deviceLimit: 1,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        type: initialData.type || "TIME",
        price: initialData.price || "",
        duration: initialData.duration || "",
        validityUnit: initialData.validityUnit || "DAY",
        downloadSpeedMbps: initialData.downloadSpeedMbps || "",
        uploadSpeedMbps: initialData.uploadSpeedMbps || "",
        dataLimitGB: initialData.dataLimitGB || "",
        deviceLimit: initialData.deviceLimit || 1,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        type: "TIME",
        price: "",
        duration: "",
        validityUnit: "DAY",
        downloadSpeedMbps: "",
        uploadSpeedMbps: "",
        dataLimitGB: "",
        deviceLimit: 1,
      });
    }
  }, [initialData, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "price" ||
        name.includes("Mbps") ||
        name === "dataLimitGB" ||
        name === "duration" ||
        name === "deviceLimit"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };

    Object.keys(submitData).forEach((key) => {
      if (submitData[key] === "" && key !== "description") {
        delete submitData[key];
      }
    });

    onSubmit(submitData);
  };

  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {initialData ? "Edit Package" : "Create New Package"}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onHide}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Package Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Package Type *</label>
                  <select
                    className="form-select"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="TIME">Time-Based</option>
                    <option value="DATA">Data-Based</option>
                    <option value="HYBRID">Hybrid (Time + Data)</option>
                    <option value="UNLIMITED">Unlimited</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="2"
                  ></textarea>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Price (TZS) *</label>
                  <input
                    type="number"
                    className="form-control"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Duration *</label>
                  <input
                    type="number"
                    className="form-control"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Validity Unit *</label>
                  <select
                    className="form-select"
                    name="validityUnit"
                    value={formData.validityUnit}
                    onChange={handleChange}
                    required
                  >
                    <option value="MINUTE">Minutes</option>
                    <option value="HOUR">Hours</option>
                    <option value="DAY">Days</option>
                    <option value="WEEK">Weeks</option>
                    <option value="MONTH">Months</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Download Speed (Mbps)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="downloadSpeedMbps"
                    value={formData.downloadSpeedMbps}
                    onChange={handleChange}
                    min="1"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Upload Speed (Mbps)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="uploadSpeedMbps"
                    value={formData.uploadSpeedMbps}
                    onChange={handleChange}
                    min="1"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Device Limit *</label>
                  <input
                    type="number"
                    className="form-control"
                    name="deviceLimit"
                    value={formData.deviceLimit}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
                {(formData.type === "DATA" || formData.type === "HYBRID") && (
                  <div className="col-md-6">
                    <label className="form-label">Data Limit (GB)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="dataLimitGB"
                      value={formData.dataLimitGB}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                    />
                  </div>
                )}
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
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    {initialData ? "Update Package" : "Create Package"}
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

export default PackageFormModal;
