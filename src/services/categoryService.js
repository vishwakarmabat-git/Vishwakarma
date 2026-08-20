import { db } from '../data/db';
import apiClient from './apiClient';

export const categoryService = {
  getAllCategories: async () => {
    try {
      const response = await apiClient.get('/categories/get_all.php');
      if (response && response.status === 'success' && Array.isArray(response.data) && response.data.length > 0) {
        return response.data.map(c => ({
          ...c,
          id: c.slug || String(c.id),
          slug: c.slug || c.id,
          name: c.name,
          price: Number(c.price) || 0,
          displayOrder: Number(c.display_order || c.displayOrder || 1),
          banner: c.banner_image || c.banner || '/assets/poster.jpg'
        }));
      }
    } catch {
      // Offline fallback
    }
    return db.getCategories();
  },
  createCategory: async (categoryData) => {
    try {
      const response = await apiClient.post('/categories/create.php', categoryData);
      if (response && response.status === 'success') {
        return response.data;
      }
    } catch {
      // Offline fallback
    }
    return db.addCategory(categoryData);
  },
  updateCategory: async (id, categoryData) => {
    try {
      const response = await apiClient.put('/categories/update.php', { id, ...categoryData });
      if (response && response.status === 'success') {
        return response.data;
      }
    } catch {
      // Offline fallback
    }
    return db.updateCategory(id, categoryData);
  },
  deleteCategory: async (id) => {
    try {
      const response = await apiClient.delete('/categories/delete.php?id=' + id);
      if (response && response.status === 'success') {
        return true;
      }
    } catch {
      // Offline fallback
    }
    return db.deleteCategory(id);
  }
};

