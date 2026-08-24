from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut
from app.core.database import get_db
from app.services.product_service import product_service

router = APIRouter()

@router.get("/", response_model=List[ProductOut])
def get_products(
    category_id: Optional[int] = Query(None, description="Filter products by category ID"),
    status: Optional[str] = Query("active", description="Filter products by status"),
    is_featured: Optional[bool] = Query(None, description="Filter featured products"),
    is_bestseller: Optional[bool] = Query(None, description="Filter bestseller products"),
    search: Optional[str] = Query(None, description="Search products by keyword"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return product_service.get_all(
        db,
        category_id=category_id,
        status=status,
        is_featured=is_featured,
        is_bestseller=is_bestseller,
        search=search,
        skip=skip,
        limit=limit
    )

@router.get("/slug/{slug}", response_model=ProductOut)
def get_product_by_slug(slug: str, db: Session = Depends(get_db)):
    return product_service.get_by_slug(db, slug)

@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return product_service.get_by_id(db, product_id)

@router.post("/", response_model=ProductOut)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    return product_service.create(db, product)

@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    return product_service.update(db, product_id, product)

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    return product_service.delete(db, product_id)
