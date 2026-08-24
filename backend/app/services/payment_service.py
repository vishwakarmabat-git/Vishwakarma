from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.schemas.payment import RazorpayCreate, RazorpayVerify, CodConfirm
from app.models.order import Order, Payment
from app.core.config import settings
import razorpay
import hmac
import hashlib
import uuid

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

    def verify_payment(self, db: Session, verification_in: RazorpayVerify):
        if not self.client:
            return {"status": "success", "message": "Test payment verified"}
            
        try:
            params_dict = {
                'razorpay_order_id': verification_in.razorpay_order_id,
                'razorpay_payment_id': verification_in.razorpay_payment_id,
                'razorpay_signature': verification_in.razorpay_signature
            }
            self.client.utility.verify_payment_signature(params_dict)
            
            # Save to database if internal_order_id is provided
            if verification_in.internal_order_id:
                order = db.query(Order).filter(Order.id == verification_in.internal_order_id).first()
                if order:
                    order.payment_status = "paid"
                    order.status = "processing"
                    
                    payment = Payment(
                        order_id=order.id,
                        razorpay_order_id=verification_in.razorpay_order_id,
                        razorpay_payment_id=verification_in.razorpay_payment_id,
                        razorpay_signature=verification_in.razorpay_signature,
                        amount=verification_in.amount or order.grand_total,
                        status="captured",
                        payment_method="Razorpay"
                    )
                    db.add(payment)
                    db.commit()
            
            return {"status": "success", "message": "Payment verified successfully"}
        except razorpay.errors.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Signature verification failed")
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def confirm_cod(self, db: Session, cod_in: CodConfirm):
        order = db.query(Order).filter(Order.id == cod_in.internal_order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
            
        order.payment_status = "pending"
        order.status = "processing"
        
        payment = Payment(
            order_id=order.id,
            razorpay_order_id=f"COD-{uuid.uuid4().hex[:8].upper()}-{order.id}", # Dummy ID to satisfy constraint
            amount=cod_in.amount,
            status="pending",
            payment_method="COD"
        )
        db.add(payment)
        db.commit()
        return {"status": "success", "message": "COD order confirmed successfully"}

payment_service = PaymentService()
