from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, BigInteger, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"
    id = Column(BigInteger, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    sku = Column(String(50), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, nullable=False)
    short_description = Column(Text)
    long_description = Column(Text)
    price = Column(Numeric(10, 2), nullable=False)
    compare_price = Column(Numeric(10, 2))
    gst_percentage = Column(Numeric(5, 2), default=12.0)
    grade = Column(String(100))
    pressing = Column(String(100))
    video_url = Column(String(255))
    is_featured = Column(Boolean, default=False)
    is_bestseller = Column(Boolean, default=False)
    status = Column(String, default="active")
    seo_title = Column(String(255))
    seo_description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product")
    specs = relationship("ProductSpec", back_populates="product")
    variants = relationship("InventoryVariant", back_populates="product")
    reviews = relationship("Review", back_populates="product")

class ProductImage(Base):
    __tablename__ = "product_images"
    id = Column(BigInteger, primary_key=True, index=True)
    product_id = Column(BigInteger, ForeignKey("products.id"))
    image_url = Column(String(255), nullable=False)
    is_primary = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)
    
    product = relationship("Product", back_populates="images")

class ProductSpec(Base):
    __tablename__ = "product_specs"
    id = Column(BigInteger, primary_key=True, index=True)
    product_id = Column(BigInteger, ForeignKey("products.id"))
    spec_name = Column(String(100), nullable=False)
    spec_value = Column(String(255), nullable=False)
    
    product = relationship("Product", back_populates="specs")

class InventoryVariant(Base):
    __tablename__ = "inventory_variants"
    id = Column(BigInteger, primary_key=True, index=True)
    product_id = Column(BigInteger, ForeignKey("products.id"))
    sku_variant = Column(String(100), unique=True, nullable=False)
    weight_range = Column(String(50))
    handle_type = Column(String(50))
    stock_quantity = Column(Integer, default=0, nullable=False)
    price_adjustment = Column(Numeric(10, 2), default=0.0)
    
    product = relationship("Product", back_populates="variants")
