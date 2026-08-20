import { db } from '../data/db';
import apiClient from './apiClient';

export const categoryService = {
  getAllCategories: async () => {
    try {
      const response = await apiClient.get('/categories/get_all.php');
      if (response && response.status === 'success' && Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch {
      // Offline fallback
    }
    return db.getCategories();
  }
};
