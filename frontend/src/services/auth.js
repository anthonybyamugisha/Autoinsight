import api from './api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post(`${API_BASE_URL}/users/login/`, { email, password });
    localStorage.setItem('tokens', JSON.stringify({ access: data.access, refresh: data.refresh }));
    return data;
  },

  register: async (userData) => {
    const { data } = await api.post(`${API_BASE_URL}/users/register/`, userData);
    localStorage.setItem('tokens', JSON.stringify(data.tokens));
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  getProfile: async () => {
    const { data } = await api.get('/users/profile/');
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  },

  changePassword: async (oldPassword, newPassword) => {
    const { data } = await api.post('/users/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return data;
  },

  logout: () => {
    localStorage.removeItem('tokens');
    localStorage.removeItem('user');
  },

  forgotPassword: async (email) => {
    const { data } = await api.post(`${API_BASE_URL}/users/forgot-password/`, { email });
    return data;
  },

  resetPassword: async (uid, token, newPassword) => {
    const { data } = await api.post(`${API_BASE_URL}/users/reset-password/`, {
      uid,
      token,
      new_password: newPassword,
    });
    return data;
  },
};
