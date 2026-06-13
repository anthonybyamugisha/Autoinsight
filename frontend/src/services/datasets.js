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
};
