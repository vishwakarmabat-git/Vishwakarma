from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.schemas.order import OrderCreate
from app.repositories.order_repository import order_repo
from app.models.user import User

class OrderService:
    def create_order(self, db: Session, current_user: User, order_in: OrderCreate):
        if order_in.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Cannot create order for another user")
        return order_repo.create(db, order_in)

    def get_user_orders(self, db: Session, current_user: User):
        return order_repo.get_user_orders(db, current_user.id)

    def get_order_by_id(self, db: Session, current_user: User, order_id: int):
        order = order_repo.get_by_id(db, order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if order.user_id != current_user.id and current_user.role not in ["admin", "super_admin"]:
            raise HTTPException(status_code=403, detail="Not authorized to view this order")
        return order

order_service = OrderService()
