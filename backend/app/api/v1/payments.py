from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.payment import RazorpayCreate, RazorpayVerify, CodConfirm
from app.services.payment_service import payment_service

router = APIRouter()

@router.post("/razorpay/create")
def create_razorpay_order(payment_in: RazorpayCreate):
    return payment_service.create_order(payment_in)

@router.post("/razorpay/verify")
def verify_razorpay_payment(verification_in: RazorpayVerify, db: Session = Depends(get_db)):
    return payment_service.verify_payment(db, verification_in)

@router.post("/cod/confirm")
def confirm_cod_payment(cod_in: CodConfirm, db: Session = Depends(get_db)):
    return payment_service.confirm_cod(db, cod_in)
