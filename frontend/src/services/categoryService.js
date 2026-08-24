import apiClient from './apiClient';

export const categoryService = {
  getCategories: async (params = {}) => {
    try {
      const response = await apiClient.get('/v1/categories/', { params });
      return Array.isArray(response) ? response : [];
    } catch (err) {
      console.error("Error fetching categories:", err);
      return [];
    }
  },

  getAllCategories: async (params = {}) => {
    return categoryService.getCategories(params);
  },

  getCategory: async (id) => {
    return apiClient.get(`/v1/categories/${id}`);
  },

  getCategoryBySlug: async (slug) => {
    return apiClient.get(`/v1/categories/slug/${slug}`);
  },

  getCategoryProducts: async (categoryId) => {
    try {
      const response = await apiClient.get(`/v1/categories/${categoryId}/products`);
      return Array.isArray(response) ? response : [];
    } catch (err) {
      console.error(`Error fetching products for category ${categoryId}:`, err);
      return [];
    }
  },

  createCategory: async (categoryData) => {
    return apiClient.post('/v1/categories/', {
      name: categoryData.name,
      slug: categoryData.slug || undefined,
      description: categoryData.description || '',
      banner_image: categoryData.banner_image || categoryData.banner || '',
      display_order: Number(categoryData.display_order ?? categoryData.displayOrder ?? 0),
      active: categoryData.active !== undefined ? Boolean(categoryData.active) : true
    });
  },

  updateCategory: async (id, categoryData) => {
    return apiClient.put(`/v1/categories/${id}`, {
      name: categoryData.name,
      slug: categoryData.slug || undefined,
      description: categoryData.description,
      banner_image: categoryData.banner_image || categoryData.banner,
      display_order: categoryData.display_order !== undefined ? Number(categoryData.display_order) : (categoryData.displayOrder !== undefined ? Number(categoryData.displayOrder) : undefined),
      active: categoryData.active !== undefined ? Boolean(categoryData.active) : undefined
    });
  },

  deleteCategory: async (id) => {
    return apiClient.delete(`/v1/categories/${id}`);
  }
};


