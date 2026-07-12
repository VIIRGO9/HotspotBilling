import { useState, useEffect } from "react";
import { reportService } from "../services/reportService";
import toast from "react-hot-toast";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("sales");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [salesReport, setSalesReport] = useState(null);
  const [sessionReport, setSessionReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load initial data when component mounts
  useEffect(() => {
    fetchSalesReport();
  }, []);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
  };

  const fetchSalesReport = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;

      const data = await reportService.getSalesReport(params);

      // Ensure data structure exists even if empty
      setSalesReport({
        summary: data.summary || { _count: { id: 0 }, _sum: { amount: 0 } },
        byProvider: data.byProvider || [],
      });
    } catch (error) {
      console.error("Failed to load sales report:", error);
      toast.error("Failed to load sales report. Please try again.");
      // Set empty data structure to prevent UI crashes
      setSalesReport({
        summary: { _count: { id: 0 }, _sum: { amount: 0 } },
        byProvider: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionReport = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;

      const data = await reportService.getSessionReport(params);

      // Ensure data structure exists even if empty
      setSessionReport({
        summary: data.summary || {
          _count: { id: 0 },
          _sum: { totalBytes: 0, uploadBytes: 0, downloadBytes: 0 },
        },
        byRouter: data.byRouter || [],
      });
    } catch (error) {
      console.error("Failed to load session report:", error);
      toast.error("Failed to load session report. Please try again.");
      // Set empty data structure to prevent UI crashes
      setSessionReport({
        summary: {
          _count: { id: 0 },
          _sum: { totalBytes: 0, uploadBytes: 0, downloadBytes: 0 },
        },
        byRouter: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      setExporting(true);
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;

      const response = await reportService.exportReport(type, params);

      // Create download link
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_report_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`${type} report exported successfully`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to export report. No data available.",
      );
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return "TZS 0";
    return `TZS ${Number(amount).toLocaleString("en-US")}`;
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "sales" && !salesReport) {
      fetchSalesReport();
    } else if (tab === "sessions" && !sessionReport) {
      fetchSessionReport();
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Reports & Analytics</h3>
          <p className="text-muted small mb-0">
            Comprehensive business intelligence and insights
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label small">Start Date</label>
              <input
                type="date"
                className="form-control"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small">End Date</label>
              <input
                type="date"
                className="form-control"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
              />
            </div>
            <div className="col-md-4">
              <button
                className="btn btn-primary w-100"
                onClick={() => {
                  if (activeTab === "sales") fetchSalesReport();
                  else if (activeTab === "sessions") fetchSessionReport();
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Loading...
                  </>
                ) : (
                  <>
                    <i className="bi bi-funnel me-2"></i>
                    Apply Filter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "sales" ? "active" : ""}`}
            onClick={() => handleTabChange("sales")}
          >
            <i className="bi bi-cash-stack me-2"></i>
            Sales Report
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "sessions" ? "active" : ""}`}
            onClick={() => handleTabChange("sessions")}
          >
            <i className="bi bi-broadcast me-2"></i>
            Session Report
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "export" ? "active" : ""}`}
            onClick={() => setActiveTab("export")}
          >
            <i className="bi bi-download me-2"></i>
            Export Data
          </button>
        </li>
      </ul>

      {/* Sales Report Tab */}
      {activeTab === "sales" && (
        <div>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : salesReport ? (
            <>
              {/* Summary Cards */}
              <div className="row mb-4">
                <div className="col-md-4 mb-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body text-center">
                      <i className="bi bi-receipt text-primary fs-1 mb-2"></i>
                      <div className="text-muted small">Total Transactions</div>
                      <div className="fs-3 fw-bold">
                        {salesReport.summary._count.id}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body text-center">
                      <i className="bi bi-cash-coin text-success fs-1 mb-2"></i>
                      <div className="text-muted small">Total Revenue</div>
                      <div className="fs-3 fw-bold text-success">
                        {formatCurrency(salesReport.summary._sum.amount)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body text-center">
                      <i className="bi bi-graph-up text-info fs-1 mb-2"></i>
                      <div className="text-muted small">
                        Average Transaction
                      </div>
                      <div className="fs-3 fw-bold text-info">
                        {salesReport.summary._count.id > 0
                          ? formatCurrency(
                              salesReport.summary._sum.amount /
                                salesReport.summary._count.id,
                            )
                          : "TZS 0"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 pt-3">
                  <h5 className="card-title mb-0">Revenue by Payment Method</h5>
                </div>
                <div className="card-body p-0">
                  {salesReport.byProvider.length === 0 ? (
                    <div className="text-center py-5">
                      <i
                        className="bi bi-inbox text-muted"
                        style={{ fontSize: "3rem" }}
                      ></i>
                      <p className="text-muted mt-3 mb-0">
                        No sales data available
                      </p>
                      <p className="text-muted small">
                        Record some payments to see analytics
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0 align-middle">
                        <thead className="table-light">
                          <tr>
                            <th className="ps-3">Payment Method</th>
                            <th>Transactions</th>
                            <th>Revenue</th>
                            <th>Average</th>
                            <th className="pe-3">% of Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesReport.byProvider.map((item) => {
                            const percentage =
                              salesReport.summary._sum.amount > 0
                                ? (
                                    (item._sum.amount /
                                      salesReport.summary._sum.amount) *
                                    100
                                  ).toFixed(1)
                                : "0.0";
                            return (
                              <tr key={item.provider}>
                                <td className="ps-3">
                                  <span className="badge bg-light text-dark border">
                                    {item.provider}
                                  </span>
                                </td>
                                <td>{item._count.id}</td>
                                <td className="fw-medium">
                                  {formatCurrency(item._sum.amount)}
                                </td>
                                <td className="text-muted">
                                  {formatCurrency(
                                    item._count.id > 0
                                      ? item._sum.amount / item._count.id
                                      : 0,
                                  )}
                                </td>
                                <td className="pe-3">
                                  <div className="d-flex align-items-center">
                                    <div
                                      className="progress flex-grow-1 me-2"
                                      style={{ height: "8px" }}
                                    >
                                      <div
                                        className="progress-bar bg-primary"
                                        style={{ width: `${percentage}%` }}
                                      ></div>
                                    </div>
                                    <span className="small fw-medium">
                                      {percentage}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Session Report Tab */}
      {activeTab === "sessions" && (
        <div>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : sessionReport ? (
            <>
              {/* Summary Cards */}
              <div className="row mb-4">
                <div className="col-md-3 mb-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body text-center">
                      <i className="bi bi-broadcast text-primary fs-1 mb-2"></i>
                      <div className="text-muted small">Total Sessions</div>
                      <div className="fs-3 fw-bold">
                        {sessionReport.summary._count.id}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body text-center">
                      <i className="bi bi-arrow-down-up text-info fs-1 mb-2"></i>
                      <div className="text-muted small">Total Bandwidth</div>
                      <div className="fs-4 fw-bold">
                        {formatBytes(sessionReport.summary._sum.totalBytes)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body text-center">
                      <i className="bi bi-arrow-up text-success fs-1 mb-2"></i>
                      <div className="text-muted small">Total Upload</div>
                      <div className="fs-4 fw-bold">
                        {formatBytes(sessionReport.summary._sum.uploadBytes)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body text-center">
                      <i className="bi bi-arrow-down text-warning fs-1 mb-2"></i>
                      <div className="text-muted small">Total Download</div>
                      <div className="fs-4 fw-bold">
                        {formatBytes(sessionReport.summary._sum.downloadBytes)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sessions by Router */}
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 pt-3">
                  <h5 className="card-title mb-0">Sessions by Router</h5>
                </div>
                <div className="card-body p-0">
                  {sessionReport.byRouter.length === 0 ? (
                    <div className="text-center py-5">
                      <i
                        className="bi bi-inbox text-muted"
                        style={{ fontSize: "3rem" }}
                      ></i>
                      <p className="text-muted mt-3 mb-0">
                        No session data available
                      </p>
                      <p className="text-muted small">
                        Start some sessions to see analytics
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0 align-middle">
                        <thead className="table-light">
                          <tr>
                            <th className="ps-3">Router</th>
                            <th>Sessions</th>
                            <th>Total Bandwidth</th>
                            <th>Upload</th>
                            <th>Download</th>
                            <th className="pe-3">Avg per Session</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessionReport.byRouter.map((item) => (
                            <tr key={item.routerId}>
                              <td className="ps-3 fw-medium">
                                {item.routerId}
                              </td>
                              <td>{item._count.id}</td>
                              <td className="fw-medium">
                                {formatBytes(item._sum.totalBytes)}
                              </td>
                              <td className="text-muted">
                                {formatBytes(item._sum.uploadBytes)}
                              </td>
                              <td className="text-muted">
                                {formatBytes(item._sum.downloadBytes)}
                              </td>
                              <td className="pe-3">
                                {formatBytes(
                                  item._count.id > 0
                                    ? item._sum.totalBytes / item._count.id
                                    : 0,
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
            </>
          ) : null}
        </div>
      )}

      {/* Export Tab */}
      {activeTab === "export" && (
        <div className="row">
          <div className="col-md-4 mb-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center">
                <i className="bi bi-file-earmark-excel text-success fs-1 mb-3"></i>
                <h5 className="card-title">Sales Report</h5>
                <p className="text-muted small">
                  Export all payment transactions with customer details,
                  amounts, and payment methods
                </p>
                <button
                  className="btn btn-success"
                  onClick={() => handleExport("sales")}
                  disabled={exporting}
                >
                  {exporting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-download me-2"></i>
                      Export CSV
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center">
                <i className="bi bi-file-earmark-excel text-primary fs-1 mb-3"></i>
                <h5 className="card-title">Sessions Report</h5>
                <p className="text-muted small">
                  Export all session data including bandwidth usage, duration,
                  and user information
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => handleExport("sessions")}
                  disabled={exporting}
                >
                  {exporting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-download me-2"></i>
                      Export CSV
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center">
                <i className="bi bi-file-earmark-excel text-info fs-1 mb-3"></i>
                <h5 className="card-title">Customers Report</h5>
                <p className="text-muted small">
                  Export customer database with contact information and account
                  status
                </p>
                <button
                  className="btn btn-info text-white"
                  onClick={() => handleExport("customers")}
                  disabled={exporting}
                >
                  {exporting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-download me-2"></i>
                      Export CSV
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
