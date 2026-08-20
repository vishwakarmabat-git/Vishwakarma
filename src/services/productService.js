import { db } from '../data/db';
import apiClient from './apiClient';

export const productService = {
  getAllProducts: async () => {
    try {
      const response = await apiClient.get('/products/get_all.php');
      if (response && response.status === 'success' && Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch {
      // Offline / API down fallback
    }
    return db.getProducts();
  },
  createProduct: async (productData) => {
    try {
      const response = await apiClient.post('/products/create.php', productData);
      if (response && response.status === 'success') {
        return response.data;
      }
    } catch {
      // Offline / local fallback
    }
    return db.addProduct(productData);
  }
};
