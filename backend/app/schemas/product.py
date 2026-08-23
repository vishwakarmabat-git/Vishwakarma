from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProductBase(BaseModel):
    sku: str
    name: str
    slug: str
    short_description: Optional[str] = None
    long_description: Optional[str] = None
    price: float
    compare_price: Optional[float] = None
    gst_percentage: float = 12.0
    grade: Optional[str] = None
    pressing: Optional[str] = None
    video_url: Optional[str] = None
    is_featured: bool = False
    is_bestseller: bool = False
    status: str = "active"
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None

class ProductCreate(ProductBase):
    category_id: int

class Product(ProductBase):
    id: int
    category_id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
