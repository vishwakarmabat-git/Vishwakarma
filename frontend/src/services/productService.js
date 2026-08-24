import apiClient from './apiClient';

export const productService = {
  getProducts: async (params = {}) => {
    try {
      const response = await apiClient.get('/v1/products/', { params });
      return Array.isArray(response) ? response : [];
    } catch (err) {
      console.error("Error fetching products:", err);
      return [];
    }
  },

  getAllProducts: async (params = {}) => {
    return productService.getProducts(params);
  },

  getProduct: async (id) => {
    return apiClient.get(`/v1/products/${id}`);
  },

  getProductBySlug: async (slug) => {
    return apiClient.get(`/v1/products/slug/${slug}`);
  },

  createProduct: async (productData) => {
    const payload = {
      name: productData.name,
      category_id: Number(productData.category_id || productData.categoryId),
      sku: productData.sku || undefined,
      slug: productData.slug || undefined,
      short_description: productData.short_description || productData.shortDescription || (productData.tags ? (Array.isArray(productData.tags) ? productData.tags.join(', ') : productData.tags) : undefined),
      long_description: productData.long_description || productData.longDescription || productData.details || undefined,
      price: Number(productData.price) || 0,
      compare_price: productData.compare_price !== undefined ? Number(productData.compare_price) : (productData.comparePrice !== undefined ? Number(productData.comparePrice) : (productData.originalPrice !== undefined ? Number(productData.originalPrice) : undefined)),
      gst_percentage: Number(productData.gst_percentage ?? productData.gst ?? 12),
      stock: Number(productData.stock ?? 0),
      grade: productData.grade || undefined,
      pressing: productData.pressing || undefined,
      video_url: productData.video_url || productData.videoUrl || undefined,
      is_featured: Boolean(productData.is_featured ?? productData.featured ?? false),
      is_bestseller: Boolean(productData.is_bestseller ?? productData.bestSeller ?? false),
      status: productData.status || "active",
      seo_title: productData.seo_title || productData.seoTitle || undefined,
      seo_description: productData.seo_description || productData.seoDescription || undefined,
      images: Array.isArray(productData.images) ? productData.images : (productData.imagesString ? productData.imagesString.split(',').map(s => s.trim()).filter(Boolean) : []),
      specs: productData.specs || {
        handle: productData.handle || 'Singapore Cane Handle',
        edges: productData.edges || '40mm',
        spine: productData.spine || '62mm',
        sweetspot: productData.sweetspot || 'Mid'
      },
      variants: productData.variants || {
        weights: productData.weightsString ? productData.weightsString.split(',').map(s => s.trim()).filter(Boolean) : ['1160-1200g'],
        handles: productData.handlesString ? productData.handlesString.split(',').map(s => s.trim()).filter(Boolean) : ['Round Handle']
      },
      tags: Array.isArray(productData.tags) ? productData.tags : (productData.tags ? String(productData.tags).split(',').map(s => s.trim()).filter(Boolean) : [])
    };
    return apiClient.post('/v1/products/', payload);
  },

  updateProduct: async (id, productData) => {
    const payload = {
      name: productData.name,
      category_id: productData.category_id !== undefined ? Number(productData.category_id) : (productData.categoryId !== undefined ? Number(productData.categoryId) : undefined),
      sku: productData.sku,
      slug: productData.slug,
      short_description: productData.short_description || productData.shortDescription,
      long_description: productData.long_description || productData.longDescription || productData.details,
      price: productData.price !== undefined ? Number(productData.price) : undefined,
      compare_price: productData.compare_price !== undefined ? Number(productData.compare_price) : (productData.comparePrice !== undefined ? Number(productData.comparePrice) : (productData.originalPrice !== undefined ? Number(productData.originalPrice) : undefined)),
      gst_percentage: productData.gst_percentage !== undefined ? Number(productData.gst_percentage) : (productData.gst !== undefined ? Number(productData.gst) : undefined),
      stock: productData.stock !== undefined ? Number(productData.stock) : undefined,
      grade: productData.grade,
      pressing: productData.pressing,
      video_url: productData.video_url || productData.videoUrl,
      is_featured: productData.is_featured !== undefined ? Boolean(productData.is_featured) : (productData.featured !== undefined ? Boolean(productData.featured) : undefined),
      is_bestseller: productData.is_bestseller !== undefined ? Boolean(productData.is_bestseller) : (productData.bestSeller !== undefined ? Boolean(productData.bestSeller) : undefined),
      status: productData.status,
      seo_title: productData.seo_title || productData.seoTitle,
      seo_description: productData.seo_description || productData.seoDescription,
      images: Array.isArray(productData.images) ? productData.images : (productData.imagesString ? productData.imagesString.split(',').map(s => s.trim()).filter(Boolean) : undefined),
      specs: productData.specs,
      variants: productData.variants,
      tags: Array.isArray(productData.tags) ? productData.tags : (productData.tags ? String(productData.tags).split(',').map(s => s.trim()).filter(Boolean) : undefined)
    };
    return apiClient.put(`/v1/products/${id}`, payload);
  },

  deleteProduct: async (id) => {
    return apiClient.delete(`/v1/products/${id}`);
  }
};
