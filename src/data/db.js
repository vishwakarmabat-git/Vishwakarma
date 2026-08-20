import { cloudSync } from '../services/cloudSync';

const DB_KEY_PREFIX = "vk_bathouse_";

// Auto-sync Interceptor
let syncTimeout = null;
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  const oldValue = localStorage.getItem(key);
  originalSetItem.call(localStorage, key, value);
  if (key.startsWith(DB_KEY_PREFIX) && !window.__blockCloudPush && oldValue !== value) {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      cloudSync.push();
    }, 100); // Debounce to prevent spamming
  }
};

// Sample Initial Banners
const INITIAL_BANNERS = [
  {
    id: "banner-1",
    title: "Handcrafted Bats Built For Champions",
    subtitle: "Premium cricket bats designed for power, precision, and performance. Every blade shaped by hand.",
    desktopImage: "/assets/banner_bat_3.png",
    mobileImage: "/assets/banner_bat_3.png",
    videoUrl: "",
    ctaText: "Shop Collection",
    ctaLink: "#categories",
    displayOrder: 1,
    active: true
  },
  {
    id: "banner-2",
    title: "Mastering the Art of Bat Making",
    subtitle: "Shaped manually by third-generation master craftsmen in Chaklasi. Built to dominate every tournament.",
    desktopImage: "/assets/craftsmanship_bat.png",
    mobileImage: "/assets/craftsmanship_bat.png",
    videoUrl: "",
    ctaText: "Explore Crafting",
    ctaLink: "#about",
    displayOrder: 2,
    active: true
  },
  {
    id: "banner-3",
    title: "5-Ton Pressed Premium Willow",
    subtitle: "Experience ultimate cellular resilience and instant tournament-ready explosive ping out of the box.",
    desktopImage: "/assets/why_vk_bat.png",
    mobileImage: "/assets/why_vk_bat.png",
    videoUrl: "",
    ctaText: "Custom Order",
    ctaLink: "#contact",
    displayOrder: 3,
    active: true
  }
];

// Sample Initial Categories
const INITIAL_CATEGORIES = [
  { id: "single-blade", name: "Single Blade", price: 1800, displayOrder: 1, banner: "/assets/poster.jpg" },
  { id: "double-blade", name: "Double Blade", price: 2100, displayOrder: 2, banner: "/assets/poster.jpg" },
  { id: "triple-blade", name: "Triple Blade", price: 2400, displayOrder: 3, banner: "/assets/poster.jpg" },
  { id: "triple-blade-hard", name: "Triple Blade Hard Pressed", price: 2500, displayOrder: 4, banner: "/assets/poster.jpg" },
  { id: "triple-x2", name: "Triple X2", price: 2800, displayOrder: 5, banner: "/assets/poster.jpg" },
  { id: "triple-x2-hard", name: "Triple X2 Hard Pressed", price: 3200, displayOrder: 6, banner: "/assets/poster.jpg" }
];

// Sample Initial Products
const INITIAL_PRODUCTS = [
  {
    id: "vk-1800",
    name: "VK Platinum Single Blade",
    category: "single-blade",
    price: 1800,
    stock: 12,
    images: ["/assets/bat_single.png", "/assets/bat_double.png", "/assets/bat_back.png"],
    videoUrl: "",
    weight: "1160 - 1200g",
    grade: "Grade 3 Premium Kashmir Willow",
    pressing: "Standard Pressed",
    specs: {
      handle: "Premium Singapore Cane Handle",
      edges: "38 - 40mm Edges",
      spine: "60 - 62mm Spine",
      sweetspot: "Mid to Low Sweetspot"
    },
    variants: {
      weights: ["1140-1160g", "1160-1180g", "1180-1200g"],
      handles: ["Round Handle", "Oval Handle"]
    },
    tags: ["Standard", "Single Blade", "Popular"],
    featured: true,
    bestSeller: true,
    seoTitle: "VK Platinum Single Blade Cricket Bat | Vishwakarma Bat House",
    seoDescription: "Shop handcrafted VK Platinum Single Blade cricket bat. Crafted with premium Kashmir willow and designed for power and balance."
  },
  {
    id: "vk-2100",
    name: "VK Elite Double Blade",
    category: "double-blade",
    price: 2100,
    stock: 8,
    images: ["/assets/bat_double.png", "/assets/bat_single.png", "/assets/bat_back.png"],
    videoUrl: "",
    weight: "1170 - 1210g",
    grade: "Grade 2 Premium English Willow Style Kashmir Willow",
    pressing: "Standard Pressed",
    specs: {
      handle: "Premium 3-Piece Cane Handle",
      edges: "40mm Edges",
      spine: "62mm Spine",
      sweetspot: "Mid Sweetspot"
    },
    variants: {
      weights: ["1150-1170g", "1170-1190g", "1190-1210g"],
      handles: ["Round Handle", "Oval Handle"]
    },
    tags: ["Double Blade", "Balance"],
    featured: true,
    bestSeller: true,
    seoTitle: "VK Elite Double Blade Cricket Bat | Vishwakarma Bat House",
    seoDescription: "Experience outstanding power with the VK Elite Double Blade cricket bat. Premium cane handle and perfect shock absorption."
  },
  {
    id: "vk-2400",
    name: "VK Pro Triple Blade",
    category: "triple-blade",
    price: 2400,
    stock: 6,
    images: ["/assets/bat_single.png", "/assets/bat_back.png", "/assets/bat_double.png"],
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    weight: "1180 - 1220g",
    grade: "Grade 1 Selected Premium Willow",
    pressing: "Standard Pressed",
    specs: {
      handle: "Full Cane Rounded Handle",
      edges: "40 - 42mm Edges",
      spine: "63mm Spine",
      sweetspot: "Mid-to-High Sweetspot"
    },
    variants: {
      weights: ["1160-1180g", "1180-1200g", "1200-1220g"],
      handles: ["Round Handle"]
    },
    tags: ["Triple Blade", "Hard Hitter"],
    featured: false,
    bestSeller: true,
    seoTitle: "VK Pro Cricket Bat - Premium Handcrafted",
    seoDescription: "Designed for tournament players, the VK Pro Triple Blade cricket bat delivers unmatched sweetspot response and power."
  },
  {
    id: "vk-2500",
    name: "VK Gold Triple Blade Hard Pressed",
    category: "triple-blade-hard",
    price: 2500,
    stock: 10,
    images: ["/assets/bat_double.png", "/assets/bat_back.png"],
    videoUrl: "",
    weight: "1150 - 1190g",
    grade: "Grade 1 Special Select Willow",
    pressing: "High Press (Hard Pressed)",
    specs: {
      handle: "9-Piece Treble Spring Cane Handle",
      edges: "39 - 41mm Edges",
      spine: "60 - 64mm Spine",
      sweetspot: "Low Sweetspot for Indian Pitches"
    },
    variants: {
      weights: ["1130g", "1150g", "1170g", "1190g"],
      handles: ["Round Handle", "Oval Handle"]
    },
    tags: ["Triple Blade", "Hard Pressed", "Best Value"],
    featured: true,
    bestSeller: true,
    seoTitle: "VK Gold Triple Blade Hard Pressed Bat | Vishwakarma Bat House",
    seoDescription: "Order the VK Gold Triple Blade Hard Pressed cricket bat. Extra pressed for instant playability and high durability."
  },
  {
    id: "vk-2800",
    name: "VK Signature Triple X2",
    category: "triple-x2",
    price: 2800,
    stock: 5,
    images: ["/assets/bat_single.png", "/assets/bat_double.png"],
    videoUrl: "",
    weight: "1160 - 1200g",
    grade: "Grade 1+ Tournament Grade Willow",
    pressing: "Standard Pressed",
    specs: {
      handle: "9-Piece Premium Cane Handle",
      edges: "42mm Edges",
      spine: "64mm Spine",
      sweetspot: "Mid Sweetspot"
    },
    variants: {
      weights: ["1140-1160g", "1160-1180g", "1180-1200g"],
      handles: ["Round Handle", "Oval Handle"]
    },
    tags: ["Triple X2", "Signature", "Limited"],
    featured: false,
    bestSeller: true,
    seoTitle: "VK Signature Triple X2 Cricket Bat | Handcrafted Power",
    seoDescription: "Get the VK Signature Triple X2 bat with thick edges and light pickup. Ideal for heavy hitters looking for balance."
  },
  {
    id: "vk-3200",
    name: "VK Limited Edition Triple X2 Hard Pressed",
    category: "triple-x2-hard",
    price: 3200,
    stock: 4,
    images: ["/assets/bat_single.png", "/assets/bat_double.png", "/assets/bat_back.png"],
    videoUrl: "",
    weight: "1140 - 1180g",
    grade: "Grade 1+ Super Select Professional Willow",
    pressing: "High Press (Hard Pressed)",
    specs: {
      handle: "Super Fine Cane 9-Piece Handle",
      edges: "43 - 44mm Massive Edges",
      spine: "65 - 67mm Spine",
      sweetspot: "Optimized Full Profile Sweetspot"
    },
    variants: {
      weights: ["1130g", "1150g", "1170g", "1180g"],
      handles: ["Round Handle", "Oval Handle"]
    },
    tags: ["Triple X2", "Hard Pressed", "Professional"],
    featured: true,
    bestSeller: true,
    seoTitle: "VK Limited Edition Triple X2 Hard Pressed Cricket Bat",
    seoDescription: "Our flagship bat. Made from the finest select willow blocks, hard pressed for ultimate ping, power, and durability."
  }
];

