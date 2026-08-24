from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    category_id: Optional[int] = None
    sku: Optional[str] = None
    slug: Optional[str] = None
    short_description: Optional[str] = None
    long_description: Optional[str] = None
    price: float
    compare_price: Optional[float] = None
    gst_percentage: float = 12.0
    stock: int = 0
    grade: Optional[str] = None
    pressing: Optional[str] = None
    video_url: Optional[str] = None
    is_featured: bool = False
    is_bestseller: bool = False
    status: str = "active"
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    images: Optional[List[str]] = []
    specs: Optional[Dict[str, Any]] = None
    variants: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = []

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    sku: Optional[str] = None
    slug: Optional[str] = None
    short_description: Optional[str] = None
    long_description: Optional[str] = None
    price: Optional[float] = None
    compare_price: Optional[float] = None
    gst_percentage: Optional[float] = None
    stock: Optional[int] = None
    grade: Optional[str] = None
    pressing: Optional[str] = None
    video_url: Optional[str] = None
    is_featured: Optional[bool] = None
    is_bestseller: Optional[bool] = None
    status: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    images: Optional[List[str]] = None
    specs: Optional[Dict[str, Any]] = None
    variants: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None

class ProductOut(ProductBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Alias for backwards compatibility in routers
Product = ProductOut

