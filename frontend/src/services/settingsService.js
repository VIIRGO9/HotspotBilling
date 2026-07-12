import api from "./api";

export const settingsService = {
  getAllSettings: async () => {
    const response = await api.get("/settings");
    return response.data.data;
  },

  updateSetting: async (key, data) => {
    const response = await api.put(`/settings/${key}`, data);
    return response.data.data;
  },
};
