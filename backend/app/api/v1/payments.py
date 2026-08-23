from fastapi import APIRouter, Depends
from app.schemas.payment import RazorpayCreate, RazorpayVerify
from app.services.payment_service import payment_service

router = APIRouter()

@router.post("/razorpay/create")
def create_razorpay_order(payment_in: RazorpayCreate):
    return payment_service.create_order(payment_in)

@router.post("/razorpay/verify")
def verify_razorpay_payment(verification_in: RazorpayVerify):
    return payment_service.verify_payment(verification_in)
