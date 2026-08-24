from sqlalchemy.orm import Session
from app.models.category import Category
from app.models.product import Product
from app.schemas.product import ProductCreate
from app.repositories.product_repository import product_repo

DEFAULT_CATEGORIES = [
    {"slug": "single-blade", "name": "Single Blade", "description": "Single Blade Handcrafted Cricket Bats", "banner_image": "/assets/bat_single.png", "display_order": 1, "active": True},
    {"slug": "double-blade", "name": "Double Blade", "description": "Double Blade Handcrafted Cricket Bats", "banner_image": "/assets/bat_double.png", "display_order": 2, "active": True},
    {"slug": "triple-blade", "name": "Triple Blade", "description": "Triple Blade Handcrafted Cricket Bats", "banner_image": "/assets/bat_single.png", "display_order": 3, "active": True},
    {"slug": "triple-blade-hard", "name": "Triple Blade Hard Pressed", "description": "Triple Blade Hard Pressed Cricket Bats", "banner_image": "/assets/bat_single.png", "display_order": 4, "active": True},
    {"slug": "triple-x2", "name": "Triple X2", "description": "Triple X2 Handcrafted Cricket Bats", "banner_image": "/assets/bat_double.png", "display_order": 5, "active": True},
    {"slug": "triple-x2-hard", "name": "Triple X2 Hard Pressed", "description": "Triple X2 Hard Pressed Cricket Bats", "banner_image": "/assets/bat_double.png", "display_order": 6, "active": True}
]

