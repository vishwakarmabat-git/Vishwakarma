import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vk_auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle global errors (like 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      const isPaymentEndpoint = url.includes('razorpay');

      if (!isPaymentEndpoint) {
        localStorage.removeItem('vk_auth_token');
        localStorage.removeItem('vk_user');
        window.dispatchEvent(new Event('auth-changed'));
      }
    }
    return Promise.reject(error.response ? error.response.data : error);
  }
);

export default apiClient;
