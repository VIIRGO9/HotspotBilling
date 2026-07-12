import api from "./api";

export const voucherService = {
  getVouchers: async (params = {}) => {
    const response = await api.get("/vouchers", { params });
    return response.data;
  },

  getVoucherByCode: async (code) => {
    const response = await api.get(`/vouchers/${code}`);
    return response.data.data;
  },

  generateVouchers: async (data) => {
    const response = await api.post("/vouchers/generate", data);
    return response.data.data;
  },

  validateVoucher: async (code) => {
    const response = await api.post("/vouchers/validate", { code });
    return response.data.data;
  },

  cancelVoucher: async (id) => {
    const response = await api.patch(`/vouchers/${id}/cancel`);
    return response.data.data;
  },
};
