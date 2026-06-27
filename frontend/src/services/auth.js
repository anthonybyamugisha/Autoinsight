import api from './api';

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/users/login/', { email, password });
    localStorage.setItem('tokens', JSON.stringify({ access: data.access, refresh: data.refresh }));
    return data;
  },

  register: async (userData) => {
    const { data } = await api.post('/users/register/', userData);
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
    const { data } = await api.post('/users/forgot-password/', { email });
    return data;
  },

  resetPassword: async (uid, token, newPassword) => {
    const { data } = await api.post('/users/reset-password/', {
      uid,
      token,
      new_password: newPassword,
    });
    return data;
  },
};
