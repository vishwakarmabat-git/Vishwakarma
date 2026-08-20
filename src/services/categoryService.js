import { db } from '../data/db';

export const categoryService = {
  getAllCategories: async () => {
    return db.getCategories();
  }
};
