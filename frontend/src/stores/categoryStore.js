import { create } from 'zustand';
import { categoryService } from '../services/categoryService';

export const useCategoryStore = create((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  fetchCategories: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await categoryService.getCategories(params);
      set({ categories: data, loading: false });
      return data;
    } catch (err) {
      set({ error: err.response?.data?.detail || err.message, loading: false });
      return [];
    }
  },

  createCategory: async (categoryData) => {
    set({ loading: true, error: null });
    try {
      const created = await categoryService.createCategory(categoryData);
      await get().fetchCategories();
      set({ loading: false });
      return created;
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message;
      set({ error: errMsg, loading: false });
      throw new Error(errMsg);
    }
  },

  updateCategory: async (id, categoryData) => {
    set({ loading: true, error: null });
    try {
      const updated = await categoryService.updateCategory(id, categoryData);
      await get().fetchCategories();
      set({ loading: false });
      return updated;
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message;
      set({ error: errMsg, loading: false });
      throw new Error(errMsg);
    }
  },

  deleteCategory: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await categoryService.deleteCategory(id);
      await get().fetchCategories();
      set({ loading: false });
      return res;
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message;
      set({ error: errMsg, loading: false });
      throw new Error(errMsg);
    }
  }
}));