// Sample Initial Orders
const INITIAL_ORDERS = [
  {
    id: "ORD-9842",
    customerId: "CST-2241",
    customerName: "Rohan Patel",
    email: "rohan.patel@gmail.com",
    phone: "9876543210",
    batName: "VK Limited Edition Triple X2 Hard Pressed",
    price: 3200,
    total: 3584,
    status: "delivered",
    date: "2026-05-28",
    specs: "Weight: 1150g, Handle: Round",
    timeline: [
      { status: "pending", label: "Order Received", time: "2026-05-28 10:14" },
      { status: "shipped", label: "Dispatched from workshop", time: "2026-05-29 14:30" },
      { status: "delivered", label: "Delivered to Ahmedabad", time: "2026-06-01 11:20" }
    ]
  },
  {
    id: "ORD-9843",
    customerId: "CST-2241",
    customerName: "Jayesh Shah",
    email: "jayesh@shahcorp.in",
    phone: "9123456789",
    batName: "VK Gold Triple Blade Hard Pressed",
    price: 2500,
    total: 2800,
    status: "shipped",
    date: "2026-06-01",
    specs: "Weight: 1170g, Handle: Oval",
    timeline: [
      { status: "pending", label: "Order Received", time: "2026-06-01 09:30" },
      { status: "shipped", label: "Dispatched from workshop", time: "2026-06-02 12:00" }
    ]
  }
];

// Sample Initial Leads (Inquiries)
const INITIAL_LEADS = [
  {
    id: "LD-101",
    name: "Amit Patel",
    email: "amit.patel@gmail.com",
    phone: "9274543199",
    message: "I want a custom weight of 1130 grams in a Triple Blade Hard Pressed bat.",
    type: "Contact Form",
    status: "New",
    date: "2026-06-01"
  }
];

// Initial CMS Data
const INITIAL_CMS = {
  hero: {
    headline: "Samurai-Precision Cricket Bats",
    subheadline: "Handcrafted English & Kashmir Willow bats engineered with thick profiles and lightweight pickups for explosive boundary hitting.",
    ctaText: "Explore Bats",
    ctaLink: "#categories"
  },
  about: {
    title: "Our Heritage & Story",
    description: "At Vishwakarma Bat House (VK Bat House), we craft high-quality cricket bats using carefully selected willow, combining traditional craftsmanship with modern performance standards. Each bat goes through rigorous grading and pressing checks to ensure it meets our champion standards.",
    address: "VK BAT HOUSE, Uttarsanda Bhalej Road, Chaklasi 387315",
    phone1: "9274543199",
    phone2: "9274543199",
    email: "vishwakarmabat@gmail.com",
    instagram: "vishwakarma_bat",
    youtube: "@VishwakarmaBathouse"
  },
  seo: {
    title: "Vishwakarma Bat House | Hitter-Grade Cricket Bats",
    description: "Welcome to VK Bat House, Uttarsanda Bhalej Road, Chaklasi. We manufacture premium handcrafted cricket bats: Single Blade, Double Blade, Triple Blade, Hard Pressed, and Triple X2. Custom orders available.",
    keywords: "cricket bats, vishwakarma bat house, vk bat house, chaklasi, single blade, double blade, hard pressed bats, cricket equipment"
  }
};

// Initial Blogs
const INITIAL_BLOGS = [
  {
    id: "blog-1",
    title: "How to Choose the Perfect Cricket Bat Weight & Size",
    slug: "choose-perfect-cricket-bat-weight-size",
    content: "Selecting the right cricket bat is crucial for every batsman. While heavy bats offer raw power, lighter bats offer faster hand speed and pick-up. For players on slower, gully pitches, a thick edges bat might be helpful, but balance is everything. Here at VK Bat House, we customize weights from 1120g up to 1250g depending on player needs.",
    author: "Vishwakarma Bat House",
    date: "2026-05-15",
    image: "/assets/poster.jpg"
  }
];

// Sample Initial Gallery (10 items for a full visual experience)
const INITIAL_GALLERY = [
  { id: "gal-1", title: "Shaping the sweetspot", type: "image", url: "/assets/poster.jpg", album: "Workshop", coverImage: true },
  { id: "gal-2", title: "Tournament Match Highlights", type: "video", url: "https://www.w3schools.com/html/mov_bbb.mp4", album: "Match Highlights", coverImage: false },
  { id: "gal-3", title: "Happy Customer with Triple X2", type: "image", url: "/assets/bat_single.png", album: "Customer Photos", coverImage: false },
  { id: "gal-4", title: "English Willow stack selection", type: "image", url: "/assets/poster.jpg", album: "Workshop", coverImage: false },
  { id: "gal-5", title: "Bat pressing operation", type: "image", url: "/assets/poster.jpg", album: "Workshop", coverImage: false },
  { id: "gal-6", title: "Singapore cane handle wrap", type: "image", url: "/assets/poster.jpg", album: "Workshop", coverImage: false },
  { id: "gal-7", title: "Linseed oil coating face", type: "image", url: "/assets/poster.jpg", album: "Workshop", coverImage: false },
  { id: "gal-8", title: "Knocking-in machine tests", type: "image", url: "/assets/poster.jpg", album: "Workshop", coverImage: false },
  { id: "gal-9", title: "VK custom bat pickup test", type: "image", url: "/assets/poster.jpg", album: "Workshop", coverImage: false },
  { id: "gal-10", title: "Decals styling audit", type: "image", url: "/assets/poster.jpg", album: "Workshop", coverImage: false }
];

