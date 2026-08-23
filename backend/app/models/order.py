from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, BigInteger, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Order(Base):
    __tablename__ = "orders"
    id = Column(BigInteger, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id"))
    shipping_address_id = Column(BigInteger, ForeignKey("addresses.id"))
    subtotal = Column(Numeric(10, 2), nullable=False)
    gst_total = Column(Numeric(10, 2), nullable=False)
    shipping_fee = Column(Numeric(10, 2), default=0.0)
    discount_total = Column(Numeric(10, 2), default=0.0)
    grand_total = Column(Numeric(10, 2), nullable=False)
    coupon_code = Column(String(50))
    status = Column(String, default="pending")
    payment_status = Column(String, default="pending")
    customer_notes = Column(Text)
    admin_notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")
    payment = relationship("Payment", uselist=False, back_populates="order")
    shipping = relationship("ShippingTracking", uselist=False, back_populates="order")
    shipping_address = relationship("Address")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(BigInteger, primary_key=True, index=True)
    order_id = Column(BigInteger, ForeignKey("orders.id"))
    product_id = Column(BigInteger, ForeignKey("products.id"))
    variant_id = Column(BigInteger, ForeignKey("inventory_variants.id"), nullable=True)
    product_name = Column(String(200), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    gst_percentage = Column(Numeric(5, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    specs_selected = Column(Text)
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product")
    variant = relationship("InventoryVariant")

class Payment(Base):
    __tablename__ = "payments"
    id = Column(BigInteger, primary_key=True, index=True)
    order_id = Column(BigInteger, ForeignKey("orders.id"))
    razorpay_order_id = Column(String(100), unique=True, nullable=False)
    razorpay_payment_id = Column(String(100))
    razorpay_signature = Column(String(255))
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(50), nullable=False)
    payment_method = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    
    order = relationship("Order", back_populates="payment")

class ShippingTracking(Base):
    __tablename__ = "shipping_tracking"
    id = Column(BigInteger, primary_key=True, index=True)
    order_id = Column(BigInteger, ForeignKey("orders.id"))
    shiprocket_order_id = Column(String(100))
    shiprocket_shipment_id = Column(String(100))
    awb_code = Column(String(100))
    courier_name = Column(String(100))
    tracking_url = Column(String(255))
    status = Column(String(50), default="manifested")
    shipped_at = Column(DateTime)
    delivered_at = Column(DateTime)
    
    order = relationship("Order", back_populates="shipping")
