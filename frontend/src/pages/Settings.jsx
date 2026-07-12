import { useEffect, useState } from "react";
import { settingsService } from "../services/settingsService";
import toast from "react-hot-toast";

const Settings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState({});
  const [editValues, setEditValues] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getAllSettings();
      const settingsArray = data || [];
      setSettings(settingsArray);

      const values = {};
      settingsArray.forEach((s) => {
        values[s.key] =
          typeof s.value === "object"
            ? JSON.stringify(s.value)
            : String(s.value ?? "");
      });
      setEditValues(values);
    } catch (err) {
      console.error("Failed to load settings:", err);
      const message = err.response?.data?.message || "Failed to load settings";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key) => {
    try {
      setSaving((prev) => ({ ...prev, [key]: true }));

      let value = editValues[key];
      if (value.startsWith("{") || value.startsWith("[")) {
        try {
          value = JSON.parse(value);
        } catch {
          // Keep as string
        }
      } else if (!isNaN(value) && value !== "") {
        value = Number(value);
      }

      await settingsService.updateSetting(key, { value });
      toast.success("Setting updated successfully");
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update setting");
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleChange = (key, value) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    const type = setting.type || "GENERAL";
    if (!acc[type]) acc[type] = [];
    acc[type].push(setting);
    return acc;
  }, {});

  const getTypeIcon = (type) => {
    const icons = {
      GENERAL: "bi-gear",
      PAYMENT: "bi-credit-card",
      ROUTER: "bi-router",
      EMAIL: "bi-envelope",
      SMS: "bi-chat-dots",
      SECURITY: "bi-shield-lock",
    };
    return icons[type] || "bi-gear";
  };

  const getTypeColor = (type) => {
    const colors = {
      GENERAL: "primary",
      PAYMENT: "success",
      ROUTER: "info",
      EMAIL: "warning",
      SMS: "secondary",
      SECURITY: "danger",
    };
    return colors[type] || "secondary";
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h3 className="fw-bold mb-4">System Settings</h3>
        <div className="card border-danger">
          <div className="card-body text-center py-5">
            <i
              className="bi bi-exclamation-triangle text-danger"
              style={{ fontSize: "3rem" }}
            ></i>
            <h5 className="mt-3">Unable to Load Settings</h5>
            <p className="text-muted">{error}</p>
            <button className="btn btn-primary" onClick={fetchSettings}>
              <i className="bi bi-arrow-clockwise me-2"></i>Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">System Settings</h3>
          <p className="text-muted small mb-0">
            Configure platform-wide settings
          </p>
        </div>
      </div>

      {settings.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i
              className="bi bi-gear text-muted"
              style={{ fontSize: "3rem" }}
            ></i>
            <p className="text-muted mt-3 mb-0">No settings configured yet</p>
            <p className="text-muted small">
              Run the database seed script to populate default settings
            </p>
          </div>
        </div>
      ) : (
        Object.entries(groupedSettings).map(([type, typeSettings]) => (
          <div key={type} className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white border-0 pt-3">
              <h5 className="card-title mb-0 d-flex align-items-center">
                <i
                  className={`bi ${getTypeIcon(type)} text-${getTypeColor(type)} me-2`}
                ></i>
                {type.charAt(0) + type.slice(1).toLowerCase()} Settings
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "25%" }}>Key</th>
                      <th style={{ width: "40%" }}>Value</th>
                      <th style={{ width: "25%" }}>Description</th>
                      <th style={{ width: "10%" }} className="text-end">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {typeSettings.map((setting) => {
                      const currentValue = editValues[setting.key] ?? "";
                      const originalValue =
                        typeof setting.value === "object"
                          ? JSON.stringify(setting.value)
                          : String(setting.value ?? "");
                      const hasChanged = currentValue !== originalValue;

                      return (
                        <tr key={setting.key}>
                          <td>
                            <code className="small">{setting.key}</code>
                          </td>
                          <td>
                            {currentValue.length > 100 ? (
                              <textarea
                                className="form-control form-control-sm font-monospace"
                                rows="3"
                                value={currentValue}
                                onChange={(e) =>
                                  handleChange(setting.key, e.target.value)
                                }
                              />
                            ) : (
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={currentValue}
                                onChange={(e) =>
                                  handleChange(setting.key, e.target.value)
                                }
                              />
                            )}
                          </td>
                          <td className="text-muted small">
                            {setting.description || "-"}
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleSave(setting.key)}
                              disabled={saving[setting.key] || !hasChanged}
                            >
                              {saving[setting.key] ? (
                                <span className="spinner-border spinner-border-sm"></span>
                              ) : (
                                <i className="bi bi-check-lg"></i>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Settings;
