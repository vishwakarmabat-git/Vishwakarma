from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.repositories.category_repository import category_repo
from app.repositories.product_repository import product_repo

class CategoryService:
    def get_all(self, db: Session, active_only: bool = True, skip: int = 0, limit: int = 100):
        return category_repo.get_all(db, active_only=active_only, skip=skip, limit=limit)

    def get_by_id(self, db: Session, category_id: int):
        cat = category_repo.get_by_id(db, category_id)
        if not cat:
            raise HTTPException(status_code=404, detail=f"Category with id {category_id} not found")
        return cat

    def get_by_slug(self, db: Session, slug: str):
        cat = category_repo.get_by_slug(db, slug)
        if not cat:
            raise HTTPException(status_code=404, detail=f"Category with slug '{slug}' not found")
        return cat

    def get_category_products(self, db: Session, category_id: int, skip: int = 0, limit: int = 100):
        # Validate category exists
        self.get_by_id(db, category_id)
        return product_repo.get_all(db, category_id=category_id, skip=skip, limit=limit)

    def create(self, db: Session, category_in: CategoryCreate):
        if category_in.slug:
            existing = category_repo.get_by_slug(db, category_in.slug)
            if existing:
                raise HTTPException(status_code=400, detail=f"Category slug '{category_in.slug}' is already registered")
        return category_repo.create(db, category_in)

    def update(self, db: Session, category_id: int, category_in: CategoryUpdate):
        try:
            updated = category_repo.update(db, category_id, category_in)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        if not updated:
            raise HTTPException(status_code=404, detail=f"Category with id {category_id} not found")
        return updated

    def delete(self, db: Session, category_id: int):
        cat = category_repo.get_by_id(db, category_id)
        if not cat:
            raise HTTPException(status_code=404, detail=f"Category with id {category_id} not found")

        prod_count = category_repo.count_products(db, category_id)
        if prod_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete category '{cat.name}': {prod_count} product(s) belong to this category. Please reassign or delete the products first."
            )

        success = category_repo.delete(db, category_id)
        if not success:
            raise HTTPException(status_code=404, detail="Category not found")
        return {"status": "success", "message": f"Category '{cat.name}' deleted successfully"}

category_service = CategoryService()

