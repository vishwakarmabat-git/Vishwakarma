from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.category import Category
from app.schemas.product import ProductCreate
from typing import List, Optional

class ProductRepository:
    def get_by_sku(self, db: Session, sku: str) -> Product | None:
        return db.query(Product).filter(Product.sku == sku).first()

    def get_by_slug(self, db: Session, slug: str) -> Product | None:
        return db.query(Product).filter(Product.slug == slug).first()

    def get_all_active(self, db: Session, skip: int = 0, limit: int = 100, category_slug: Optional[str] = None) -> List[Product]:
        query = db.query(Product).filter(Product.status == 'active')
        if category_slug:
            category = db.query(Category).filter(Category.slug == category_slug).first()
            if category:
                query = query.filter(Product.category_id == category.id)
        return query.offset(skip).limit(limit).all()

    def create(self, db: Session, product_in: ProductCreate) -> Product:
        db_product = Product(**product_in.model_dump())
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product

    def update(self, db: Session, product_id: int, product_in: ProductCreate) -> Product | None:
        db_product = db.query(Product).filter(Product.id == product_id).first()
        if not db_product:
            return None
        for var, value in vars(product_in).items():
            setattr(db_product, var, value) if value is not None else None
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product

    def delete(self, db: Session, product_id: int) -> bool:
        db_product = db.query(Product).filter(Product.id == product_id).first()
        if not db_product:
            return False
        db.delete(db_product)
        db.commit()
        return True

product_repo = ProductRepository()