// Product Specific Reviews Seed Data
const INITIAL_REVIEWS = [
  {
    id: "rev-1",
    productId: "vk-2100",
    userName: "Sachin Sharma",
    rating: 5,
    comment: "This Elite Double Blade bat has a fantastic pickup and massive ping. Highly recommended for heavy hitting!",
    likes: 8,
    dislikes: 0,
    date: "2026-05-30",
    approved: true
  },
  {
    id: "rev-2",
    productId: "vk-3200",
    userName: "Rahul S.",
    rating: 5,
    comment: "The Triple X2 Hard Pressed bat is an absolute masterpiece. The 44mm edges are huge but it picks up like a feather.",
    likes: 12,
    dislikes: 1,
    date: "2026-06-01",
    approved: true
  },
  {
    id: "rev-3",
    productId: "vk-2500",
    userName: "Virat K.",
    rating: 5,
    comment: "Loved the grain count on this Kashmir willow bat. Extremely durable, playing with it for 3 weeks now.",
    likes: 5,
    dislikes: 0,
    date: "2026-05-28",
    approved: true
  },
  {
    id: "rev-4",
    productId: "vk-1800",
    userName: "Siddharth P.",
    rating: 4,
    comment: "Very good value for money. It comes knocked in, but I recommend doing a bit more oiling and knocking.",
    likes: 3,
    dislikes: 0,
    date: "2026-05-25",
    approved: true
  }
];


