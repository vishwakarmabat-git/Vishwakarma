from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryOut
from app.schemas.product import ProductOut
from app.core.database import get_db
from app.services.category_service import category_service

router = APIRouter()

@router.get("/", response_model=List[CategoryOut])
def get_categories(
    active_only: bool = Query(True, description="Filter only active categories"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return category_service.get_all(db, active_only=active_only, skip=skip, limit=limit)

@router.get("/slug/{slug}", response_model=CategoryOut)
def get_category_by_slug(slug: str, db: Session = Depends(get_db)):
    return category_service.get_by_slug(db, slug)

@router.get("/{category_id}", response_model=CategoryOut)
def get_category(category_id: int, db: Session = Depends(get_db)):
    return category_service.get_by_id(db, category_id)

@router.get("/{category_id}/products", response_model=List[ProductOut])
def get_category_products(
    category_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return category_service.get_category_products(db, category_id=category_id, skip=skip, limit=limit)

@router.post("/", response_model=CategoryOut)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    return category_service.create(db, category)

@router.put("/{category_id}", response_model=CategoryOut)
def update_category(category_id: int, category: CategoryUpdate, db: Session = Depends(get_db)):
    return category_service.update(db, category_id, category)

@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    return category_service.delete(db, category_id)

