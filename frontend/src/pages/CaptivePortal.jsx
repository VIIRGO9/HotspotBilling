import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const CaptivePortal = () => {
    const [voucherCode, setVoucherCode] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // 🔥 Step 2.1: Read MAC address from URL query parameter
    const [searchParams] = useSearchParams();
    const macAddress = searchParams.get("mac") || "00:00:00:00:00:00";
    const ipAddress = searchParams.get("ip") || "127.0.0.1";

    console.log(" Device MAC from MikroTik:", macAddress);
    console.log(" Device IP from MikroTik:", ipAddress);

    const handleVoucherLogin = async (e) => {
        e.preventDefault();
        if (!voucherCode.trim()) {
            toast.error("Please enter a valid voucher code.");
            return;
        }

        setLoading(true);
        try {
            // 🔥 Step 2.2: Send MAC address in request headers
            const response = await api.post("/vouchers/activate", {
                code: voucherCode.trim().toUpperCase(),
            }, {
                headers: {
                    "x-mac-address": macAddress,
                    "x-ip-address": ipAddress,
                },
            });

            if (response.data.success) {
                toast.success("Authentication successful! Internet access granted.");
                navigate("/customer/status", {
                    state: { session: response.data.data }
                });
            }
        } catch (error) {
            console.error("Activation error:", error);
            toast.error(error.response?.data?.message || "Invalid or expired voucher code.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="captive-portal-container">
            <div className="portal-card">
                <h2>Senete WiFi Portal</h2>
                <p className="text-muted">
                    Device: {macAddress !== "00:00:00:00:00:00" ? macAddress : "Unknown"}
                </p>

                <form onSubmit={handleVoucherLogin}>
                    <div className="form-group">
                        <label>Voucher Code</label>
                        <input
                            type="text"
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value)}
                            placeholder="Enter voucher code"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? "Connecting..." : "Connect to Internet"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CaptivePortal;
