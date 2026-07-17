import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const CustomerStatus = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [disconnecting, setDisconnecting] = useState(false);

    useEffect(() => {
        // 1. Try to get session data passed from the Captive Portal
        let activeSession = location.state?.session;

        // 2. If not in state (e.g., user refreshed the page), try sessionStorage
        if (!activeSession) {
            const stored = sessionStorage.getItem("activeSession");
            if (stored) {
                activeSession = JSON.parse(stored);
            }
        }

        if (activeSession) {
            setSession(activeSession);
            // Persist in sessionStorage so it survives page refreshes
            sessionStorage.setItem("activeSession", JSON.stringify(activeSession));
        } else {
            // If no session exists, redirect back to the portal
            toast.error("No active internet session found.");
            navigate("/portal");
        }

        setLoading(false);
    }, [location.state, navigate]);

    const handleDisconnect = async () => {
        if (!window.confirm("Are you sure you want to disconnect your device from the internet?")) {
            return;
        }

        setDisconnecting(true);
        try {
            //Send a body payload to satisfy the backend validator
            await api.post(`/sessions/${session.sessionId}/stop`, {
                reason: "USER_REQUEST"
            });

            sessionStorage.removeItem("activeSession");
            toast.success("You have been successfully disconnected.");
            navigate("/portal");
        } catch (error) {
            console.error("Disconnect Error:", error.response?.data); // Debug log
            toast.error(error.response?.data?.message || "Failed to disconnect.");
        } finally {
            setDisconnecting(false);
        }
    };

    const formatTimeRemaining = (expiryDate) => {
        if (!expiryDate) return "Unlimited";
        const now = new Date();
        const end = new Date(expiryDate);
        const diff = end - now;

        if (diff <= 0) return "Expired";

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    if (loading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
            <div className="card shadow-lg border-0 w-100" style={{ maxWidth: "450px" }}>
                <div className="card-body p-4 text-center">

                    {/* Success Header */}
                    <div className="mb-4">
                        <div className="rounded-circle bg-success-subtle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "80px", height: "80px" }}>
                            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "2.5rem" }}></i>
                        </div>
                        <h3 className="fw-bold mb-1">You are Connected!</h3>
                        <p className="text-muted small">Enjoy your high-speed internet access.</p>
                    </div>

                    {/* Session Details Card */}
                    <div className="bg-light rounded-3 p-3 mb-4 text-start">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted small">Package</span>
                            <span className="fw-bold text-dark">{session.packageName || "Standard Access"}</span>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted small">Time Remaining</span>
                            <span className="fw-bold text-primary">
                                <i className="bi bi-clock me-1"></i>
                                {formatTimeRemaining(session.expiresAt)}
                            </span>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted small">Data Limit</span>
                            <span className="fw-bold text-dark">
                                <i className="bi bi-hdd-network me-1"></i>
                                {session.dataLimit || "Unlimited"}
                            </span>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted small">Speed Limit</span>
                            <span className="fw-bold text-dark">
                                <i className="bi bi-speedometer2 me-1"></i>
                                {session.speedLimit || "Unlimited"}
                            </span>
                        </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted small">Status</span>
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                            <i className="bi bi-circle-fill me-1" style={{ fontSize: "0.5rem" }}></i>
                            Active
                        </span>
                    </div>
                </div>

                {/* Disconnect Button */}
                <button
                    className="btn btn-outline-danger w-100 btn-lg fw-bold"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                >
                    {disconnecting ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Disconnecting...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-power me-2"></i>
                            Disconnect Device
                        </>
                    )}
                </button>

                {/* Footer Info */}
                <div className="mt-4 pt-3 border-top">
                    <p className="small text-muted mb-0">
                        Need more time? <a href="/portal" className="text-decoration-none fw-bold">Purchase another voucher</a>
                    </p>
                </div>

            </div>
        </div>
    );
};

export default CustomerStatus;