import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const menuItems = [
  { path: "/dashboard", label: "Dashboard", icon: "bi-house-door" },
  { path: "/packages", label: "Packages", icon: "bi-box" },
  { path: "/customers", label: "Customers", icon: "bi-people" },
  { path: "/vouchers", label: "Vouchers", icon: "bi-ticket" },
  { path: "/payments", label: "Payments", icon: "bi-cash-stack" },
  { path: "/routers", label: "Routers", icon: "bi-wifi" },
  { path: "/reports", label: "Reports", icon: "bi-bar-chart" },
  { path: "/sessions", label: "Sessions", icon: "bi-broadcast" },
  { path: "/settings", label: "Settings", icon: "bi-gear" },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="d-flex vh-100 bg-light">
      {/* Sidebar */}
      <aside
        className={`d-flex flex-column flex-shrink-0 bg-white border-end ${sidebarOpen ? "d-flex" : "d-none d-md-flex"}`}
        style={{ width: "260px" }}
      >
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
          <h4 className="mb-0 text-primary fw-bold">SeneteBilling</h4>
          <button
            onClick={() => setSidebarOpen(false)}
            className="btn btn-sm btn-outline-secondary d-md-none"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <nav className="p-2 flex-grow-1 overflow-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`d-flex align-items-center px-3 py-2 mb-1 rounded text-decoration-none ${
                location.pathname === item.path
                  ? "bg-primary-subtle text-primary fw-medium"
                  : "text-dark"
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <i className={`${item.icon} me-2`}></i>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="d-flex flex-column flex-grow-1 overflow-hidden">
        {/* Header */}
        <header className="d-flex align-items-center justify-content-between bg-white border-bottom px-3 py-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn btn-sm btn-outline-secondary d-md-none"
          >
            <i className="bi bi-list"></i>
          </button>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="btn btn-sm btn-outline-danger"
            >
              <i className="bi bi-box-arrow-right"></i> Logout
            </button>
          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-grow-1 p-3 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
