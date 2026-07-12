import api from "./api";

export const dashboardService = {
  getDashboardMetrics: async () => {
    const response = await api.get("/reports/dashboard");
    return response.data.data;
  },
};
