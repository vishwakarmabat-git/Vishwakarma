import { db } from '../data/db';
import apiClient from './apiClient';

export const categoryService = {
  getAllCategories: async () => {
    try {
      const response = await apiClient.get('/categories/get_all.php');
      if (response && response.status === 'success' && Array.isArray(response.data) && response.data.length > 0) {
        const mapped = response.data.map(c => ({
          ...c,
          id: c.slug || String(c.id),
          dbId: c.id, // preserve the real numeric database ID for update/delete
          slug: c.slug || c.id,
          name: c.name,
          price: Number(c.price) || 0,
          gst: Number(c.gst) || 12,
          displayOrder: Number(c.display_order || c.displayOrder || 1),
          banner: c.banner_image || c.banner || '/assets/poster.jpg'
        }));
        db.saveCategories(mapped);
        return mapped;
      }
    } catch {
      // Offline fallback
    }
    return db.getCategories();
  },
  createCategory: async (categoryData) => {
    const localCat = db.addCategory(categoryData);
    try {
      const response = await apiClient.post('/categories/create.php', {
        name: categoryData.name,
        description: categoryData.description || '',
        banner_image: categoryData.banner || categoryData.banner_image,
        display_order: categoryData.displayOrder || 0,
        price: categoryData.price || 0,
        gst: categoryData.gst || 12,
        active: 1
      });
      if (response && response.status === 'success') {
        return response.data;
      }
    } catch {
      // Offline fallback handled
    }
    return localCat;
  },
  updateCategory: async (id, categoryData, dbId) => {
    db.updateCategory(id, categoryData);
    // Use the numeric database ID for API calls, fall back to slug-based id
    const apiId = dbId || categoryData.dbId || id;
    try {
      const response = await apiClient.put('/categories/update.php', {
        id: apiId,
        name: categoryData.name,
        description: categoryData.description || '',
        banner_image: categoryData.banner || categoryData.banner_image,
        display_order: categoryData.displayOrder || 0,
        price: categoryData.price || 0,
        gst: categoryData.gst || 12,
        active: 1
      });
      if (response && response.status === 'success') {
        return response.data;
      }
    } catch {
      // Offline fallback handled
    }
    return true;
  },
  deleteCategory: async (id, dbId) => {
    db.deleteCategory(id);
    // Use the numeric database ID for API calls
    const apiId = dbId || id;
    try {
      const response = await apiClient.delete('/categories/delete.php', { data: { id: apiId } });
      if (response && response.status === 'success') {
        return true;
      }
    } catch {
      // Offline fallback handled
    }
    return true;
  }
};

