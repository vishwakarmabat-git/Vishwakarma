from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.schemas.product import ProductCreate, ProductUpdate
from app.repositories.product_repository import product_repo
from app.repositories.category_repository import category_repo
from typing import Optional

class ProductService:
    def get_all(
        self,
        db: Session,
        category_id: Optional[int] = None,
        status: Optional[str] = "active",
        is_featured: Optional[bool] = None,
        is_bestseller: Optional[bool] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ):
        return product_repo.get_all(
            db,
            category_id=category_id,
            status=status,
            is_featured=is_featured,
            is_bestseller=is_bestseller,
            search=search,
            skip=skip,
            limit=limit
        )

    def get_by_id(self, db: Session, product_id: int):
        product = product_repo.get_by_id(db, product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with id {product_id} not found")
        return product

    def get_by_slug(self, db: Session, slug: str):
        product = product_repo.get_by_slug(db, slug)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with slug '{slug}' not found")
        return product

    def create(self, db: Session, product_in: ProductCreate):
        # 1. Validate Category if provided
        if product_in.category_id:
            category = category_repo.get_by_id(db, product_in.category_id)
            if not category:
                raise HTTPException(
                    status_code=404,
                    detail=f"Category with id {product_in.category_id} not found."
                )
            if not category.active:
                raise HTTPException(
                    status_code=400,
                    detail=f"Category '{category.name}' (id: {product_in.category_id}) is inactive."
                )

        # 2. Check for duplicate slug or SKU if provided
        if product_in.slug:
            existing_slug = product_repo.get_by_slug(db, product_in.slug)
            if existing_slug:
                raise HTTPException(status_code=400, detail=f"Product slug '{product_in.slug}' already exists")
        if product_in.sku:
            existing_sku = product_repo.get_by_sku(db, product_in.sku)
            if existing_sku:
                raise HTTPException(status_code=400, detail=f"Product SKU '{product_in.sku}' already exists")

        return product_repo.create(db, product_in)

    def update(self, db: Session, product_id: int, product_in: ProductUpdate):
        # 1. Verify product exists
        product = product_repo.get_by_id(db, product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with id {product_id} not found")

        # 2. If updating category_id, validate it
        if product_in.category_id is not None:
            category = category_repo.get_by_id(db, product_in.category_id)
            if not category:
                raise HTTPException(
                    status_code=404,
                    detail=f"Category with id {product_in.category_id} not found."
                )

        updated = product_repo.update(db, product_id, product_in)
        if not updated:
            raise HTTPException(status_code=404, detail="Product not found")
        return updated

    def delete(self, db: Session, product_id: int):
        product = product_repo.get_by_id(db, product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with id {product_id} not found")
        success = product_repo.delete(db, product_id)
        if not success:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"status": "success", "message": f"Product '{product['name']}' deleted successfully"}

product_service = ProductService()
