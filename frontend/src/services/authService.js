import apiClient from './apiClient';

export const authService = {
  login: async (email, password) => {
    // FastAPI OAuth2PasswordRequestForm usually expects form data, but we accept JSON for now based on schemas
    const response = await apiClient.post('/v1/auth/login', { email, password });
    if (response && response.access_token) {
      localStorage.setItem('vk_auth_token', response.access_token);
      
      // Let's fetch the user profile after login
      const userProfile = await authService.getCurrentUser();
      if (userProfile) {
          localStorage.setItem('vk_user', JSON.stringify(userProfile));
          if (['super-admin', 'admin', 'content-manager', 'sales'].includes(userProfile.role)) {
            localStorage.setItem('vk_bathouse_admin_session', JSON.stringify({
              email: userProfile.email,
              name: userProfile.first_name,
              role: userProfile.role,
              id: userProfile.id
            }));
          }
      }
      return { status: 'success', data: { token: response.access_token, user: userProfile } };
    }
    return response;
  },

  register: async (userData) => {
    return await apiClient.post('/v1/auth/register', userData);
  },

  logout: () => {
    localStorage.removeItem('vk_auth_token');
    localStorage.removeItem('vk_user');
    localStorage.removeItem('vk_bathouse_admin_session');
  },

  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/v1/auth/me');
      if (response && response.id) {
        localStorage.setItem('vk_user', JSON.stringify(response));
        return response;
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
