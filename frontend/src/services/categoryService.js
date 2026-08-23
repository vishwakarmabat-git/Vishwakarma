import { db } from '../data/db';
import apiClient from './apiClient';

export const categoryService = {
  getAllCategories: async () => {
    try {
      const response = await apiClient.get('/v1/categories/');
      if (response && Array.isArray(response) && response.length > 0) {
        const mapped = response.map(c => ({
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
    const slug = categoryData.slug || categoryData.name.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '');
    const localCat = db.addCategory(categoryData);
    try {
      const response = await apiClient.post('/v1/categories/', {
        name: categoryData.name,
        slug: slug,
        description: categoryData.description || '',
        banner_image: categoryData.banner || categoryData.banner_image,
        display_order: categoryData.displayOrder || 0,
        active: true
      });
      if (response && response.id) {
        return response;
      }
    } catch {
      // Offline fallback handled
    }
    return localCat;
  },
  updateCategory: async (id, categoryData, dbId) => {
    db.updateCategory(id, categoryData);
    const slug = categoryData.slug || categoryData.name.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '');
    const apiId = dbId || categoryData.dbId || id;
    try {
      const response = await apiClient.put(`/v1/categories/${apiId}`, {
        id: apiId,
        name: categoryData.name,
        slug: slug,
        description: categoryData.description || '',
        banner_image: categoryData.banner || categoryData.banner_image,
        display_order: categoryData.displayOrder || 0,
        active: true
      });
      if (response && response.id) {
        return response;
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
      const response = await apiClient.delete(`/v1/categories/${apiId}`);
      if (response) {
        return true;
      }
    } catch {
      // Offline fallback handled
    }
    return true;
  }
};

