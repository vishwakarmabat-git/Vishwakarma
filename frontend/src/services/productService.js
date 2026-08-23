import { db } from '../data/db';
import apiClient from './apiClient';

export const productService = {
  getAllProducts: async () => {
    try {
      const response = await apiClient.get('/v1/products/');
      if (response && Array.isArray(response) && response.length > 0) {
        return response.map(p => ({
          ...p,
          id: p.id,
          name: p.name,
          category: p.category || p.category_slug || (p.category_id ? String(p.category_id) : 'single-blade'),
          category_slug: p.category_slug || p.category,
          category_name: p.category_name,
          price: Number(p.price) || 0,
          comparePrice: p.compare_price ? Number(p.compare_price) : (p.originalPrice || 0),
          originalPrice: p.originalPrice || (p.compare_price ? Number(p.compare_price) : 0),
          gst: p.gst !== undefined ? Number(p.gst) : (p.gst_percentage !== undefined ? Number(p.gst_percentage) : 12),
          stock: p.stock !== undefined ? Number(p.stock) : 10,
          weight: p.weight || '1160 - 1200g',
          grade: p.grade || 'Grade 1 Premium Willow',
          pressing: p.pressing || 'Standard Pressed',
          featured: Boolean(p.featured || p.is_featured),
          bestSeller: Boolean(p.bestSeller || p.is_bestseller),
          videoUrl: p.videoUrl || p.video_url || '',
          images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ['/assets/bat_single.png'],
          seoTitle: p.seoTitle || p.seo_title || `${p.name} | VK Bat House`,
          seoDescription: p.seoDescription || p.seo_description || `Buy handcrafted ${p.name} from Vishwakarma Bat House.`,
          specs: p.specs && typeof p.specs === 'object' ? p.specs : {
            handle: 'Premium Cane Handle',
            edges: '40mm Edges',
            spine: '62mm Spine',
            sweetspot: 'Mid Sweetspot'
          },
          variants: p.variants && typeof p.variants === 'object' ? p.variants : {
            weights: ['1140-1160g', '1160-1180g', '1180-1200g'],
            handles: ['Round Handle', 'Oval Handle']
          },
          tags: Array.isArray(p.tags) ? p.tags : (p.tags ? String(p.tags).split(',').map(s => s.trim()) : [])
        }));
      }
    } catch {
      // Offline / API down fallback
    }
    return db.getProducts();
  },
  createProduct: async (productData) => {
    try {
      const response = await apiClient.post('/v1/products/', productData);
      if (response && response.id) {
        return response;
      }
    } catch {
      // Offline / local fallback
    }
    return db.addProduct(productData);
  },
  updateProduct: async (id, productData) => {
    try {
      const response = await apiClient.put(`/v1/products/${id}`, productData);
      if (response && response.id) {
        return response;
      }
    } catch {
      // Offline / local fallback
    }
    return db.updateProduct(id, productData);
  },
  deleteProduct: async (id) => {
    try {
      const response = await apiClient.delete(`/v1/products/${id}`);
      if (response) {
        return true;
      }
    } catch {
      // Offline / local fallback
    }
    return db.deleteProduct(id);
  }
};

