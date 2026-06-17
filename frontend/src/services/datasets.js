import api from './api';

export const datasetService = {
  upload: async (formData, onProgress) => {
    const { data } = await api.post('/datasets/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
    });
    return data;
  },

  list: async (params = {}) => {
    const { data } = await api.get('/datasets/', { params });
    return data;
  },

  detail: async (id) => {
    const { data } = await api.get(`/datasets/${id}/`);
    return data;
  },

  preview: async (id, rows = 50) => {
    const { data } = await api.get(`/datasets/${id}/preview/`, { params: { rows } });
    return data;
  },

  delete: async (id) => {
    await api.delete(`/datasets/${id}/`);
  },

  summary: async () => {
    const { data } = await api.get('/datasets/summary/');
    return data;
  },

  analytics: async (id) => {
    const { data } = await api.get(`/datasets/${id}/analytics/`);
    return data;
  },

  trends: async (id, params = {}) => {
    const { data } = await api.get(`/datasets/${id}/trends/`, { params });
    return data;
  },

  quality: async (id) => {
    const { data } = await api.get(`/datasets/${id}/quality/`);
    return data;
  },

  anomalies: async (id) => {
    const { data } = await api.get(`/datasets/${id}/anomalies/`);
    return data;
  },

  export: async (id, type = 'excel') => {
    const response = await api.get(`/datasets/${id}/export/`, {
      params: { type },
      responseType: 'blob',
    });
    // Trigger browser download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const ext = type === 'pdf' ? 'pdf' : 'xlsx';
    link.setAttribute('download', `report_${id}.${ext}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
