import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { db } from './data/db';
import { productService } from './services/productService';
import { categoryService } from './services/categoryService';
import { settingService } from './services/settingService';
import { cloudSync } from './services/cloudSync';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Hero from './components/Hero';
import ProductList from './components/ProductList';
import ProductDetailModal from './components/ProductDetailModal';
import CartModal from './components/CartModal';
import CheckoutView from './components/CheckoutView';
import PolicyView from './components/PolicyView';
import Timeline from './components/Timeline';
import ContactForm from './components/ContactForm';
import BestSellersCarousel from './components/BestSellersCarousel';
import AuthModal from './components/AuthModal';
import WishlistModal from './components/WishlistModal';
import GalleryPage from './components/GalleryPage';
import CustomerProfile from './components/CustomerProfile';
import {
  ShieldCheck, MessageCircle, Heart, User, Menu, X,
  Play, CheckCircle, Search, ShoppingBag, Home, Grid
} from 'lucide-react';
import confetti from 'canvas-confetti';
import './App.css';

const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));

export default function App() {
  const [activeView, setActiveView] = useState('home'); // home, shop, gallery, about, blogs, customer-account, dashboard, blog-detail
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cms, setCms] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [banners, setBanners] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [demoVideos, setDemoVideos] = useState([]);
  const [homepageSections, setHomepageSections] = useState([]);
  const [settings, setSettings] = useState({});
  const [navigationList, setNavigationList] = useState([]);
  const [brandStory, setBrandStory] = useState(null);
  const [typography, setTypography] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeBlog, setActiveBlog] = useState(null);

  // Customer Authentication States
  const [currentUser, setCurrentUser] = useState(() => db.getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Wishlist States
  const [wishlist, setWishlist] = useState(() => {
    const u = db.getCurrentUser();
    return u ? db.getUserWishlist(u.id) : [];
  });
  const [showWishlist, setShowWishlist] = useState(false);

  // Mobile Hamburger Drawer State
  const [showMobileNav, setShowMobileNav] = useState(false);

  // Sticky header scrolled state
  const [scrolled, setScrolled] = useState(false);
  const [showBulkOrderModal, setShowBulkOrderModal] = useState(false);
  const [instagramLightbox, setInstagramLightbox] = useState(null);

  // Newsletter Email State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Search State
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Category filter from featured categories
  const [shopCategoryFilter, setShopCategoryFilter] = useState('all');

  // Cart States
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState(null);

  const refreshDatabase = useCallback(() => {
    setProducts(db.getProducts());
    setCategories(db.getCategories());
    setCms(db.getCms());
    setBanners(db.getBanners());
    setGallery(db.getGallery());
    setTestimonials(db.getTestimonials());
    setDemoVideos(db.getDemoVideos());
    setHomepageSections(db.getHomepageSections());
    setSettings(db.getSettings());
    setNavigationList(db.getNavigation());
    setBrandStory(db.getBrandStory());
    setTypography(db.getTypography());
  }, []);

  // Global application initialization
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      await cloudSync.pull(); // Pull fresh data from Hostinger before anything else
      db.init(); // Ensure local DB is seeded before we do any fallbacks
      try {
        // Fetch real data from PHP backend
        const [apiProducts, apiCategories, apiSettings] = await Promise.all([
          productService.getAllProducts(),
          categoryService.getAllCategories(),
          settingService.getSettings()
        ]);

        setProducts(apiProducts);
        setCategories(apiCategories);

        // Hydrate settings if available from backend, else fallback to db.js
        if (apiSettings && Object.keys(apiSettings).length > 0) {
          if (apiSettings.homepageSections) setHomepageSections(JSON.parse(apiSettings.homepageSections));
          else setHomepageSections(db.getHomepageSections());

          if (apiSettings.settings) setSettings(JSON.parse(apiSettings.settings));
          else setSettings(db.getSettings());

          if (apiSettings.typography) setTypography(JSON.parse(apiSettings.typography));
          else setTypography(db.getTypography());

          if (apiSettings.brandStory) setBrandStory(JSON.parse(apiSettings.brandStory));
          else setBrandStory(db.getBrandStory());

          if (apiSettings.cms) setCms(JSON.parse(apiSettings.cms));
          else setCms(db.getCms());

          if (apiSettings.navigation) setNavigationList(JSON.parse(apiSettings.navigation));
          else setNavigationList(db.getNavigation());
        } else {
          // Fallback
          setHomepageSections(db.getHomepageSections());
          setSettings(db.getSettings());
          setTypography(db.getTypography());
          setBrandStory(db.getBrandStory());
          setCms(db.getCms());
          setNavigationList(db.getNavigation());
        }

        setBlogs(db.get("blogs") || []);
        db.init();
        refreshDatabase();
      } catch (err) {
        console.error("Failed to initialize app from API, falling back to local database", err);
        toast.warning("Live API is down. Loading offline catalog mode.");
        setProducts(db.getProducts());
        setCategories(db.getCategories());

        // Fallback for settings
        setHomepageSections(db.getHomepageSections());
        setSettings(db.getSettings());
        setTypography(db.getTypography());
        setBrandStory(db.getBrandStory());
        setCms(db.getCms());
        setNavigationList(db.getNavigation());

        // Ensure other mock data is loaded
        setBlogs(db.get("blogs") || []);
        db.init();
        refreshDatabase();
      } finally {
        // Failsafe timeout in case video is blocked or stuck
        setTimeout(() => {
          setIsLoading(false);
        }, 12000);
      }
    };

    initApp();

    // SPA Router Hash Change handler
    const handlePopState = () => {
      // Clean up legacy hash routes from old bookmarks or refreshed pages
      if (window.location.hash && !['#about', '#contact', '#hero', '#reviews', '#why'].includes(window.location.hash)) {
        const legacyPath = window.location.hash.substring(1);
        if (['shop', 'checkout', 'gallery', 'account', 'blogs', 'terms', 'privacy', 'returns', 'vk-dashboard-console'].includes(legacyPath) || legacyPath.startsWith('cat-')) {
          window.history.replaceState(null, '', '/' + legacyPath);
        }
      }

      const path = window.location.pathname;
      if (path !== '/checkout') {
        setBuyNowItem(null);
      }
      if (path === '/vk-dashboard-console') {
        const activeAdmin = db.getAdminSession();
        const token = localStorage.getItem('vk_auth_token');
        if (activeAdmin && token) {
          setActiveView('dashboard');
        } else {
          db.logoutAdmin();
          window.history.pushState(null, '', '/');
          setActiveView('home');
          setShowAuthModal(true);
        }
      } else if (path === '/shop') {
        setActiveView('shop');
      } else if (path === '/gallery') {
        setActiveView('gallery');
      } else if (path === '/account') {
        setActiveView('customer-account');
      } else if (path === '/blogs') {
        setActiveView('blogs');
      } else if (path === '/checkout') {
        setActiveView('checkout');
      } else if (path === '/terms' || path === '/privacy' || path === '/returns') {
        setActiveView(path.substring(1));
      } else if (path.startsWith('/cat-')) {
        const catId = path.replace('/cat-', '');
        setShopCategoryFilter(catId);
        setActiveView('shop');
      } else {
        setActiveView('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState();

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };

  }, [refreshDatabase]);

  // Background polling to auto-update the storefront when admin makes database modifications
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      const updated = await cloudSync.pull();
      if (updated) {
        refreshDatabase();
      }
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(syncInterval);
  }, [refreshDatabase]);

  // Instant cross-tab storage listener to sync categories & admin edits
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (!e.key || e.key.startsWith('vk_bathouse_')) {
        refreshDatabase();
      }
    };
    // Same-tab custom event for when admin makes changes within the same SPA
    const handleDataChanged = () => {
      refreshDatabase();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('vk-data-changed', handleDataChanged);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('vk-data-changed', handleDataChanged);
    };
  }, [refreshDatabase]);

  // Scroll to top on view change, but respect hash links
  useEffect(() => {
    const hash = window.location.hash;
    const scrollableHashes = ['#about', '#contact', '#hero', '#reviews', '#why'];
    if (hash && scrollableHashes.includes(hash)) {
      setTimeout(() => {
        const el = document.getElementById(hash.substring(1));
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    } else {
      window.scrollTo(0, 0);
    }
  }, [activeView]);

  // Handle scroll events and animations
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.12 });

    const fadeEls = document.querySelectorAll('.fade-in');
    fadeEls.forEach(el => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      fadeEls.forEach(el => observer.unobserve(el));
    };
  }, [activeView, products, homepageSections, isLoading]);

  // SEO dynamically updates title & meta search descriptions
  useEffect(() => {
    if (cms && cms.seo) {
      document.title = cms.seo.title || "Vishwakarma Bat House";

      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', cms.seo.description || "Premium Handcrafted Cricket Bats");
    }
  }, [cms]);

  // Typography dynamically loads Google fonts and overrides elements
  useEffect(() => {
    if (typography) {
      const heading = typography.headingFont || 'Syne';
      const body = typography.bodyFont || 'Inter';

      let fontLink = document.getElementById('dynamic-google-fonts');
      if (!fontLink) {
        fontLink = document.createElement('link');
        fontLink.id = 'dynamic-google-fonts';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
      }
      fontLink.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(heading)}:wght@400;600;700;800;900&family=${encodeURIComponent(body)}:wght@300;400;500;600;700&display=swap`;

      let styleTag = document.getElementById('dynamic-typography-styles');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-typography-styles';
        document.head.appendChild(styleTag);
      }
      styleTag.innerHTML = `
        body, p, span, a, li, input, select, textarea, .btn-primary, .btn-secondary, .btn-outline {
          font-family: '${body}', sans-serif !important;
        }
        h1, h2, h3, h4, h5, h6, .section-title {
          font-family: '${heading}', sans-serif !important;
        }
      `;
    }
  }, [typography]);

  // Active Theme handler
  useEffect(() => {
    if (settings && settings.theme) {
      document.documentElement.setAttribute('data-theme', settings.theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [settings]);



  const handleAddToCart = (product, weight, handle, quantity = 1, isBuyNow = false) => {
    if (!currentUser) {
      toast.info("Please login to add items to your cart");
      setShowAuthModal(true);
      return;
    }

    // Get current stock
    const pStock = product.stock !== undefined ? Number(product.stock) : 999;
    if (pStock <= 0) {
      toast.error(`"${product.name}" is currently out of stock.`);
      return;
    }

    // Check existing cart items for this product
    const existingQty = isBuyNow ? 0 : cart
      .filter(item => item.product.id === product.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    if (existingQty + quantity > pStock) {
      if (isBuyNow) {
        toast.error(`Cannot purchase. Only ${pStock} items of "${product.name}" are in stock.`);
      } else {
        toast.error(`Cannot add more. Only ${pStock} items of "${product.name}" are in stock (${existingQty} already in cart).`);
      }
      return;
    }

    if (isBuyNow) {
      setBuyNowItem({ cartId: Date.now() + Math.random(), product, weight, handle, quantity });
      window.history.pushState(null, '', '/checkout'); window.dispatchEvent(new Event('popstate'));
      setActiveView('checkout');
    } else {
      setCart(prev => {
        const existingIdx = prev.findIndex(item => item.product.id === product.id && item.weight === weight && item.handle === handle);
        if (existingIdx >= 0) {
          const newCart = [...prev];
          newCart[existingIdx].quantity += quantity;
          return newCart;
        }
        return [...prev, { cartId: Date.now() + Math.random(), product, weight, handle, quantity }];
      });

      toast.success(
        ({ closeToast }) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '14px' }}><strong>{product.name}</strong> added to cart!</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedProduct(null); // Close the Product Detail Modal so it doesn't block the Cart
                setShowCart(true);
                if (closeToast) closeToast();
              }}
              style={{
                background: 'var(--gold)',
                color: '#000',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                alignSelf: 'flex-start',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => e.target.style.opacity = 0.8}
              onMouseOut={(e) => e.target.style.opacity = 1}
            >
              View Cart
            </button>
          </div>
        ),
        { autoClose: 5000, closeOnClick: false }
      );
    }
  };

  const handleRemoveFromCart = (cartId) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const handleClearCart = () => setCart([]);

  const handleUpdateCartQuantity = (cartId, quantity) => {
    if (quantity <= 0) return handleRemoveFromCart(cartId);

    // Find the item to check stock
    const item = cart.find(i => i.cartId === cartId);
    if (item) {
      const pStock = item.product.stock !== undefined ? Number(item.product.stock) : 999;

      // Calculate total quantity of this product from other variants in cart
      const otherQty = cart
        .filter(i => i.product.id === item.product.id && i.cartId !== cartId)
        .reduce((sum, i) => sum + i.quantity, 0);

      if (otherQty + quantity > pStock) {
        toast.error(`Sorry, only ${pStock} items of "${item.product.name}" are available in stock.`);
        return;
      }
    }

    setCart(prev => prev.map(item => item.cartId === cartId ? { ...item, quantity } : item));
  };

  const handleToggleWishlist = (productId) => {
    if (!currentUser) {
      toast.info("Please login to save your wishlist");
      setShowAuthModal(true);
      return;
    }
    const updatedWishlist = db.toggleWishlist(currentUser.id, productId);
    setWishlist(updatedWishlist);

    if (updatedWishlist.includes(productId)) {
      toast.success("Added to Wishlist");
    } else {
      toast.info("Removed from Wishlist");
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.role && ['super-admin', 'staff', 'content-manager', 'sales-team'].includes(user.role)) {
      window.history.pushState(null, '', '/vk-dashboard-console');
      window.dispatchEvent(new Event('popstate'));
      return;
    }
    setWishlist(db.getUserWishlist(user.id));
    confetti({
      particleCount: 50,
      spread: 60,
      colors: ['#e31b23', '#ffffff']
    });
  };

  const handleLogout = () => {
    if (currentUser) {
      db.addLog("Customer logout successful: " + currentUser.email);
    }
    db.setCurrentUser(null);
    setCurrentUser(null);
    setWishlist([]);
    window.history.pushState(null, '', '/'); window.dispatchEvent(new Event('popstate'));
  };

  const handleBlogClick = (blog) => {
    setActiveBlog(blog);
    setActiveView('blog-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubscribed(true);
    confetti({
      particleCount: 40,
      spread: 50,
      colors: ['#e31b23', '#ffffff']
    });
    setNewsletterEmail('');
  };

  if (isLoading || !cms) {
    return (
      <div className="video-intro-container" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <video
          src="/assets/2026_06_13_19_03_54.mp4"
          autoPlay
          muted
          playsInline
          onEnded={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <button
          onClick={() => setIsLoading(false)}
          style={{ position: 'absolute', bottom: '40px', right: '40px', zIndex: 10000, background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '12px 24px', borderRadius: '30px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', backdropFilter: 'blur(5px)', transition: 'all 0.3s ease' }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.8)'; e.currentTarget.style.borderColor = '#fff'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
        >
          Skip Intro
        </button>
      </div>
    );
  }

  // Gate Admin View (no public buttons)
  if (activeView === 'dashboard') {
    return (
      <Suspense fallback={<div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--white)' }}>Loading Admin Console...</div>}>
        <AdminDashboard
          onBackToStore={() => {
            window.history.pushState(null, '', '/'); window.dispatchEvent(new Event('popstate'));
            setActiveView('home');
            refreshDatabase();
          }}
          onLogout={() => {
            db.setCurrentUser(null);
            setCurrentUser(null);
            setWishlist([]);
            window.history.pushState(null, '', '/'); window.dispatchEvent(new Event('popstate'));
            setActiveView('home');
            refreshDatabase();
          }}
        />
      </Suspense>
    );
  }

  // Filter dynamic products with settings limit
  const bestSellerProducts = products
    .filter(p => p.bestSeller === true)
    .slice(0, settings.bestSellersLimit !== undefined ? settings.bestSellersLimit : 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--black)' }}>

      {/* Top Hitter Announcement Bar */}
      <div style={{
        background: '#111111',
        color: '#ffffff',
        height: '35px',
        fontSize: '11px',
        fontWeight: '600',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 501
      }}>
        <span>Free Delivery all over India</span>
      </div>

      {/* Header / Navbar */}
      <header className={`nav-header ${scrolled || activeView !== 'home' ? 'scrolled' : ''}`} style={{
        top: scrolled ? '0px' : '35px',
        background: (scrolled || activeView !== 'home') ? 'var(--black)' : 'transparent',
        borderBottom: (scrolled || activeView !== 'home') ? '1px solid var(--border)' : 'none',
        color: (scrolled || activeView !== 'home') ? 'var(--white)' : '#ffffff'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>

          {/* Brand Left Logo */}
          <div onClick={() => { window.history.pushState(null, '', '/'); window.dispatchEvent(new Event('popstate')); setActiveView('home'); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            {brandStory?.logoUrl ? (
              <img
                src={brandStory.logoUrl}
                alt="VK Logo"
                style={{ width: '38px', height: '38px', objectFit: 'contain' }}
              />
            ) : (
              <div className="logo-text">
                <span className="logo-vk">VK</span>
                <span className="logo-sub">Bat House</span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {navigationList
              .filter(nav => nav.active !== false)
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map(nav => {
                const isAnchor = nav.link.startsWith('#') || nav.link === '';
                const isActive = (nav.link === '#' && activeView === 'home') ||
                  (nav.link === '#shop' && activeView === 'shop') ||
                  (nav.link === '#gallery' && activeView === 'gallery') ||
                  (nav.link === '#account' && activeView === 'customer-account');

                const handleClick = (e) => {
                  if (nav.link === 'bulk') {
                    e.preventDefault();
                    setShowBulkOrderModal(true);
                  } else if (isAnchor) {
                    if (nav.link === '#' || nav.link === '') {
                      window.history.pushState(null, '', '/'); window.dispatchEvent(new Event('popstate'));
                      setActiveView('home');
                    } else if (nav.link === '#shop') {
                      setShopCategoryFilter('all');
                      window.history.pushState(null, '', '/shop'); window.dispatchEvent(new Event('popstate'));
                    } else {
                      if (nav.link.startsWith('#')) {
                        if (activeView !== 'home') {
                          window.history.pushState(null, '', '/' + nav.link);
                          window.dispatchEvent(new Event('popstate'));
                        } else {
                          window.location.hash = nav.link;
                        }
                      } else {
                        window.history.pushState(null, '', nav.link);
                        window.dispatchEvent(new Event('popstate'));
                      }
                    }
                  }
                };

                return (
                  <span
                    key={nav.id}
                    onClick={handleClick}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    {nav.label}
                  </span>
                );
              })}
          </nav>

          {/* Action widgets (Search, Account, Wishlist, Cart with dark badges) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

            {/* Search Icon & Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {showSearch && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 499 }}
                    onClick={() => setShowSearch(false)}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (activeView !== 'shop') {
                        window.history.pushState(null, '', '/shop'); window.dispatchEvent(new Event('popstate'));
                        setActiveView('shop');
                      }
                    }}
                    autoFocus
                    placeholder="Search weapons..."
                    style={{ position: 'relative', zIndex: 500, background: 'var(--dark)', border: '1px solid var(--border)', color: 'var(--white)', padding: '6px 12px', fontSize: '13px', borderRadius: '4px', outline: 'none', width: '160px' }}
                  />
                </>
              )}
              <button
                onClick={() => {
                  setShowSearch(!showSearch);
                  if (!showSearch) {
                    setShopCategoryFilter('all');
                    window.history.pushState(null, '', '/shop'); window.dispatchEvent(new Event('popstate'));
                  }
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--white)', cursor: 'pointer' }}
                title="Search Shop"
              >
                <Search size={20} />
              </button>
            </div>

            {/* Profile User Badge / Login */}
            {currentUser ? (
              currentUser.role ? (
                <div onClick={() => { window.history.pushState(null, '', '/vk-dashboard-console'); window.dispatchEvent(new Event('popstate')); }} className="user-account-badge admin-badge hide-on-mobile animate-pulse" style={{ cursor: 'pointer', background: 'rgba(163,0,0,0.15)', border: '1px solid var(--gold)', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gold)', fontSize: '12px', fontWeight: 'bold' }} title="Go to Admin Dashboard">
                  <ShieldCheck size={14} style={{ color: 'var(--gold)' }} />
                  <span>Admin Console</span>
                </div>
              ) : (
                <div onClick={() => { window.history.pushState(null, '', '/account'); window.dispatchEvent(new Event('popstate')); }} className="user-account-badge hide-on-mobile" style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--white)', fontSize: '12px', fontWeight: 'bold' }}>
                  <User size={14} />
                  <span>{currentUser.name.split(' ')[0]}</span>
                </div>
              )
            ) : (
              <button
                className="hide-on-mobile"
                onClick={() => setShowAuthModal(true)}
                style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
                title="Account Login"
              >
                <User size={20} />
              </button>
            )}

            {/* Wishlist Heart Icon with Dark Badge */}
            <button
              className="hide-on-mobile"
              onClick={() => setShowWishlist(true)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }}
              title="Wishlist"
            >
              <Heart size={20} fill={wishlist.length > 0 ? "var(--red)" : "none"} color={wishlist.length > 0 ? "var(--red)" : "currentColor"} />
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: 'var(--red)',
                color: '#ffffff',
                fontSize: '9px',
                fontWeight: '700',
                borderRadius: '50%',
                width: '15px',
                height: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {wishlist.length}
              </span>
            </button>

            {/* Shopping Bag Icon with Dark Badge */}
            <button
              className="hide-on-mobile"
              onClick={() => setShowCart(true)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }}
              title="Shopping Cart"
            >
              <ShoppingBag size={20} />
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: 'var(--red)',
                color: '#ffffff',
                fontSize: '9px',
                fontWeight: '700',
                borderRadius: '50%',
                width: '15px',
                height: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {cart.length}
              </span>
            </button>

            {/* Mobile Hamburger Drawer Menu button */}
            <button className="menu-burger" onClick={() => setShowMobileNav(true)} aria-label="Open Navigation menu" style={{ background: 'transparent', border: 'none', color: 'var(--white)', cursor: 'pointer' }}>
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Spacer for sticky header overlay */}
      <div style={{ height: '75px' }}></div>

      {/* VIEW: BLOGS GRID */}
      {activeView === 'blogs' && (
        <section className="section-padding" style={{ background: 'var(--black)', flexGrow: 1 }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <span className="badge badge-gold" style={{ marginBottom: '12px', background: 'var(--gold)', color: '#fff' }}>Knowledge Hub</span>
              <h2 style={{ fontSize: '2.5rem', fontFamily: 'Playfair Display', color: 'var(--white)' }}>VK Cricket Bat Guides</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', textAlign: 'left' }}>
              {blogs.map(blog => (
                <div key={blog.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', background: 'var(--card)' }}>
                  <img
                    src={blog.image || "/assets/poster.jpg"}
                    alt={blog.title}
                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = "/assets/poster.jpg"; }}
                  />
                  <div style={{ padding: '24px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                      By {blog.author} | {blog.date}
                    </span>
                    <h3 style={{ color: 'var(--white)', fontSize: '1.25rem', marginBottom: '12px', lineHeight: 1.3 }}>{blog.title}</h3>
                    <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.5 }}>
                      {blog.content.substring(0, 120)}...
                    </p>
                    <button
                      onClick={() => handleBlogClick(blog)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                    >
                      Read Guide
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* VIEW: BLOG DETAIL */}
      {activeView === 'blog-detail' && activeBlog && (
        <section className="section-padding" style={{ background: 'var(--black)', flexGrow: 1, textAlign: 'left' }}>
          <div className="container" style={{ maxWidth: '800px' }}>
            <button onClick={() => setActiveView('blogs')} className="btn btn-secondary" style={{ marginBottom: '30px', padding: '6px 14px', fontSize: '0.8rem' }}>
              ← Back to Guides
            </button>
            <h1 style={{ fontSize: '2.4rem', marginBottom: '20px', lineHeight: '1.2', fontFamily: 'var(--font-serif)', color: 'var(--white)' }}>{activeBlog.title}</h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '24px' }}>
              By {activeBlog.author} on {activeBlog.date}
            </span>
            <div style={{ color: 'var(--white)', fontSize: '1.05rem', lineHeight: '1.7', whiteSpace: 'pre-line', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              {activeBlog.content}
            </div>
          </div>
        </section>
      )}

      {/* VIEW: SHOP PAGE */}
      {activeView === 'shop' && (
        <ProductList
          products={products}
          categories={categories}
          onProductClick={(p) => setSelectedProduct(p)}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
          isShopPage={true}
          forceCategory={shopCategoryFilter}
          externalSearchQuery={searchQuery}
        />
      )}

      {/* VIEW: CHECKOUT PAGE */}
      {activeView === 'checkout' && (
        <CheckoutView
          cart={buyNowItem ? [buyNowItem] : cart}
          onBackToShop={() => {
            setBuyNowItem(null);
            window.history.pushState(null, '', '/shop');
            window.dispatchEvent(new Event('popstate'));
            setActiveView('shop');
          }}
          onClearCart={buyNowItem ? () => setBuyNowItem(null) : handleClearCart}
          onRequestLogin={() => setShowAuthModal(true)}
        />
      )}

      {/* VIEW: POLICIES */}
      {['terms', 'privacy', 'returns'].includes(activeView) && (
        <PolicyView
          title={
            activeView === 'terms' ? 'Terms of Service' :
              activeView === 'privacy' ? 'Privacy Policy' : 'Returns & Refunds'
          }
          content={brandStory?.companyPages?.[activeView] || cms.about?.[activeView] || ''}
          onBack={() => { window.history.pushState(null, '', '/'); window.dispatchEvent(new Event('popstate')); setActiveView('home'); }}
        />
      )}

      {/* VIEW: GALLERY MASONRY */}
      {activeView === 'gallery' && (
        <GalleryPage gallery={gallery} />
      )}

      {/* VIEW: CUSTOMER ACCOUNT PROFILE */}
      {activeView === 'customer-account' && (
        <CustomerProfile
          currentUser={currentUser}
          onLogout={handleLogout}
          onCloseStorefront={() => { window.history.pushState(null, '', '/'); window.dispatchEvent(new Event('popstate')); setActiveView('home'); }}
        />
      )}

      {/* VIEW: HOME VIEW (DYNAMIC SECTIONS ACCORDING TO CMS BUILDER ORDER) */}
      {activeView === 'home' && (
        <>
          {homepageSections
            .filter(section => section.active !== false)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((section) => {
              switch (section.id) {

                // Hero slider
                case 'hero':
                  return (
                    <Hero
                      key="sec-hero"
                      banners={banners}
                      onShopClick={() => { window.history.pushState(null, '', '/shop'); window.dispatchEvent(new Event('popstate')); }}
                      onContactClick={() => {
                        const contactEl = document.getElementById('contact');
                        if (contactEl) contactEl.scrollIntoView({ behavior: 'smooth' });
                      }}
                    />
                  );

                // Featured categories list: Dynamic categories collection grid
                case 'featured_categories': {
                  const sortedCategories = [...categories].sort(
                    (a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0)
                  );

                  return (
                    <section key="sec-cats" className="section-padding" style={{ background: 'var(--black)', borderBottom: '1px solid var(--border)' }}>
                      <div className="container">
                        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                          <span className="section-tag">Explore Series</span>
                          <h2 className="section-title" style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--white)' }}>Categories Collection</h2>
                          <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '500px', margin: '12px auto 0' }}>
                            Handcrafted options designed for every format. Pick your weapon class.
                          </p>
                        </div>

                        <div className="products-grid">
                          {sortedCategories.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                              No categories configured. Add categories in Admin Console.
                            </div>
                          ) : (
                            sortedCategories.map((cat) => (
                              <div
                                key={cat.id || cat.slug || cat.name}
                                onClick={() => {
                                  setShopCategoryFilter(cat.id || cat.slug);
                                  window.history.pushState(null, '', '/shop');
                                  window.dispatchEvent(new Event('popstate'));
                                }}
                                className="product-card"
                                style={{
                                  background: 'var(--black)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '8px',
                                  padding: '12px',
                                  textAlign: 'center',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  boxShadow: 'none',
                                  transition: 'all 0.3s ease',
                                  cursor: 'pointer'
                                }}
                              >
                                <div
                                  className="card-image-wrapper"
                                  style={{
                                    width: '100%',
                                    aspectRatio: '3/4',
                                    background: 'var(--card-image-bg, transparent)',
                                    borderRadius: '6px',
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '10px'
                                  }}
                                >
                                  <img
                                    src={cat.banner || "/assets/bat_single.png"}
                                    alt={cat.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    onError={(e) => {
                                      e.target.src = "/assets/bat_single.png";
                                    }}
                                  />
                                </div>
                                <div style={{ width: '100%', marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--white)', marginBottom: '4px', textAlign: 'center' }}>
                                    {cat.name}
                                  </h3>
                                  {cat.price ? (
                                    <span style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px' }}>
                                      Starting from ₹{cat.price}
                                    </span>
                                  ) : null}
                                  <span style={{ fontSize: '11px', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700' }}>
                                    View Collection
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </section>
                  );
                }

                // Best sellers bats carousel
                case 'best_sellers':
                  return (
                    <BestSellersCarousel
                      key="sec-best"
                      products={bestSellerProducts}
                      categories={categories}
                      onProductClick={(p) => setSelectedProduct(p)}
                      wishlist={wishlist}
                      onToggleWishlist={handleToggleWishlist}
                      limit={settings.bestSellersLimit !== undefined ? settings.bestSellersLimit : 4}
                    />
                  );

                // New Arrivals
                case 'new_arrivals':
                  return (
                    <section key="sec-new" className="section-padding" style={{ background: 'var(--dark)' }}>
                      <div className="container">
                        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                          <span className="section-tag">Latest Collection</span>
                          <h2 className="section-title" style={{ fontFamily: 'Barlow Condensed', fontSize: '2.5rem', fontWeight: 'bold' }}>New Arrival</h2>
                        </div>
                        <div className="products-grid">
                          {products.slice(0, 4).map(product => {
                            const isWishlisted = wishlist.includes(product.id);
                            return (
                              <div
                                key={product.id}
                                className="product-card"
                                onClick={() => setSelectedProduct(product)}
                                style={{
                                  background: 'var(--black)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '8px',
                                  padding: '12px',
                                  textAlign: 'center',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  boxShadow: 'none',
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                <div className="card-image-wrapper" style={{ width: '100%', aspectRatio: '3/4', background: 'var(--card-image-bg, transparent)', borderRadius: '6px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                                  <span style={{ position: 'absolute', top: '12px', left: '12px', background: '#000000', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px' }}>-20%</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleWishlist(product.id); }}
                                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                  >
                                    <Heart size={16} fill={isWishlisted ? 'var(--color-red)' : 'none'} color={isWishlisted ? 'var(--color-red)' : '#fff'} />
                                  </button>
                                  <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                                <div style={{ width: '100%', marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--white)', marginBottom: '8px', minHeight: '38px', textAlign: 'center' }}>{product.name}</h3>
                                  <div style={{ display: 'flex', justify: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--gold)' }}>₹{product.price.toLocaleString('en-IN')}.00</span>
                                  </div>
                                  <button
                                    className="product-btn"
                                    style={{ width: '85%', background: 'transparent', border: '1px solid var(--border)', color: 'var(--white)', padding: '8px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}
                                    onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); }}
                                  >
                                    Add to Cart
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </section>
                  );

                // All Products section (Appears right after New Arrivals)
                case 'all_products':
                  return (
                    <ProductList
                      key="sec-all-products"
                      products={products}
                      categories={categories}
                      onProductClick={(p) => setSelectedProduct(p)}
                      wishlist={wishlist}
                      onToggleWishlist={handleToggleWishlist}
                      isShopPage={false}
                    />
                  );

                // Why choose us (Visual effects)
                case 'why':
                  return (
                    <section key="sec-why" className="why section-padding" id="why" style={{ background: 'var(--black)', color: 'var(--white)' }}>
                      <div className="container">
                        <div className="why-inner">
                          <div className="why-features fade-in">
                            <span className="section-tag">Why VK?</span>
                            <h2 className="section-title" style={{ marginBottom: '40px', color: 'var(--white)' }}>
                              Built Different.<br />Performs Different.
                            </h2>

                            <div className="why-feat">
                              <div className="why-feat-num">01</div>
                              <div className="why-feat-content">
                                <div className="why-feat-title">Artisan Handcrafted</div>
                                <div className="why-feat-desc">Shaped manually by third-generation batmakers in Chaklasi. We refine the curvature of every blade to guarantee the perfect aerodynamic pickup and sweep.</div>
                              </div>
                            </div>

                            <div className="why-feat">
                              <div className="why-feat-num">02</div>
                              <div className="why-feat-content">
                                <div className="why-feat-title">5-Ton Pressing</div>
                                <div className="why-feat-desc">Pressed under 5-ton setups to compact the willow cells, assuring extreme durability and an explosive ping response straight out of the box.</div>
                              </div>
                            </div>

                            <div className="why-feat">
                              <div className="why-feat-num">03</div>
                              <div className="why-feat-content">
                                <div className="why-feat-title">Optimal Power-to-Weight</div>
                                <div className="why-feat-desc">Thick profiles (40mm+ edges, 60mm+ spine) paired with balanced weight distribution, offering massive power without sacrificing hand speed.</div>
                              </div>
                            </div>

                            <div className="why-feat">
                              <div className="why-feat-num">04</div>
                              <div className="why-feat-content">
                                <div className="why-feat-title">Singapore Cane Handles</div>
                                <div className="why-feat-desc">Built with premium multi-piece cane handles wrapped in high-tension thread and epoxy to absorb heavy impacts and reduce sting vibrations.</div>
                              </div>
                            </div>
                          </div>

                          <div className="why-visual fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                            <div style={{
                              position: 'relative',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              border: '1px solid var(--border)',
                              boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 40px rgba(227, 27, 35, 0.1)',
                              maxWidth: '100%',
                              width: '380px',
                              margin: '0 auto'
                            }}>
                              <img
                                src={brandStory?.newsletterPopupImage || "/assets/why_vk_bat.png"}
                                alt="VK Premium Bat Close-Up"
                                style={{ width: '100%', height: 'auto', display: 'block', transition: 'transform 0.5s' }}
                                onError={(e) => { e.target.src = "/assets/bat_single.png"; }}
                              />
                              <div style={{
                                position: 'absolute',
                                bottom: '20px',
                                left: '20px',
                                background: 'rgba(0, 0, 0, 0.75)',
                                backdropFilter: 'blur(4px)',
                                border: '1px solid var(--border)',
                                padding: '10px 16px',
                                color: '#fff',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                letterSpacing: '1px'
                              }}>
                                PREMIUM GRADE-A WILLOW
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  );

                // Customer video review section: Hitter style cards
                case 'video_reviews':
                  return (
                    <section key="sec-video" className="section-padding" style={{ background: 'var(--dark)' }}>
                      <div className="container">
                        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                          <span className="section-tag">Player Feedback</span>
                          <h2 className="section-title" style={{ fontFamily: 'Barlow Condensed', fontSize: '2.5rem', fontWeight: 'bold' }}>Batting Video Reviews</h2>
                        </div>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'nowrap',
                          gap: '20px',
                          overflowX: 'auto',
                          paddingBottom: '20px',
                          scrollSnapType: 'x mandatory',
                          scrollbarWidth: 'thin',
                          scrollbarColor: 'var(--gold) var(--dark)'
                        }}>
                          {demoVideos.map((url, index) => (
                            <div
                              key={index}
                              className="product-card"
                              style={{
                                flex: '0 0 auto',
                                width: '280px',
                                background: 'var(--black)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: 'none',
                                scrollSnapAlign: 'start'
                              }}
                            >
                              <div style={{ position: 'relative', aspectRatio: '0.8', background: '#000', borderRadius: '6px', overflow: 'hidden' }}>
                                {(url.includes('youtube.com') || url.includes('youtu.be')) ? (
                                  <iframe
                                    src={url.includes('watch?v=') ? url.replace('watch?v=', 'embed/') : url.includes('youtu.be/') ? url.replace('youtu.be/', 'youtube.com/embed/') : url.includes('shorts/') ? url.replace('shorts/', 'embed/') : url}
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                ) : (
                                  <video src={url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                )}
                              </div>
                            </div>
                          ))}
                          {demoVideos.length === 0 && (
                            <div style={{ color: 'var(--muted)', width: '100%', textAlign: 'center' }}>No demo videos available.</div>
                          )}
                        </div>
                      </div>
                    </section>
                  );

                // Instagram Gallery
                case 'gallery':
                  return (
                    <section key="sec-gal" className="section-padding" style={{ background: 'var(--black)' }}>
                      <div className="container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
                          <div style={{ textAlign: 'left' }}>
                            <span className="section-tag">Social Hub</span>
                            <h2 className="section-title" style={{ margin: 0 }}>Instagram Grid</h2>
                          </div>
                          <button onClick={() => { window.history.pushState(null, '', '/gallery'); window.dispatchEvent(new Event('popstate')); }} className="btn btn-secondary">View All</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                          {gallery.slice(0, 10).map(item => (
                            <div
                              key={item.id}
                              className="instagram-grid-item"
                              onClick={() => setInstagramLightbox(item)}
                              style={{ position: 'relative', overflow: 'hidden', aspectRatio: '1', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              <img src={item.type === 'video' ? '/assets/poster.jpg' : item.url} alt={item.title} className="insta-img" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} onError={(e) => { e.target.src = "/assets/poster.jpg"; }} />
                              {item.type === 'video' && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', zIndex: 2 }}>
                                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justify: 'center', color: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.4)' }}>
                                    <Play size={16} fill="#fff" style={{ marginLeft: '2px' }} />
                                  </div>
                                </div>
                              )}
                              <div className="insta-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', opacity: 0, transition: 'opacity 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}>
                                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                  {item.type === 'video' ? 'Play Video' : 'View Image'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  );

                // Testimonials
                case 'testimonials':
                  return (
                    <section key="sec-test" className="testimonials section-padding" id="reviews" style={{ background: 'var(--dark)' }}>
                      <div className="container">
                        <div className="testimonials-header fade-in">
                          <span className="section-tag">Testimonials</span>
                          <h2 className="section-title">
                            Trusted by <span style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Champions</span>
                          </h2>
                        </div>

                        <div className="reviews-grid">
                          {testimonials.filter(t => !t.videoUrl && t.approved).slice(0, 3).map(review => (
                            <div key={review.id} className="review-card fade-in" style={{ background: 'var(--black)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                              <div className="stars">{'★'.repeat(review.stars)}</div>
                              <p className="review-text" style={{ color: 'var(--white)' }}>"{review.text}"</p>
                              <div className="reviewer">
                                <div className="reviewer-avatar" style={{ background: 'var(--gold)', color: '#fff' }}>{review.avatar}</div>
                                <div>
                                  <div className="reviewer-name">{review.reviewerName}</div>
                                  <div className="reviewer-role">{review.reviewerRole}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  );

                // Guides removed
                case 'guides':
                  return null;

                // Newsletter Section
                case 'newsletter':
                  return (
                    <section key="sec-news" className="section-padding" style={{ background: 'var(--dark)', borderTop: '1px solid var(--border)' }}>
                      <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
                        <span className="section-tag">Newsletter</span>
                        <h2 className="section-title">Join The Club</h2>
                        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>Subscribe to get notifications on new willow shipments, customized bat selections, and seasonal coupon promotions.</p>

                        {!newsletterSubscribed ? (
                          <form onSubmit={handleNewsletterSubmit} style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="email"
                              required
                              placeholder="Enter your email address"
                              className="form-control"
                              value={newsletterEmail}
                              onChange={(e) => setNewsletterEmail(e.target.value)}
                              style={{ flex: 1, padding: '12px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)' }}
                            />
                            <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>Subscribe</button>
                          </form>
                        ) : (
                          <div style={{ color: '#2ecc71', display: 'flex', alignItems: 'center', justify: 'center', gap: '8px' }}>
                            <CheckCircle size={18} />
                            <span>Thanks for subscribing! Check your email for welcoming notes.</span>
                          </div>
                        )}
                      </div>
                    </section>
                  );

                // Contact Section
                case 'contact':
                  return (
                    <span key="sec-contact">
                      <Timeline />
                      <section className="section-padding" style={{ background: 'var(--black)', borderTop: '1px solid var(--border)' }} id="about">
                        <div className="container">
                          <div className="about-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', alignItems: 'center' }}>

                            <div className="about-img-block fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                              <div style={{
                                position: 'relative',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: '1px solid var(--border)',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                                height: '420px',
                                width: '100%',
                                maxWidth: '380px',
                                margin: '0 auto'
                              }}>
                                <img
                                  src={brandStory?.storyImage || "/assets/craftsmanship_bat.png"}
                                  alt="VK Workshop Handcrafting Process"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => { e.target.src = "/assets/poster.jpg"; }}
                                />
                                <div style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)'
                                }}></div>
                                <div style={{
                                  position: 'absolute',
                                  bottom: '24px',
                                  left: '24px',
                                  color: '#fff',
                                  fontSize: '11px',
                                  letterSpacing: '2px',
                                  fontWeight: 'bold',
                                  background: 'var(--gold)',
                                  padding: '6px 14px',
                                  textTransform: 'uppercase'
                                }}>
                                  FACTORY DIRECT WORKSHOP
                                </div>
                              </div>
                            </div>

                            <div className="about-text fade-in">
                              <span className="section-tag">Craftsmanship</span>
                              <h2 className="section-title" style={{ color: 'var(--white)', marginBottom: '24px' }}>
                                {brandStory?.storyTitle || cms.about?.title || "Crafted From Tradition"}
                              </h2>

                              <p className="section-desc" style={{ color: 'var(--white)', fontSize: '15px', fontWeight: '500', marginBottom: '24px', lineHeight: '1.6' }}>
                                {brandStory?.storyParagraph1 || "At Vishwakarma Bat House (VK Bat House), we craft high-quality cricket bats using carefully selected willow, combining traditional craftsmanship with modern performance standards."}
                              </p>
                              {brandStory?.storyParagraph2 && (
                                <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
                                  {brandStory.storyParagraph2}
                                </p>
                              )}

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ borderLeft: '3px solid var(--gold)', paddingLeft: '16px' }}>
                                  <h4 style={{ color: 'var(--white)', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                    1. Sourcing Elite Clefts
                                  </h4>
                                  <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
                                    We select Grade 1+ Kashmir and English Willow, inspecting for straight grains and moisture levels to assure premium performance.
                                  </p>
                                </div>

                                <div style={{ borderLeft: '3px solid var(--gold)', paddingLeft: '16px' }}>
                                  <h4 style={{ color: 'var(--white)', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                    2. Manual Blade Shaping
                                  </h4>
                                  <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
                                    Every willow block is shaped by hand using specialized woodcarving tools. The contours are refined until the pickup feels feather-light.
                                  </p>
                                </div>

                                <div style={{ borderLeft: '3px solid var(--gold)', paddingLeft: '16px' }}>
                                  <h4 style={{ color: 'var(--white)', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                    3. Double Compression Pressing
                                  </h4>
                                  <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
                                    We press bats using professional multi-ton machinery, solidifying the willow fibers to deliver tournament-grade ping responses.
                                  </p>
                                </div>
                              </div>

                              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--muted)' }}>
                                📍 <strong>Workshop Address:</strong> {brandStory?.address || cms.about?.address}
                              </div>
                            </div>

                          </div>
                        </div>
                      </section>
                      <ContactForm about={cms.about} onNewLead={refreshDatabase} />
                    </span>
                  );

                default:
                  return null;
              }
            })}
        </>
      )}

      {/* Footer */}
      <footer style={{
        background: 'var(--black)',
        borderTop: '1px solid var(--border)',
        padding: '70px 0 35px',
        textAlign: 'left'
      }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px', marginBottom: '40px' }}>

            {/* Column 1: Brand & Contacts */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                {brandStory?.logoUrl ? (
                  <img src={brandStory.logoUrl} alt="Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                ) : (
                  <h3 style={{ color: 'var(--white)', fontSize: '1.2rem', fontWeight: '800', letterSpacing: '0.5px' }}>VK BAT HOUSE</h3>
                )}
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '16px', maxWidth: '300px' }}>
                Traditional handcrafting combined with multi-ton compression setups. Handcrafted in Chaklasi, Gujarat. Trusted by league hitters since 2003.
              </p>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                <span>📍 {brandStory?.address || cms.about?.address || 'Uttarsanda Bhalej Road, Chaklasi 387315'}</span>
                <span>📞 +91 {settings.contactPhone || '9274543199'}</span>
              </div>
              {/* Social Handles */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {settings.socialInstagram && (
                  <a
                    href={`https://instagram.com/${settings.socialInstagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--muted)', transition: 'color 0.2s', display: 'flex', alignItems: 'center' }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--gold)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--muted)'}
                    title="Instagram"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                  </a>
                )}
                {settings.socialFacebook && (
                  <a
                    href={settings.socialFacebook.startsWith('http') ? settings.socialFacebook : `https://facebook.com/${settings.socialFacebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--muted)', transition: 'color 0.2s', display: 'flex', alignItems: 'center' }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--gold)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--muted)'}
                    title="Facebook"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </a>
                )}
                {settings.socialYoutube && (
                  <a
                    href={`https://youtube.com/${settings.socialYoutube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--muted)', transition: 'color 0.2s', display: 'flex', alignItems: 'center' }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--gold)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--muted)'}
                    title="YouTube"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube">
                      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
                      <polygon points="10 15 15 12 10 9" />
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {/* Column 3: Navigation */}
            <div>
              <h4 style={{ color: 'var(--white)', fontSize: '0.9rem', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Quick Links</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', padding: 0, margin: 0 }}>
                <li>
                  <span onClick={() => { window.history.pushState(null, '', '/'); window.dispatchEvent(new Event('popstate')); }} style={{ color: 'var(--muted)', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--gold)'} onMouseOut={(e) => e.target.style.color = 'var(--muted)'}>Home Storefront</span>
                </li>
                <li>
                  <span onClick={() => { setShopCategoryFilter('all'); window.history.pushState(null, '', '/shop'); window.dispatchEvent(new Event('popstate')); }} style={{ color: 'var(--muted)', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--gold)'} onMouseOut={(e) => e.target.style.color = 'var(--muted)'}>Browse All Bats</span>
                </li>
                <li>
                  <span onClick={() => { window.history.pushState(null, '', '/gallery'); window.dispatchEvent(new Event('popstate')); }} style={{ color: 'var(--muted)', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--gold)'} onMouseOut={(e) => e.target.style.color = 'var(--muted)'}>Gallery Showcase</span>
                </li>
                <li>
                  <span onClick={() => setShowBulkOrderModal(true)} style={{ color: 'var(--muted)', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--gold)'} onMouseOut={(e) => e.target.style.color = 'var(--muted)'}>Bulk Orders Inquiries</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Hours & Policies */}
            <div>
              <h4 style={{ color: 'var(--white)', fontSize: '0.9rem', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Legal & Info</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', padding: 0, margin: 0, marginBottom: '20px' }}>
                <li>
                  <span onClick={() => { window.history.pushState(null, '', '/terms'); window.dispatchEvent(new Event('popstate')); }} style={{ color: 'var(--muted)', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--gold)'} onMouseOut={(e) => e.target.style.color = 'var(--muted)'}>Terms of Service</span>
                </li>
                <li>
                  <span onClick={() => { window.history.pushState(null, '', '/privacy'); window.dispatchEvent(new Event('popstate')); }} style={{ color: 'var(--muted)', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--gold)'} onMouseOut={(e) => e.target.style.color = 'var(--muted)'}>Privacy Policy</span>
                </li>
                <li>
                  <span onClick={() => { window.history.pushState(null, '', '/returns'); window.dispatchEvent(new Event('popstate')); }} style={{ color: 'var(--muted)', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--gold)'} onMouseOut={(e) => e.target.style.color = 'var(--muted)'}>Returns & Refunds</span>
                </li>
              </ul>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'var(--dark)',
                border: '1px solid var(--border)',
                borderRadius: '4px'
              }}>
                <div style={{ color: 'var(--white)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                  🚫 Closed on Amavasya
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '11px', lineHeight: '1.4', fontWeight: '500' }}>
                  Please Note: Our workshop remains completely closed on all Amavasya days.
                </div>
              </div>
            </div>

          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)' }}>
            <div style={{ marginBottom: '8px' }}>&copy; {new Date().getFullYear()} Vishwakarma Bat House. All rights reserved. Handcrafted with Samurai-Precision in Gujarat, India.</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>developed by <a href="" target="_blank" rel="noopener noreferrer" className="qubnix-link" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', transition: 'all 0.3s ease' }}>Nexvora</a></div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <div className={`nav-item ${activeView === 'home' ? 'active' : ''}`} onClick={() => { setActiveView('home'); window.history.pushState(null, '', '/'); window.dispatchEvent(new Event('popstate')); }}>
          <Home size={22} />
          <span>Home</span>
        </div>
        <div className={`nav-item ${activeView === 'shop' ? 'active' : ''}`} onClick={() => { setActiveView('shop'); window.history.pushState(null, '', '/shop'); window.dispatchEvent(new Event('popstate')); }}>
          <Grid size={22} />
          <span>Categories</span>
        </div>
        <div className="nav-item" onClick={() => {
          if (currentUser) {
            window.history.pushState(null, '', currentUser.role ? '/vk-dashboard-console' : '/account'); window.dispatchEvent(new Event('popstate'));
          } else {
            setShowAuthModal(true);
          }
        }}>
          <User size={22} />
          <span>Account</span>
        </div>
        <div className="nav-item" onClick={() => setShowCart(true)}>
          <div style={{ position: 'relative' }}>
            <ShoppingBag size={22} />
            {cart.length > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: 'var(--red)', color: '#fff', fontSize: '10px', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cart.length}
              </span>
            )}
          </div>
          <span>Cart</span>
        </div>
      </div>


      {/* Persistent WhatsApp Widget */}
      <a
        href={`https://wa.me/91${settings.contactWhatsapp || '9274543199'}`}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-widget"
        title="Chat with Workshop"
      >
        <MessageCircle size={28} />
      </a>

      {/* Modals and Overlays */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          categories={categories}
          wishlist={wishlist}
          onToggleWishlist={handleToggleWishlist}
          allProducts={products}
          onProductClick={(p) => setSelectedProduct(p)}
          onAddToCart={handleAddToCart}
          onRequestLogin={() => {
            setSelectedProduct(null);
            setShowAuthModal(true);
          }}
          currentUser={currentUser}
          onNewLead={() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#000000', '#ffffff']
            });
            refreshDatabase();
          }}
        />
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      {showWishlist && (
        <WishlistModal
          onClose={() => setShowWishlist(false)}
          wishlist={wishlist}
          products={products}
          onRemove={handleToggleWishlist}
          onProductClick={(p) => {
            setSelectedProduct(p);
            setShowWishlist(false);
          }}
        />
      )}

      {showBulkOrderModal && (
        <BulkOrderModal onClose={() => setShowBulkOrderModal(false)} />
      )}

      {/* Mobile Navigation Sidebar Drawer */}
      {showMobileNav && (
        <div>
          <div className="drawer-backdrop" onClick={() => setShowMobileNav(false)}></div>
          <div className="mobile-nav-drawer animate-slide-in" style={{ left: 0, right: 'auto', borderRight: '1px solid var(--border)', borderLeft: 'none', background: 'var(--black)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <strong style={{ color: 'var(--white)', letterSpacing: '0.05em' }}>NAVIGATION</strong>
              <button onClick={() => setShowMobileNav(false)} style={{ background: 'transparent', border: 'none', color: 'var(--white)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {navigationList
                .filter(nav => nav.active !== false)
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map(nav => {
                  const isAnchor = nav.link.startsWith('#') || nav.link === '';
                  const handleClick = (e) => {
                    setShowMobileNav(false);
                    if (nav.link === 'bulk') {
                      e.preventDefault();
                      setShowBulkOrderModal(true);
                    } else if (isAnchor) {
                      if (nav.link === '#' || nav.link === '') {
                        window.history.pushState(null, '', '/'); window.dispatchEvent(new Event('popstate'));
                        setActiveView('home');
                      } else if (nav.link === '#shop') {
                        setShopCategoryFilter('all');
                        window.history.pushState(null, '', '/shop'); window.dispatchEvent(new Event('popstate'));
                      } else {
                        if (nav.link.startsWith('#')) { window.location.hash = nav.link; } else { window.history.pushState(null, '', nav.link); window.dispatchEvent(new Event('popstate')); }
                      }
                    }
                  };

                  return (
                    <span
                      key={nav.id}
                      onClick={handleClick}
                      className="mobile-nav-link"
                      style={{ color: 'var(--white)', cursor: 'pointer' }}
                    >
                      {nav.label}
                    </span>
                  );
                })}

              {currentUser && (
                <span onClick={() => { window.history.pushState(null, '', '/account'); window.dispatchEvent(new Event('popstate')); setShowMobileNav(false); }} className="mobile-nav-link" style={{ color: 'var(--gold)', cursor: 'pointer' }}>My Account Profile</span>
              )}
            </nav>
          </div>
        </div>
      )}
      {showCart && (
        <CartModal
          cart={cart}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveFromCart}
          onCheckout={() => {
            setShowCart(false);
            window.history.pushState(null, '', '/checkout'); window.dispatchEvent(new Event('popstate'));
            setActiveView('checkout');
          }}
          onProductClick={(p) => setSelectedProduct(p)}
        />
      )}
      {/* Lightbox Modal for Homepage Social Hub Grid */}
      {instagramLightbox && (
        <div
          className="modal-overlay"
          onClick={() => setInstagramLightbox(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '800px',
              width: '95%',
              background: 'transparent',
              border: 'none',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: 'none',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setInstagramLightbox(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <X size={20} /> Close
            </button>

            {instagramLightbox.type === 'video' ? (
              (instagramLightbox.url.includes('youtube.com') || instagramLightbox.url.includes('youtu.be')) ? (
                <iframe
                  src={instagramLightbox.url.includes('watch?v=') ? instagramLightbox.url.replace('watch?v=', 'embed/') : instagramLightbox.url.includes('youtu.be/') ? instagramLightbox.url.replace('youtu.be/', 'youtube.com/embed/') : instagramLightbox.url.includes('shorts/') ? instagramLightbox.url.replace('shorts/', 'embed/') : instagramLightbox.url}
                  style={{ width: '100%', minHeight: '60vh', border: 'none', background: '#000' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={instagramLightbox.url}
                  controls
                  autoPlay
                  style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', background: '#000' }}
                />
              )
            ) : (
              <img
                src={instagramLightbox.url}
                alt={instagramLightbox.title || 'Social Hub Showcase'}
                style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain' }}
                onError={(e) => { e.target.src = "/assets/poster.jpg"; }}
              />
            )}

            {instagramLightbox.title && (
              <div style={{ marginTop: '16px', textAlign: 'center', color: '#fff' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '4px', fontFamily: 'Barlow Condensed', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>{instagramLightbox.title}</h3>
                <span className="badge badge-gold" style={{ background: 'var(--gold)', color: '#fff', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>{instagramLightbox.album || 'Social Hub'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Toast Container for Animations */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}

// Bulk Order Form Modal Component
function BulkOrderModal({ onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    club: '',
    quantity: '5 - 10 Bats',
    models: '',
    message: ''
  });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.message) {
      toast.error("Name, Phone, and Requirements are required!");
      return;
    }
    if (!/[a-zA-Z]/.test(formData.name)) {
      toast.error("Name must contain alphabets.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit Indian Mobile Number.");
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    const lead = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      message: `Bulk Order Request:\n- Expected Quantity: ${formData.quantity}\n- Club/Academy: ${formData.club || 'None'}\n- Interested Models: ${formData.models || 'Not specified'}\n- Requirements: ${formData.message}`,
      type: "Bulk Order Request",
      status: "New"
    };

    db.addLead(lead);

    // Redirect directly to WhatsApp
    const whatsappNum = "919274543199"; // Admin
    const text = `Hello Vishwakarma Bat House,\n\nI want to make a Bulk Order Inquiry:\n\n*Name*: ${formData.name}\n*Phone*: ${formData.phone}\n*Email*: ${formData.email || 'N/A'}\n*Club/Academy*: ${formData.club || 'None'}\n*Expected Quantity*: ${formData.quantity}\n*Interested Models*: ${formData.models || 'Not specified'}\n\n*Requirements*: ${formData.message}`;
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/${whatsappNum}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');

    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 3000);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 3000 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '35px', maxWidth: '550px', width: '95%', borderRadius: '0' }}>
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        {!success ? (
          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            <span className="section-tag" style={{ marginBottom: '8px' }}>VK B2B Portal</span>
            <h3 style={{ fontSize: '1.6rem', color: 'var(--white)', marginBottom: '24px', fontFamily: 'Playfair Display' }}>Bulk Order Specifications</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', color: 'var(--muted)' }}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Sumit Patel"
                  style={{ width: '100%', padding: '12px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', outline: 'none' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', color: 'var(--muted)' }}>Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })}
                  placeholder="99094 54977"
                  style={{ width: '100%', padding: '12px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', outline: 'none' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', color: 'var(--muted)' }}>Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="club@gmail.com"
                  style={{ width: '100%', padding: '12px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', outline: 'none' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', color: 'var(--muted)' }}>Club / Academy Name</label>
                <input
                  type="text"
                  value={formData.club}
                  onChange={e => setFormData({ ...formData, club: e.target.value })}
                  placeholder="Gujarat Titans Club"
                  style={{ width: '100%', padding: '12px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', color: 'var(--muted)' }}>Order Quantity *</label>
                <select
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', outline: 'none' }}
                >
                  <option>5 - 10 Bats</option>
                  <option>10 - 20 Bats</option>
                  <option>20 - 50 Bats</option>
                  <option>50+ Bats</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', color: 'var(--muted)' }}>Interested Bat Models</label>
                <input
                  type="text"
                  value={formData.models}
                  onChange={e => setFormData({ ...formData, models: e.target.value })}
                  placeholder="e.g. Triple X2, Double Blade"
                  style={{ width: '100%', padding: '12px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', color: 'var(--muted)' }}>Custom Specifications & Details *</label>
              <textarea
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                placeholder="Mention specific weights (e.g. 1150g), sizes, handles, linseed oiling, or customized logo branding requirements..."
                style={{ width: '100%', padding: '12px', background: 'var(--black)', border: '1px solid var(--border)', color: 'var(--white)', minHeight: '80px', outline: 'none' }}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', background: '#000000', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>
              Request Bulk Quote
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <CheckCircle size={48} style={{ color: 'var(--gold)', marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.5rem', color: 'var(--white)', marginBottom: '8px', fontFamily: 'Playfair Display' }}>Inquiry Logged</h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.5 }}>
              Your B2B bulk specifications order inquiry has been recorded. Hansraj Bhai will reach out via WhatsApp/email within 24 hours.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
