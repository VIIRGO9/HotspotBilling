import api from "./api";

export const sessionService = {
  getSessions: async (params = {}) => {
    const response = await api.get("/sessions", { params });
    return response.data;
  },

  getSessionById: async (id) => {
    const response = await api.get(`/sessions/${id}`);
    return response.data.data;
  },

  startSession: async (sessionData) => {
    const response = await api.post("/sessions/start", sessionData);
    return response.data.data;
  },

  stopSession: async (id, stopData) => {
    const response = await api.post(`/sessions/${id}/stop`, stopData);
    return response.data.data;
  },

  getActiveSessionsCount: async () => {
    const response = await api.get("/sessions/active/count");
    return response.data.data.activeSessions;
  },
};