// Sample Initial Testimonials
const INITIAL_TESTIMONIALS = [
  { id: "tst-1", reviewerName: "Rahul Patel", reviewerRole: "Club Cricketer, Ahmedabad", stars: 5, text: "Ordered the Triple X2 Hard Pressed and it's an absolute beast. The timing is perfect, the pickup feels light despite the 45mm edges. Best bat at this price range easily.", approved: true, avatar: "R", videoUrl: "" },
  { id: "tst-2", reviewerName: "Mehul Shah", reviewerRole: "League Captain, Vadodara", stars: 5, text: "We customized the grains and spine profile exactly how I requested. Outstanding customer service and genuine English willow. Highly recommended!", approved: true, avatar: "M", videoUrl: "" },
  { id: "tst-3", reviewerName: "Karan Amin", reviewerRole: "T20 Opener, Anand", stars: 5, text: "Double pressed willow has incredible ping. Knocking-in was superb. It's my go-to bat for all tournament matches now.", approved: true, avatar: "K", videoUrl: "" },
  { id: "tst-4", reviewerName: "Amit Solanki", reviewerRole: "Opening Batsman", stars: 5, text: "Outstanding performance under lights. The sound off the middle is amazing.", approved: false, avatar: "A", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" }
];

// Sample Initial Homepage Sections
const INITIAL_HOMEPAGE_SECTIONS = [
  { id: "hero", name: "Hero Banner Slider", displayOrder: 1, active: true },
  { id: "featured_categories", name: "Featured Categories", displayOrder: 2, active: true },
  { id: "best_sellers", name: "Best Sellers", displayOrder: 3, active: true },
  { id: "new_arrivals", name: "New Arrivals", displayOrder: 4, active: true },
  { id: "all_products", name: "All Products", displayOrder: 5, active: true },
  { id: "why", name: "Why Choose VK", displayOrder: 6, active: true },
  { id: "video_reviews", name: "Customer Batting Videos", displayOrder: 7, active: true },
  { id: "gallery", name: "Instagram Masonry Gallery", displayOrder: 8, active: true },
  { id: "testimonials", name: "Customer Reviews", displayOrder: 9, active: true },
  { id: "guides", name: "Blogs & Guides", displayOrder: 10, active: false },
  { id: "contact", name: "Contact & Location", displayOrder: 11, active: true }
];

// Sample Settings
const INITIAL_SETTINGS = {
  gstRate: 12,
  shippingRate: 150,
  contactPhone: "9274543199",
  contactWhatsapp: "9274543199",
  contactEmail: "vishwakarmabat@gmail.com",
  socialInstagram: "vishwakarma_bat",
  socialYoutube: "@VishwakarmaBathouse",
  socialFacebook: "",
  theme: "black",
  websiteBranding: "VK Bat House",
  websiteTitle: "VK Bat House – Premium Kashmir & English Willow Cricket Bats",
  bestSellersLimit: 4
};

// Pre-seeded Admin Users
const ADMIN_USERS = [
  { email: "admin@vkbathouse.com", password: "vkadmin@2026", role: "super-admin", name: "Super Admin" },
  { email: "staff@vkbathouse.com", password: "password123", role: "staff", name: "Staff Member" },
  { email: "content@vkbathouse.com", password: "password123", role: "content-manager", name: "VK Content Manager" },
  { email: "sales@vkbathouse.com", password: "password123", role: "sales-team", name: "VK Sales Representative" }
];

// Sample Initial Q&A
const INITIAL_QA = [
  { id: "qa-1", productId: "vk-2100", question: "Does this bat need pre-knocking?", answer: "Yes, although it is pre-pressed, we recommend 2-3 hours of knocking with a mallet before match play.", date: "2026-06-02", user: "Ravi Teja" },
  { id: "qa-2", productId: "vk-3200", question: "Can I get this customized to 1140 grams?", answer: "Absolutely, we shape bats between 1120g to 1250g. Place your order and mention it in the custom order box.", date: "2026-06-03", user: "Kunal G." }
];

// Sample Initial Typography
const INITIAL_TYPOGRAPHY = {
  headingFont: "Syne",
  bodyFont: "Inter"
};

// Sample Initial Header Links
const INITIAL_NAVIGATION = [
  { id: "nav-1", label: "Home", link: "#", active: true, displayOrder: 1 },
  { id: "nav-2", label: "Bats", link: "#shop", active: true, displayOrder: 2 },
  { id: "nav-3", label: "Gallery", link: "#gallery", active: true, displayOrder: 3 },
  { id: "nav-4", label: "Bulk Orders", link: "bulk", active: true, displayOrder: 4 },
  { id: "nav-5", label: "Crafting", link: "#about", active: true, displayOrder: 5 },
  { id: "nav-6", label: "Contact", link: "#contact", active: true, displayOrder: 6 }
];

// Sample Initial System Audit Logs
const INITIAL_AUDIT_LOGS = [
  { id: "log-1", timestamp: "2026-06-04 10:12:11", user: "System", action: "Database seeded and initialized" },
  { id: "log-2", timestamp: "2026-06-04 11:45:00", user: "admin@vkbathouse.com", action: "Admin login successful" }
];

// Sample Initial Email Management Config
const INITIAL_EMAIL_CONFIG = {
  apiKey: "brevo_mock_api_key_for_testing_12345",
  senderName: "VK Bat House Support",
  senderEmail: "support@vkbathouse.com",
  enabledTemplates: {
    welcome: true,
    orderConfirmed: true,
    orderShipped: true,
    orderDelivered: true,
    contactForm: true,
    newsletter: false
  },
  templates: {
    welcome: { subject: "Welcome to VK Bat House!", body: "Hi {{name}},\n\nThank you for registering at VK Bat House! Get ready for the best bats shaped by hand.\n\nBest,\nVK Team" },
    orderConfirmed: { subject: "Order Confirmed: {{orderId}}", body: "Hi {{name}},\n\nYour order {{orderId}} has been confirmed for ₹{{total}}. We will begin shaping and pressing your bat soon.\n\nBest,\nVK Team" },
    orderShipped: { subject: "Your VK Bat is Shipped!", body: "Hi {{name}},\n\nExciting news! Your order {{orderId}} has been dispatched. Tracking number: {{trackingNumber}}.\n\nBest,\nVK Team" },
    orderDelivered: { subject: "Order Delivered!", body: "Hi {{name}},\n\nYour order {{orderId}} has been delivered. We hope you love the ping of your new VK bat! Drop us a review.\n\nBest,\nVK Team" }
  }
};

// Sample Initial FAQs
const INITIAL_FAQS = [
  { id: "faq-1", question: "What is the difference between Single and Double Blade?", answer: "Single blade bats have a standard profile, ideal for lightweight pickup. Double blade bats have extra wood compaction and thicker edges for heavy hitting." },
  { id: "faq-2", question: "How long does shipping take?", answer: "Standard shipping takes 4-7 business days across India. Custom-made orders may take an additional 3 days to prepare." },
  { id: "faq-3", question: "Do you offer knocking-in?", answer: "Yes, all bats are pre-knocked and pressed at 5 tons. However, we advise playing with old balls or light mallet knocking before direct match play." }
];

// Sample Initial Brand Story & Image CMS
const INITIAL_BRAND_STORY = {
  logoUrl: "/assets/logo.png",
  storyTitle: "Our Heritage & Story",
  storyParagraph1: "At Vishwakarma Bat House (VK Bat House), we craft high-quality cricket bats using carefully selected willow, combining traditional craftsmanship with modern performance standards.",
  storyParagraph2: "Each bat goes through rigorous grading and pressing checks to ensure it meets our champion standards. Shaped manually by third-generation master craftsmen in Chaklasi.",
  storyQuote: "“A cricketer's bat is the extension of their soul on the field.”",
  storyImage: "/assets/craftsmanship_bat.png",
  lookbookTitle: "Trending Lookbook Collection",
  lookbookSubtitle: "Handcrafted for boundary domination",
  lookbookCover1: "/assets/banner_white_1.png",
  lookbookCover2: "/assets/banner_white_2.png",
  shopByStyleTitle: "Shop by Style & Edge Profile",
  shopByStyleSubtitle: "Find the sweetspot tailored to your hitting arc",
  seenOnBrands: "ESPN, Star Sports, Cricbuzz, Wisden",
  marqueeDrops: "PREMIUM WILLOW ARRIVED · FREE SHIPPING ACROSS INDIA · 5-TON COMPRESSED POWER",
  newsletterTitle: "Join The Hitter's Club",
  newsletterSubtitle: "Subscribe to get notifications on new willow shipments, customized bat selections, and seasonal coupon promotions.",
  newsletterDiscountCode: "VKPLAY20",
  newsletterDiscountActive: true,
  newsletterPopupImage: "/assets/why_vk_bat.png",
  companyPages: {
    about: "Vishwakarma Bat House (VK Bat House) was founded in Chaklasi, Gujarat. We are third-generation batmakers specializing in manual cleft grading, pressing, and dynamic shape balancing.",
    refund: "We accept returns within 7 days of delivery if the bat is unused and in original packaging. Custom-made bats cannot be returned unless there is a structural defect.",
    terms: "By purchasing from VK Bat House, you agree to our standard shipping and warranty terms. Warranty covers handle breakage within 30 days. Blade cracks from hard leather ball play are normal wear and tear.",
    careers: "Join our team of master craftsmen, sales associates, or digital markers. Email vishwakarmabat@gmail.com with your resume.",
    partnerships: "For wholesale inquiries, corporate cricket league supplies, and brand sponsorships, please reach out to Hansraj Bhai."
  }
};

// Sample Initial Craft Steps
const INITIAL_CRAFT_STEPS = [
  { id: "step-1", num: "01", title: "Willow Selection", desc: "Every bat begins with Expert selecting the finest English and Kashmir Willow clefts, checking for vertical grains and weight density." },
  { id: "step-2", num: "02", title: "Blade Cleft Prep", desc: "The raw willow block is cut, seasoned, and slowly air-dried to preserve natural cellular moisture, guaranteeing a resilient blade profile." },
  { id: "step-3", num: "03", title: "Manual Profile Shaping", desc: "Using traditional draw-knives and hand-planes, we carve the spine and edge thicknesses to optimize the bat's natural sweet spot." },
  { id: "step-4", num: "04", title: "5-Ton Fibers Pressing", desc: "We compress the wood under a multi-ton hydraulic roller. This hardens the surface wood cells to deliver maximum ping out of the box." },
  { id: "step-5", num: "05", title: "Handle Fitting", desc: "A premium Singapore cane handle is bound with elastic rubber layers and glued deep into the cleft to absorb impact vibrations." },
  { id: "step-6", num: "06", title: "Fine Sanding & Oiling", desc: "The bat is repeatedly hand-sanded with fine grits and treated with raw linseed oil to seal the wood fibers and keep the face clean." },
  { id: "step-7", num: "07", title: "Quality Audit & Grip", desc: "We run a final check on the exact weight, center of gravity, and pickup before applying the premium chevron grip and decals." }
];

// Helper functions for Database
export const db = {
  // Internal Helper: Load or Initialize
  _loadData(key, initialData) {
    try {
      const data = localStorage.getItem(DB_KEY_PREFIX + key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error(`Error parsing ${key} from localStorage, resetting data...`, e);
      localStorage.removeItem(DB_KEY_PREFIX + key);
    }
    localStorage.setItem(DB_KEY_PREFIX + key, JSON.stringify(initialData));
    return initialData;
  },

  // Initialize Database
  init() {
    try {
      const currentBannersStr = localStorage.getItem(DB_KEY_PREFIX + "banners");
      if (!currentBannersStr || currentBannersStr.includes("banner_bat_1.png") || currentBannersStr.includes("banner_white")) {
        this.saveBanners(INITIAL_BANNERS);
      }
    } catch (e) {
      this.saveBanners(INITIAL_BANNERS);
    }

    if (!localStorage.getItem(DB_KEY_PREFIX + "leads")) {
      localStorage.setItem(DB_KEY_PREFIX + "leads", JSON.stringify(INITIAL_LEADS));
    }
    if (!localStorage.getItem(DB_KEY_PREFIX + "cms")) {
      localStorage.setItem(DB_KEY_PREFIX + "cms", JSON.stringify(INITIAL_CMS));
    } else {
      // Migrate: ensure seo key exists in stored CMS
      try {
        const storedCms = JSON.parse(localStorage.getItem(DB_KEY_PREFIX + "cms"));
        if (storedCms && !storedCms.seo) {
          storedCms.seo = INITIAL_CMS.seo;
          localStorage.setItem(DB_KEY_PREFIX + "cms", JSON.stringify(storedCms));
        }
      } catch (e) {
        // Reset corrupted CMS data
        localStorage.setItem(DB_KEY_PREFIX + "cms", JSON.stringify(INITIAL_CMS));
      }
    }
    if (!localStorage.getItem(DB_KEY_PREFIX + "blogs")) {
      localStorage.setItem(DB_KEY_PREFIX + "blogs", JSON.stringify(INITIAL_BLOGS));
    }
    if (!localStorage.getItem(DB_KEY_PREFIX + "customers")) {
      // Seed a default customer to allow immediate login testing
      const defaultCust = {
        id: "CST-2241",
        name: "Sumit Kumar",
        email: "sumit@gmail.com",
        password: "password123",
        wishlist: ["vk-2100", "vk-3200"],
        addresses: [
          { id: "addr-1", type: "Home", name: "Sumit Kumar", street: "12, Shrinathji Society", city: "Ahmedabad", state: "Gujarat", pincode: "380015", phone: "9876543210" }
        ],
        blocked: false
      };
      localStorage.setItem(DB_KEY_PREFIX + "customers", JSON.stringify([defaultCust]));
    }
    if (!localStorage.getItem(DB_KEY_PREFIX + "products") || JSON.parse(localStorage.getItem(DB_KEY_PREFIX + "products")).length === 0) this.saveProducts(INITIAL_PRODUCTS);
    if (!localStorage.getItem(DB_KEY_PREFIX + "categories") || JSON.parse(localStorage.getItem(DB_KEY_PREFIX + "categories")).length === 0) this.saveCategories(INITIAL_CATEGORIES);
    if (localStorage.getItem(DB_KEY_PREFIX + "gallery") === null) {
      localStorage.setItem(DB_KEY_PREFIX + "gallery", JSON.stringify(INITIAL_GALLERY));
    }
    if (!localStorage.getItem(DB_KEY_PREFIX + "testimonials")) {
      localStorage.setItem(DB_KEY_PREFIX + "testimonials", JSON.stringify(INITIAL_TESTIMONIALS));
    }
    if (!localStorage.getItem(DB_KEY_PREFIX + "demo_videos")) {
      localStorage.setItem(DB_KEY_PREFIX + "demo_videos", JSON.stringify([
        "https://www.w3schools.com/html/mov_bbb.mp4"
      ]));
    }
    if (!localStorage.getItem(DB_KEY_PREFIX + "homepage_sections")) {
      localStorage.setItem(DB_KEY_PREFIX + "homepage_sections", JSON.stringify(INITIAL_HOMEPAGE_SECTIONS));
    } else {
      try {
        const storedSections = localStorage.getItem(DB_KEY_PREFIX + "homepage_sections");
        if (storedSections) {
          const parsed = JSON.parse(storedSections);
          if (!parsed.some(s => s.id === 'all_products')) {
            const newArrivalsIdx = parsed.findIndex(s => s.id === 'new_arrivals');
            const insertIdx = newArrivalsIdx !== -1 ? newArrivalsIdx + 1 : 4;
            parsed.splice(insertIdx, 0, { id: "all_products", name: "All Products", displayOrder: insertIdx + 1, active: true });
            parsed.forEach((s, idx) => {
              s.displayOrder = idx + 1;
            });
            localStorage.setItem(DB_KEY_PREFIX + "homepage_sections", JSON.stringify(parsed));
          }
        }
      } catch (e) {
        console.error("Failed to migrate homepage sections:", e);
      }
    }
    if (!localStorage.getItem(DB_KEY_PREFIX + "settings")) {
      localStorage.setItem(DB_KEY_PREFIX + "settings", JSON.stringify(INITIAL_SETTINGS));
    } else {
      try {
        const storedSettings = JSON.parse(localStorage.getItem(DB_KEY_PREFIX + "settings"));
        if (storedSettings.bestSellersLimit === undefined) {
          storedSettings.bestSellersLimit = 4;
          localStorage.setItem(DB_KEY_PREFIX + "settings", JSON.stringify(storedSettings));
        }
      } catch (e) {
        console.error("Failed to migrate settings:", e);
      }
    }
    if (!localStorage.getItem(DB_KEY_PREFIX + "reviews")) {
      localStorage.setItem(DB_KEY_PREFIX + "reviews", JSON.stringify(INITIAL_REVIEWS));
    }
    if (!localStorage.getItem(DB_KEY_PREFIX + "operators")) {
      localStorage.setItem(DB_KEY_PREFIX + "operators", JSON.stringify(ADMIN_USERS));
    }
    if (!localStorage.getItem(DB_KEY_PREFIX + "qa")) {
      localStorage.setItem(DB_KEY_PREFIX + "qa", JSON.stringify(INITIAL_QA));
    }
    if (!localStorage.getItem(DB_KEY_PREFIX + "typography")) {
      localStorage.setItem(DB_KEY_PREFIX + "typography", JSON.stringify(INITIAL_TYPOGRAPHY));
    }
    if (!localStorage.getItem(DB_KEY_PREFIX + "navigation")) {
      localStorage.setItem(DB_KEY_PREFIX + "navigation", JSON.stringify(INITIAL_NAVIGATION));
    }
    if (!localStorage.getItem(DB_KEY_PREFIX + "audit_logs")) {
      localStorage.setItem(DB_KEY_PREFIX + "audit_logs", JSON.stringify(INITIAL_AUDIT_LOGS));
    }
    if (!localStorage.getItem(DB_KEY_PREFIX + "email_config")) {
      localStorage.setItem(DB_KEY_PREFIX + "email_config", JSON.stringify(INITIAL_EMAIL_CONFIG));
    }
    if (!localStorage.getItem(DB_KEY_PREFIX + "faqs")) {
      localStorage.setItem(DB_KEY_PREFIX + "faqs", JSON.stringify(INITIAL_FAQS));
    }
    if (!localStorage.getItem(DB_KEY_PREFIX + "brand_story")) {
      localStorage.setItem(DB_KEY_PREFIX + "brand_story", JSON.stringify(INITIAL_BRAND_STORY));
    }
    if (!localStorage.getItem(DB_KEY_PREFIX + "craft_steps")) {
      localStorage.setItem(DB_KEY_PREFIX + "craft_steps", JSON.stringify(INITIAL_CRAFT_STEPS));
    }
  },

  // Read data
  get(key) {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(DB_KEY_PREFIX + key));
    } catch (e) {
      console.error("Error reading db key: " + key, e);
      return null;
    }
  },

  // Save data
  save(key, data) {
    localStorage.setItem(DB_KEY_PREFIX + key, JSON.stringify(data));
  },

  // Products
  getProducts() {
    return this.get("products") || [];
  },
  saveProducts(products) {
    this.save("products", products);
  },
  addProduct(product) {
    const products = this.getProducts();
    const newProduct = {
      ...product,
      id: "vk-" + Math.floor(1000 + Math.random() * 9000),
      images: product.images && product.images.length > 0 ? product.images : ["/assets/bat_single.png"],
      variants: product.variants || { weights: ["1150g", "1180g"], handles: ["Round Handle"] }
    };
    products.push(newProduct);
    this.saveProducts(products);
    return newProduct;
  },
  updateProduct(id, updatedFields) {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx] = { ...products[idx], ...updatedFields };
      this.saveProducts(products);
      return true;
    }
    return false;
  },
  deleteProduct(id) {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    this.saveProducts(filtered);
    return true;
  },

  // Categories
  getCategories() {
    return this.get("categories") || [];
  },
  saveCategories(categories) {
    this.save("categories", categories);
  },
  addCategory(category) {
    const categories = this.getCategories();
    const newCat = {
      ...category,
      id: category.name.toLowerCase().replace(/\s+/g, "-") + "-" + Math.floor(Math.random() * 100),
      banner: category.banner || "/assets/poster.jpg"
    };
    categories.push(newCat);
    this.saveCategories(categories);
    return newCat;
  },
  deleteCategory(id) {
    const categories = this.getCategories();
    const filtered = categories.filter(c => c.id !== id);
    this.saveCategories(filtered);
    return true;
  },
  updateCategory(id, updatedCategory) {
    const categories = this.getCategories();
    const index = categories.findIndex(c => c.id === id);
    if (index !== -1) {
      categories[index] = { ...categories[index], ...updatedCategory };
      this.saveCategories(categories);
      return true;
    }
    return false;
  },

  // Orders
  getOrders() {
    return this.get("orders") || [];
  },
  saveOrders(orders) {
    this.save("orders", orders);
  },
  createOrder(order) {
    const orders = this.getOrders();
    const newOrder = {
      ...order,
      id: order.id || "ORD-" + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString().split("T")[0],
      timeline: order.timeline || [{ status: "pending", label: "Order Received", time: new Date().toLocaleString() }]
    };
    orders.unshift(newOrder);
    this.saveOrders(orders);

    // Decrement stock for ordered items
    const products = this.getProducts();
    let updatedAny = false;
    if (newOrder.cartItems && newOrder.cartItems.length > 0) {
      newOrder.cartItems.forEach(item => {
        const pIdx = products.findIndex(p => p.id === item.id);
        if (pIdx !== -1) {
          const currentStock = products[pIdx].stock !== undefined ? Number(products[pIdx].stock) : 10;
          products[pIdx].stock = Math.max(0, currentStock - Number(item.quantity || 1));
          updatedAny = true;
        }
      });
    } else if (newOrder.batName) {
      const pIdx = products.findIndex(p => p.name === newOrder.batName);
      if (pIdx !== -1) {
        const currentStock = products[pIdx].stock !== undefined ? Number(products[pIdx].stock) : 10;
        products[pIdx].stock = Math.max(0, currentStock - 1);
        updatedAny = true;
      }
    }

    if (updatedAny) {
      this.saveProducts(products);
    }

    return newOrder;
  },
  updateOrderStatus(id, status, notes = "") {
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      orders[idx].status = status;
      if (!orders[idx].timeline) orders[idx].timeline = [];
      
      let label = "Status updated";
      if (status === "pending") label = "Order Received";
      else if (status === "shipped") label = "Dispatched from workshop: " + (notes || "In Transit");
      else if (status === "delivered") label = "Delivered " + (notes || "Success");
      else if (status === "cancelled") {
        label = "Order Cancelled";
        if (notes) {
          label += " - " + notes;
          orders[idx].cancelReason = notes;
        }
      }

      orders[idx].timeline.push({
        status,
        label,
        time: new Date().toLocaleString()
      });
      this.saveOrders(orders);
      return true;
    }
    return false;
  },

  // Leads
  getLeads() {
    return this.get("leads") || [];
  },
  saveLeads(leads) {
    this.save("leads", leads);
  },
  addLead(lead) {
    const leads = this.getLeads();
    const newLead = {
      ...lead,
      id: "LD-" + Math.floor(100 + Math.random() * 900),
      date: new Date().toISOString().split("T")[0],
      status: "New"
    };
    leads.unshift(newLead);
    this.saveLeads(leads);
    return newLead;
  },
  updateLeadStatus(id, status) {
    const leads = this.getLeads();
    const idx = leads.findIndex(l => l.id === id);
    if (idx !== -1) {
      leads[idx].status = status;
      this.saveLeads(leads);
      return true;
    }
    return false;
  },

  // CMS
  getCms() {
    return this.get("cms") || INITIAL_CMS;
  },
  saveCms(cmsData) {
    this.save("cms", cmsData);
  },

  // Blogs
  getBlogs() {
    return this.get("blogs") || [];
  },
  saveBlogs(blogs) {
    this.save("blogs", blogs);
  },
  addBlog(blog) {
    const blogs = this.getBlogs();
    const newBlog = {
      ...blog,
      id: "blog-" + Math.floor(100 + Math.random() * 900),
      slug: blog.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      date: blog.date || new Date().toISOString().split("T")[0],
      image: blog.image || "/assets/poster.jpg"
    };
    blogs.unshift(newBlog);
    this.saveBlogs(blogs);
    return newBlog;
  },
  deleteBlog(id) {
    const blogs = this.getBlogs();
    const filtered = blogs.filter(b => b.id !== id);
    this.saveBlogs(filtered);
    return true;
  },
  updateBlog(id, updatedFields) {
    const blogs = this.getBlogs();
    const idx = blogs.findIndex(b => b.id === id);
    if (idx !== -1) {
      const updated = {
        ...blogs[idx],
        ...updatedFields,
        slug: updatedFields.title ? updatedFields.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : blogs[idx].slug
      };
      blogs[idx] = updated;
      this.saveBlogs(blogs);
      return true;
    }
    return false;
  },

  // --- CUSTOMER AUTHENTICATION METHODS ---
  getCustomers() {
    return this.get("customers") || [];
  },
  saveCustomers(customers) {
    this.save("customers", customers);
  },
  registerCustomer(name, email, password) {
    const customers = this.getCustomers();
    if (customers.some(c => c.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, message: "Email is already registered!" };
    }
    const newCustomer = {
      id: "CST-" + Math.floor(1000 + Math.random() * 9000),
      name,
      email: email.toLowerCase(),
      password,
      wishlist: [],
      addresses: [],
      blocked: false
    };
    customers.push(newCustomer);
    this.save("customers", customers);
    return { success: true, user: newCustomer };
  },
  loginCustomer(email, password) {
    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedPassword = (password || '').trim();

    // Check if it's an admin logging in from the storefront
    const operators = this.getOperators();
    const admin = operators.find(u => u.email.toLowerCase() === trimmedEmail);
    if (admin) {
      const hasToken = !!localStorage.getItem('vk_auth_token');
      if (hasToken || admin.password === trimmedPassword) {
        // Save admin session as well
        localStorage.setItem(DB_KEY_PREFIX + "admin_session", JSON.stringify(admin));
        if (!hasToken) {
          localStorage.setItem('vk_auth_token', 'local-admin-token-' + admin.role);
        }
        return { success: true, user: { ...admin, id: "ADMIN-" + admin.role, wishlist: [] }, isAdmin: true };
      }
    }

    const customers = this.getCustomers();
    const user = customers.find(c => c.email.toLowerCase() === trimmedEmail);
    if (!user) {
      return { success: false, message: "Invalid email or password!" };
    }
    if (user.password !== trimmedPassword) {
      return { success: false, message: "Invalid email or password!" };
    }
    if (user.blocked) {
      return { success: false, message: "This account has been suspended by VK Administrator." };
    }
    this.addLog("Customer login successful: " + user.email);
    return { success: true, user };
  },
  updateCustomerProfile(id, name, email, password) {
    const customers = this.getCustomers();
    const idx = customers.findIndex(c => c.id === id);
    if (idx !== -1) {
      if (customers.some((c, i) => i !== idx && c.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, message: "Email already taken by another user." };
      }
      customers[idx].name = name;
      customers[idx].email = email;
      if (password) customers[idx].password = password;
      this.saveCustomers(customers);

      // Sync session
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === id) {
        const updatedUser = { ...currentUser, name, email };
        if (password) updatedUser.password = password;
        this.setCurrentUser(updatedUser);
      }
      return { success: true, user: customers[idx] };
    }
    return { success: false, message: "Customer not found." };
  },
  updateCustomerAddressBook(customerId, addressBook) {
    const customers = this.getCustomers();
    const idx = customers.findIndex(c => c.id === customerId);
    if (idx !== -1) {
      customers[idx].addresses = addressBook;
      this.saveCustomers(customers);
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === customerId) {
        currentUser.addresses = addressBook;
        this.setCurrentUser(currentUser);
      }
      return true;
    }
    return false;
  },
  toggleBlockCustomer(id) {
    const customers = this.getCustomers();
    const idx = customers.findIndex(c => c.id === id);
    if (idx !== -1) {
      customers[idx].blocked = !customers[idx].blocked;
      this.saveCustomers(customers);
      
      // Force logout if blocked user is currently logged in
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === id && customers[idx].blocked) {
        this.setCurrentUser(null);
      }
      return true;
    }
    return false;
  },
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEY_PREFIX + "current_user"));
    } catch (e) {
      return null;
    }
  },
  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(DB_KEY_PREFIX + "current_user", JSON.stringify(user));
    } else {
      localStorage.removeItem(DB_KEY_PREFIX + "current_user");
    }
  },

  // --- WISHLIST MANAGEMENT ---
  getUserWishlist(userId) {
    const customers = this.getCustomers();
    const user = customers.find(c => c.id === userId);
    return user ? user.wishlist || [] : [];
  },
  toggleWishlist(userId, productId) {
    const customers = this.getCustomers();
    const userIdx = customers.findIndex(c => c.id === userId);
    if (userIdx === -1) return [];

    let wishlist = customers[userIdx].wishlist || [];
    if (wishlist.includes(productId)) {
      wishlist = wishlist.filter(id => id !== productId);
    } else {
      wishlist.push(productId);
    }
    customers[userIdx].wishlist = wishlist;
    this.save("customers", customers);

    // Sync active session if this is the active user
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      currentUser.wishlist = wishlist;
      this.setCurrentUser(currentUser);
    }
    return wishlist;
  },

  // --- ADMIN LOGIN GATEWAY ---
  loginAdmin(email, password) {
    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedPassword = (password || '').trim();
    const operators = this.getOperators();
    const admin = operators.find(u => u.email.toLowerCase() === trimmedEmail && u.password === trimmedPassword);
    if (!admin) return { success: false, message: "Invalid Admin Credentials!" };
    
    // Save admin session
    localStorage.setItem(DB_KEY_PREFIX + "admin_session", JSON.stringify(admin));
    this.addLog("Admin login successful", admin.email);
    return { success: true, admin };
  },

  // --- DYNAMIC OPERATORS (ADMIN ROLES) ---
  getOperators() {
    return this.get("operators") || [];
  },
  saveOperators(operators) {
    this.save("operators", operators);
  },
  addOperator(operator) {
    const operators = this.getOperators();
    if (operators.some(o => o.email.toLowerCase() === operator.email.toLowerCase())) {
      return { success: false, message: "Operator email already exists!" };
    }
    const newOp = {
      ...operator,
      email: operator.email.toLowerCase()
    };
    operators.push(newOp);
    this.saveOperators(operators);
    this.addLog("Added admin operator: " + newOp.email);
    return { success: true, operator: newOp };
  },
  updateOperator(email, updatedFields) {
    const operators = this.getOperators();
    const idx = operators.findIndex(o => o.email.toLowerCase() === email.toLowerCase());
    if (idx !== -1) {
      operators[idx] = { ...operators[idx], ...updatedFields };
      this.saveOperators(operators);
      this.addLog("Updated admin operator details: " + email);
      return true;
    }
    return false;
  },
  deleteOperator(email) {
    const operators = this.getOperators();
    const filtered = operators.filter(o => o.email.toLowerCase() !== email.toLowerCase());
    this.saveOperators(filtered);
    this.addLog("Deleted admin operator: " + email);
    return true;
  },

  // --- Q&A METHODS ---
  getQA() {
    return this.get("qa") || [];
  },
  saveQA(qaList) {
    this.save("qa", qaList);
  },
  addQA(productId, question, user = "Guest Player") {
    const qaList = this.getQA();
    const newQA = {
      id: "qa-" + Math.floor(1000 + Math.random() * 9000),
      productId,
      question,
      answer: "",
      date: new Date().toISOString().split("T")[0],
      user
    };
    qaList.push(newQA);
    this.saveQA(qaList);
    return newQA;
  },
  replyQA(id, answer) {
    const qaList = this.getQA();
    const idx = qaList.findIndex(q => q.id === id);
    if (idx !== -1) {
      qaList[idx].answer = answer;
      this.saveQA(qaList);
      this.addLog("Replied to customer question ID: " + id);
      return true;
    }
    return false;
  },
  deleteQA(id) {
    const qaList = this.getQA();
    const filtered = qaList.filter(q => q.id !== id);
    this.saveQA(filtered);
    this.addLog("Deleted customer question ID: " + id);
    return true;
  },

  // --- TYPOGRAPHY CMS ---
  getTypography() {
    return this.get("typography") || INITIAL_TYPOGRAPHY;
  },
  saveTypography(typography) {
    this.save("typography", typography);
    this.addLog("Updated global typography settings");
  },

  // --- HEADER NAVIGATION LINKS ---
  getNavigation() {
    return this.get("navigation") || [];
  },
  saveNavigation(navigation) {
    this.save("navigation", navigation);
    this.addLog("Updated header navigation links layout");
  },

  // --- SYSTEM AUDIT LOGS ---
  getLogs() {
    return this.get("audit_logs") || [];
  },
  saveLogs(logs) {
    this.save("audit_logs", logs);
  },
  addLog(action, user = "System") {
    const logs = this.getLogs();
    const newLog = {
      id: "log-" + Math.floor(1000 + Math.random() * 9000),
      timestamp: new Date().toLocaleString(),
      user,
      action
    };
    logs.unshift(newLog);
    if (logs.length > 100) logs.pop();
    this.saveLogs(logs);
    return newLog;
  },

  // --- EMAIL CONFIGURATION ---
  getEmailConfig() {
    return this.get("email_config") || INITIAL_EMAIL_CONFIG;
  },
  saveEmailConfig(cfg) {
    this.save("email_config", cfg);
    this.addLog("Updated email configurations and Brevo API details");
  },

  // --- FAQS DATABASE ---
  getFaqs() {
    return this.get("faqs") || [];
  },
  saveFaqs(faqs) {
    this.save("faqs", faqs);
  },
  addFaq(question, answer) {
    const faqs = this.getFaqs();
    const newFaq = {
      id: "faq-" + Math.floor(1000 + Math.random() * 9000),
      question,
      answer
    };
    faqs.push(newFaq);
    this.saveFaqs(faqs);
    this.addLog("Added new FAQ item");
    return newFaq;
  },
  updateFaq(id, updatedFields) {
    const faqs = this.getFaqs();
    const idx = faqs.findIndex(f => f.id === id);
    if (idx !== -1) {
      faqs[idx] = { ...faqs[idx], ...updatedFields };
      this.saveFaqs(faqs);
      this.addLog("Updated FAQ item ID: " + id);
      return true;
    }
    return false;
  },
  deleteFaq(id) {
    const faqs = this.getFaqs();
    const filtered = faqs.filter(f => f.id !== id);
    this.saveFaqs(filtered);
    this.addLog("Deleted FAQ item ID: " + id);
    return true;
  },

  // --- BRAND STORY CMS ---
  getBrandStory() {
    return this.get("brand_story") || INITIAL_BRAND_STORY;
  },
  saveBrandStory(story) {
    this.save("brand_story", story);
    this.addLog("Updated brand story, logos, and homepage copy");
  },

  // --- UTILITY / BACKUP / RESTORE ---
  resetCatalog() {
    this.save("products", INITIAL_PRODUCTS);
    this.save("categories", INITIAL_CATEGORIES);
    this.addLog("Reset catalog to initial seed products");
  },
  wipeOrdersAndAnalytics() {
    this.save("orders", []);
    this.save("leads", []);
    this.save("reviews", []);
    this.addLog("Cleared all storefront order and analytics data");
  },
  factoryReset() {
    localStorage.clear();
    this.init();
    this.addLog("Performed factory reset on client local storage database");
  },
  getAdminSession() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEY_PREFIX + "admin_session"));
    } catch (e) {
      return null;
    }
  },
  logoutAdmin() {
    const admin = this.getAdminSession();
    if (admin) {
      this.addLog("Admin logout successful", admin.email);
    }
    localStorage.removeItem(DB_KEY_PREFIX + "admin_session");
    const token = localStorage.getItem('vk_auth_token');
    if (token && token.startsWith('local-admin-token-')) {
      localStorage.removeItem('vk_auth_token');
    }
  },

  // --- BANNERS ---
  getBanners() {
    return this.get("banners") || [];
  },
  saveBanners(banners) {
    this.save("banners", banners);
  },
  addBanner(banner) {
    const banners = this.getBanners();
    const newBanner = {
      ...banner,
      id: "banner-" + Math.floor(1000 + Math.random() * 9000)
    };
    banners.push(newBanner);
    this.saveBanners(banners);
    return newBanner;
  },
  updateBanner(id, updatedFields) {
    const banners = this.getBanners();
    const idx = banners.findIndex(b => b.id === id);
    if (idx !== -1) {
      banners[idx] = { ...banners[idx], ...updatedFields };
      this.saveBanners(banners);
      return true;
    }
    return false;
  },
  deleteBanner(id) {
    const banners = this.getBanners();
    const filtered = banners.filter(b => b.id !== id);
    this.saveBanners(filtered);
    return true;
  },

  // --- GALLERY ---
  getGallery() {
    return this.get("gallery") || [];
  },
  saveGallery(gallery) {
    this.save("gallery", gallery);
  },
  addGalleryItem(item) {
    const gallery = this.getGallery();
    const newItem = {
      ...item,
      id: "gal-" + Math.floor(1000 + Math.random() * 9000)
    };
    gallery.push(newItem);
    this.saveGallery(gallery);
    return newItem;
  },
  deleteGalleryItem(id) {
    const gallery = this.getGallery();
    const filtered = gallery.filter(g => g.id !== id);
    this.saveGallery(filtered);
    return true;
  },

  // --- TESTIMONIALS ---
  getTestimonials() {
    return this.get("testimonials") || [];
  },
  saveTestimonials(testimonials) {
    this.save("testimonials", testimonials);
  },
  addTestimonial(testimonial) {
    const testimonials = this.getTestimonials();
    const newTst = {
      ...testimonial,
      id: "tst-" + Math.floor(1000 + Math.random() * 9000),
      approved: testimonial.approved !== undefined ? testimonial.approved : false,
      avatar: testimonial.reviewerName ? testimonial.reviewerName.charAt(0).toUpperCase() : "U"
    };
    testimonials.push(newTst);
    this.saveTestimonials(testimonials);
    return newTst;
  },
  approveTestimonial(id) {
    const testimonials = this.getTestimonials();
    const idx = testimonials.findIndex(t => t.id === id);
    if (idx !== -1) {
      testimonials[idx].approved = true;
      this.saveTestimonials(testimonials);
      return true;
    }
    return false;
  },
  deleteTestimonial(id) {
    const testimonials = this.getTestimonials();
    const filtered = testimonials.filter(t => t.id !== id);
    this.saveTestimonials(filtered);
    return true;
  },
  updateTestimonial(id, updatedFields) {
    const testimonials = this.getTestimonials();
    const idx = testimonials.findIndex(t => t.id === id);
    if (idx !== -1) {
      testimonials[idx] = { ...testimonials[idx], ...updatedFields };
      this.saveTestimonials(testimonials);
      return true;
    }
    return false;
  },

  getDemoVideos() {
    return this.get("demo_videos") || [];
  },

  addDemoVideo(url) {
    const videos = this.getDemoVideos();
    videos.push(url);
    this.save("demo_videos", videos);
  },

  deleteDemoVideo(index) {
    const videos = this.getDemoVideos();
    videos.splice(index, 1);
    this.save("demo_videos", videos);
  },

  // --- HOMEPAGE SECTIONS BUILDER ---
  getHomepageSections() {
    return this.get("homepage_sections") || [];
  },
  saveHomepageSections(sections) {
    this.save("homepage_sections", sections);
  },

  // --- SETTINGS ---
  getSettings() {
    return this.get("settings") || INITIAL_SETTINGS;
  },
  saveSettings(settings) {
    this.save("settings", settings);
  },

  // --- PRODUCT REVIEWS ---
  getReviews() {
    return this.get("reviews") || [];
  },
  saveReviews(reviews) {
    this.save("reviews", reviews);
  },
  getProductReviews(productId) {
    const reviews = this.getReviews();
    return reviews.filter(r => r.productId === productId && r.approved);
  },
  addReview(productId, review) {
    const reviews = this.getReviews();
    const newReview = {
      id: "rev-" + Math.floor(1000 + Math.random() * 9000),
      productId,
      userName: review.userName || "Anonymous",
      rating: Number(review.rating || 5),
      comment: review.comment || "",
      likes: 0,
      dislikes: 0,
      date: new Date().toISOString().split("T")[0],
      approved: false // requires admin approval by default
    };
    reviews.push(newReview);
    this.saveReviews(reviews);
    return newReview;
  },
  voteReview(reviewId, type, userId) {
    if (!userId) return false;
    const reviews = this.getReviews();
    const idx = reviews.findIndex(r => r.id === reviewId);
    if (idx !== -1) {
      const review = reviews[idx];
      if (!review.likedBy) review.likedBy = [];
      if (!review.dislikedBy) review.dislikedBy = [];

      const hasLiked = review.likedBy.includes(userId);
      const hasDisliked = review.dislikedBy.includes(userId);

      if (type === 'like') {
        if (hasLiked) {
          review.likedBy = review.likedBy.filter(id => id !== userId);
          review.likes = Math.max(0, review.likes - 1);
        } else {
          review.likedBy.push(userId);
          review.likes += 1;
          if (hasDisliked) {
            review.dislikedBy = review.dislikedBy.filter(id => id !== userId);
            review.dislikes = Math.max(0, review.dislikes - 1);
          }
        }
      } else if (type === 'dislike') {
        if (hasDisliked) {
          review.dislikedBy = review.dislikedBy.filter(id => id !== userId);
          review.dislikes = Math.max(0, review.dislikes - 1);
        } else {
          review.dislikedBy.push(userId);
          review.dislikes += 1;
          if (hasLiked) {
            review.likedBy = review.likedBy.filter(id => id !== userId);
            review.likes = Math.max(0, review.likes - 1);
          }
        }
      }
      this.saveReviews(reviews);
      return true;
    }
    return false;
  },
  approveReview(id) {
    const reviews = this.getReviews();
    const idx = reviews.findIndex(r => r.id === id);
    if (idx !== -1) {
      reviews[idx].approved = true;
      this.saveReviews(reviews);
      return true;
    }
    return false;
  },
  deleteReview(id) {
    const reviews = this.getReviews();
    const filtered = reviews.filter(r => r.id !== id);
    this.saveReviews(filtered);
    return true;
  },
  getCraftSteps() {
    return this.get("craft_steps") || [];
  },
  saveCraftSteps(steps) {
    this.save("craft_steps", steps);
  },
  addCraftStep(step) {
    const steps = this.getCraftSteps();
    const newStep = {
      ...step,
      id: "step-" + Math.floor(1000 + Math.random() * 9000),
      num: String(steps.length + 1).padStart(2, '0')
    };
    steps.push(newStep);
    this.saveCraftSteps(steps);
    return newStep;
  },
  updateCraftStep(id, updatedFields) {
    const steps = this.getCraftSteps();
    const idx = steps.findIndex(s => s.id === id);
    if (idx !== -1) {
      steps[idx] = { ...steps[idx], ...updatedFields };
      this.saveCraftSteps(steps);
      return true;
    }
    return false;
  },
  deleteCraftStep(id) {
    const steps = this.getCraftSteps();
    let filtered = steps.filter(s => s.id !== id);
    filtered = filtered.map((s, idx) => ({
      ...s,
      num: String(idx + 1).padStart(2, '0')
    }));
    this.saveCraftSteps(filtered);
    return true;
  }
};
