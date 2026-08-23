from sqlalchemy.orm import Session
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate
import uuid

class OrderRepository:
    def get_by_id(self, db: Session, order_id: int) -> Order | None:
        return db.query(Order).filter(Order.id == order_id).first()

    def get_by_order_number(self, db: Session, order_number: str) -> Order | None:
        return db.query(Order).filter(Order.order_number == order_number).first()

    def get_user_orders(self, db: Session, user_id: int) -> list[Order]:
        return db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()

    def create(self, db: Session, order_in: OrderCreate) -> Order:
        order_number = f"VK-{uuid.uuid4().hex[:8].upper()}"
        
        db_order = Order(
            order_number=order_number,
            user_id=order_in.user_id,
            shipping_address_id=order_in.shipping_address_id,
            subtotal=order_in.subtotal,
            gst_total=order_in.gst_total,
            shipping_fee=order_in.shipping_fee,
            discount_total=order_in.discount_total,
            grand_total=order_in.grand_total,
            coupon_code=order_in.coupon_code,
            customer_notes=order_in.customer_notes
        )
        db.add(db_order)
        db.commit()
        db.refresh(db_order)

        for item in order_in.items:
            db_item = OrderItem(
                order_id=db_order.id,
                product_id=item.product_id,
                product_name=item.product_name,
                quantity=item.quantity,
                unit_price=item.unit_price,
                gst_percentage=item.gst_percentage,
                subtotal=item.subtotal,
                specs_selected=item.specs_selected,
                variant_id=item.variant_id
            )
            db.add(db_item)
        
        db.commit()
        db.refresh(db_order)
        return db_order

order_repo = OrderRepository()
