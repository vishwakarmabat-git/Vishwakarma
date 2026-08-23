from sqlalchemy.orm import Session
from app.models.category import Category
from app.schemas.category import CategoryCreate
from typing import List

class CategoryRepository:
    def get_by_slug(self, db: Session, slug: str) -> Category | None:
        return db.query(Category).filter(Category.slug == slug).first()

    def get_all_active(self, db: Session, skip: int = 0, limit: int = 100) -> List[Category]:
        return db.query(Category).filter(Category.active == True).offset(skip).limit(limit).all()

    def create(self, db: Session, category_in: CategoryCreate) -> Category:
        db_category = Category(**category_in.model_dump())
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category

    def update(self, db: Session, category_id: int, category_in: CategoryCreate) -> Category | None:
        db_category = db.query(Category).filter(Category.id == category_id).first()
        if not db_category:
            return None
        for var, value in vars(category_in).items():
            setattr(db_category, var, value) if value is not None else None
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category

    def delete(self, db: Session, category_id: int) -> bool:
        db_category = db.query(Category).filter(Category.id == category_id).first()
        if not db_category:
            return False
        db.delete(db_category)
        db.commit()
        return True

category_repo = CategoryRepository()
