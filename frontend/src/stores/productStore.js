import { create } from 'zustand';
import { productService } from '../services/productService';

export const useProductStore = create((set, get) => ({
  products: [],
  loading: false,
  error: null,

  fetchProducts: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await productService.getProducts(params);
      set({ products: data, loading: false });
      return data;
    } catch (err) {
      set({ error: err.response?.data?.detail || err.message, loading: false });
      return [];
    }
  },

  createProduct: async (productData) => {
    set({ loading: true, error: null });
    try {
      const created = await productService.createProduct(productData);
      await get().fetchProducts();
      set({ loading: false });
      return created;
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message;
      set({ error: errMsg, loading: false });
      throw new Error(errMsg);
    }
  },

  updateProduct: async (id, productData) => {
    set({ loading: true, error: null });
    try {
      const updated = await productService.updateProduct(id, productData);
      await get().fetchProducts();
      set({ loading: false });
      return updated;
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message;
      set({ error: errMsg, loading: false });
      throw new Error(errMsg);
    }
  },

  deleteProduct: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await productService.deleteProduct(id);
      await get().fetchProducts();
      set({ loading: false });
      return res;
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message;
      set({ error: errMsg, loading: false });
      throw new Error(errMsg);
    }
  }
}));
