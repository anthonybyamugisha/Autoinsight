import api from './api';

export const auditService = {
  getLogs: async (params = {}) => {
    const { data } = await api.get('/audit/logs/', { params });
    return data;
  },

  getAlerts: async (params = {}) => {
    const { data } = await api.get('/audit/alerts/', { params });
    return data;
  },

  getUnreadCount: async () => {
    const { data } = await api.get('/audit/alerts/unread-count/');
    return data;
  },

  getSecuritySummary: async (days = 7) => {
    const { data } = await api.get('/audit/security-summary/', { params: { days } });
    return data;
  },

  markAlertRead: async (id) => {
    const { data } = await api.post(`/audit/alerts/${id}/read/`);
    return data;
  },

  markAllAlertsRead: async () => {
    const { data } = await api.post('/audit/alerts/read-all/');
    return data;
  },
};
