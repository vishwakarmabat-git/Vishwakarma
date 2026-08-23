from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.schemas.category import CategoryCreate
from app.repositories.category_repository import category_repo

class CategoryService:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100):
        return category_repo.get_all_active(db, skip=skip, limit=limit)

    def create(self, db: Session, category_in: CategoryCreate):
        existing = category_repo.get_by_slug(db, category_in.slug)
        if existing:
            raise HTTPException(status_code=400, detail="Slug already registered")
        return category_repo.create(db, category_in)

    def update(self, db: Session, category_id: int, category_in: CategoryCreate):
        updated = category_repo.update(db, category_id, category_in)
        if not updated:
            raise HTTPException(status_code=404, detail="Category not found")
        return updated

    def delete(self, db: Session, category_id: int):
        success = category_repo.delete(db, category_id)
        if not success:
            raise HTTPException(status_code=404, detail="Category not found")
        return {"status": "success", "message": "Deleted successfully"}

category_service = CategoryService()
