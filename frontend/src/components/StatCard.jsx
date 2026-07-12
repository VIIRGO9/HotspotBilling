const StatCard = ({ icon, label, value, color = "primary", subtitle }) => {
  return (
    <div className="col-sm-6 col-xl-3 mb-4">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex align-items-center">
          <div
            className={`rounded-circle d-flex align-items-center justify-content-center me-3`}
            style={{
              width: "52px",
              height: "52px",
              backgroundColor: `var(--bs-${color}-bg-subtle)`,
              color: `var(--bs-${color})`,
            }}
          >
            <i className={`${icon} fs-4`}></i>
          </div>
          <div className="flex-grow-1">
            <div className="text-muted small text-uppercase fw-medium">
              {label}
            </div>
            <div className="fs-4 fw-bold text-dark">{value}</div>
            {subtitle && <div className="text-muted small">{subtitle}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
