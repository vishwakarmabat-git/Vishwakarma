import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, ShoppingBag, FolderKanban, ClipboardList,
  Contact, FileText, Settings, ShieldAlert, Plus, Edit, Trash,
  CheckCircle, Truck, Package, Download, X, Eye, EyeOff, FileCode, Users,
  Lock, Mail, LogOut, CheckCircle2, ShieldCheck, AlertCircle,
  Copy, Image, Video, Check, RefreshCw, Globe, Server, HelpCircle, Menu
} from 'lucide-react';
import { db } from '../../data/db';
import { settingService } from '../../services/settingService';
import { apiClient } from '../../services/apiClient';

export default function AdminDashboard({ onBackToStore, onLogout, initialTab = 'overview' }) {
  const persistSetting = async (key, data, saveFn) => {
    try {
      await settingService.updateSettings({ [key]: JSON.stringify(data) });
    } catch (e) {
      console.warn('Backend save failed for ' + key, e);
    }
    saveFn(data);
  };
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isUploading, setIsUploading] = useState(false);

  const compressImage = (file, maxWidth = 1920, maxHeight = 1920, quality = 0.82) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new window.Image();
        img.src = e.target.result;
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          }, 'image/jpeg', quality);
        };
        img.onerror = () => reject(new Error('Image load failed'));
      };
      reader.onerror = () => reject(new Error('FileReader failed'));
    });
  };

  const uploadImage = async (file) => {
    setIsUploading(true);
    try {
      let uploadFile = file;
      // Only compress actual images over 500KB
      if (file.type && file.type.startsWith('image/') && file.size > 500 * 1024) {
        uploadFile = await compressImage(file);
      }
      const formData = new FormData();
      formData.append('image', uploadFile);
      const res = await apiClient.post('/upload/image.php', formData);
      setIsUploading(false);
      if (res && res.status === 'success' && res.data?.url) {
        return res.data.url;
      } else {
        const errMsg = (res && res.message) || "Failed to upload image.";
        console.error("Image upload rejected by server:", errMsg);
        alert(errMsg);
        return null;
      }
    } catch(e) {
      const errMsg = (e && e.message) || "Network error during upload. Check your connection and server status.";
      console.error("Image upload failed:", errMsg, e);
      alert(errMsg + "\n\nFalling back to local storage (image may not be visible to other users).");
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('FileReader error'));
          reader.readAsDataURL(file);
        });
        setIsUploading(false);
        return dataUrl;
      } catch (fallbackErr) {
        console.error("Base64 fallback also failed:", fallbackErr);
        setIsUploading(false);
        return null;
      }
    }
  };
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [leads, setLeads] = useState([]);
  const [cms, setCms] = useState({});
  const [blogs, setBlogs] = useState([]);
  
  // New collection states
  const [banners, setBanners] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [homepageSections, setHomepageSections] = useState([]);
  const [settings, setSettings] = useState({});
  const [customers, setCustomers] = useState([]);
  const [reviewsSubTab, setReviewsSubTab] = useState('testimonials');
  const [policiesSubTab, setPoliciesSubTab] = useState('faqs');
  const [cmsSubTab, setCmsSubTab] = useState('seo');

  // Admin Authentication State
  const [adminUser, setAdminUser] = useState(null);

  // New features state variables
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [qaSearchQuery, setQaSearchQuery] = useState('');
  const [qaList, setQaList] = useState([]);
  const [typography, setTypography] = useState({ headingFont: 'Syne', bodyFont: 'Inter' });
  const [navigationList, setNavigationList] = useState([]);
  const [brandStory, setBrandStory] = useState({});
  const [faqs, setFaqs] = useState([]);
  const [operators, setOperators] = useState([]);
  const [emailConfig, setEmailConfig] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Modals / sub-state additions
  const [showOperatorModal, setShowOperatorModal] = useState(false);
  const [editingOperator, setEditingOperator] = useState(null);
  const [operatorForm, setOperatorForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' });

  const [showNavLinkModal, setShowNavLinkModal] = useState(false);
  const [editingNavLink, setEditingNavLink] = useState(null);
  const [navLinkForm, setLinkForm] = useState({ label: '', link: '#', active: true, displayOrder: 1 });

  // Q&A and Blog editing additions
  const [editingQaId, setEditingQaId] = useState(null);
  const [editingBlog, setEditingBlog] = useState(null);

  // Testimonials editing/adding additions
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [testimonialForm, setTestimonialForm] = useState({ reviewerName: '', reviewerRole: '', stars: 5, text: '', videoUrl: '', approved: true });

  // Craft Timeline additions
  const [craftSteps, setCraftSteps] = useState([]);
  const [showCraftModal, setShowCraftModal] = useState(false);
  const [editingCraftStep, setEditingCraftStep] = useState(null);
  const [craftForm, setCraftForm] = useState({ title: '', desc: '' });

  // Product modal form state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '', category: '', price: '', gst: 12, stock: '',
    weight: '1160 - 1200g', grade: 'Grade 1 Premium Kashmir Willow',
    pressing: 'Standard Pressed', handle: 'Premium Cane Handle',
    edges: '40mm Edges', spine: '62mm Spine', sweetspot: 'Mid Sweetspot',
    tags: '', featured: false, bestSeller: false,
    seoTitle: '', seoDescription: '', videoUrl: '',
    imagesString: '/assets/bat_single.png, /assets/bat_double.png',
    weightsString: '1140-1160g, 1160-1180g, 1180-1200g',
    handlesString: 'Round Handle, Oval Handle',
    originalPrice: '', salePrice: '',
    details: '', sizeGuide: '', materials: '', shippingTerms: ''
  });

  // Banner form state
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    title: '', subtitle: '', desktopImage: '/assets/poster.jpg',
    mobileImage: '/assets/poster.jpg', videoUrl: '',
    ctaText: 'Explore', ctaLink: '#categories', displayOrder: 1, active: true
  });

  // Gallery form state
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryForm, setGalleryForm] = useState({
    title: '', type: 'image', url: '/assets/poster.jpg', album: 'Workshop', coverImage: false
  });

  // Category Form State
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', price: '', gst: 12, displayOrder: '', banner: '/assets/poster.jpg' });

  // Batting Video Reviews state
  const [demoVideos, setDemoVideos] = useState([]);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrlForm, setVideoUrlForm] = useState('');

  // Blog Form State
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [blogForm, setBlogForm] = useState({ title: '', content: '', author: 'VK Admin', image: '/assets/poster.jpg' });

  // Invoice / Details Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Reload data
  const reloadData = () => {
    setProducts(db.getProducts());
    setCategories(db.getCategories());
    setOrders(db.getOrders());
    setLeads(db.getLeads());
    setCms(db.getCms());
    setBlogs(db.getBlogs());
    setBanners(db.getBanners());
    setGallery(db.getGallery());
    setTestimonials(db.getTestimonials());
    setDemoVideos(db.getDemoVideos());
    setHomepageSections(db.getHomepageSections());
    setSettings(db.getSettings());
    setCustomers(db.getCustomers());
    setReviews(db.getReviews());

    // Load new collections
    setQaList(db.getQA());
    setTypography(db.getTypography());
    setNavigationList(db.getNavigation());
    setBrandStory(db.getBrandStory());
    setFaqs(db.getFaqs());
    setOperators(db.getOperators());
    setEmailConfig(db.getEmailConfig());
    setAuditLogs(db.getLogs());
    setCraftSteps(db.getCraftSteps());
  };

  useEffect(() => {
    // Ensure database is initialized (needed when navigating directly to admin)
    db.init();
    // Check active admin session
    const activeAdmin = db.getAdminSession();
    if (activeAdmin) {
      setAdminUser(activeAdmin);
    }
    reloadData();
  }, []);

  const handleAdminLogout = () => {
    if (adminUser) db.addLog("Admin console locked / logged out", adminUser.email);
    db.logoutAdmin();
    setAdminUser(null);
    if (onLogout) {
      onLogout();
    } else {
      onBackToStore();
    }
  };

  // Check Role Permissions
  const hasAccess = (tab) => {
    if (!adminUser) return false;
    const role = adminUser.role;
    if (role === 'super-admin') return true;
    if (role === 'staff' && ['overview', 'orders', 'products'].includes(tab)) return true;
    if (role === 'content-manager' && ['overview', 'cms', 'blogs', 'banners', 'gallery', 'testimonials', 'builder', 'qa', 'typography', 'navigation', 'socials', 'policies', 'craft'].includes(tab)) return true;
    if (role === 'sales-team' && ['overview', 'leads', 'orders'].includes(tab)) return true;
    return false;
  };

  const MAX_IMG_SIZE = 10 * 1024 * 1024;

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    const oversized = files.filter(f => f.size > MAX_IMG_SIZE);
    if (oversized.length > 0) {
      alert(`The following files exceed the 10MB limit and were skipped:\n${oversized.map(f => `  - ${f.name} (${(f.size / 1024 / 1024).toFixed(1)}MB)`).join('\n')}`);
    }

    const validFiles = files.filter(f => f.size <= MAX_IMG_SIZE);
    if (validFiles.length === 0) return;

    const uploadPromises = validFiles.map(file => uploadImage(file).catch(() => null));
    const uploadedUrls = await Promise.all(uploadPromises);
    const validUrls = uploadedUrls.filter(Boolean);
    if (validUrls.length === 0) return;

    const currentList = productForm.imagesString
      ? productForm.imagesString.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const updatedList = [...currentList, ...validUrls];
    setProductForm(prev => ({
      ...prev,
      imagesString: updatedList.join(', ')
    }));
  };

  // Product CRUD
  const handleProductSubmit = (e) => {
    e.preventDefault();
    const imagesArray = productForm.imagesString.split(',').map(img => img.trim()).filter(Boolean);
    const weightsArray = productForm.weightsString.split(',').map(w => w.trim()).filter(Boolean);
    const handlesArray = productForm.handlesString.split(',').map(h => h.trim()).filter(Boolean);

    const cleanProduct = {
      name: productForm.name,
      category: productForm.category || categories[0]?.id || 'single-blade',
      price: Number(productForm.price),
      gst: Number(productForm.gst),
      stock: Number(productForm.stock),
      weight: productForm.weight,
      grade: productForm.grade,
      pressing: productForm.pressing,
      specs: {
        handle: productForm.handle,
        edges: productForm.edges,
        spine: productForm.spine,
        sweetspot: productForm.sweetspot
      },
      variants: {
        weights: weightsArray,
        handles: handlesArray
      },
      tags: productForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      featured: productForm.featured,
      bestSeller: productForm.bestSeller,
      videoUrl: productForm.videoUrl,
      images: imagesArray,
      seoTitle: productForm.seoTitle || `${productForm.name} | VK Bat House`,
      seoDescription: productForm.seoDescription || `Buy handcrafted ${productForm.name} from Vishwakarma Bat House.`,
      
      // New extended fields
      originalPrice: Number(productForm.originalPrice || productForm.price),
      salePrice: Number(productForm.salePrice || productForm.price),
      details: productForm.details,
      sizeGuide: productForm.sizeGuide,
      materials: productForm.materials,
      shippingTerms: productForm.shippingTerms
    };

    if (editingProduct) {
      db.updateProduct(editingProduct.id, cleanProduct);
      db.addLog("Updated product details for ID: " + editingProduct.id);
    } else {
      const newProd = db.addProduct(cleanProduct);
      db.addLog("Added new product ID: " + newProd.id);
    }

    setShowProductModal(false);
    setEditingProduct(null);
    reloadData();
  };

  const handleEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      category: prod.category,
      price: prod.price,
      gst: prod.gst,
      stock: prod.stock,
      weight: prod.weight,
      grade: prod.grade,
      pressing: prod.pressing,
      handle: prod.specs?.handle || 'Premium Cane Handle',
      edges: prod.specs?.edges || '40mm Edges',
      spine: prod.specs?.spine || '62mm Spine',
      sweetspot: prod.specs?.sweetspot || 'Mid Sweetspot',
      tags: prod.tags ? prod.tags.join(', ') : '',
      featured: prod.featured || false,
      bestSeller: prod.bestSeller || false,
      videoUrl: prod.videoUrl || '',
      imagesString: prod.images ? prod.images.join(', ') : '/assets/bat_single.png',
      weightsString: prod.variants?.weights ? prod.variants.weights.join(', ') : '1140-1160g, 1170-1190g',
      handlesString: prod.variants?.handles ? prod.variants.handles.join(', ') : 'Round Handle, Oval Handle',
      seoTitle: prod.seoTitle || '',
      seoDescription: prod.seoDescription || '',
      
      // Load extended fields
      originalPrice: prod.originalPrice || prod.price || '',
      salePrice: prod.salePrice || prod.price || '',
      details: prod.details || '',
      sizeGuide: prod.sizeGuide || '',
      materials: prod.materials || '',
      shippingTerms: prod.shippingTerms || ''
    });
    setShowProductModal(true);
  };

  const handleDuplicateProduct = (prod) => {
    const duplicated = {
      ...prod,
      name: `${prod.name} (Copy)`,
      featured: false,
      bestSeller: false
    };
    db.addProduct(duplicated);
    reloadData();
  };

  const handleDeleteProduct = (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      db.deleteProduct(id);
      reloadData();
    }
  };

  // Category CRUD
  const handleEditCategory = (cat) => {
    setEditingCategory(cat);
    setCatForm({
      name: cat.name,
      price: cat.price,
      gst: cat.gst !== undefined ? cat.gst : 12,
      displayOrder: cat.displayOrder,
      banner: cat.banner || '/assets/poster.jpg'
    });
    setShowCatModal(true);
  };

  const handleCatSubmit = (e) => {
    e.preventDefault();
    const cleanCat = {
      name: catForm.name,
      price: Number(catForm.price),
      gst: Number(catForm.gst),
      displayOrder: Number(catForm.displayOrder),
      banner: catForm.banner
    };
    if (editingCategory) {
      db.updateCategory(editingCategory.id, cleanCat);
    } else {
      db.addCategory(cleanCat);
    }
    setShowCatModal(false);
    setEditingCategory(null);
    reloadData();
  };

  // Banner CRUD
  const handleBannerSubmit = (e) => {
    e.preventDefault();
    const cleanBanner = {
      title: bannerForm.title,
      subtitle: bannerForm.subtitle,
      desktopImage: bannerForm.desktopImage,
      mobileImage: bannerForm.mobileImage,
      videoUrl: bannerForm.videoUrl,
      ctaText: bannerForm.ctaText,
      ctaLink: bannerForm.ctaLink,
      displayOrder: Number(bannerForm.displayOrder),
      active: bannerForm.active
    };

    if (editingBanner) {
      db.updateBanner(editingBanner.id, cleanBanner);
    } else {
      db.addBanner(cleanBanner);
    }

    setShowBannerModal(false);
    setEditingBanner(null);
    reloadData();
  };

  const handleDeleteBanner = (id) => {
    if (confirm("Remove this banner?")) {
      db.deleteBanner(id);
      reloadData();
    }
  };

  // Gallery CRUD
  const handleGallerySubmit = (e) => {
    e.preventDefault();
    db.addGalleryItem(galleryForm);
    setShowGalleryModal(false);
    setGalleryForm({ title: '', type: 'image', url: '/assets/poster.jpg', album: 'Workshop', coverImage: false });
    reloadData();
  };

  const handleDeleteGallery = (id) => {
    if (confirm("Delete this gallery item?")) {
      db.deleteGalleryItem(id);
      reloadData();
    }
  };

  // Testimonial Approval / CRUD
  const handleApproveTestimonial = (id) => {
    db.approveTestimonial(id);
    reloadData();
  };

  const handleDeleteTestimonial = (id) => {
    if (confirm("Delete this testimonial?")) {
      db.deleteTestimonial(id);
      reloadData();
    }
  };

  const handleTestimonialSubmit = (e) => {
    e.preventDefault();
    if (editingTestimonial) {
      db.updateTestimonial(editingTestimonial.id, testimonialForm);
    } else {
      db.addTestimonial(testimonialForm);
    }
    setShowTestimonialModal(false);
    setEditingTestimonial(null);
    setTestimonialForm({ reviewerName: '', reviewerRole: '', stars: 5, text: '', videoUrl: '', approved: true });
    reloadData();
  };

  // Blog CRUD
  const handleBlogSubmit = (e) => {
    e.preventDefault();
    if (editingBlog) {
      db.updateBlog(editingBlog.id, blogForm);
    } else {
      db.addBlog(blogForm);
    }
    setShowBlogModal(false);
    setEditingBlog(null);
    setBlogForm({ title: '', content: '', author: 'VK Admin', image: '/assets/poster.jpg' });
    reloadData();
  };

  // Craft steps CRUD
  const handleCraftSubmit = (e) => {
    e.preventDefault();
    if (editingCraftStep) {
      db.updateCraftStep(editingCraftStep.id, craftForm);
    } else {
      db.addCraftStep(craftForm);
    }
    setShowCraftModal(false);
    setEditingCraftStep(null);
    setCraftForm({ title: '', desc: '' });
    reloadData();
  };

  const handleDeleteBlog = (id) => {
    if (confirm("Delete this blog post?")) {
      db.deleteBlog(id);
      reloadData();
    }
  };

  const handleNavLinkSubmit = (e) => {
    e.preventDefault();
    const cleanLink = {
      ...navLinkForm,
      displayOrder: Number(navLinkForm.displayOrder)
    };

    let updatedList = [...navigationList];
    if (editingNavLink) {
      const idx = updatedList.findIndex(n => n.id === editingNavLink.id);
      if (idx !== -1) {
        updatedList[idx] = cleanLink;
      }
    } else {
      const newLink = {
        ...cleanLink,
        id: "nav-" + Math.floor(1000 + Math.random() * 9000)
      };
      updatedList.push(newLink);
    }

    persistSetting('navigation', updatedList, (d) => db.saveNavigation(d));
    setShowNavLinkModal(false);
    setEditingNavLink(null);
    reloadData();
  };

  const handleFaqSubmit = (e) => {
    e.preventDefault();
    if (editingFaq) {
      db.updateFaq(editingFaq.id, faqForm);
    } else {
      db.addFaq(faqForm.question, faqForm.answer);
    }
    setShowFaqModal(false);
    setEditingFaq(null);
    reloadData();
  };

  const handleOperatorSubmit = (e) => {
    e.preventDefault();
    if (editingOperator && typeof editingOperator === 'object') {
      db.updateOperator(editingOperator.email, operatorForm);
    } else {
      const res = db.addOperator(operatorForm);
      if (!res.success) {
        alert(res.message);
        return;
      }
    }
    setShowOperatorModal(false);
    setEditingOperator(null);
    setOperatorForm({ name: '', email: '', password: '', role: 'staff' });
    reloadData();
  };

  // CSV Exporter for Orders
  const exportOrdersCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Order ID,Date,Customer,Phone,Email,Bat Model,Specs,Price,GST,Total,Status\n";

    orders.forEach(o => {
      const row = `"${o.id}","${o.date}","${o.customerName}","${o.phone}","${o.email}","${o.batName}","${o.specs || ''}",${o.price},${o.gst},${o.total},"${o.status}"`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VK_BatHouse_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Customer Management
  const handleToggleBlockCustomer = (id) => {
    db.toggleBlockCustomer(id);
    reloadData();
  };

  // Settings Save
  const handleSaveSettings = (e) => {
    e.preventDefault();
    persistSetting('settings', settings, (d) => db.saveSettings(d));
    alert("Global Settings Saved Successfully!");
    reloadData();
  };

  // Homepage Builder
  const handleToggleSection = (sectionId) => {
    const updated = homepageSections.map(s => {
      if (s.id === sectionId) return { ...s, active: !s.active };
      return s;
    });
    setHomepageSections(updated);
    persistSetting('homepageSections', updated, (d) => db.saveHomepageSections(d));
  };

  const handleMoveSection = (idx, direction) => {
    const updated = [...homepageSections];
    if (direction === 'up' && idx > 0) {
      const temp = updated[idx];
      updated[idx] = updated[idx - 1];
      updated[idx - 1] = temp;
    } else if (direction === 'down' && idx < updated.length - 1) {
      const temp = updated[idx];
      updated[idx] = updated[idx + 1];
      updated[idx + 1] = temp;
    }
    // Reassign display orders
    updated.forEach((s, i) => s.displayOrder = i + 1);
    setHomepageSections(updated);
    persistSetting('homepageSections', updated, (d) => db.saveHomepageSections(d));
  };

  // Status transitions
  const handleUpdateOrderStatus = (id, status) => {
    db.updateOrderStatus(id, status, "Updated by Store Admin");
    reloadData();
  };

  // Invoice generator
  const generateInvoicePDF = (order) => {
    const printWindow = window.open('', '_blank');
    const invoiceHtml = `
      <html>
      <head>
        <title>Invoice - ${order.id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 40px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #a30000; padding-bottom: 20px; margin-bottom: 30px; }
          .brand { font-size: 24px; font-weight: bold; color: #111; }
          .invoice-details { text-align: right; font-size: 14px; color: #555; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .bill-to { font-size: 14px; }
          .bill-to h4 { margin: 0 0 8px; font-size: 16px; color: #a30000; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f9f9f9; padding: 12px; font-weight: bold; border-bottom: 2px solid #ddd; text-align: left; }
          td { padding: 12px; border-bottom: 1px solid #eee; }
          .totals { text-align: right; font-size: 16px; font-weight: bold; }
          .totals-row { display: flex; justify-content: flex-end; gap: 20px; padding: 8px 0; }
          .grand-total { border-top: 2px solid #a30000; font-size: 18px; color: #a30000; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">VK BAT HOUSE</div>
            <div style="font-size:12px;color:#777">Uttarsanda Bhalej Road, Chaklasi 387315</div>
          </div>
          <div class="invoice-details">
            <h2 style="margin:0;color:#a30000">TAX INVOICE</h2>
            <div>Invoice No: <strong>${order.id}</strong></div>
            <div>Date: ${order.date}</div>
          </div>
        </div>
        <div class="meta-grid">
          <div class="bill-to">
            <h4>Customer Details</h4>
            <strong>Name:</strong> ${order.customerName}<br/>
            <strong>Phone:</strong> ${order.phone}<br/>
            <strong>Email:</strong> ${order.email}<br/>
            <strong>Specs:</strong> ${order.specs || 'Standard'}<br/>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Product / Description</th>
              <th style="text-align:right">Quantity</th>
              <th style="text-align:right">Unit Price</th>
              <th style="text-align:right">GST Amount</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${order.batName}</strong> - Handcrafted Premium Cricket Bat</td>
              <td style="text-align:right">1</td>
              <td style="text-align:right">₹${order.price.toLocaleString('en-IN')}</td>
              <td style="text-align:right">₹${order.gst.toLocaleString('en-IN')}</td>
              <td style="text-align:right">₹${order.total.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
        <div class="totals">
          <div class="totals-row"><span>Subtotal:</span><span>₹${order.price.toLocaleString('en-IN')}</span></div>
          <div class="totals-row"><span>GST Amount:</span><span>₹${order.gst.toLocaleString('en-IN')}</span></div>
          <div class="totals-row grand-total"><span>Grand Total:</span><span>₹${order.total.toLocaleString('en-IN')}</span></div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    printWindow.print();
  };

  // Metrics
  const totalRevenue = orders.reduce((acc, o) => acc + (o.status === 'delivered' ? o.total : 0), 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const newLeadsCount = leads.filter(l => l.status === 'New').length;

  /* RENDER PROTECTED LOGIN GATE IF NO ADMIN USER SESSION EXISTS */
  if (!adminUser) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08080b', color: '#fff' }}>Loading Admin Console...</div>;
  }

  // Dashboard Tab selection failsafe
  const visibleTab = hasAccess(activeTab) ? activeTab : (adminUser.role === 'sales-team' ? 'leads' : (adminUser.role === 'content-manager' ? 'cms' : 'overview'));

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="admin-sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/assets/logo.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
          <div>
            <h3 style={{ fontSize: '0.95rem', color: '#fff', margin: 0 }}>VK Bat House</h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 600 }}>ADMIN MODULE</span>
          </div>
        </div>

        {/* User Role Card */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border)',
          padding: '12px',
          fontSize: '0.8rem'
        }}>
          <span style={{ color: 'var(--muted)', fontSize: '0.7rem', display: 'block', textTransform: 'uppercase' }}>Logged in as</span>
          <strong style={{ color: '#fff', display: 'block', margin: '2px 0 6px' }}>{adminUser.name}</strong>
          <span className="badge badge-gold" style={{ fontSize: '0.65rem', background: '#a30000', color: '#fff' }}>{adminUser.role.toUpperCase()}</span>
        </div>

        {/* Tab Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1, overflowY: 'auto' }}>
          {hasAccess('overview') && (
            <div onClick={() => setActiveTab('overview')} className={`admin-menu-item ${visibleTab === 'overview' ? 'active' : ''}`}>
              <LayoutDashboard size={16} /> Overview
            </div>
          )}
          {hasAccess('products') && (
            <div onClick={() => setActiveTab('products')} className={`admin-menu-item ${visibleTab === 'products' ? 'active' : ''}`}>
              <ShoppingBag size={16} /> Products
            </div>
          )}
          {hasAccess('categories') && (
            <div onClick={() => setActiveTab('categories')} className={`admin-menu-item ${visibleTab === 'categories' ? 'active' : ''}`}>
              <FolderKanban size={16} /> Categories
            </div>
          )}
          {hasAccess('banners') && (
            <div onClick={() => setActiveTab('banners')} className={`admin-menu-item ${visibleTab === 'banners' ? 'active' : ''}`}>
              <Image size={16} /> Banners Slider
            </div>
          )}
          {hasAccess('builder') && (
            <div onClick={() => setActiveTab('builder')} className={`admin-menu-item ${visibleTab === 'builder' ? 'active' : ''}`}>
              <Server size={16} /> Homepage Builder
            </div>
          )}
          {hasAccess('gallery') && (
            <div onClick={() => setActiveTab('gallery')} className={`admin-menu-item ${visibleTab === 'gallery' ? 'active' : ''}`}>
              <Copy size={16} /> Social Hub (Insta Grid)
            </div>
          )}
          {hasAccess('testimonials') && (
            <div onClick={() => setActiveTab('testimonials')} className={`admin-menu-item ${visibleTab === 'testimonials' ? 'active' : ''}`}>
              <CheckCircle size={16} /> Reviews & Ratings ({testimonials.filter(t => !t.approved).length + reviews.filter(r => !r.approved).length})
            </div>
          )}
          {hasAccess('orders') && (
            <div onClick={() => setActiveTab('orders')} className={`admin-menu-item ${visibleTab === 'orders' ? 'active' : ''}`}>
              <ClipboardList size={16} /> Orders ({pendingOrdersCount})
            </div>
          )}
          {hasAccess('leads') && (
            <div onClick={() => setActiveTab('leads')} className={`admin-menu-item ${visibleTab === 'leads' ? 'active' : ''}`}>
              <Contact size={16} /> Leads ({newLeadsCount})
            </div>
          )}
          {hasAccess('customers') && (
            <div onClick={() => setActiveTab('customers')} className={`admin-menu-item ${visibleTab === 'customers' ? 'active' : ''}`}>
              <Users size={16} /> Customers Directory
            </div>
          )}
          {hasAccess('cms') && (
            <div onClick={() => setActiveTab('cms')} className={`admin-menu-item ${visibleTab === 'cms' ? 'active' : ''}`}>
              <Globe size={16} /> SEO & Metadata
            </div>
          )}
          {hasAccess('blogs') && (
            <div onClick={() => setActiveTab('blogs')} className={`admin-menu-item ${visibleTab === 'blogs' ? 'active' : ''}`}>
              <FileText size={16} /> Blogs
            </div>
          )}
          {hasAccess('settings') && (
            <div onClick={() => setActiveTab('settings')} className={`admin-menu-item ${visibleTab === 'settings' ? 'active' : ''}`}>
              <Settings size={16} /> Store Settings
            </div>
          )}
          {hasAccess('qa') && (
            <div onClick={() => setActiveTab('qa')} className={`admin-menu-item ${visibleTab === 'qa' ? 'active' : ''}`}>
              <HelpCircle size={16} /> Q&A Manager ({qaList.filter(q => !q.answer).length})
            </div>
          )}
          {hasAccess('typography') && (
            <div onClick={() => setActiveTab('typography')} className={`admin-menu-item ${visibleTab === 'typography' ? 'active' : ''}`}>
              <FileCode size={16} /> Typography CMS
            </div>
          )}
          {hasAccess('navigation') && (
            <div onClick={() => setActiveTab('navigation')} className={`admin-menu-item ${visibleTab === 'navigation' ? 'active' : ''}`}>
              <Menu size={16} /> Header Navigation
            </div>
          )}
          {hasAccess('socials') && (
            <div onClick={() => setActiveTab('socials')} className={`admin-menu-item ${visibleTab === 'socials' ? 'active' : ''}`}>
              <Globe size={16} /> Socials & Footer CMS
            </div>
          )}
          {hasAccess('policies') && (
            <div onClick={() => setActiveTab('policies')} className={`admin-menu-item ${visibleTab === 'policies' ? 'active' : ''}`}>
              <ClipboardList size={16} /> Policies & FAQs
            </div>
          )}
          {hasAccess('security') && (
            <div onClick={() => setActiveTab('security')} className={`admin-menu-item ${visibleTab === 'security' ? 'active' : ''}`}>
              <Lock size={16} /> Security & Event Logs
            </div>
          )}
          {hasAccess('backups') && (
            <div onClick={() => setActiveTab('backups')} className={`admin-menu-item ${visibleTab === 'backups' ? 'active' : ''}`}>
              <RefreshCw size={16} /> Database Backups
            </div>
          )}
          {hasAccess('emails') && (
            <div onClick={() => setActiveTab('emails')} className={`admin-menu-item ${visibleTab === 'emails' ? 'active' : ''}`}>
              <Mail size={16} /> Email Management
            </div>
          )}
          {hasAccess('roles') && (
            <div onClick={() => setActiveTab('roles')} className={`admin-menu-item ${visibleTab === 'roles' ? 'active' : ''}`}>
              <Users size={16} /> Admin Roles & Team
            </div>
          )}
          {hasAccess('craft') && (
            <div onClick={() => setActiveTab('craft')} className={`admin-menu-item ${visibleTab === 'craft' ? 'active' : ''}`}>
              <FileCode size={16} /> Manage The Craft
            </div>
          )}
        </nav>

        {/* Logout Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={handleAdminLogout}
            className="btn btn-primary"
            style={{ padding: '10px', fontSize: '0.8rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <LogOut size={14} /> Lock Dashboard
          </button>
          <button
            onClick={onBackToStore}
            className="btn btn-secondary"
            style={{ padding: '10px', fontSize: '0.8rem', width: '100%', border: '1px solid var(--border)' }}
          >
            Return to Store
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="admin-body">
        
        {/* OVERVIEW PANEL */}
        {visibleTab === 'overview' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Overview Dashboard</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Operations summary and performance metrics.</p>
              </div>
              <div className="badge badge-gold" style={{ background: '#a30000', color: '#fff' }}>Live Database</div>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Delivered Revenue</div>
                <div className="metric-value">₹{totalRevenue.toLocaleString('en-IN')}</div>
                <div className="metric-change positive">📈 +18.4% this month</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Pending Orders</div>
                <div className="metric-value">{pendingOrdersCount}</div>
                <div className="metric-change negative">⚠️ Action required</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Total Catalog</div>
                <div className="metric-value">{products.length} bats</div>
                <div className="metric-change positive">🔥 {categories.length} Categories</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Callback Leads</div>
                <div className="metric-value">{newLeadsCount}</div>
                <div className="metric-change positive">⚡ Custom weights</div>
              </div>
            </div>

            {/* Weekly Sales Performance & Fit Breakdown Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              {/* Weekly Sales Chart */}
              <div className="glass-card" style={{ padding: '24px', background: '#121215', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '16px' }}>Weekly Sales Performance</h3>
                <div style={{ height: '220px', position: 'relative' }}>
                  <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%' }}>
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" />
                    <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(255,255,255,0.05)" />
                    <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.05)" />
                    <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.1)" />
                    
                    <path d="M 40 170 Q 113 90 186 110 T 332 50 T 480 80 L 480 170 L 40 170 Z" fill="url(#chartGrad)" />
                    <path d="M 40 170 Q 113 90 186 110 T 332 50 T 480 80" fill="none" stroke="var(--gold)" strokeWidth="3" />
                    
                    <circle cx="40" cy="170" r="4" fill="#fff" stroke="var(--gold)" strokeWidth="2" />
                    <circle cx="113" cy="90" r="4" fill="#fff" stroke="var(--gold)" strokeWidth="2" />
                    <circle cx="186" cy="110" r="4" fill="#fff" stroke="var(--gold)" strokeWidth="2" />
                    <circle cx="259" cy="80" r="4" fill="#fff" stroke="var(--gold)" strokeWidth="2" />
                    <circle cx="332" cy="50" r="4" fill="#fff" stroke="var(--gold)" strokeWidth="2" />
                    <circle cx="405" cy="65" r="4" fill="#fff" stroke="var(--gold)" strokeWidth="2" />
                    <circle cx="480" cy="80" r="4" fill="#fff" stroke="var(--gold)" strokeWidth="2" />
                    
                    <text x="40" y="190" fill="var(--muted)" fontSize="10" textAnchor="middle">Mon</text>
                    <text x="113" y="190" fill="var(--muted)" fontSize="10" textAnchor="middle">Tue</text>
                    <text x="186" y="190" fill="var(--muted)" fontSize="10" textAnchor="middle">Wed</text>
                    <text x="259" y="190" fill="var(--muted)" fontSize="10" textAnchor="middle">Thu</text>
                    <text x="332" y="190" fill="var(--muted)" fontSize="10" textAnchor="middle">Fri</text>
                    <text x="405" y="190" fill="var(--muted)" fontSize="10" textAnchor="middle">Sat</text>
                    <text x="480" y="190" fill="var(--muted)" fontSize="10" textAnchor="middle">Sun</text>
                    
                    <text x="30" y="24" fill="var(--muted)" fontSize="9" textAnchor="end">₹50K</text>
                    <text x="30" y="74" fill="var(--muted)" fontSize="9" textAnchor="end">₹25K</text>
                    <text x="30" y="124" fill="var(--muted)" fontSize="9" textAnchor="end">₹10K</text>
                    <text x="30" y="174" fill="var(--muted)" fontSize="9" textAnchor="end">₹0</text>
                  </svg>
                </div>
              </div>

              {/* Fit Categories Breakdown */}
              <div className="glass-card" style={{ padding: '24px', background: '#121215', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '16px' }}>Blade Pressing & Fit Breakdown</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'center', height: '220px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span>Triple Pressed Hard (Explosive Ping)</span>
                      <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>45%</span>
                    </div>
                    <div style={{ height: '6px', background: '#222', width: '100%', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--gold)', width: '45%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span>Standard Double Pressed (Optimal Balance)</span>
                      <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>35%</span>
                    </div>
                    <div style={{ height: '6px', background: '#222', width: '100%', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--gold)', width: '35%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span>Light Press (Natural Blade Pickup)</span>
                      <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>20%</span>
                    </div>
                    <div style={{ height: '6px', background: '#222', width: '100%', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--gold)', width: '20%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              {/* Category Statistics */}
              <div className="glass-card" style={{ padding: '24px', background: '#121215', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '20px' }}>Top Selling Categories</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {categories.map((c, i) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justify: 'space-between' }}>
                      <span style={{ color: '#fff', fontSize: '0.9rem', width: '150px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{i+1}. {c.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1, margin: '0 15px' }}>
                        <div style={{ height: '6px', background: '#222', width: '100%', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'var(--gold)', width: `${85 - i * 10}%` }}></div>
                        </div>
                      </div>
                      <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Starting ₹{c.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="glass-card" style={{ padding: '24px', background: '#121215', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '20px' }}>Top Selling Bats</h3>
                <div className="admin-table-wrapper" style={{ margin: 0, maxHeight: '250px', overflowY: 'auto' }}>
                  <table className="admin-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Quantity Sold</th>
                        <th>Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.slice(0, 4).map((p, i) => (
                        <tr key={p.id}>
                          <td><strong style={{ color: '#fff' }}>{p.name}</strong><br/><span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>ID: {p.id}</span></td>
                          <td><strong>{12 - i * 2} sold</strong></td>
                          <td style={{ color: 'var(--gold)', fontWeight: 'bold' }}>₹{((12 - i * 2) * p.price).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS PANEL */}
        {visibleTab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Manage Catalog</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Add, update, duplicate, or delete bats inside store listing.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to reset the catalog to store defaults? This will restore original seeded items.")) {
                      db.resetCatalog();
                      reloadData();
                    }
                  }}
                  className="btn btn-secondary"
                  style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)' }}
                >
                  Reset Catalog Defaults
                </button>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({
                      name: '', category: categories[0]?.id || 'single-blade', price: '', gst: 12, stock: '',
                      weight: '1160 - 1200g', grade: 'Grade 1 Premium Kashmir Willow', pressing: 'Standard Pressed',
                      handle: 'Premium Singapore Cane Handle', edges: '40mm Edges', spine: '62mm Spine', sweetspot: 'Mid Sweetspot',
                      tags: '', featured: false, bestSeller: false, videoUrl: '',
                      imagesString: '/assets/bat_single.png, /assets/bat_double.png',
                      weightsString: '1140-1160g, 1170-1190g', handlesString: 'Round Handle, Oval Handle',
                      seoTitle: '', seoDescription: '',
                      sku: '', originalPrice: '', salePrice: '', gender: 'Unisex', details: '', sizeGuide: '', materials: '', shippingTerms: ''
                    });
                    setShowProductModal(true);
                  }}
                  className="btn btn-primary"
                >
                  <Plus size={16} /> Add Product
                </button>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product Details</th>
                    <th>Category</th>
                    <th>Base Price</th>
                    <th>Stock</th>
                    <th>Attributes</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(prod => {
                    const cat = categories.find(c => c.id === prod.category);
                    return (
                      <tr key={prod.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                              src={prod.images?.[0] || '/assets/bat_single.png'}
                              alt={prod.name}
                              style={{ width: '40px', height: '40px', objectFit: 'contain', background: '#1c1c24' }}
                              onError={(e) => { e.target.src = "/assets/bat_single.png"; }}
                            />
                            <div>
                              <strong style={{ color: '#fff', display: 'block' }}>{prod.name}</strong>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {prod.id} · Pressing: {prod.pressing}</span>
                            </div>
                          </div>
                        </td>
                        <td>{cat ? cat.name : 'Cricket Bat'}</td>
                        <td>₹{prod.price} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+{prod.gst}% GST</span></td>
                        <td>
                          <span className={`badge ${prod.stock > 5 ? 'badge-green' : 'badge-red'}`}>
                            {prod.stock} in stock
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {prod.featured && <span className="badge badge-gold" style={{ fontSize: '0.6rem', padding: '2px 4px', background: '#a30000', color: '#fff' }}>Featured</span>}
                            {prod.bestSeller && <span className="badge badge-red" style={{ fontSize: '0.6rem', padding: '2px 4px' }}>Bestseller</span>}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="admin-actions" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                            <button onClick={() => handleEditProduct(prod)} className="admin-btn-icon" title="Edit"><Edit size={14} /></button>
                            <button onClick={() => handleDuplicateProduct(prod)} className="admin-btn-icon" title="Duplicate"><Copy size={14} /></button>
                            <button onClick={() => handleDeleteProduct(prod.id)} className="admin-btn-icon delete" title="Delete"><Trash size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CATEGORIES PANEL */}
        {visibleTab === 'categories' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Manage Categories</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Baselines for bat cuts, pricing boundaries, and covers.</p>
              </div>
              <button onClick={() => { setEditingCategory(null); setCatForm({ name: '', price: '', gst: 12, displayOrder: '', banner: '/assets/poster.jpg' }); setShowCatModal(true); }} className="btn btn-primary">
                <Plus size={16} /> Add Category
              </button>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Display Order</th>
                    <th>Category Title</th>
                    <th>Starting Base Price</th>
                    <th>Tax Rate (GST)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id}>
                      <td><strong>#{cat.displayOrder}</strong></td>
                      <td><strong style={{ color: '#fff' }}>{cat.name}</strong></td>
                      <td>₹{cat.price}</td>
                      <td>{cat.gst}%</td>
                      <td>
                        <div className="admin-actions" style={{ gap: '6px' }}>
                          <button onClick={() => handleEditCategory(cat)} className="admin-btn-icon" title="Edit Category"><Edit size={14} /></button>
                          <button onClick={() => {
                            if (confirm("Delete this category?")) {
                              db.deleteCategory(cat.id);
                              reloadData();
                            }
                          }} className="admin-btn-icon delete" title="Delete Category"><Trash size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BANNERS SLIDER MANAGER */}
        {visibleTab === 'banners' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Hero Banners Slider</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Desktop/mobile sliders, video backdrops, and active actions.</p>
              </div>
              <button
                onClick={() => {
                  setEditingBanner(null);
                  setBannerForm({ title: '', subtitle: '', desktopImage: '/assets/poster.jpg', mobileImage: '/assets/poster.jpg', videoUrl: '', ctaText: 'Shop', ctaLink: '#categories', displayOrder: banners.length + 1, active: true });
                  setShowBannerModal(true);
                }}
                className="btn btn-primary"
              >
                <Plus size={16} /> Add Slide Banner
              </button>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Banner Details</th>
                    <th>Desktop/Mobile Source</th>
                    <th>Backdrop Type</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {banners.map(b => (
                    <tr key={b.id}>
                      <td><strong>#{b.displayOrder}</strong></td>
                      <td>
                        <strong style={{ color: '#fff', display: 'block' }}>{b.title}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CTA: {b.ctaText} ({b.ctaLink})</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', display: 'block' }}>D: {b.desktopImage}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>M: {b.mobileImage}</span>
                      </td>
                      <td>
                        {b.videoUrl ? <span className="badge badge-red" style={{ background: '#a30000', color: '#fff' }}>Video Stream</span> : <span className="badge">Static JPG</span>}
                      </td>
                      <td>
                        <span className={`badge ${b.active ? 'badge-green' : 'badge-red'}`}>
                          {b.active ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="admin-actions" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => {
                              setEditingBanner(b);
                              setBannerForm(b);
                              setShowBannerModal(true);
                            }}
                            className="admin-btn-icon"
                          >
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDeleteBanner(b.id)} className="admin-btn-icon delete">
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* HOMEPAGE SECTION BUILDER */}
        {visibleTab === 'builder' && (
          <div>
            <div style={{ marginBottom: '35px' }}>
              <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Homepage Sections layout</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Reorder sections, toggle visibility, and configure grid builders.</p>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Display Order</th>
                    <th>Section Node Name</th>
                    <th>Visibility Toggle</th>
                    <th>Layout Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {homepageSections.map((sec, idx) => (
                    <tr key={sec.id}>
                      <td><strong>#{sec.displayOrder}</strong></td>
                      <td><strong style={{ color: '#fff' }}>{sec.name}</strong></td>
                      <td>
                        <button
                          onClick={() => handleToggleSection(sec.id)}
                          className={`btn ${sec.active ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '6px 12px', fontSize: '0.75rem', border: sec.active ? 'none' : '1px solid var(--border)' }}
                        >
                          {sec.active ? 'Enabled & Shown' : 'Disabled & Hidden'}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMoveSection(idx, 'up')}
                            className="admin-btn-icon"
                            style={{ opacity: idx === 0 ? 0.3 : 1 }}
                          >
                            ▲
                          </button>
                          <button
                            disabled={idx === homepageSections.length - 1}
                            onClick={() => handleMoveSection(idx, 'down')}
                            className="admin-btn-icon"
                            style={{ opacity: idx === homepageSections.length - 1 ? 0.3 : 1 }}
                          >
                            ▼
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GALLERY MANAGER */}
        {visibleTab === 'gallery' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Social Hub (Instagram Grid) Media Organizer</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Publish match highlights, customer photos, and videos visible in the homepage Social Hub grid.</p>
              </div>
              <button onClick={() => setShowGalleryModal(true)} className="btn btn-primary">
                <Plus size={16} /> Add Media Item
              </button>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Cover</th>
                    <th>Media Title</th>
                    <th>Category Album</th>
                    <th>Media Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {gallery.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ width: '40px', height: '40px', background: '#1c1c24' }}>
                          {item.type === 'video' ? (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justify: 'center', background: '#a30000', color: '#fff', fontSize: '9px', fontWeight: 'bold' }}>VIDEO</div>
                          ) : (
                            <img src={item.url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = "/assets/poster.jpg"; }} />
                          )}
                        </div>
                      </td>
                      <td><strong style={{ color: '#fff' }}>{item.title}</strong></td>
                      <td><span className="badge badge-gold" style={{ background: '#a30000', color: '#fff' }}>{item.album}</span></td>
                      <td>{item.type.toUpperCase()}</td>
                      <td>
                        <button onClick={() => handleDeleteGallery(item.id)} className="admin-btn-icon delete"><Trash size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TESTIMONIAL & PRODUCT REVIEWS APPROVALS */}
        {visibleTab === 'testimonials' && (
          <div>
            <div style={{ marginBottom: '35px' }}>
              <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Customer Reviews & Moderation</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Approve or delete brand testimonials and product-specific ratings/comments.</p>
            </div>

            {/* Sub Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px', gap: '8px' }}>
              <button
                onClick={() => setReviewsSubTab('testimonials')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: reviewsSubTab === 'testimonials' ? 'var(--gold)' : 'var(--muted)',
                  borderBottom: reviewsSubTab === 'testimonials' ? '2px solid var(--gold)' : 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Brand Testimonials ({testimonials.filter(t => !t.approved).length})
              </button>
              <button
                onClick={() => setReviewsSubTab('product-reviews')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: reviewsSubTab === 'product-reviews' ? 'var(--gold)' : 'var(--muted)',
                  borderBottom: reviewsSubTab === 'product-reviews' ? '2px solid var(--gold)' : 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Product Reviews ({reviews.filter(r => !r.approved).length})
              </button>
              <button
                onClick={() => setReviewsSubTab('video-reviews')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: reviewsSubTab === 'video-reviews' ? 'var(--gold)' : 'var(--muted)',
                  borderBottom: reviewsSubTab === 'video-reviews' ? '2px solid var(--gold)' : 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Batting Video Reviews ({demoVideos.length})
              </button>
            </div>

            {reviewsSubTab === 'testimonials' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                  <button
                    onClick={() => {
                      setEditingTestimonial(null);
                      setTestimonialForm({ reviewerName: '', reviewerRole: '', stars: 5, text: '', videoUrl: '', approved: true });
                      setShowTestimonialModal(true);
                    }}
                    className="btn btn-primary"
                  >
                    <Plus size={16} /> Add Testimonial
                  </button>
                </div>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Reviewer</th>
                        <th>Stars</th>
                        <th>Review Content</th>
                        <th>Backdrop Clip</th>
                        <th>Fulfillment</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testimonials.map(t => (
                        <tr key={t.id}>
                          <td>
                            <strong style={{ color: '#fff', display: 'block' }}>{t.reviewerName}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t.reviewerRole}</span>
                          </td>
                          <td><span style={{ color: 'var(--gold)', letterSpacing: '1px' }}>{'★'.repeat(t.stars)}</span></td>
                          <td><p style={{ fontSize: '0.85rem', maxWidth: '350px' }}>{t.text}</p></td>
                          <td>{t.videoUrl ? <span style={{ color: 'var(--gold)', fontSize: '0.8rem' }}>🎬 Video Included</span> : 'No Video'}</td>
                          <td>
                            <span className={`badge ${t.approved ? 'badge-green' : 'badge-red'}`}>
                              {t.approved ? 'Approved' : 'Pending'}
                            </span>
                          </td>
                          <td>
                            <div className="admin-actions" style={{ gap: '6px' }}>
                              <button
                                onClick={() => {
                                  setEditingTestimonial(t);
                                  setTestimonialForm({ reviewerName: t.reviewerName, reviewerRole: t.reviewerRole, stars: t.stars, text: t.text, videoUrl: t.videoUrl || '', approved: t.approved });
                                  setShowTestimonialModal(true);
                                }}
                                className="admin-btn-icon"
                                title="Edit Testimonial"
                              >
                                <Edit size={14} />
                              </button>
                              {!t.approved && (
                                <button onClick={() => handleApproveTestimonial(t.id)} className="admin-btn-icon" style={{ borderColor: '#2ecc71', color: '#2ecc71' }} title="Approve"><Check size={14} /></button>
                              )}
                              <button onClick={() => handleDeleteTestimonial(t.id)} className="admin-btn-icon delete"><Trash size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reviewsSubTab === 'product-reviews' && (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Reviewer Name</th>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map(rev => {
                      const prod = products.find(p => p.id === rev.productId);
                      return (
                        <tr key={rev.id}>
                          <td>
                            <strong>{prod ? prod.name : 'Unknown Product'}</strong><br />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {rev.productId}</span>
                          </td>
                          <td>
                            <strong style={{ color: '#fff', display: 'block' }}>{rev.userName}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{rev.date}</span>
                          </td>
                          <td><span style={{ color: 'var(--gold)', letterSpacing: '1px' }}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span></td>
                          <td><p style={{ fontSize: '0.85rem', maxWidth: '350px' }}>{rev.comment}</p></td>
                          <td>
                            <span className={`badge ${rev.approved ? 'badge-green' : 'badge-red'}`}>
                              {rev.approved ? 'Approved' : 'Pending'}
                            </span>
                          </td>
                          <td>
                            <div className="admin-actions" style={{ gap: '6px' }}>
                              {!rev.approved && (
                                <button onClick={() => { db.approveReview(rev.id); reloadData(); }} className="admin-btn-icon" style={{ borderColor: '#2ecc71', color: '#2ecc71' }} title="Approve"><Check size={14} /></button>
                              )}
                              <button onClick={() => { if(confirm("Delete this product review?")) { db.deleteReview(rev.id); reloadData(); } }} className="admin-btn-icon delete" title="Delete"><Trash size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {reviewsSubTab === 'video-reviews' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                  <button
                    onClick={() => {
                      setVideoUrlForm('');
                      setShowVideoModal(true);
                    }}
                    className="btn btn-primary"
                  >
                    <Plus size={16} /> Add Video Review
                  </button>
                </div>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>Video Source / URL</th>
                        <th>Preview Type</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {demoVideos.map((url, idx) => {
                        const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
                        return (
                          <tr key={idx}>
                            <td><strong>#{idx + 1}</strong></td>
                            <td style={{ color: '#fff', fontSize: '0.85rem', wordBreak: 'break-all' }}>{url}</td>
                            <td>
                              <span className={`badge`} style={{ background: isYoutube ? '#a30000' : '#2ecc71', color: '#fff', fontSize: '11px', padding: '3px 8px', borderRadius: '4px' }}>
                                {isYoutube ? 'YouTube Stream' : 'Direct Video File'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => {
                                  if (confirm("Are you sure you want to remove this video from reviews?")) {
                                    db.deleteDemoVideo(idx);
                                    reloadData();
                                  }
                                }}
                                className="admin-btn-icon delete"
                                title="Delete Video"
                              >
                                <Trash size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {demoVideos.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                            No batting video reviews added yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ORDERS PANEL */}
        {visibleTab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Sales Orders</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Fulfillment, shipping adjustments, and tax invoice generation.</p>
              </div>
              <button onClick={exportOrdersCSV} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={14} /> Export to CSV
              </button>
            </div>

            {/* Search Filter bar */}
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search orders by Order ID, customer email, name, or phone..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                style={{ maxWidth: '450px' }}
              />
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID & Date</th>
                    <th>Customer Details</th>
                    <th>Bat Model</th>
                    <th>Invoice Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders
                    .filter(o => 
                      o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                      (o.customerName && o.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase())) ||
                      (o.email && o.email.toLowerCase().includes(orderSearchQuery.toLowerCase())) ||
                      (o.phone && o.phone.toLowerCase().includes(orderSearchQuery.toLowerCase()))
                    )
                    .map(order => (
                      <tr key={order.id}>
                        <td><strong>{order.id}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.date}</span></td>
                        <td>
                          <strong style={{ color: '#fff' }}>{order.customerName}</strong><br />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.phone}</span><br />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.email}</span>
                        </td>
                        <td>
                          <strong>{order.batName}</strong><br />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.specs}</span><br />
                          {order.trackingNumber && <span style={{ fontSize: '0.75rem', color: 'var(--gold)', display: 'block', marginTop: '2px' }}>🚚 Track: {order.trackingNumber}</span>}
                        </td>
                        <td>₹{order.total.toLocaleString('en-IN')} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Incl. GST</span></td>
                        <td>
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="form-control"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.8rem',
                              background: order.status === 'delivered' ? 'rgba(46,204,113,0.1)' : order.status === 'shipped' ? 'rgba(52,152,219,0.1)' : 'rgba(230,126,34,0.1)',
                              color: order.status === 'delivered' ? '#2ecc71' : order.status === 'shipped' ? '#3498db' : '#e67e22',
                              borderColor: 'transparent',
                              width: '120px'
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </td>
                        <td>
                          <div className="admin-actions">
                            <button onClick={() => setSelectedOrder(order)} className="admin-btn-icon" title="View & Edit Tracking"><Eye size={14} /></button>
                            <button onClick={() => generateInvoicePDF(order)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--border)' }}>
                              <Download size={12} /> Invoice
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CUSTOMERS DIRECTORY */}
        {visibleTab === 'customers' && (
          <div>
            <div style={{ marginBottom: '35px' }}>
              <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Customers Directory</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Check user credentials, address book totals, and block/unblock accounts.</p>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Email Address</th>
                    <th>Addresses Registered</th>
                    <th>Wishlist Items</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td><strong style={{ color: '#fff' }}>{c.name}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {c.id}</span></td>
                      <td>{c.email}</td>
                      <td>{c.addresses?.length || 0} destinations</td>
                      <td>{c.wishlist?.length || 0} saved weapons</td>
                      <td>
                        <span className={`badge ${c.blocked ? 'badge-red' : 'badge-green'}`}>
                          {c.blocked ? 'Suspended' : 'Active Account'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleBlockCustomer(c.id)}
                          className={`btn ${c.blocked ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '6px 12px', fontSize: '0.75rem', border: c.blocked ? 'none' : '1px solid var(--border)' }}
                        >
                          {c.blocked ? 'Activate User' : 'Block User Account'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SEO & METADATA SECTION */}
        {visibleTab === 'cms' && (
          <div>
            <div style={{ marginBottom: '35px' }}>
              <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Storefront Content & SEO CMS</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Configure SEO tags, homepage narrative story, lookbooks, announcements and popups.</p>
            </div>

            {/* Sub Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setCmsSubTab('seo')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: cmsSubTab === 'seo' ? 'var(--gold)' : 'var(--muted)',
                  borderBottom: cmsSubTab === 'seo' ? '2px solid var(--gold)' : 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                SEO Metadata
              </button>
              <button
                type="button"
                onClick={() => setCmsSubTab('story')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: cmsSubTab === 'story' ? 'var(--gold)' : 'var(--muted)',
                  borderBottom: cmsSubTab === 'story' ? '2px solid var(--gold)' : 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Brand Story & Storefront Images
              </button>
              <button
                type="button"
                onClick={() => setCmsSubTab('lookbook')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: cmsSubTab === 'lookbook' ? 'var(--gold)' : 'var(--muted)',
                  borderBottom: cmsSubTab === 'lookbook' ? '2px solid var(--gold)' : 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Lookbook & Brands
              </button>
              <button
                type="button"
                onClick={() => setCmsSubTab('marquee')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: cmsSubTab === 'marquee' ? 'var(--gold)' : 'var(--muted)',
                  borderBottom: cmsSubTab === 'marquee' ? '2px solid var(--gold)' : 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Ticker & Popups
              </button>
            </div>

            {cmsSubTab === 'seo' && (
              <div className="glass-card" style={{ padding: '30px', border: '1px solid var(--border)' }}>
                <form onSubmit={(e) => { e.preventDefault(); persistSetting('cms', cms, (d) => db.saveCms(d)); alert("SEO Metadata Updated!"); reloadData(); }}>
                  <div className="form-group">
                    <label className="form-label">Global Website Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={cms.seo?.title || ''}
                      onChange={(e) => {
                        const updated = { ...cms };
                        updated.seo.title = e.target.value;
                        setCms(updated);
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Meta Search Description</label>
                    <textarea
                      className="form-control"
                      style={{ minHeight: '100px' }}
                      value={cms.seo?.description || ''}
                      onChange={(e) => {
                        const updated = { ...cms };
                        updated.seo.description = e.target.value;
                        setCms(updated);
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Global SEO Keywords (Comma Separated)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={cms.seo?.keywords || ''}
                      onChange={(e) => {
                        const updated = { ...cms };
                        updated.seo.keywords = e.target.value;
                        setCms(updated);
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button type="submit" className="btn btn-primary">Save SEO Settings</button>
                    <button
                      type="button"
                      onClick={() => {
                        const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://vkbathouse.in/</loc><priority>1.0</priority></url>\n  <url><loc>https://vkbathouse.in/#shop</loc><priority>0.8</priority></url>\n  <url><loc>https://vkbathouse.in/#gallery</loc><priority>0.7</priority></url>\n</urlset>`;
                        const blob = new Blob([sitemapContent], { type: 'text/xml' });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = "sitemap.xml";
                        link.click();
                      }}
                      className="btn btn-secondary"
                      style={{ border: '1px solid var(--border)' }}
                    >
                      Generate sitemap.xml
                    </button>
                  </div>
                </form>
              </div>
            )}

            {cmsSubTab === 'story' && (
              <div className="glass-card" style={{ padding: '30px', border: '1px solid var(--border)' }}>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  persistSetting('brandStory', brandStory, (d) => db.saveBrandStory(d));
                  alert("Brand Story narrative details saved successfully!");
                  reloadData();
                }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group">
                      <label className="form-label">Story Narrative Section Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={brandStory.storyTitle || ''}
                        onChange={(e) => setBrandStory(prev => ({ ...prev, storyTitle: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Story Accent Quote</label>
                      <input
                        type="text"
                        className="form-control"
                        value={brandStory.storyQuote || ''}
                        onChange={(e) => setBrandStory(prev => ({ ...prev, storyQuote: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Story Paragraph 1</label>
                    <textarea
                      className="form-control"
                      style={{ minHeight: '85px' }}
                      value={brandStory.storyParagraph1 || ''}
                      onChange={(e) => setBrandStory(prev => ({ ...prev, storyParagraph1: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Story Paragraph 2</label>
                    <textarea
                      className="form-control"
                      style={{ minHeight: '85px' }}
                      value={brandStory.storyParagraph2 || ''}
                      onChange={(e) => setBrandStory(prev => ({ ...prev, storyParagraph2: e.target.value }))}
                    />
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                    <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '16px' }}>Main Story & Craftsmanship Image</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{
                        width: '120px',
                        height: '100px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#1a1a24',
                        overflow: 'hidden'
                      }}>
                        <img
                          src={brandStory.storyImage || '/assets/craftsmanship_bat.png'}
                          alt="Story Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = "/assets/poster.jpg"; }}
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                          <label htmlFor="story-image-upload" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '12px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                            Upload Story Image
                          </label>
                          <input
                            type="file"
                            id="story-image-upload"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                uploadImage(file).then(url => {
                                  if (url) setBrandStory(prev => ({ ...prev, storyImage: url }));
                                });
                              }
                            }}
                            style={{ display: 'none' }}
                          />
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Upload Craftsmanship picture from device.</span>
                        </div>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Or enter path directly"
                          value={brandStory.storyImage || ''}
                          onChange={(e) => setBrandStory(prev => ({ ...prev, storyImage: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                    <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '16px' }}>Why VK? Section Cover Image</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{
                        width: '120px',
                        height: '100px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#1a1a24',
                        overflow: 'hidden'
                      }}>
                        <img
                          src={brandStory.newsletterPopupImage || '/assets/why_vk_bat.png'}
                          alt="Why VK Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = "/assets/bat_single.png"; }}
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                          <label htmlFor="whyvk-image-upload" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '12px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                            Upload Why VK Image
                          </label>
                          <input
                            type="file"
                            id="whyvk-image-upload"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                uploadImage(file).then(url => {
                                  if (url) setBrandStory(prev => ({ ...prev, newsletterPopupImage: url }));
                                });
                              }
                            }}
                            style={{ display: 'none' }}
                          />
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Upload premium bat closeup image from device.</span>
                        </div>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Or enter path directly"
                          value={brandStory.newsletterPopupImage || ''}
                          onChange={(e) => setBrandStory(prev => ({ ...prev, newsletterPopupImage: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                    Save Story Details & Images
                  </button>
                </form>
              </div>
            )}

            {cmsSubTab === 'lookbook' && (
              <div className="glass-card" style={{ padding: '30px', border: '1px solid var(--border)' }}>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  persistSetting('brandStory', brandStory, (d) => db.saveBrandStory(d));
                  alert("Lookbook layouts and Seen-on brands updated!");
                  reloadData();
                }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group">
                      <label className="form-label">Lookbook Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={brandStory.lookbookTitle || ''}
                        onChange={(e) => setBrandStory(prev => ({ ...prev, lookbookTitle: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Lookbook Subtitle</label>
                      <input
                        type="text"
                        className="form-control"
                        value={brandStory.lookbookSubtitle || ''}
                        onChange={(e) => setBrandStory(prev => ({ ...prev, lookbookSubtitle: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                    <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '16px' }}>Lookbook Cover Image 1</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{
                        width: '120px',
                        height: '100px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#1a1a24',
                        overflow: 'hidden'
                      }}>
                        <img
                          src={brandStory.lookbookCover1 || '/assets/banner_white_1.png'}
                          alt="Cover 1 Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = "/assets/poster.jpg"; }}
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                          <label htmlFor="lookbook1-image-upload" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '12px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                            Upload Lookbook 1 Image
                          </label>
                          <input
                            type="file"
                            id="lookbook1-image-upload"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                uploadImage(file).then(url => {
                                  if (url) setBrandStory(prev => ({ ...prev, lookbookCover1: url }));
                                });
                              }
                            }}
                            style={{ display: 'none' }}
                          />
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Select cover 1 picture from your device.</span>
                        </div>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Or enter path directly"
                          value={brandStory.lookbookCover1 || ''}
                          onChange={(e) => setBrandStory(prev => ({ ...prev, lookbookCover1: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                    <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '16px' }}>Lookbook Cover Image 2</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{
                        width: '120px',
                        height: '100px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#1a1a24',
                        overflow: 'hidden'
                      }}>
                        <img
                          src={brandStory.lookbookCover2 || '/assets/banner_white_2.png'}
                          alt="Cover 2 Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = "/assets/poster.jpg"; }}
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                          <label htmlFor="lookbook2-image-upload" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '12px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                            Upload Lookbook 2 Image
                          </label>
                          <input
                            type="file"
                            id="lookbook2-image-upload"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                uploadImage(file).then(url => {
                                  if (url) setBrandStory(prev => ({ ...prev, lookbookCover2: url }));
                                });
                              }
                            }}
                            style={{ display: 'none' }}
                          />
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Select cover 2 picture from your device.</span>
                        </div>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Or enter path directly"
                          value={brandStory.lookbookCover2 || ''}
                          onChange={(e) => setBrandStory(prev => ({ ...prev, lookbookCover2: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                    Save Lookbook Settings
                  </button>
                </form>
              </div>
            )}

            {cmsSubTab === 'marquee' && (
              <div className="glass-card" style={{ padding: '30px', border: '1px solid var(--border)' }}>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  persistSetting('brandStory', brandStory, (d) => db.saveBrandStory(d));
                  alert("Ticker & Announcements Saved!");
                  reloadData();
                }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  <div className="form-group">
                    <label className="form-label">Ticker drops text (separated by dots/dashes)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={brandStory.marqueeDrops || ''}
                      onChange={(e) => setBrandStory(prev => ({ ...prev, marqueeDrops: e.target.value }))}
                    />
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                    <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '16px' }}>Newsletter Signup Settings</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Newsletter Title</label>
                        <input
                          type="text"
                          className="form-control"
                          value={brandStory.newsletterTitle || ''}
                          onChange={(e) => setBrandStory(prev => ({ ...prev, newsletterTitle: e.target.value }))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Newsletter Promo Code</label>
                        <input
                          type="text"
                          className="form-control"
                          value={brandStory.newsletterDiscountCode || ''}
                          onChange={(e) => setBrandStory(prev => ({ ...prev, newsletterDiscountCode: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Newsletter Subtitle</label>
                      <textarea
                        className="form-control"
                        style={{ minHeight: '60px' }}
                        value={brandStory.newsletterSubtitle || ''}
                        onChange={(e) => setBrandStory(prev => ({ ...prev, newsletterSubtitle: e.target.value }))}
                      />
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={brandStory.newsletterDiscountActive || false}
                        onChange={(e) => setBrandStory(prev => ({ ...prev, newsletterDiscountActive: e.target.checked }))}
                      /> Enable Promo Code Discount Active status
                    </label>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                    Save Announcement & Ticker settings
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* LEADS PANEL */}
        {visibleTab === 'leads' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Callback Leads</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Customer custom spec details and callback requests.</p>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Lead Info</th>
                    <th>Message Details</th>
                    <th>Form Source</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => (
                    <tr key={lead.id}>
                      <td>
                        <strong style={{ color: '#fff' }}>{lead.name}</strong><br />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lead.phone}</span><br />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lead.email || 'No email'}</span>
                      </td>
                      <td>
                        <p style={{ maxWidth: '400px', fontSize: '0.85rem', color: '#fff' }}>{lead.message}</p>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Received: {lead.date}</span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: lead.type === 'Bulk Order Request' ? '#000000' : '#a30000',
                            border: lead.type === 'Bulk Order Request' ? '1px solid var(--border)' : 'none',
                            color: '#fff'
                          }}
                        >
                          {lead.type}
                        </span>
                      </td>
                      <td>
                        <select
                          value={lead.status}
                          onChange={(e) => {
                            db.updateLeadStatus(lead.id, e.target.value);
                            reloadData();
                          }}
                          className="form-control"
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.8rem',
                            background: lead.status === 'Closed' ? 'rgba(46,204,113,0.1)' : lead.status === 'Follow-up' ? 'rgba(241,196,15,0.1)' : 'rgba(231,76,60,0.1)',
                            color: lead.status === 'Closed' ? '#2ecc71' : lead.status === 'Follow-up' ? '#f1c40f' : '#e74c3c',
                            borderColor: 'transparent',
                            width: '120px'
                          }}
                        >
                          <option value="New">New</option>
                          <option value="Follow-up">Follow-up</option>
                          <option value="Closed">Closed</option>
                          <option value="Spam">Spam</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BLOGS PANEL */}
        {visibleTab === 'blogs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Manage Blogs</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Write bat maintenance guidelines and player guides.</p>
              </div>
              <button onClick={() => {
                setEditingBlog(null);
                setBlogForm({ title: '', content: '', author: 'VK Admin', image: '/assets/poster.jpg' });
                setShowBlogModal(true);
              }} className="btn btn-primary">
                <Plus size={16} /> Write Blog Post
              </button>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Publish Date</th>
                    <th>Excerpt</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blogs.map(blog => (
                    <tr key={blog.id}>
                      <td><strong style={{ color: '#fff' }}>{blog.title}</strong></td>
                      <td>{blog.author}</td>
                      <td>{blog.date}</td>
                      <td>{blog.content.substring(0, 80)}...</td>
                      <td>
                        <div className="admin-actions" style={{ gap: '6px' }}>
                          <button
                            onClick={() => {
                              setEditingBlog(blog);
                              setBlogForm({ title: blog.title, content: blog.content, author: blog.author, image: blog.image });
                              setShowBlogModal(true);
                            }}
                            className="admin-btn-icon"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDeleteBlog(blog.id)} className="admin-btn-icon delete"><Trash size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GLOBAL STORE SETTINGS */}
        {visibleTab === 'settings' && (
          <div>
            <div style={{ marginBottom: '35px' }}>
              <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Store Settings</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Modify base GST metrics, default shipping rates, and workshop contacts.</p>
            </div>

            {/* Premium Theme Switcher Panel */}
            <div className="glass-card" style={{ padding: '30px', border: '1px solid var(--border)', marginBottom: '30px', background: '#121217' }}>
              <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '8px', fontFamily: 'var(--font-sans)' }}>Storefront Design Template</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>Choose a curated color scheme and theme layout to customize your storefront presentation instantly.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                {/* Black theme card */}
                <div 
                  onClick={() => setSettings(prev => ({ ...prev, theme: 'black' }))}
                  style={{
                    border: (settings.theme === 'black' || !settings.theme) ? '2px solid var(--gold)' : '1px solid var(--border)',
                    background: '#09090b',
                    padding: '20px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    textAlign: 'center',
                    transition: 'all 0.25s ease',
                    boxShadow: (settings.theme === 'black' || !settings.theme) ? '0 0 15px rgba(212, 175, 55, 0.15)' : 'none'
                  }}
                >
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#d4af37', margin: '0 auto 10px', border: '2px solid #ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {(settings.theme === 'black' || !settings.theme) && <span style={{ color: '#09090b', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
                  </div>
                  <strong style={{ color: '#ffffff', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>Classic Black</strong>
                  <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Bold Dark Contrast</span>
                </div>

                {/* White theme card */}
                <div 
                  onClick={() => setSettings(prev => ({ ...prev, theme: 'white' }))}
                  style={{
                    border: settings.theme === 'white' ? '2px solid var(--gold)' : '1px solid var(--border)',
                    background: '#f8fafc',
                    padding: '20px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    textAlign: 'center',
                    transition: 'all 0.25s ease',
                    boxShadow: settings.theme === 'white' ? '0 0 15px rgba(212, 175, 55, 0.15)' : 'none'
                  }}
                >
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#c5a059', margin: '0 auto 10px', border: '2px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {settings.theme === 'white' && <span style={{ color: '#0f172a', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
                  </div>
                  <strong style={{ color: '#0f172a', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>Sleek White</strong>
                  <span style={{ fontSize: '0.75rem', color: '#475569' }}>Premium Light Contrast</span>
                </div>

                {/* Brown theme card */}
                <div 
                  onClick={() => setSettings(prev => ({ ...prev, theme: 'brown' }))}
                  style={{
                    border: settings.theme === 'brown' ? '2px solid var(--gold)' : '1px solid var(--border)',
                    background: '#2a1f16',
                    padding: '20px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    textAlign: 'center',
                    transition: 'all 0.25s ease',
                    boxShadow: settings.theme === 'brown' ? '0 0 15px rgba(212, 175, 55, 0.15)' : 'none'
                  }}
                >
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#df9e51', margin: '0 auto 10px', border: '2px solid #f5efe6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {settings.theme === 'brown' && <span style={{ color: '#2a1f16', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
                  </div>
                  <strong style={{ color: '#f5efe6', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>Warm Brown</strong>
                  <span style={{ fontSize: '0.75rem', color: '#bdae9c' }}>Rich Wood Aesthetics</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    persistSetting('settings', settings, (d) => db.saveSettings(d));
                    document.documentElement.setAttribute('data-theme', settings.theme || 'black');
                    alert(`Storefront theme template successfully switched to ${settings.theme ? settings.theme.toUpperCase() : 'BLACK'} and saved!`);
                  }}
                  className="btn btn-primary"
                  style={{ padding: '12px 24px', fontSize: '12px' }}
                >
                  Save Theme Template
                </button>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '30px', border: '1px solid var(--border)' }}>
              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Base GST Tax Rate (%)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.gstRate || 12}
                      onChange={(e) => setSettings(prev => ({ ...prev, gstRate: Number(e.target.value) }))}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Global Shipping Fee (INR)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.shippingRate || 150}
                      onChange={(e) => setSettings(prev => ({ ...prev, shippingRate: Number(e.target.value) }))}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Bestseller Products Count</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      max="12"
                      value={settings.bestSellersLimit !== undefined ? settings.bestSellersLimit : 4}
                      onChange={(e) => setSettings(prev => ({ ...prev, bestSellersLimit: Number(e.target.value) }))}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Workshop Call Helpline</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.contactPhone || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Workshop WhatsApp Helpline</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.contactWhatsapp || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, contactWhatsapp: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Helpline Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={settings.contactEmail || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Instagram Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.socialInstagram || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, socialInstagram: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">YouTube Handle</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.socialYoutube || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, socialYoutube: e.target.value }))}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
                  Save Global Configurations
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Q&A MANAGER PANEL */}
        {visibleTab === 'qa' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Product Questions & Answers</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Reply to customer queries and manage storefront Q&A catalog.</p>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search questions by text or product ID..."
                value={qaSearchQuery}
                onChange={(e) => setQaSearchQuery(e.target.value)}
                style={{ maxWidth: '450px' }}
              />
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product Details</th>
                    <th>User & Date</th>
                    <th>Question</th>
                    <th>Answer & Reply</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {qaList
                    .filter(q => 
                      q.question.toLowerCase().includes(qaSearchQuery.toLowerCase()) ||
                      q.productId.toLowerCase().includes(qaSearchQuery.toLowerCase())
                    )
                    .map(q => {
                      const prod = products.find(p => p.id === q.productId);
                      return (
                        <tr key={q.id}>
                          <td>
                            <strong style={{ color: '#fff' }}>{prod ? prod.name : 'Unknown Product'}</strong><br />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {q.productId}</span>
                          </td>
                          <td>
                            <strong style={{ color: '#fff', display: 'block' }}>{q.user}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{q.date}</span>
                          </td>
                          <td>
                            <p style={{ fontSize: '0.85rem', maxWidth: '300px', color: '#fff' }}>{q.question}</p>
                          </td>
                          <td>
                            {q.answer && editingQaId !== q.id ? (
                              <div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--gold)', margin: 0 }}>{q.answer}</p>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Replied</span>
                                  <button
                                    onClick={() => setEditingQaId(q.id)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--gold)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                                  >
                                    Edit Answer
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <form onSubmit={(e) => {
                                e.preventDefault();
                                const text = e.target.elements.replyText.value;
                                if (!text) return;
                                db.replyQA(q.id, text);
                                setEditingQaId(null);
                                reloadData();
                              }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <input
                                    type="text"
                                    name="replyText"
                                    defaultValue={q.answer}
                                    placeholder="Type answer..."
                                    className="form-control"
                                    style={{ padding: '6px 12px', fontSize: '0.8rem', flexGrow: 1 }}
                                    required
                                  />
                                  <button type="submit" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                                    {q.answer ? 'Save' : 'Reply'}
                                  </button>
                                  {q.answer && (
                                    <button type="button" onClick={() => setEditingQaId(null)} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                                      Cancel
                                    </button>
                                  )}
                                </div>
                              </form>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button onClick={() => { if(confirm("Delete this Q&A?")) { db.deleteQA(q.id); reloadData(); } }} className="admin-btn-icon delete" title="Delete"><Trash size={14} /></button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TYPOGRAPHY CMS PANEL */}
        {visibleTab === 'typography' && (
          <div>
            <div style={{ marginBottom: '35px' }}>
              <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Typography Style Management</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Set heading and body font families for storefront components.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div className="glass-card" style={{ padding: '30px', border: '1px solid var(--border)' }}>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  persistSetting('typography', typography, (d) => db.saveTypography(d));
                  alert("Typography settings saved successfully!");
                  reloadData();
                }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Heading Font Family</label>
                    <select
                      className="form-control"
                      value={typography.headingFont || 'Syne'}
                      onChange={(e) => setTypography(prev => ({ ...prev, headingFont: e.target.value }))}
                    >
                      <option value="Syne">Syne (Modern & Bold)</option>
                      <option value="Barlow Condensed">Barlow Condensed (Aggressive & Sporty)</option>
                      <option value="Playfair Display">Playfair Display (Elegant & Classic)</option>
                      <option value="Inter">Inter (Clean & Professional)</option>
                      <option value="Outfit">Outfit (Geometric & Sleek)</option>
                      <option value="Oswald">Oswald (Industrial & Strong)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Body Text Font Family</label>
                    <select
                      className="form-control"
                      value={typography.bodyFont || 'Inter'}
                      onChange={(e) => setTypography(prev => ({ ...prev, bodyFont: e.target.value }))}
                    >
                      <option value="Inter">Inter (Clean & Highly Readable)</option>
                      <option value="Outfit">Outfit (Modern Geometric)</option>
                      <option value="Roboto">Roboto (Default Modern)</option>
                      <option value="Open Sans">Open Sans (Classic Web Standard)</option>
                      <option value="Lato">Lato (Friendly & Warm)</option>
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                    Save Typography Theme
                  </button>
                </form>
              </div>

              {/* Typography Preview */}
              <div className="glass-card" style={{ padding: '30px', border: '1px solid var(--border)', background: '#121217' }}>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Typography Live Preview</h3>
                <div style={{ textAlign: 'left', padding: '15px', background: '#0a0a0d', border: '1px solid var(--border)' }}>
                  <h1 style={{ fontFamily: `'${typography.headingFont}', sans-serif`, fontSize: '2rem', color: '#fff', margin: '0 0 10px' }}>
                    Handcrafted Bats Built For Champions
                  </h1>
                  <p style={{ fontFamily: `'${typography.bodyFont}', sans-serif`, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                    Experience ultimate cellular resilience and instant tournament-ready explosive ping out of the box. shaped manually by third-generation master craftsmen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HEADER NAVIGATION LINKS PANEL */}
        {visibleTab === 'navigation' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Header Navigation Links</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Customize the top and mobile drawer navigation menu.</p>
              </div>
              <button
                onClick={() => {
                  setEditingNavLink(null);
                  setLinkForm({ label: '', link: '#', active: true, displayOrder: navigationList.length + 1 });
                  setShowNavLinkModal(true);
                }}
                className="btn btn-primary"
              >
                <Plus size={16} /> Add Navigation Link
              </button>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Display Order</th>
                    <th>Link Label</th>
                    <th>Link Anchor / URL</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {navigationList
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map(nav => (
                      <tr key={nav.id}>
                        <td><strong>#{nav.displayOrder}</strong></td>
                        <td><strong style={{ color: '#fff' }}>{nav.label}</strong></td>
                        <td><code style={{ color: 'var(--gold)' }}>{nav.link}</code></td>
                        <td>
                          <span className={`badge ${nav.active ? 'badge-green' : 'badge-red'}`}>
                            {nav.active ? 'Shown' : 'Hidden'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="admin-actions" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setEditingNavLink(nav);
                                setLinkForm(nav);
                                setShowNavLinkModal(true);
                              }}
                              className="admin-btn-icon"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Delete this navigation link?")) {
                                  const updated = navigationList.filter(n => n.id !== nav.id);
                                  persistSetting('navigation', updated, (d) => db.saveNavigation(d));
                                  reloadData();
                                }
                              }}
                              className="admin-btn-icon delete"
                              title="Delete"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SOCIALS & FOOTER CMS PANEL */}
        {visibleTab === 'socials' && (
          <div>
            <div style={{ marginBottom: '35px' }}>
              <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Socials & Footer CMS</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Configure footer helpline numbers, support email address, and branding assets.</p>
            </div>

            <div className="glass-card" style={{ padding: '30px', border: '1px solid var(--border)' }}>
              <form onSubmit={(e) => {
                e.preventDefault();
                persistSetting('brandStory', brandStory, (d) => db.saveBrandStory(d));
                persistSetting('settings', settings, (d) => db.saveSettings(d));
                alert("Socials & footer configurations saved!");
                reloadData();
              }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Store Branding Logo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#1a1a24',
                        overflow: 'hidden',
                        color: 'var(--gold)',
                        fontWeight: 'bold',
                        fontSize: '10px',
                        textAlign: 'center',
                        padding: '4px'
                      }}>
                        {brandStory.logoUrl ? (
                          <img
                            src={brandStory.logoUrl}
                            alt="Logo Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          <span>{settings.websiteBranding || 'VK Bat House'}</span>
                        )}
                      </div>
                      <div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <label htmlFor="logo-upload-socials" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '12px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                            Upload Logo File
                          </label>
                          {brandStory.logoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setBrandStory(prev => ({ ...prev, logoUrl: "" }));
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '8px 14px', fontSize: '12px', border: '1px solid var(--red)', color: 'var(--red)' }}
                            >
                              Remove Logo
                            </button>
                          )}
                        </div>
                        <input
                          type="file"
                          id="logo-upload-socials"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              uploadImage(file).then(url => {
                                if (url) setBrandStory(prev => ({ ...prev, logoUrl: url }));
                              });
                            }
                          }}
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      value={brandStory.logoUrl || ''}
                      onChange={(e) => setBrandStory(prev => ({ ...prev, logoUrl: e.target.value }))}
                      placeholder="Or enter logo path"
                      style={{ marginTop: '8px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Store Helpline Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={settings.contactEmail || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Workshop Call Helpline Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.contactPhone || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Workshop WhatsApp Helpline Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.contactWhatsapp || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, contactWhatsapp: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Workshop Physical Address</label>
                  <textarea
                    className="form-control"
                    style={{ minHeight: '60px' }}
                    value={brandStory.address || ''}
                    onChange={(e) => setBrandStory(prev => ({ ...prev, address: e.target.value }))}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Instagram Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.socialInstagram || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, socialInstagram: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">YouTube Channel Handle</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.socialYoutube || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, socialYoutube: e.target.value }))}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                  Save Socials & Branding Configurations
                </button>
              </form>
            </div>
          </div>
        )}

        {/* POLICIES & FAQS PANEL */}
        {visibleTab === 'policies' && (
          <div>
            <div style={{ marginBottom: '35px' }}>
              <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Store Policies & FAQs</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage legal documentation text and homepage FAQs answers.</p>
            </div>

            {/* Sub Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setPoliciesSubTab('faqs')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: policiesSubTab === 'faqs' ? 'var(--gold)' : 'var(--muted)',
                  borderBottom: policiesSubTab === 'faqs' ? '2px solid var(--gold)' : 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                FAQs Manager
              </button>
              <button
                type="button"
                onClick={() => setPoliciesSubTab('company-pages')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: policiesSubTab === 'company-pages' ? 'var(--gold)' : 'var(--muted)',
                  borderBottom: policiesSubTab === 'company-pages' ? '2px solid var(--gold)' : 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Company Policies & Pages
              </button>
            </div>

            {policiesSubTab === 'faqs' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                  <button
                    onClick={() => {
                      setEditingFaq(null);
                      setFaqForm({ question: '', answer: '' });
                      setShowFaqModal(true);
                    }}
                    className="btn btn-primary"
                  >
                    <Plus size={16} /> Add FAQ Item
                  </button>
                </div>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>FAQ Question</th>
                        <th>FAQ Answer Details</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {faqs.map(faq => (
                        <tr key={faq.id}>
                          <td><strong style={{ color: '#fff' }}>{faq.question}</strong></td>
                          <td><p style={{ fontSize: '0.85rem', maxWidth: '450px' }}>{faq.answer}</p></td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="admin-actions" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                onClick={() => {
                                  setEditingFaq(faq);
                                  setFaqForm(faq);
                                  setShowFaqModal(true);
                                }}
                                className="admin-btn-icon"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Delete FAQ?")) {
                                    db.deleteFaq(faq.id);
                                    reloadData();
                                  }
                                }}
                                className="admin-btn-icon delete"
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="glass-card" style={{ padding: '30px', border: '1px solid var(--border)' }}>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  persistSetting('brandStory', brandStory, (d) => db.saveBrandStory(d));
                  alert("Company policy details saved successfully!");
                  reloadData();
                }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  <div className="form-group">
                    <label className="form-label">Heritage & About Us Info</label>
                    <textarea
                      className="form-control"
                      style={{ minHeight: '100px' }}
                      value={brandStory.companyPages?.about || ''}
                      onChange={(e) => {
                        const updated = { ...brandStory };
                        if (!updated.companyPages) updated.companyPages = {};
                        updated.companyPages.about = e.target.value;
                        setBrandStory(updated);
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Refunds & Returns Policy</label>
                    <textarea
                      className="form-control"
                      style={{ minHeight: '100px' }}
                      value={brandStory.companyPages?.refund || ''}
                      onChange={(e) => {
                        const updated = { ...brandStory };
                        if (!updated.companyPages) updated.companyPages = {};
                        updated.companyPages.refund = e.target.value;
                        setBrandStory(updated);
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Terms of Service</label>
                    <textarea
                      className="form-control"
                      style={{ minHeight: '100px' }}
                      value={brandStory.companyPages?.terms || ''}
                      onChange={(e) => {
                        const updated = { ...brandStory };
                        if (!updated.companyPages) updated.companyPages = {};
                        updated.companyPages.terms = e.target.value;
                        setBrandStory(updated);
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Careers at VK Bat House</label>
                    <textarea
                      className="form-control"
                      style={{ minHeight: '80px' }}
                      value={brandStory.companyPages?.careers || ''}
                      onChange={(e) => {
                        const updated = { ...brandStory };
                        if (!updated.companyPages) updated.companyPages = {};
                        updated.companyPages.careers = e.target.value;
                        setBrandStory(updated);
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Partnerships & Wholesales</label>
                    <textarea
                      className="form-control"
                      style={{ minHeight: '80px' }}
                      value={brandStory.companyPages?.partnerships || ''}
                      onChange={(e) => {
                        const updated = { ...brandStory };
                        if (!updated.companyPages) updated.companyPages = {};
                        updated.companyPages.partnerships = e.target.value;
                        setBrandStory(updated);
                      }}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                    Save Policy Copy Details
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* SECURITY & LOGS PANEL */}
        {visibleTab === 'security' && (
          <div>
            <div style={{ marginBottom: '35px' }}>
              <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Security Logs & System Settings</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Review administrative login sessions and configure login preferences.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
              <div className="glass-card" style={{ padding: '30px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: 0 }}>Security Preferences</h3>
                <form onSubmit={(e) => { e.preventDefault(); persistSetting('settings', settings, (d) => db.saveSettings(d)); alert("Security configurations updated!"); reloadData(); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Auto Session Timeout removed */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.strongPasswordPolicy || false}
                      onChange={(e) => setSettings(prev => ({ ...prev, strongPasswordPolicy: e.target.checked }))}
                    /> Require Strong Passwords for Admin
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.twoFactorAuth || false}
                      onChange={(e) => setSettings(prev => ({ ...prev, twoFactorAuth: e.target.checked }))}
                    /> Enable Simulated 2FA Validation Code
                  </label>
                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }}>
                    Save Preferences
                  </button>
                </form>
              </div>

              <div className="glass-card" style={{ padding: '30px', border: '1px solid var(--border)', background: '#121217', color: 'var(--muted)' }}>
                🔒 <strong>Server Endpoint:</strong><br />
                Vite Host: <code style={{ color: 'var(--white)' }}>localhost:5173</code><br />
                DB Driver: <code style={{ color: 'var(--white)' }}>LocalStorage Cache Layer</code><br /><br />
                ⚠️ <strong>Security Advisory:</strong><br />
                Restrict team member privileges under the Admin Roles & Team panel to protect order pipelines.
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="glass-card" style={{ padding: '24px', border: '1px solid var(--border)', background: '#121217' }}>
              <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '20px' }}>Live System Event Audit Logs</h3>
              <div className="admin-table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="admin-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Operator User</th>
                      <th>Action Log Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log.id}>
                        <td><span style={{ color: 'var(--text-muted)' }}>{log.timestamp}</span></td>
                        <td><strong>{log.user}</strong></td>
                        <td style={{ color: '#fff' }}><code>{log.action}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* DATABASE BACKUPS PANEL */}
        {visibleTab === 'backups' && (
          <div>
            <div style={{ marginBottom: '35px' }}>
              <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Database Backups & Maintenance</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Download JSON database backups, restore catalog presets, or wipe analytics.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              
              {/* Backup card */}
              <div className="glass-card" style={{ padding: '30px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: 0 }}>Export & Import Database JSON</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>Export the entire LocalStorage database as a single file, or restore a backup from your computer.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                  <button
                    onClick={() => {
                      const keys = [
                        "categories", "products", "orders", "leads", "cms", "blogs",
                        "customers", "banners", "gallery", "testimonials", "homepage_sections",
                        "settings", "reviews", "operators", "qa", "typography", "navigation",
                        "audit_logs", "email_config", "faqs", "brand_story"
                      ];
                      const data = {};
                      keys.forEach(k => {
                        data[k] = db.get(k);
                      });
                      const json = JSON.stringify(data, null, 2);
                      const blob = new Blob([json], { type: "application/json" });
                      const link = document.createElement("a");
                      link.href = URL.createObjectURL(blob);
                      link.download = `vk_bathouse_backup_${new Date().toISOString().split('T')[0]}.json`;
                      link.click();
                      db.addLog("Database JSON backup exported successfully", adminUser.email);
                    }}
                    className="btn btn-primary"
                  >
                    Export JSON Database
                  </button>
                  
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', marginTop: '5px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#fff', marginBottom: '8px' }}>Restore Database Backup:</label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const data = JSON.parse(event.target.result);
                            Object.keys(data).forEach(key => {
                              db.save(key, data[key]);
                            });
                            alert("Database restored successfully from JSON backup!");
                            db.addLog("Database JSON backup imported / restored", adminUser.email);
                            reloadData();
                          } catch (err) {
                            alert("Invalid JSON backup file!");
                          }
                        };
                        reader.readAsText(file);
                      }}
                      className="form-control"
                      style={{ fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Maintenance Presets */}
              <div className="glass-card" style={{ padding: '30px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: 0 }}>System Maintenance Presets</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>Reset or clean catalog items and transaction records to refresh the store status.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  <button
                    onClick={() => {
                      if (confirm("Reset catalog to store default presets? This will delete custom products.")) {
                        db.resetCatalog();
                        reloadData();
                        alert("Product catalog reset to default seed data.");
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ border: '1px solid var(--border)', background: 'transparent' }}
                  >
                    Reset Catalog to Seeds
                  </button>

                  <button
                    onClick={() => {
                      if (confirm("Wipe all orders, callback leads, and product reviews? This action is permanent!")) {
                        db.wipeOrdersAndAnalytics();
                        reloadData();
                        alert("Transactions, leads and reviews cleared.");
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ border: '1px solid var(--border)', background: 'transparent', color: '#e74c3c', borderColor: '#e74c3c' }}
                  >
                    Wipe Orders & Lead Data
                  </button>

                  <button
                    onClick={() => {
                      if (confirm("Perform absolute factory reset? This clears everything and initializes default settings!")) {
                        db.factoryReset();
                        reloadData();
                        alert("Factory reset completed successfully.");
                      }
                    }}
                    className="btn btn-primary"
                    style={{ background: '#a30000', border: 'none' }}
                  >
                    Absolute Factory Reset
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* EMAIL MANAGEMENT PANEL */}
        {visibleTab === 'emails' && (
          <div>
            <div style={{ marginBottom: '35px' }}>
              <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Email Management & SMTP Presets</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Configure Brevo SMTP server integrations and manage system email templates.</p>
            </div>

            <div className="glass-card" style={{ padding: '30px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
              <form onSubmit={(e) => {
                e.preventDefault();
                persistSetting('emailConfig', emailConfig, (d) => db.saveEmailConfig(d));
                alert("Brevo email config and settings saved!");
                reloadData();
              }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: 0 }}>Brevo SMTP API Credentials</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Brevo SMTP API v3 Key</label>
                    <input
                      type="password"
                      className="form-control"
                      value={emailConfig.apiKey || ''}
                      onChange={(e) => setEmailConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Sender Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={emailConfig.senderEmail || ''}
                      onChange={(e) => setEmailConfig(prev => ({ ...prev, senderEmail: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Default Sender Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={emailConfig.senderName || ''}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, senderName: e.target.value }))}
                    required
                  />
                </div>

                <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: '10px 0 0' }}>Transaction Templates Customization</h3>
                <div className="form-group">
                  <label className="form-label">Choose Template to Edit</label>
                  <select
                    className="form-control"
                    defaultValue="welcome"
                    id="admin-email-template-selector"
                    onChange={(e) => {
                      const sel = e.target.value;
                      const bodyTextarea = document.getElementById('admin-email-template-body');
                      const subjectInput = document.getElementById('admin-email-template-subject');
                      if (bodyTextarea && subjectInput && emailConfig.templates?.[sel]) {
                        bodyTextarea.value = emailConfig.templates[sel].body;
                        subjectInput.value = emailConfig.templates[sel].subject;
                      }
                    }}
                  >
                    <option value="welcome">Welcome Onboarding Email</option>
                    <option value="orderConfirmed">Order Confirmation Receipt</option>
                    <option value="orderShipped">Order Shipped notification</option>
                    <option value="orderDelivered">Order Delivered success</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Template Email Subject Line</label>
                  <input
                    type="text"
                    id="admin-email-template-subject"
                    className="form-control"
                    defaultValue={emailConfig.templates?.welcome?.subject || ''}
                    onChange={(e) => {
                      const sel = document.getElementById('admin-email-template-selector').value;
                      const updated = { ...emailConfig };
                      if (!updated.templates) updated.templates = {};
                      if (!updated.templates[sel]) updated.templates[sel] = {};
                      updated.templates[sel].subject = e.target.value;
                      setEmailConfig(updated);
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Template Email Body Template</label>
                  <textarea
                    id="admin-email-template-body"
                    className="form-control"
                    style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                    defaultValue={emailConfig.templates?.welcome?.body || ''}
                    onChange={(e) => {
                      const sel = document.getElementById('admin-email-template-selector').value;
                      const updated = { ...emailConfig };
                      if (!updated.templates) updated.templates = {};
                      if (!updated.templates[sel]) updated.templates[sel] = {};
                      updated.templates[sel].body = e.target.value;
                      setEmailConfig(updated);
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Available variables: {"{{name}}, {{orderId}}, {{total}}, {{trackingNumber}}"}</span>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                  Save Email Configurations
                </button>
              </form>
            </div>

            {/* Test Email Sender Simulator */}
            <div className="glass-card" style={{ padding: '30px', border: '1px solid var(--border)' }}>
              <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '15px' }}>Send Test Integration Email</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const recipient = e.target.elements.testRecipient.value;
                alert(`SMTP TEST SUCCESSFUL!\nSimulated Brevo integration email successfully dispatched to: ${recipient}\n\nSubject: Welcome to VK Bat House!`);
                db.addLog(`Mock test email sent to: ${recipient}`, adminUser.email);
                e.target.reset();
              }} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ marginBottom: 0, flexGrow: 1 }}>
                  <label className="form-label">Recipient Email Address</label>
                  <input
                    type="email"
                    name="testRecipient"
                    required
                    placeholder="e.g. tester@gmail.com"
                    className="form-control"
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>
                  Send Test Email
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ADMIN OPERATORS PANEL */}
        {visibleTab === 'roles' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Admin Roles & Team</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage team roles, access lists, and dashboard authorization passwords.</p>
              </div>
              <button
                onClick={() => {
                  setEditingOperator(null);
                  setOperatorForm({ name: '', email: '', password: '', role: 'staff' });
                  setShowOperatorModal(true);
                }}
                className="btn btn-primary"
              >
                <Plus size={16} /> Register Team Member
              </button>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Member Name</th>
                    <th>Member Email</th>
                    <th>Role Designation</th>
                    <th>Authorization Key</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map(op => (
                    <tr key={op.email}>
                      <td><strong style={{ color: '#fff' }}>{op.name}</strong></td>
                      <td>{op.email}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: op.role === 'super-admin' ? '#a30000' : 'rgba(255,255,255,0.06)',
                            border: op.role === 'super-admin' ? 'none' : '1px solid var(--border)',
                            color: op.role === 'super-admin' ? '#fff' : 'var(--gold)',
                            fontSize: '0.75rem'
                          }}
                        >
                          {op.role === 'super-admin' ? 'SUPER ADMIN' : op.role === 'staff' ? 'STAFF MEMBER' : op.role.toUpperCase()}
                        </span>
                      </td>
                      <td><code style={{ fontSize: '0.85rem' }}>{op.password}</code></td>
                      <td style={{ textAlign: 'right' }}>
                        {op.email.toLowerCase() !== 'admin@vkbathouse.com' && (
                          <div className="admin-actions" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setEditingOperator(op);
                                setOperatorForm(op);
                                setShowOperatorModal(true);
                              }}
                              className="admin-btn-icon"
                              title="Edit password / role"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Delete this team member?")) {
                                  db.deleteOperator(op.email);
                                  reloadData();
                                }
                              }}
                              className="admin-btn-icon delete"
                              title="Delete"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* THE CRAFT STEPS PANEL */}
        {visibleTab === 'craft' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'var(--font-sans)' }}>Manage The Craft (Timeline)</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Customize the 7 steps of craftsmanship shown in the timeline section.</p>
              </div>
              <button
                onClick={() => {
                  setEditingCraftStep(null);
                  setCraftForm({ title: '', desc: '' });
                  setShowCraftModal(true);
                }}
                className="btn btn-primary"
              >
                <Plus size={16} /> Add Craft Step
              </button>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Step #</th>
                    <th>Step Title</th>
                    <th>Description Details</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {craftSteps.map(step => (
                    <tr key={step.id}>
                      <td><strong>{step.num}</strong></td>
                      <td><strong style={{ color: '#fff' }}>{step.title}</strong></td>
                      <td><p style={{ fontSize: '0.85rem', maxWidth: '500px' }}>{step.desc}</p></td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="admin-actions" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => {
                              setEditingCraftStep(step);
                              setCraftForm({ title: step.title, desc: step.desc });
                              setShowCraftModal(true);
                            }}
                            className="admin-btn-icon"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Delete this craft step?")) {
                                db.deleteCraftStep(step.id);
                                reloadData();
                              }
                            }}
                            className="admin-btn-icon delete"
                            title="Delete"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* --- ADD/EDIT PRODUCT MODAL --- */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal-content admin-form-modal" onClick={e => e.stopPropagation()} style={{ background: '#121217', border: '1px solid var(--border)' }}>
            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '20px' }}>
              {editingProduct ? 'Modify Bat specifications' : 'Publish New Weapon'}
            </h3>
            <form onSubmit={handleProductSubmit}>
              <div className="admin-form-grid">
                <div className="form-group">
                  <label className="form-label">Bat Name *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm(p => ({ ...p, name: e.target.value }))}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm(p => ({ ...p, category: e.target.value }))}
                    className="form-control"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="form-group">
                  <label className="form-label">Base Price (INR) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm(p => ({ ...p, price: e.target.value }))}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Inventory *</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm(p => ({ ...p, stock: e.target.value }))}
                    className="form-control"
                  />
                </div>
              </div>



              <div className="admin-form-grid">
                <div className="form-group">
                  <label className="form-label">Original Price (INR)</label>
                  <input
                    type="number"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm(p => ({ ...p, originalPrice: e.target.value }))}
                    className="form-control"
                    placeholder="e.g. 2500"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sale Price (INR)</label>
                  <input
                    type="number"
                    value={productForm.salePrice}
                    onChange={(e) => setProductForm(p => ({ ...p, salePrice: e.target.value }))}
                    className="form-control"
                    placeholder="e.g. 2100"
                  />
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="form-group">
                  <label className="form-label">Product Details & Descriptions</label>
                  <textarea
                    value={productForm.details}
                    onChange={(e) => setProductForm(p => ({ ...p, details: e.target.value }))}
                    className="form-control"
                    placeholder="Mention custom details..."
                    style={{ minHeight: '80px' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Materials & Construction Details</label>
                  <textarea
                    value={productForm.materials}
                    onChange={(e) => setProductForm(p => ({ ...p, materials: e.target.value }))}
                    className="form-control"
                    placeholder="e.g. Grade 1+ English Willow"
                    style={{ minHeight: '80px' }}
                  />
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="form-group">
                  <label className="form-label">Size Guide Specification</label>
                  <input
                    type="text"
                    value={productForm.sizeGuide}
                    onChange={(e) => setProductForm(p => ({ ...p, sizeGuide: e.target.value }))}
                    className="form-control"
                    placeholder="e.g. Standard Short Handle"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Shipping Terms & Delivery Days</label>
                  <input
                    type="text"
                    value={productForm.shippingTerms}
                    onChange={(e) => setProductForm(p => ({ ...p, shippingTerms: e.target.value }))}
                    className="form-control"
                    placeholder="e.g. Shipped within 24 hours"
                  />
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="form-group">
                  <label className="form-label">Weight Range</label>
                  <input
                    type="text"
                    value={productForm.weight}
                    onChange={(e) => setProductForm(p => ({ ...p, weight: e.target.value }))}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pressing Profile</label>
                  <input
                    type="text"
                    value={productForm.pressing}
                    onChange={(e) => setProductForm(p => ({ ...p, pressing: e.target.value }))}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="form-group">
                  <label className="form-label">Willow Grade Details</label>
                  <input
                    type="text"
                    value={productForm.grade}
                    onChange={(e) => setProductForm(p => ({ ...p, grade: e.target.value }))}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Handle Cane Specs</label>
                  <input
                    type="text"
                    value={productForm.handle}
                    onChange={(e) => setProductForm(p => ({ ...p, handle: e.target.value }))}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="form-group">
                  <label className="form-label">Edges Size (e.g. 40mm)</label>
                  <input
                    type="text"
                    value={productForm.edges}
                    onChange={(e) => setProductForm(p => ({ ...p, edges: e.target.value }))}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Spine Size (e.g. 62mm)</label>
                  <input
                    type="text"
                    value={productForm.spine}
                    onChange={(e) => setProductForm(p => ({ ...p, spine: e.target.value }))}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '10px' }}>Product Images</label>
                
                {/* Visual Thumbnails Preview with Quick Delete Option */}
                {productForm.imagesString && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '15px' }}>
                    {productForm.imagesString.split(',').map(s => s.trim()).filter(Boolean).map((img, idx) => (
                      <div key={idx} style={{
                        position: 'relative',
                        width: '80px',
                        height: '80px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        overflow: 'hidden',
                        background: '#181821',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                        transition: 'transform 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }} className="image-preview-thumbnail">
                        <img src={img} alt={`preview-${idx}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        <button
                          type="button"
                          onClick={() => {
                            const list = productForm.imagesString.split(',').map(s => s.trim()).filter(Boolean);
                            list.splice(idx, 1);
                            setProductForm(prev => ({ ...prev, imagesString: list.join(', ') }));
                          }}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: '#e31b23',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            cursor: 'pointer',
                            lineHeight: 1,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            padding: 0
                          }}
                          title="Delete image"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Device Upload Trigger */}
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '12px' }}>
                  <label htmlFor="admin-device-image-upload" className="btn btn-secondary" style={{
                    padding: '10px 18px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    background: 'transparent',
                    border: '1px solid var(--gold)',
                    color: 'var(--gold)',
                    borderRadius: '0',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    <Plus size={14} /> Add from Device
                  </label>
                  <input
                    type="file"
                    id="admin-device-image-upload"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                    Select one or more images from your local system.
                  </span>
                </div>

                {/* Direct Comma-separated Text Input fallback */}
                <input
                  type="text"
                  value={productForm.imagesString}
                  onChange={(e) => setProductForm(p => ({ ...p, imagesString: e.target.value }))}
                  className="form-control"
                  placeholder="Or enter comma-separated image URLs directly (e.g. /assets/bat_single.png)"
                  style={{ fontSize: '0.85rem' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '6px', display: 'block' }}>
                  Base64 data URLs from your device uploads are stored directly in local database.
                </span>
              </div>

              {/* VARIANTS STRINGS */}
              <div className="admin-form-grid">
                <div className="form-group">
                  <label className="form-label">Weight Options (Comma Separated)</label>
                  <input
                    type="text"
                    value={productForm.weightsString}
                    onChange={(e) => setProductForm(p => ({ ...p, weightsString: e.target.value }))}
                    className="form-control"
                    placeholder="1140-1160g, 1170-1190g"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Handle Options (Comma Separated)</label>
                  <input
                    type="text"
                    value={productForm.handlesString}
                    onChange={(e) => setProductForm(p => ({ ...p, handlesString: e.target.value }))}
                    className="form-control"
                    placeholder="Round Handle, Oval Handle"
                  />
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="form-group">
                  <label className="form-label">Product Video URL (MP4 / Youtube)</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <label htmlFor="product-video-upload" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      Upload Video
                    </label>
                    <input
                      type="file"
                      id="product-video-upload"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            alert("Warning: This video file is larger than 2MB. To avoid exceeding client-side localStorage capacity limits, we highly recommend uploading a shorter or more compressed video file under 2MB.");
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProductForm(prev => ({ ...prev, videoUrl: reader.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Upload from device (Max 2MB).</span>
                  </div>
                  <input
                    type="text"
                    value={productForm.videoUrl}
                    onChange={(e) => setProductForm(p => ({ ...p, videoUrl: e.target.value }))}
                    className="form-control"
                    placeholder="e.g. https://www.w3schools.com/html/mov_bbb.mp4"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={productForm.tags}
                    onChange={(e) => setProductForm(p => ({ ...p, tags: e.target.value }))}
                    className="form-control"
                    placeholder="Double Blade, Limited, Pro"
                  />
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="form-group">
                  <label className="form-label">SEO Title Tag</label>
                  <input
                    type="text"
                    value={productForm.seoTitle}
                    onChange={(e) => setProductForm(p => ({ ...p, seoTitle: e.target.value }))}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SEO Meta Description</label>
                  <input
                    type="text"
                    value={productForm.seoDescription}
                    onChange={(e) => setProductForm(p => ({ ...p, seoDescription: e.target.value }))}
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', margin: '15px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={productForm.featured}
                    onChange={(e) => setProductForm(p => ({ ...p, featured: e.target.checked }))}
                  /> Featured Item
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={productForm.bestSeller}
                    onChange={(e) => setProductForm(p => ({ ...p, bestSeller: e.target.checked }))}
                  /> Bestseller Item
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowProductModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product specifications</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT SLIDE BANNER MODAL --- */}
      {showBannerModal && (
        <div className="modal-overlay" onClick={() => setShowBannerModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal-content admin-form-modal" onClick={e => e.stopPropagation()} style={{ background: '#121217', border: '1px solid var(--border)' }}>
            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '20px' }}>
              {editingBanner ? 'Modify Slider Banner' : 'Publish New Banner Slide'}
            </h3>
            <form onSubmit={handleBannerSubmit}>
              <div className="form-group">
                <label className="form-label">Banner Title *</label>
                <input
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm(p => ({ ...p, title: e.target.value }))}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Subtitle Description *</label>
                <input
                  type="text"
                  required
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm(p => ({ ...p, subtitle: e.target.value }))}
                  className="form-control"
                />
              </div>

              <div className="admin-form-grid">
                <div className="form-group">
                  <label className="form-label">Desktop Image Asset Path *</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <label htmlFor="banner-desktop-upload" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      Upload Desktop Image
                    </label>
                    <input
                      type="file"
                      id="banner-desktop-upload"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          uploadImage(file).then(url => {
                            if (url) setBannerForm(prev => ({ ...prev, desktopImage: url }));
                          });
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Upload from device.</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={bannerForm.desktopImage}
                    onChange={(e) => setBannerForm(p => ({ ...p, desktopImage: e.target.value }))}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Image Asset Path</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <label htmlFor="banner-mobile-upload" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      Upload Mobile Image
                    </label>
                    <input
                      type="file"
                      id="banner-mobile-upload"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          uploadImage(file).then(url => {
                            if (url) setBannerForm(prev => ({ ...prev, mobileImage: url }));
                          });
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Upload from device.</span>
                  </div>
                  <input
                    type="text"
                    value={bannerForm.mobileImage}
                    onChange={(e) => setBannerForm(p => ({ ...p, mobileImage: e.target.value }))}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="form-group">
                  <label className="form-label">Background Video URL (optional)</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <label htmlFor="banner-video-upload" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      Upload Video
                    </label>
                    <input
                      type="file"
                      id="banner-video-upload"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          uploadImage(file).then(url => {
                            if (url) setBannerForm(prev => ({ ...prev, videoUrl: url }));
                          });
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Upload video file to server.</span>
                  </div>
                  <input
                    type="text"
                    value={bannerForm.videoUrl}
                    onChange={(e) => setBannerForm(p => ({ ...p, videoUrl: e.target.value }))}
                    className="form-control"
                    placeholder="e.g. /assets/hero.mp4"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Display Order Position</label>
                  <input
                    type="number"
                    value={bannerForm.displayOrder}
                    onChange={(e) => setBannerForm(p => ({ ...p, displayOrder: Number(e.target.value) }))}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="form-group">
                  <label className="form-label">CTA Text</label>
                  <input
                    type="text"
                    value={bannerForm.ctaText}
                    onChange={(e) => setBannerForm(p => ({ ...p, ctaText: e.target.value }))}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CTA Anchor Link</label>
                  <input
                    type="text"
                    value={bannerForm.ctaLink}
                    onChange={(e) => setBannerForm(p => ({ ...p, ctaLink: e.target.value }))}
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ margin: '15px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={bannerForm.active}
                    onChange={(e) => setBannerForm(p => ({ ...p, active: e.target.checked }))}
                  /> Enable Slide (Active)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowBannerModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Slide</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD GALLERY ITEM MODAL --- */}
      {showGalleryModal && (
        <div className="modal-overlay" onClick={() => setShowGalleryModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal-content admin-form-modal" onClick={e => e.stopPropagation()} style={{ background: '#121217', border: '1px solid var(--border)', maxWidth: '450px' }}>
            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '20px' }}>Publish Media Gallery Item</h3>
            <form onSubmit={handleGallerySubmit}>
              <div className="form-group">
                <label className="form-label">Media Title *</label>
                <input
                  type="text"
                  required
                  value={galleryForm.title}
                  onChange={(e) => setGalleryForm(p => ({ ...p, title: e.target.value }))}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Media Type *</label>
                <select
                  value={galleryForm.type}
                  onChange={(e) => setGalleryForm(p => ({ ...p, type: e.target.value }))}
                  className="form-control"
                >
                  <option value="image">Image File</option>
                  <option value="video">Video URL Stream</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Asset Path / URL *</label>
                {galleryForm.type === 'image' ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '11px', border: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => document.getElementById('gallery-image-upload')?.click()}
                    >
                      Upload Media Image
                    </button>
                    <input
                      type="file"
                      id="gallery-image-upload"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          uploadImage(file).then(url => {
                            if (url) setGalleryForm(prev => ({ ...prev, url }));
                          });
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Upload from device.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '11px', border: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => document.getElementById('gallery-video-upload')?.click()}
                    >
                      Upload Media Video
                    </button>
                    <input
                      type="file"
                      id="gallery-video-upload"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          uploadImage(file).then(url => {
                            if (url) setGalleryForm(prev => ({ ...prev, url }));
                          });
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Upload from device.</span>
                  </div>
                )}
                <input
                  type="text"
                  required
                  value={galleryForm.url}
                  onChange={(e) => setGalleryForm(p => ({ ...p, url: e.target.value }))}
                  className="form-control"
                  placeholder="Or enter path/URL directly"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Album Tag *</label>
                <select
                  value={galleryForm.album}
                  onChange={(e) => setGalleryForm(p => ({ ...p, album: e.target.value }))}
                  className="form-control"
                >
                  <option value="Workshop">Workshop & Crafts</option>
                  <option value="Match Highlights">Match Highlights</option>
                  <option value="Customer Photos">Customer Photos</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowGalleryModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Media</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD CATEGORY MODAL --- */}
      {showCatModal && (
        <div className="modal-overlay" onClick={() => setShowCatModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal-content admin-form-modal" onClick={e => e.stopPropagation()} style={{ background: '#121217', border: '1px solid var(--border)' }}>
            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '20px' }}>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
            <form onSubmit={handleCatSubmit}>
              <div className="form-group">
                <label className="form-label">Category Title *</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm(p => ({ ...p, name: e.target.value }))}
                  className="form-control"
                />
              </div>
              <div className="admin-form-grid">
                <div className="form-group">
                  <label className="form-label">Starting Price *</label>
                  <input
                    type="number"
                    required
                    value={catForm.price}
                    onChange={(e) => setCatForm(p => ({ ...p, price: e.target.value }))}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Display Position Index *</label>
                  <input
                    type="number"
                    required
                    value={catForm.displayOrder}
                    onChange={(e) => setCatForm(p => ({ ...p, displayOrder: e.target.value }))}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Category Cover Banner Link</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                  <label htmlFor="cat-image-upload" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '12px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                    Upload Banner
                  </label>
                  <input
                    type="file"
                    id="cat-image-upload"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        uploadImage(file).then(url => {
                          if (url) setCatForm(prev => ({ ...prev, banner: url }));
                        });
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Upload from device.</span>
                </div>
                <input
                  type="text"
                  value={catForm.banner}
                  onChange={(e) => setCatForm(p => ({ ...p, banner: e.target.value }))}
                  className="form-control"
                  placeholder="Or enter image URL"
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowCatModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD BATTING VIDEO REVIEW MODAL --- */}
      {showVideoModal && (
        <div className="modal-overlay" onClick={() => setShowVideoModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal-content admin-form-modal" onClick={e => e.stopPropagation()} style={{ background: '#121217', border: '1px solid var(--border)' }}>
            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '20px' }}>Add Batting Video Review</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (videoUrlForm.trim()) {
                db.addDemoVideo(videoUrlForm.trim());
                setShowVideoModal(false);
                setVideoUrlForm('');
                reloadData();
              } else {
                alert("Please enter a URL or upload a video file first.");
              }
            }}>
              <div className="form-group">
                <label className="form-label">Video Clip Upload / Direct Link</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                  <label htmlFor="video-review-upload" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '12px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                    Upload MP4 / MOV Video
                  </label>
                  <input
                    type="file"
                    id="video-review-upload"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        uploadImage(file).then(url => {
                          if (url) setVideoUrlForm(url);
                        });
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Upload from device (Max 10MB).</span>
                </div>
                <input
                  type="text"
                  value={videoUrlForm}
                  required
                  onChange={(e) => setVideoUrlForm(e.target.value)}
                  className="form-control"
                  placeholder="Or enter YouTube link / Video file URL directly"
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowVideoModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Video</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD BLOG MODAL --- */}
      {showBlogModal && (
        <div className="modal-overlay" onClick={() => setShowBlogModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal-content admin-form-modal" onClick={e => e.stopPropagation()} style={{ background: '#121217', border: '1px solid var(--border)' }}>
            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '20px' }}>Publish Blog Post</h3>
            <form onSubmit={handleBlogSubmit}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  required
                  value={blogForm.title}
                  onChange={(e) => setBlogForm(p => ({ ...p, title: e.target.value }))}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Image Link</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                  <label htmlFor="blog-image-upload" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                    Upload Blog Image
                  </label>
                  <input
                    type="file"
                    id="blog-image-upload"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        uploadImage(file).then(url => {
                          if (url) setBlogForm(prev => ({ ...prev, image: url }));
                        });
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Upload from device.</span>
                </div>
                <input
                  type="text"
                  value={blogForm.image}
                  onChange={(e) => setBlogForm(p => ({ ...p, image: e.target.value }))}
                  className="form-control"
                  placeholder="Or enter path/URL directly"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Content Body *</label>
                <textarea
                  required
                  value={blogForm.content}
                  onChange={(e) => setBlogForm(p => ({ ...p, content: e.target.value }))}
                  className="form-control"
                  style={{ minHeight: '150px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowBlogModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Publish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW ORDER DETAILS OVERLAY --- */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)} style={{ zIndex: 1100 }}>
          <div className="modal-content admin-form-modal" onClick={e => e.stopPropagation()} style={{ background: '#121217', border: '1px solid var(--border)' }}>
            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              Order Details - {selectedOrder.id}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', fontSize: '0.9rem' }}>
              <div>
                <strong style={{ color: 'var(--gold)' }}>Customer Info:</strong>
                <p>Name: {selectedOrder.customerName}</p>
                <p>Phone: {selectedOrder.phone}</p>
                <p>Email: {selectedOrder.email}</p>
              </div>
              <div>
                <strong style={{ color: 'var(--gold)' }}>Order Items:</strong>
                <p>Model: {selectedOrder.batName}</p>
                <p>Specs: {selectedOrder.specs}</p>
              </div>
              <div>
                <strong style={{ color: 'var(--gold)' }}>Payment:</strong>
                <p>Subtotal: ₹{selectedOrder.price.toLocaleString('en-IN')}</p>
                <p>GST Tax Amount: ₹{selectedOrder.gst.toLocaleString('en-IN')}</p>
                <strong style={{ color: 'var(--gold)' }}>Total Invoiced: ₹{selectedOrder.total.toLocaleString('en-IN')}</strong>
              </div>
              
              {/* Tracking Number Input */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <strong style={{ color: 'var(--gold)' }}>Shipping & Tracking:</strong>
                <div className="form-group" style={{ marginTop: '8px', marginBottom: 0 }}>
                  <label className="form-label">Tracking Code (e.g. FedEx / India Post)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedOrder.trackingNumber || ''}
                      onChange={(e) => {
                        const updatedVal = e.target.value;
                        setSelectedOrder(prev => ({ ...prev, trackingNumber: updatedVal }));
                        // Save directly to db list
                        const ords = db.getOrders();
                        const idx = ords.findIndex(o => o.id === selectedOrder.id);
                        if (idx !== -1) {
                          ords[idx].trackingNumber = updatedVal;
                          db.saveOrders(ords);
                        }
                      }}
                      placeholder="e.g. IN1283912938IN"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '30px' }}>
              <button onClick={() => generateInvoicePDF(selectedOrder)} className="btn btn-primary">
                <Download size={14} /> Print Invoice
              </button>
              <button onClick={() => setSelectedOrder(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT NAVIGATION LINK MODAL --- */}
      {showNavLinkModal && (
        <div className="modal-overlay" onClick={() => setShowNavLinkModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal-content admin-form-modal" onClick={e => e.stopPropagation()} style={{ background: '#121217', border: '1px solid var(--border)', maxWidth: '450px' }}>
            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '20px' }}>
              {editingNavLink ? 'Modify Navigation Link' : 'Add New Header Link'}
            </h3>
            <form onSubmit={handleNavLinkSubmit}>
              <div className="form-group">
                <label className="form-label">Link Label *</label>
                <input
                  type="text"
                  required
                  value={navLinkForm.label}
                  onChange={(e) => setLinkForm(p => ({ ...p, label: e.target.value }))}
                  className="form-control"
                  placeholder="e.g. Gallery"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Link URL / Anchor Link *</label>
                <input
                  type="text"
                  required
                  value={navLinkForm.link}
                  onChange={(e) => setLinkForm(p => ({ ...p, link: e.target.value }))}
                  className="form-control"
                  placeholder="e.g. #gallery or bulk"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Display Position Order</label>
                <input
                  type="number"
                  value={navLinkForm.displayOrder}
                  onChange={(e) => setLinkForm(p => ({ ...p, displayOrder: Number(e.target.value) }))}
                  className="form-control"
                />
              </div>
              <div style={{ margin: '15px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={navLinkForm.active}
                    onChange={(e) => setLinkForm(p => ({ ...p, active: e.target.checked }))}
                  /> Active link (Visible in header menu)
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowNavLinkModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Link</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT FAQ MODAL --- */}
      {showFaqModal && (
        <div className="modal-overlay" onClick={() => setShowFaqModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal-content admin-form-modal" onClick={e => e.stopPropagation()} style={{ background: '#121217', border: '1px solid var(--border)', maxWidth: '500px' }}>
            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '20px' }}>
              {editingFaq ? 'Modify FAQ Details' : 'Create FAQ Item'}
            </h3>
            <form onSubmit={handleFaqSubmit}>
              <div className="form-group">
                <label className="form-label">Question Text *</label>
                <input
                  type="text"
                  required
                  value={faqForm.question}
                  onChange={(e) => setFaqForm(p => ({ ...p, question: e.target.value }))}
                  className="form-control"
                  placeholder="e.g. Do you ship internationally?"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Answer Details *</label>
                <textarea
                  required
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm(p => ({ ...p, answer: e.target.value }))}
                  className="form-control"
                  placeholder="Type policy or answer here..."
                  style={{ minHeight: '120px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowFaqModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save FAQ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT TEAM MEMBER MODAL --- */}
      {showOperatorModal && (
        <div className="modal-overlay" onClick={() => setShowOperatorModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal-content admin-form-modal" onClick={e => e.stopPropagation()} style={{ background: '#121217', border: '1px solid var(--border)', maxWidth: '450px' }}>
            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '20px' }}>
              {editingOperator ? 'Modify Team Member Role / Password' : 'Register Team Member'}
            </h3>
            <form onSubmit={handleOperatorSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  value={operatorForm.name}
                  onChange={(e) => setOperatorForm(p => ({ ...p, name: e.target.value }))}
                  className="form-control"
                  placeholder="e.g. Staff Member"
                  disabled={!!editingOperator}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  value={operatorForm.email}
                  onChange={(e) => setOperatorForm(p => ({ ...p, email: e.target.value }))}
                  className="form-control"
                  placeholder="e.g. staff@vkbathouse.com"
                  disabled={!!editingOperator}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Authorization Password *</label>
                <input
                  type="text"
                  required
                  value={operatorForm.password}
                  onChange={(e) => setOperatorForm(p => ({ ...p, password: e.target.value }))}
                  className="form-control"
                  placeholder="Enter login password"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Team Role *</label>
                <select
                  value={operatorForm.role}
                  onChange={(e) => setOperatorForm(p => ({ ...p, role: e.target.value }))}
                  className="form-control"
                >
                  <option value="super-admin">Super Admin (All Privileges)</option>
                  <option value="staff">Staff (Orders & Products)</option>
                  <option value="content-manager">Content Manager (CMS & Blogs)</option>
                  <option value="sales-team">Sales Representative (Leads & Orders)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowOperatorModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Team Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT TESTIMONIAL MODAL --- */}
      {showTestimonialModal && (
        <div className="modal-overlay" onClick={() => setShowTestimonialModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal-content admin-form-modal" onClick={e => e.stopPropagation()} style={{ background: '#121217', border: '1px solid var(--border)', maxWidth: '500px' }}>
            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '20px' }}>
              {editingTestimonial ? 'Modify Testimonial' : 'Add Brand Testimonial'}
            </h3>
            <form onSubmit={handleTestimonialSubmit}>
              <div className="form-group">
                <label className="form-label">Reviewer Name *</label>
                <input
                  type="text"
                  required
                  value={testimonialForm.reviewerName}
                  onChange={(e) => setTestimonialForm(p => ({ ...p, reviewerName: e.target.value }))}
                  className="form-control"
                  placeholder="e.g. Mehul Shah"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Reviewer Role/Designation *</label>
                <input
                  type="text"
                  required
                  value={testimonialForm.reviewerRole}
                  onChange={(e) => setTestimonialForm(p => ({ ...p, reviewerRole: e.target.value }))}
                  className="form-control"
                  placeholder="e.g. League Captain, Vadodara"
                />
              </div>
              <div className="admin-form-grid">
                <div className="form-group">
                  <label className="form-label">Rating Stars *</label>
                  <select
                    value={testimonialForm.stars}
                    onChange={(e) => setTestimonialForm(p => ({ ...p, stars: Number(e.target.value) }))}
                    className="form-control"
                  >
                    <option value={5}>5 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={2}>2 Stars</option>
                    <option value={1}>1 Star</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Backdrop Clip / Video URL</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <label htmlFor="testimonial-video-upload" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      Upload Video
                    </label>
                    <input
                      type="file"
                      id="testimonial-video-upload"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            alert("Warning: This video file is larger than 2MB. To avoid exceeding client-side localStorage capacity limits, we highly recommend uploading a shorter or more compressed video file under 2MB.");
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setTestimonialForm(prev => ({ ...prev, videoUrl: reader.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Upload (Max 2MB).</span>
                  </div>
                  <input
                    type="text"
                    value={testimonialForm.videoUrl}
                    onChange={(e) => setTestimonialForm(p => ({ ...p, videoUrl: e.target.value }))}
                    className="form-control"
                    placeholder="e.g. /assets/videos/player_review.mp4"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Review Comments *</label>
                <textarea
                  required
                  value={testimonialForm.text}
                  onChange={(e) => setTestimonialForm(p => ({ ...p, text: e.target.value }))}
                  className="form-control"
                  placeholder="Type customer testimonial here..."
                  style={{ minHeight: '100px' }}
                />
              </div>
              <div style={{ margin: '15px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={testimonialForm.approved}
                    onChange={(e) => setTestimonialForm(p => ({ ...p, approved: e.target.checked }))}
                  /> Approved & Display on Storefront
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowTestimonialModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Testimonial</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT CRAFT STEP MODAL --- */}
      {showCraftModal && (
        <div className="modal-overlay" onClick={() => setShowCraftModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal-content admin-form-modal" onClick={e => e.stopPropagation()} style={{ background: '#121217', border: '1px solid var(--border)', maxWidth: '500px' }}>
            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '20px' }}>
              {editingCraftStep ? 'Modify Craftsmanship Step' : 'Add Craft Step'}
            </h3>
            <form onSubmit={handleCraftSubmit}>
              <div className="form-group">
                <label className="form-label">Step Title *</label>
                <input
                  type="text"
                  required
                  value={craftForm.title}
                  onChange={(e) => setCraftForm(p => ({ ...p, title: e.target.value }))}
                  className="form-control"
                  placeholder="e.g. Willow Selection"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description Details *</label>
                <textarea
                  required
                  value={craftForm.desc}
                  onChange={(e) => setCraftForm(p => ({ ...p, desc: e.target.value }))}
                  className="form-control"
                  placeholder="Describe this craftsmanship step..."
                  style={{ minHeight: '120px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowCraftModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Step</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
