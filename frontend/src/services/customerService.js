import api from "./api";

export const customerService = {
  getCustomers: async (params = {}) => {
    const response = await api.get("/customers", { params });
    return response.data;
  },

  getCustomerById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data.data;
  },

  createCustomer: async (customerData) => {
    const response = await api.post("/customers", customerData);
    return response.data.data;
  },

  updateCustomer: async (id, customerData) => {
    const response = await api.put(`/customers/${id}`, customerData);
    return response.data.data;
  },

  updateCustomerStatus: async (id, status) => {
    const response = await api.patch(`/customers/${id}/status`, { status });
    return response.data.data;
  },

  deleteCustomer: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },
};
