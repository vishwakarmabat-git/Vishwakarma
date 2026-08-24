from sqlalchemy.orm import Session
from app.models.category import Category
from app.models.product import Product
from app.schemas.category import CategoryCreate, CategoryUpdate
from typing import List, Optional
import re

class CategoryRepository:
    def get_by_id(self, db: Session, category_id: int) -> Optional[Category]:
        return db.query(Category).filter(Category.id == category_id).first()

    def get_by_slug(self, db: Session, slug: str) -> Optional[Category]:
        return db.query(Category).filter(Category.slug == slug).first()

    def get_all(self, db: Session, active_only: bool = True, skip: int = 0, limit: int = 100) -> List[Category]:
        query = db.query(Category)
        if active_only:
            query = query.filter(Category.active == True)
        return query.order_by(Category.display_order.asc(), Category.id.asc()).offset(skip).limit(limit).all()

    def count_products(self, db: Session, category_id: int) -> int:
        return db.query(Product).filter(Product.category_id == category_id).count()

    def create(self, db: Session, category_in: CategoryCreate) -> Category:
        slug = category_in.slug
        if not slug:
            slug = re.sub(r'[\s_]+', '-', category_in.name.lower().strip())
            slug = re.sub(r'[^\w-]', '', slug)
        
        # Ensure unique slug
        base_slug = slug
        counter = 1
        while db.query(Category).filter(Category.slug == slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        db_category = Category(
            name=category_in.name,
            slug=slug,
            description=category_in.description,
            banner_image=category_in.banner_image,
            display_order=category_in.display_order,
            active=category_in.active
        )
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category

    def update(self, db: Session, category_id: int, category_in: CategoryUpdate) -> Optional[Category]:
        db_category = self.get_by_id(db, category_id)
        if not db_category:
            return None
        
        data = category_in.model_dump(exclude_unset=True)
        if "slug" in data and data["slug"]:
            slug = data["slug"]
            existing = db.query(Category).filter(Category.slug == slug, Category.id != category_id).first()
            if existing:
                raise ValueError("Slug already in use by another category")
            db_category.slug = slug

        for field, val in data.items():
            if field != "slug" and hasattr(db_category, field):
                setattr(db_category, field, val)

        db.commit()
        db.refresh(db_category)
        return db_category

    def delete(self, db: Session, category_id: int) -> bool:
        db_category = self.get_by_id(db, category_id)
        if not db_category:
            return False
        db.delete(db_category)
        db.commit()
        return True

category_repo = CategoryRepository()