DEFAULT_PRODUCTS = [
    {
        "sku": "VK-1800",
        "name": "VK Platinum Single Blade",
        "slug": "vk-platinum-single-blade",
        "category_slug": "single-blade",
        "price": 1800.0,
        "compare_price": 2400.0,
        "gst_percentage": 12.0,
        "stock": 12,
        "weight": "1160 - 1200g",
        "grade": "Grade 3 Premium Kashmir Willow",
        "pressing": "Standard Pressed",
        "is_featured": True,
        "is_bestseller": True,
        "video_url": "",
        "images": ["/assets/bat_single.png", "/assets/bat_double.png", "/assets/bat_back.png"],
        "specs": {
            "handle": "Premium Singapore Cane Handle",
            "edges": "38 - 40mm Edges",
            "spine": "60 - 62mm Spine",
            "sweetspot": "Mid to Low Sweetspot"
        },
        "variants": {
            "weights": ["1140-1160g", "1160-1180g", "1180-1200g"],
            "handles": ["Round Handle", "Oval Handle"]
        },
        "tags": ["Standard", "Single Blade", "Popular"],
        "seo_title": "VK Platinum Single Blade Cricket Bat | Vishwakarma Bat House",
        "seo_description": "Shop handcrafted VK Platinum Single Blade cricket bat. Crafted with premium Kashmir willow and designed for power and balance."
    },
    {
        "sku": "VK-2100",
        "name": "VK Elite Double Blade",
        "slug": "vk-elite-double-blade",
        "category_slug": "double-blade",
        "price": 2100.0,
        "compare_price": 2800.0,
        "gst_percentage": 12.0,
        "stock": 8,
        "weight": "1170 - 1210g",
        "grade": "Grade 2 Premium English Willow Style Kashmir Willow",
        "pressing": "Standard Pressed",
        "is_featured": True,
        "is_bestseller": True,
        "video_url": "",
        "images": ["/assets/bat_double.png", "/assets/bat_single.png", "/assets/bat_back.png"],
        "specs": {
            "handle": "Premium 3-Piece Cane Handle",
            "edges": "40mm Edges",
            "spine": "62mm Spine",
            "sweetspot": "Mid Sweetspot"
        },
        "variants": {
            "weights": ["1150-1170g", "1170-1190g", "1190-1210g"],
            "handles": ["Round Handle", "Oval Handle"]
        },
        "tags": ["Double Blade", "Balance"],
        "seo_title": "VK Elite Double Blade Cricket Bat | Vishwakarma Bat House",
        "seo_description": "Experience outstanding power with the VK Elite Double Blade cricket bat. Premium cane handle and perfect shock absorption."
    },
    {
        "sku": "VK-2400",
        "name": "VK Pro Triple Blade",
        "slug": "vk-pro-triple-blade",
        "category_slug": "triple-blade",
        "price": 2400.0,
        "compare_price": 3200.0,
        "gst_percentage": 12.0,
        "stock": 6,
        "weight": "1180 - 1220g",
        "grade": "Grade 1 Selected Premium Willow",
        "pressing": "Standard Pressed",
        "is_featured": False,
        "is_bestseller": True,
        "video_url": "https://www.w3schools.com/html/mov_bbb.mp4",
        "images": ["/assets/bat_single.png", "/assets/bat_back.png", "/assets/bat_double.png"],
        "specs": {
            "handle": "Full Cane Rounded Handle",
            "edges": "40 - 42mm Edges",
            "spine": "63mm Spine",
            "sweetspot": "Mid-to-High Sweetspot"
        },
        "variants": {
            "weights": ["1160-1180g", "1180-1200g", "1200-1220g"],
            "handles": ["Round Handle"]
        },
        "tags": ["Triple Blade", "Hard Hitter"],
        "seo_title": "VK Pro Cricket Bat - Premium Handcrafted",
        "seo_description": "Designed for tournament players, the VK Pro Triple Blade cricket bat delivers unmatched sweetspot response and power."
    },
    {
        "sku": "VK-2500",
        "name": "VK Gold Triple Blade Hard Pressed",
        "slug": "vk-gold-triple-blade-hard-pressed",
        "category_slug": "triple-blade-hard",
        "price": 2500.0,
        "compare_price": 3333.0,
        "gst_percentage": 12.0,
        "stock": 10,
        "weight": "1150 - 1190g",
        "grade": "Grade 1 Special Select Willow",
        "pressing": "High Press (Hard Pressed)",
        "is_featured": True,
        "is_bestseller": True,
        "video_url": "",
        "images": ["/assets/bat_double.png", "/assets/bat_back.png"],
        "specs": {
            "handle": "9-Piece Treble Spring Cane Handle",
            "edges": "39 - 41mm Edges",
            "spine": "60 - 64mm Spine",
            "sweetspot": "Low Sweetspot for Indian Pitches"
        },
        "variants": {
            "weights": ["1130g", "1150g", "1170g", "1190g"],
            "handles": ["Round Handle", "Oval Handle"]
        },
        "tags": ["Triple Blade", "Hard Pressed", "Best Value"],
        "seo_title": "VK Gold Triple Blade Hard Pressed Bat | Vishwakarma Bat House",
        "seo_description": "Order the VK Gold Triple Blade Hard Pressed cricket bat. Extra pressed for instant playability and high durability."
    },
    {
        "sku": "VK-2800",
        "name": "VK Signature Triple X2",
        "slug": "vk-signature-triple-x2",
        "category_slug": "triple-x2",
        "price": 2800.0,
        "compare_price": 3800.0,
        "gst_percentage": 12.0,
        "stock": 5,
        "weight": "1160 - 1200g",
        "grade": "Grade 1+ Tournament Grade Willow",
        "pressing": "Standard Pressed",
        "is_featured": False,
        "is_bestseller": True,
        "video_url": "",
        "images": ["/assets/bat_single.png", "/assets/bat_double.png"],
        "specs": {
            "handle": "9-Piece Premium Cane Handle",
            "edges": "42mm Edges",
            "spine": "64mm Spine",
            "sweetspot": "Mid Sweetspot"
        },
        "variants": {
            "weights": ["1140-1160g", "1160-1180g", "1180-1200g"],
            "handles": ["Round Handle", "Oval Handle"]
        },
        "tags": ["Triple X2", "Signature", "Limited"],
        "seo_title": "VK Signature Triple X2 Cricket Bat | Handcrafted Power",
        "seo_description": "Get the VK Signature Triple X2 bat with thick edges and light pickup. Ideal for heavy hitters looking for balance."
    },
    {
        "sku": "VK-3200",
        "name": "VK Limited Edition Triple X2 Hard Pressed",
        "slug": "vk-limited-edition-triple-x2-hard-pressed",
        "category_slug": "triple-x2-hard",
        "price": 3200.0,
        "compare_price": 4200.0,
        "gst_percentage": 12.0,
        "stock": 4,
        "weight": "1140 - 1180g",
        "grade": "Grade 1+ Super Select Professional Willow",
        "pressing": "High Press (Hard Pressed)",
        "is_featured": True,
        "is_bestseller": True,
        "video_url": "",
        "images": ["/assets/bat_single.png", "/assets/bat_double.png", "/assets/bat_back.png"],
        "specs": {
            "handle": "Super Fine Cane 9-Piece Handle",
            "edges": "43 - 44mm Massive Edges",
            "spine": "65 - 67mm Spine",
            "sweetspot": "Optimized Full Profile Sweetspot"
        },
        "variants": {
            "weights": ["1130g", "1150g", "1170g", "1180g"],
            "handles": ["Round Handle", "Oval Handle"]
        },
        "tags": ["Triple X2", "Hard Pressed", "Professional"],
        "seo_title": "VK Limited Edition Triple X2 Hard Pressed Cricket Bat",
        "seo_description": "Our flagship bat. Made from the finest select willow blocks, hard pressed for ultimate ping, power, and durability."
    }
]

def seed_database(db: Session, force: bool = False):
    # 1. Seed categories
    for cat_data in DEFAULT_CATEGORIES:
        existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
        if not existing:
            new_cat = Category(**cat_data)
            db.add(new_cat)
    db.commit()

    # 2. Seed products if table is empty or forced
    product_count = db.query(Product).count()
    if product_count == 0 or force:
        for p_data in DEFAULT_PRODUCTS:
            existing = db.query(Product).filter(Product.sku == p_data["sku"]).first()
            if not existing:
                p_in = ProductCreate(**p_data)
                product_repo.create(db, p_in)
        print("Default catalog successfully seeded into database.")
