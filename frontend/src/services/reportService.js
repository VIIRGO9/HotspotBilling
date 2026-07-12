import api from "./api";

export const reportService = {
  getDashboardMetrics: async () => {
    const response = await api.get("/reports/dashboard");
    return response.data.data;
  },

  getSalesReport: async (params = {}) => {
    const response = await api.get("/reports/sales", { params });
    return response.data.data;
  },

  getSessionReport: async (params = {}) => {
    const response = await api.get("/reports/sessions", { params });
    return response.data.data;
  },

  exportReport: async (type, params = {}) => {
    const response = await api.get(`/reports/export/${type}`, {
      params,
      responseType: "blob",
    });
    return response;
  },
};
