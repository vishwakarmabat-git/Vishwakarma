from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.schemas.category import CategoryCreate, Category
from app.core.database import get_db
from app.services.category_service import category_service

router = APIRouter()

@router.get("/", response_model=List[Category])
def get_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return category_service.get_all(db, skip=skip, limit=limit)

@router.post("/", response_model=Category)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    return category_service.create(db, category)

@router.put("/{category_id}", response_model=Category)
def update_category(category_id: int, category: CategoryCreate, db: Session = Depends(get_db)):
    return category_service.update(db, category_id, category)

@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    return category_service.delete(db, category_id)
