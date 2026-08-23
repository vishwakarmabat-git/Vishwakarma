from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.schemas.order import OrderCreate, Order
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.services.order_service import order_service

router = APIRouter()

@router.post("/", response_model=Order)
def create_order(
    order_in: OrderCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return order_service.create_order(db, current_user, order_in)

@router.get("/", response_model=List[Order])
def get_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return order_service.get_user_orders(db, current_user)

@router.get("/{order_id}", response_model=Order)
def get_order(
    order_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return order_service.get_order_by_id(db, current_user, order_id)
