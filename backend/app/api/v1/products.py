from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas.product import ProductCreate, Product
from app.core.database import get_db
from app.services.product_service import product_service

router = APIRouter()

@router.get("/", response_model=List[Product])
def get_products(
    skip: int = 0, 
    limit: int = 100, 
    category_slug: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return product_service.get_all(db, skip=skip, limit=limit, category_slug=category_slug)

@router.get("/{slug}", response_model=Product)
def get_product(slug: str, db: Session = Depends(get_db)):
    return product_service.get_by_slug(db, slug)

@router.post("/", response_model=Product)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    return product_service.create(db, product)

@router.put("/{product_id}", response_model=Product)
def update_product(product_id: int, product: ProductCreate, db: Session = Depends(get_db)):
    return product_service.update(db, product_id, product)

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    return product_service.delete(db, product_id)
