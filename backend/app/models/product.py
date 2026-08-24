from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, BigInteger, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, index=True, nullable=False)
    short_description = Column(String(500), nullable=True)
    long_description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    compare_price = Column(Float, nullable=True)
    gst_percentage = Column(Float, default=12.0)
    stock = Column(Integer, default=0)
    grade = Column(String(100), nullable=True)
    pressing = Column(String(100), nullable=True)
    video_url = Column(String(500), nullable=True)
    is_featured = Column(Boolean, default=False)
    is_bestseller = Column(Boolean, default=False)
    status = Column(String(20), default="active")
    seo_title = Column(String(200), nullable=True)
    seo_description = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    specs = relationship("ProductSpec", back_populates="product", cascade="all, delete-orphan")
    variants = relationship("InventoryVariant", back_populates="product", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")

class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)
    
    product = relationship("Product", back_populates="images")

class ProductSpec(Base):
    __tablename__ = "product_specs"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    spec_name = Column(String(100), nullable=False)
    spec_value = Column(String(255), nullable=False)
    
    product = relationship("Product", back_populates="specs")

class InventoryVariant(Base):
    __tablename__ = "inventory_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    sku_variant = Column(String(100), nullable=False)
    weight_range = Column(String(50), nullable=True)
    handle_type = Column(String(50), nullable=True)
    stock_quantity = Column(Integer, default=0, nullable=False)
    price_adjustment = Column(Float, default=0.0)
    
    product = relationship("Product", back_populates="variants")

