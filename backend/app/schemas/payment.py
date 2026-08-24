from pydantic import BaseModel
from typing import Optional

class RazorpayCreate(BaseModel):
    amount: float
    currency: str = "INR"
    receipt: Optional[str] = None

class RazorpayVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    internal_order_id: Optional[int] = None
    amount: Optional[float] = None

class CodConfirm(BaseModel):
    internal_order_id: int
    amount: float
