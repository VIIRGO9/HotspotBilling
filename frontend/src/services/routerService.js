import api from "./api";

export const routerService = {
  getRouters: async (params = {}) => {
    const response = await api.get("/routers", { params });
    return response.data;
  },

  getRouterById: async (id) => {
    const response = await api.get(`/routers/${id}`);
    return response.data.data;
  },

  createRouter: async (routerData) => {
    const response = await api.post("/routers", routerData);
    return response.data.data;
  },

  updateRouter: async (id, routerData) => {
    const response = await api.put(`/routers/${id}`, routerData);
    return response.data.data;
  },

  updateRouterStatus: async (id, status) => {
    const response = await api.patch(`/routers/${id}/status`, { status });
    return response.data.data;
  },

  deleteRouter: async (id) => {
    const response = await api.delete(`/routers/${id}`);
    return response.data;
  },
};
