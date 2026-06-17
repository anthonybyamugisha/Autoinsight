import api from './api';

export const auditService = {
  // Audit logs
  getLogs: async (params = {}) => {
    const { data } = await api.get('/audit/logs/', { params });
    return data;
  },

  // Alerts
  getAlerts: async () => {
    const { data } = await api.get('/audit/alerts/');
    return data;
  },

  getUnreadCount: async () => {
    const { data } = await api.get('/audit/alerts/unread-count/');
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
