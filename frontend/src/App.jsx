import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layout/AdminLayout";
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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes - Admin & Operator */}
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

          {/* Admin-Only Route */}
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

          {/* Default Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
