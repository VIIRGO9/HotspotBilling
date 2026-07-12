import api from "./api";

export const paymentService = {
  getPayments: async (params = {}) => {
    const response = await api.get("/payments", { params });
    return response.data;
  },

  recordPayment: async (paymentData) => {
    const response = await api.post("/payments", paymentData);
    return response.data.data;
  },

  verifyPayment: async (id, data) => {
    const response = await api.patch(`/payments/${id}/verify`, data);
    return response.data.data;
  },

  getPaymentById: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response.data.data;
  },
};
