from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.schemas.product import ProductCreate
from app.repositories.product_repository import product_repo
from typing import Optional

class ProductService:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100, category_slug: Optional[str] = None):
        return product_repo.get_all_active(db, skip=skip, limit=limit, category_slug=category_slug)

    def get_by_slug(self, db: Session, slug: str):
        product = product_repo.get_by_slug(db, slug)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product

    def create(self, db: Session, product_in: ProductCreate):
        existing = product_repo.get_by_sku(db, product_in.sku)
        if existing:
            raise HTTPException(status_code=400, detail="SKU already exists")
        return product_repo.create(db, product_in)

    def update(self, db: Session, product_id: int, product_in: ProductCreate):
        updated = product_repo.update(db, product_id, product_in)
        if not updated:
            raise HTTPException(status_code=404, detail="Product not found")
        return updated

    def delete(self, db: Session, product_id: int):
        success = product_repo.delete(db, product_id)
        if not success:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"status": "success", "message": "Deleted successfully"}

product_service = ProductService()
