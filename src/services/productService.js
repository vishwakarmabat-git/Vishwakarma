import { db } from '../data/db';

export const productService = {
  getAllProducts: async () => {
    return db.getProducts();
  },
  createProduct: async (productData) => {
    return db.addProduct(productData);
  }
};
