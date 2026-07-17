import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layout/AdminLayout";

// Admin & Operator Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Packages from "./pages/Packages";
import Customers from "./pages/Customers";
import Vouchers from "./pages/Vouchers";
import Payments from "./pages/Payments";
import Routers from "./pages/Routers";
import Sessions from "./pages/Sessions";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

// Customer & Public Pages
import CaptivePortal from "./pages/CaptivePortal";
import CustomerStatus from "./pages/CustomerStatus";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* ==========================================
              PUBLIC ROUTES (No Authentication Required)
              Used by normal hotspot users and guests
              ========================================== */}
          <Route path="/login" element={<Login />} />

          {/* Captive Portal: The first screen a user sees when connecting to Wi-Fi */}
          <Route path="/portal" element={<CaptivePortal />} />

          {/* Customer Status: Shows remaining time/data after successful login */}
          <Route path="/customer/status" element={<CustomerStatus />} />

          {/* ==========================================
              PROTECTED ROUTES - Admin & Operator
              ========================================== */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "OPERATOR"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/vouchers" element={<Vouchers />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/routers" element={<Routers />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          {/* ==========================================
              PROTECTED ROUTES - Admin Only
              ========================================== */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Settings />} />
          </Route>

          {/* ==========================================
              DEFAULT REDIRECTS
              ========================================== */}
          {/* Default to dashboard for staff. 
              (The MikroTik router will explicitly redirect hotspot users to /portal) */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;