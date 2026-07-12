import { useState, useEffect } from "react";

const RouterFormModal = ({ show, onHide, onSubmit, initialData, loading }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "MIKROTIK",
    ipAddress: "",
    apiPort: 8728,
    username: "",
    password: "",
    location: "",
    routerVersion: "",
    modelName: "",
    serialNumber: "",
    isDefault: false,
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        type: initialData.type || "MIKROTIK",
        ipAddress: initialData.ipAddress || "",
        apiPort: initialData.apiPort || 8728,
        username: initialData.username || "",
        password: "",
        location: initialData.location || "",
        routerVersion: initialData.routerVersion || "",
        modelName: initialData.modelName || "",
        serialNumber: initialData.serialNumber || "",
        isDefault: initialData.isDefault || false,
      });
    } else {
      setFormData({
        name: "",
        type: "MIKROTIK",
        ipAddress: "",
        apiPort: 8728,
        username: "",
        password: "",
        location: "",
        routerVersion: "",
        modelName: "",
        serialNumber: "",
        isDefault: false,
      });
    }
  }, [initialData, show]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "apiPort"
            ? Number(value)
            : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };

    Object.keys(submitData).forEach((key) => {
      if (submitData[key] === "" && key !== "password") {
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
              <i className="bi bi-router me-2"></i>
              {initialData ? "Edit Router" : "Add New Router"}
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
                  <label className="form-label">Router Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Main Lobby MikroTik"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Router Type *</label>
                  <select
                    className="form-select"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="MIKROTIK">MikroTik</option>
                    <option value="OPENWRT">OpenWrt</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">IP Address *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="ipAddress"
                    value={formData.ipAddress}
                    onChange={handleChange}
                    placeholder="192.168.1.1"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">API Port *</label>
                  <input
                    type="number"
                    className="form-control"
                    name="apiPort"
                    value={formData.apiPort}
                    onChange={handleChange}
                    min="1"
                    max="65535"
                    required
                  />
                  <div className="form-text">MikroTik default: 8728</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="admin"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Password {!initialData && "*"}
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={
                        initialData
                          ? "Leave blank to keep current"
                          : "Enter password"
                      }
                      required={!initialData}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i
                        className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                      ></i>
                    </button>
                  </div>
                  {initialData && (
                    <div className="form-text text-warning">
                      <i className="bi bi-shield-lock me-1"></i>
                      Password is encrypted. Leave blank to keep current.
                    </div>
                  )}
                </div>
                <div className="col-12">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Main Lobby Floor 1"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Model Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="modelName"
                    value={formData.modelName}
                    onChange={handleChange}
                    placeholder="e.g. RB4011"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Router Version</label>
                  <input
                    type="text"
                    className="form-control"
                    name="routerVersion"
                    value={formData.routerVersion}
                    onChange={handleChange}
                    placeholder="e.g. 7.12"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Serial Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-12">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      name="isDefault"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="isDefault">
                      Set as default router
                    </label>
                    <div className="form-text">
                      Only one router can be default at a time
                    </div>
                  </div>
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
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    {initialData ? "Update Router" : "Add Router"}
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

export default RouterFormModal;
