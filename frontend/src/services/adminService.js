import apiClient from './apiClient';

export const adminService = {
  getOrders: async () => {
    try {
      const response = await apiClient.get('/orders/get_all.php');
      return response.status === 'success' ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch orders", error);
      return [];
    }
  },

  updateOrderStatus: async (id, status, notes = '') => {
    try {
      return await apiClient.put('/orders/update.php', { id, status, admin_notes: notes });
    } catch (error) {
      console.error("Failed to update order", error);
      throw error;
    }
  },
};
