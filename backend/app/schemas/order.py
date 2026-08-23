from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class OrderItemBase(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    unit_price: float
    gst_percentage: float
    subtotal: float
    specs_selected: Optional[str] = None
    variant_id: Optional[int] = None

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    order_id: int
    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    user_id: int
    shipping_address_id: Optional[int] = None
    subtotal: float
    gst_total: float
    shipping_fee: float = 0.0
    discount_total: float = 0.0
    grand_total: float
    coupon_code: Optional[str] = None
    customer_notes: Optional[str] = None

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class Order(OrderBase):
    id: int
    order_number: str
    status: str
    payment_status: str
    created_at: datetime
    updated_at: datetime
    items: List[OrderItem]
    class Config:
        from_attributes = True
