from fastapi import HTTPException
from app.schemas.payment import RazorpayCreate, RazorpayVerify
from app.core.config import settings
import razorpay
import hmac
import hashlib

class PaymentService:
    def __init__(self):
        # We handle cases where keys might not be set yet in dev
        if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
            self.client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        else:
            self.client = None

    def create_order(self, payment_in: RazorpayCreate):
        if not self.client:
            return {"id": "test_order_id_123", "amount": payment_in.amount * 100, "status": "created"}
        
        try:
            data = {
                "amount": int(payment_in.amount * 100), # Razorpay expects paise
                "currency": payment_in.currency,
                "receipt": payment_in.receipt or "receipt_01"
            }
            order = self.client.order.create(data=data)
            return order
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def verify_payment(self, verification_in: RazorpayVerify):
        if not self.client:
            return {"status": "success", "message": "Test payment verified"}
            
        try:
            params_dict = {
                'razorpay_order_id': verification_in.razorpay_order_id,
                'razorpay_payment_id': verification_in.razorpay_payment_id,
                'razorpay_signature': verification_in.razorpay_signature
            }
            self.client.utility.verify_payment_signature(params_dict)
            return {"status": "success", "message": "Payment verified successfully"}
        except razorpay.errors.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Signature verification failed")
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

payment_service = PaymentService()
