import api from "./api";

export const packageService = {
  getPackages: async (params = {}) => {
    const response = await api.get("/packages", { params });
    return response.data;
  },

  getPackageById: async (id) => {
    const response = await api.get(`/packages/${id}`);
    return response.data.data;
  },

  createPackage: async (packageData) => {
    const response = await api.post("/packages", packageData);
    return response.data.data;
  },

  updatePackage: async (id, packageData) => {
    const response = await api.put(`/packages/${id}`, packageData);
    return response.data.data;
  },

  updatePackageStatus: async (id, status) => {
    const response = await api.patch(`/packages/${id}/status`, { status });
    return response.data.data;
  },

  deletePackage: async (id) => {
    const response = await api.delete(`/packages/${id}`);
    return response.data;
  },
};
