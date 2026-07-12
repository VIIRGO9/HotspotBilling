import { useState } from "react";

const VoucherDisplayModal = ({ show, onHide, vouchers, batchNumber }) => {
  const [copied, setCopied] = useState(false);

  if (!show || !vouchers) return null;

  const copyAllCodes = () => {
    const codes = vouchers.map((v) => v.code).join("\n");
    navigator.clipboard.writeText(codes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportToCSV = () => {
    const csvContent = [
      "Code,Package,Expires At,Batch Number",
      ...vouchers.map(
        (v) =>
          `${v.code},"${v.package.name}",${v.expiresAt || "N/A"},${v.batchNumber}`,
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vouchers_${batchNumber}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printVouchers = () => {
    const printWindow = window.open("", "_blank");
    const printContent = `
      <html>
        <head>
          <title>Vouchers - ${batchNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .voucher { 
              border: 2px dashed #0d6efd; 
              padding: 15px; 
              margin: 10px; 
              display: inline-block;
              width: 300px;
              text-align: center;
            }
            .code { font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #0d6efd; }
            .package { font-size: 14px; color: #6c757d; margin-top: 5px; }
            .expires { font-size: 12px; color: #dc3545; margin-top: 5px; }
          </style>
        </head>
        <body>
          <h2>Voucher Batch: ${batchNumber}</h2>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <hr>
          ${vouchers
            .map(
              (v) => `
            <div class="voucher">
              <div class="code">${v.code}</div>
              <div class="package">${v.package.name}</div>
              ${v.expiresAt ? `<div class="expires">Expires: ${new Date(v.expiresAt).toLocaleDateString()}</div>` : ""}
            </div>
          `,
            )
            .join("")}
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">
              <i className="bi bi-check-circle me-2"></i>
              Vouchers Generated Successfully
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onHide}
            ></button>
          </div>
          <div className="modal-body">
            <div className="alert alert-info">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>Batch:</strong> {batchNumber}
                  <br />
                  <strong>Total Vouchers:</strong> {vouchers.length}
                </div>
                <div className="btn-group">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={copyAllCodes}
                  >
                    <i
                      className={`bi ${copied ? "bi-check" : "bi-clipboard"} me-1`}
                    ></i>
                    {copied ? "Copied!" : "Copy All"}
                  </button>
                  <button
                    className="btn btn-sm btn-outline-success"
                    onClick={exportToCSV}
                  >
                    <i className="bi bi-file-earmark-excel me-1"></i>
                    Export CSV
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={printVouchers}
                  >
                    <i className="bi bi-printer me-1"></i>
                    Print
                  </button>
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-sm table-hover">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Voucher Code</th>
                    <th>Package</th>
                    <th>Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((voucher, index) => (
                    <tr key={voucher.id}>
                      <td>{index + 1}</td>
                      <td>
                        <code className="fs-6 text-primary fw-bold">
                          {voucher.code}
                        </code>
                      </td>
                      <td>{voucher.package.name}</td>
                      <td className="small text-muted">
                        {voucher.expiresAt
                          ? new Date(voucher.expiresAt).toLocaleDateString()
                          : "Never"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onHide}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherDisplayModal;
