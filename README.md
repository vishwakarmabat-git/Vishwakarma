# Vishwakarma Bat House (VK Bat House) - E-Commerce Platform

A modern, high-performance, luxury sports e-commerce platform built for **Vishwakarma Bat House**. Features a React 19 single-page application (SPA), an offline-first state synchronization engine, a PHP REST API, and an integrated Admin Management Dashboard.

---

## 📁 Project Directory Structure

```text
sports/
├── api/                             # Backend PHP REST API
│   ├── auth/                        # Authentication endpoints (login, register, me)
│   ├── categories/                  # Category CRUD endpoints
│   ├── config/                      # Core DB connection, JWT, AuthMiddleware, ErrorHandler
│   ├── orders/                      # Order management & placement endpoints
│   ├── payments/                    # Payment gateway (Razorpay) endpoints
│   ├── products/                    # Product CRUD and search endpoints
│   ├── settings/                    # Store CMS & dynamic configuration endpoints
│   ├── upload/                      # Image & media upload handlers
│   ├── setup_admin.php              # Initial administrator account generator
│   └── sync.php                     # Cloud state JSON synchronization endpoint
│
├── database/                        # Database Schemas & Migrations
│   ├── schema.sql                   # Main active database schema (MySQL/MariaDB)
│   ├── mock_data.sql                # Seed / sample test data
│   └── update_schema.sql            # Schema migration and update log
│
├── docs/                            # Documentation & Specifications
│   ├── requirements.md              # Brand requirements & reference design specs
│   └── changelog.md                 # Project updates and feature changelogs
│
├── scripts/                         # Deployment & Maintenance Scripts
│   ├── deploy.js                    # SFTP automated deployment script
│   └── deploy.ps1                   # PowerShell FTP deployment script
│
├── public/                          # Static public web assets
│   ├── assets/                      # Brand banners, bat product visuals, videos
│   ├── favicon.svg                  # Brand favicon
│   ├── icons.svg                    # SVG icon sprites
│   └── .htaccess                    # Apache URL rewrite and routing rules
│
├── src/                             # React 19 Frontend Source Code
│   ├── assets/                      # Bundled frontend assets
│   ├── components/                  # UI & Feature Components
│   │   ├── admin/                   # Admin Portal (AdminDashboard.jsx)
│   │   ├── AuthModal.jsx            # User authentication modal
│   │   ├── BestSellersCarousel.jsx  # Swiper-powered bestsellers carousel
│   │   ├── CartModal.jsx            # Interactive slide-out cart drawer
│   │   ├── CheckoutView.jsx         # Multi-step checkout & payment processing
│   │   ├── ContactForm.jsx          # Inquiry & contact form
│   │   ├── CustomerProfile.jsx      # Customer portal & order history
│   │   ├── ErrorBoundary.jsx        # Component error boundary
│   │   ├── GalleryPage.jsx          # Bat manufacturing & factory gallery
│   │   ├── Hero.jsx                 # High-impact video/image landing hero
│   │   ├── PolicyView.jsx           # Store policies (terms, shipping, refund)
│   │   ├── ProductDetailModal.jsx   # Product specs, laser engraving, blade selector
│   │   ├── ProductList.jsx          # Filterable catalog with search & sorting
│   │   ├── ScrollReveal.jsx         # Framer Motion scroll animations
│   │   ├── Timeline.jsx             # Craftsmanship journey & brand storytelling
│   │   └── WishlistModal.jsx        # Saved wishlist items drawer
│   ├── data/                        # Local DB & offline fallback storage (db.js)
│   ├── services/                    # API client and service layer
│   │   ├── adminService.js          # Admin management API calls
│   │   ├── apiClient.js             # Configured Axios instance
│   │   ├── authService.js           # Authentication services
│   │   ├── categoryService.js       # Category service
│   │   ├── cloudSync.js             # Background cloud synchronizer
│   │   ├── orderService.js          # Order placement service
│   │   ├── productService.js        # Product catalog service
│   │   └── settingService.js        # Store settings service
│   ├── App.css                      # Master application stylesheet & design system
│   ├── App.jsx                      # App root component & view router
│   ├── index.css                    # Base tokens, variables, and CSS reset
│   └── main.jsx                     # Vite React entrypoint
│
├── assets/                          # Runtime server uploads directory
│   └── uploads/                     # Upload storage target
│
├── .env                             # Base environment variables
├── .env.development                 # Development configuration
├── .env.production                  # Production configuration
├── eslint.config.js                 # ESLint rules
├── index.html                       # HTML root template
├── package.json                     # NPM dependencies and scripts
└── vite.config.js                   # Vite configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ recommended
- **PHP**: v8.0+ (with PDO MySQL and OpenSSL enabled)
- **MySQL / MariaDB**: v5.7+ or v8.0+

### 1. Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### 2. Backend & Database Setup
1. Import [`database/schema.sql`](database/schema.sql) into your MySQL database.
2. (Optional) Import [`database/mock_data.sql`](database/mock_data.sql) for sample products.
3. Configure your database credentials in `api/config/.env` or `api/config/Database.php`.
4. Run `php api/setup_admin.php` to initialize default administrator credentials.

---

## 🛠️ Tech Stack
- **Frontend**: React 19, Vite, Framer Motion, Swiper, Lucide React, Canvas-Confetti, React-Toastify
- **Styling**: Vanilla CSS with custom tokens and dark/gold sports luxury design system
- **Backend API**: PHP 8 REST API (JWT Authentication, PDO, Error Handling, File Uploads)
- **Database**: MySQL / MariaDB
