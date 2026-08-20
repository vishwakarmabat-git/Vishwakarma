import apiClient from './apiClient';

export const authService = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login.php', { email, password });
    if (response.status === 'success') {
      localStorage.setItem('vk_auth_token', response.data.token);
      localStorage.setItem('vk_user', JSON.stringify(response.data.user));
      if (response.data.user && ['super-admin', 'staff', 'content-manager', 'sales-team'].includes(response.data.user.role)) {
        localStorage.setItem('vk_bathouse_admin_session', JSON.stringify({
          email: response.data.user.email,
          name: response.data.user.name,
          role: response.data.user.role,
          id: response.data.user.id
        }));
      }
    }
    return response;
  },

  register: async (userData) => {
    return await apiClient.post('/auth/register.php', userData);
  },

  logout: () => {
    localStorage.removeItem('vk_auth_token');
    localStorage.removeItem('vk_user');
    localStorage.removeItem('vk_bathouse_admin_session');
  },

  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/me.php');
      if (response.status === 'success') {
        localStorage.setItem('vk_user', JSON.stringify(response.data));
        return response.data;
      }
    } catch (error) {
      console.error("Failed to fetch user profile", error);
      return null;
    }
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('vk_auth_token');
  }
};
