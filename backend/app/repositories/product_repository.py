

from sqlalchemy.orm import Session
from app.models.product import Product, ProductImage, ProductSpec, InventoryVariant
from app.models.category import Category
from app.schemas.product import ProductCreate, ProductUpdate
from typing import List, Optional, Dict, Any
import re
import uuid

class ProductRepository:
    def _format_product(self, product: Product) -> Optional[Dict[str, Any]]:
        if not product:
            return None

        images_list = [img.image_url for img in product.images] if product.images else []
        specs_dict = {s.spec_name: s.spec_value for s in product.specs} if product.specs else {}

        weights = []
        handles = []
        if product.variants:
            for v in product.variants:
                if v.weight_range and v.weight_range not in weights:
                    weights.append(v.weight_range)
                if v.handle_type and v.handle_type not in handles:
                    handles.append(v.handle_type)

        tags_list = [s.strip() for s in (product.short_description or "").split(",") if s.strip()] if product.short_description else []

        return {
            "id": product.id,
            "category_id": product.category_id,
            "sku": product.sku,
            "name": product.name,
            "slug": product.slug,
            "short_description": product.short_description,
            "long_description": product.long_description,
            "price": float(product.price) if product.price is not None else 0.0,
            "compare_price": float(product.compare_price) if product.compare_price is not None else None,
            "gst_percentage": float(product.gst_percentage) if product.gst_percentage is not None else 12.0,
            "stock": int(product.stock) if product.stock is not None else 0,
            "grade": product.grade,
            "pressing": product.pressing,
            "video_url": product.video_url,
            "is_featured": bool(product.is_featured),
            "is_bestseller": bool(product.is_bestseller),
            "status": product.status or "active",
            "seo_title": product.seo_title,
            "seo_description": product.seo_description,
            "images": images_list,
            "specs": specs_dict,
            "variants": {
                "weights": weights,
                "handles": handles
            } if (weights or handles) else None,
            "tags": tags_list,
            "created_at": product.created_at,
            "updated_at": product.updated_at
        }

    def get_by_id(self, db: Session, product_id: int) -> Optional[Dict[str, Any]]:
        p = db.query(Product).filter(Product.id == product_id).first()
        return self._format_product(p) if p else None

    def get_by_sku(self, db: Session, sku: str) -> Optional[Product]:
        return db.query(Product).filter(Product.sku == sku).first()

    def get_by_slug(self, db: Session, slug: str) -> Optional[Dict[str, Any]]:
        p = db.query(Product).filter(Product.slug == slug).first()
        return self._format_product(p) if p else None

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
    ) -> List[Dict[str, Any]]:
        query = db.query(Product)
        
        if status:
            query = query.filter(Product.status == status)
        if category_id is not None:
            query = query.filter(Product.category_id == category_id)
        if is_featured is not None:
            query = query.filter(Product.is_featured == is_featured)
        if is_bestseller is not None:
            query = query.filter(Product.is_bestseller == is_bestseller)
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                (Product.name.ilike(search_term)) |
                (Product.short_description.ilike(search_term)) |
                (Product.grade.ilike(search_term)) |
                (Product.sku.ilike(search_term))
            )

        products = query.order_by(Product.id.asc()).offset(skip).limit(limit).all()
        return [self._format_product(p) for p in products]

    def create(self, db: Session, product_in: ProductCreate) -> Dict[str, Any]:
        # Generate slug
        slug = product_in.slug
        if not slug:
            slug = re.sub(r'[\s_]+', '-', product_in.name.lower().strip())
            slug = re.sub(r'[^\w-]', '', slug)
        
        base_slug = slug
        counter = 1
        while db.query(Product).filter(Product.slug == slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        # Generate SKU
        sku = product_in.sku
        if not sku:
            sku = f"VK-{uuid.uuid4().hex[:6].upper()}"
        
        base_sku = sku
        sku_counter = 1
        while db.query(Product).filter(Product.sku == sku).first():
            sku = f"{base_sku}-{sku_counter}"
            sku_counter += 1

        db_product = Product(
            category_id=product_in.category_id,
            sku=sku,
            name=product_in.name,
            slug=slug,
            short_description=product_in.short_description or (", ".join(product_in.tags) if product_in.tags else None),
            long_description=product_in.long_description,
            price=product_in.price,
            compare_price=product_in.compare_price,
            gst_percentage=product_in.gst_percentage or 12.0,
            stock=product_in.stock or 0,
            grade=product_in.grade,
            pressing=product_in.pressing,
            video_url=product_in.video_url,
            is_featured=product_in.is_featured,
            is_bestseller=product_in.is_bestseller,
            status=product_in.status or "active",
            seo_title=product_in.seo_title,
            seo_description=product_in.seo_description
        )
        db.add(db_product)
        db.commit()
        db.refresh(db_product)

        # Attach images
        if product_in.images:
            for idx, img_url in enumerate(product_in.images):
                if img_url and img_url.strip():
                    img = ProductImage(
                        product_id=db_product.id,
                        image_url=img_url.strip(),
                        is_primary=(idx == 0),
                        display_order=idx + 1
                    )
                    db.add(img)

        # Attach specs
        if product_in.specs and isinstance(product_in.specs, dict):
            for k, v in product_in.specs.items():
                if v:
                    sp = ProductSpec(
                        product_id=db_product.id,
                        spec_name=str(k),
                        spec_value=str(v)
                    )
                    db.add(sp)

        # Attach variants
        if product_in.variants and isinstance(product_in.variants, dict):
            weights = product_in.variants.get("weights", [])
            handles = product_in.variants.get("handles", [])
            if weights or handles:
                inv = InventoryVariant(
                    product_id=db_product.id,
                    sku_variant=f"{sku}-STD",
                    weight_range=weights[0] if weights else None,
                    handle_type=handles[0] if handles else None,
                    stock_quantity=product_in.stock or 0,
                    price_adjustment=0.0
                )
                db.add(inv)

        db.commit()
        db.refresh(db_product)
        return self._format_product(db_product)

    def update(self, db: Session, product_id: int, product_in: ProductUpdate) -> Optional[Dict[str, Any]]:
        db_product = db.query(Product).filter(Product.id == product_id).first()
        if not db_product:
            return None

        data = product_in.model_dump(exclude_unset=True)

        # Update scalar fields
        for field in [
            "name", "category_id", "sku", "slug", "short_description", "long_description",
            "price", "compare_price", "gst_percentage", "stock", "grade", "pressing",
            "video_url", "is_featured", "is_bestseller", "status", "seo_title", "seo_description"
        ]:
            if field in data and data[field] is not None:
                setattr(db_product, field, data[field])

        if "tags" in data and data["tags"] is not None:
            db_product.short_description = ", ".join(data["tags"])

        # Update images
        if "images" in data and data["images"] is not None:
            db.query(ProductImage).filter(ProductImage.product_id == db_product.id).delete()
            for idx, img_url in enumerate(data["images"]):
                if img_url and img_url.strip():
                    img = ProductImage(
                        product_id=db_product.id,
                        image_url=img_url.strip(),
                        is_primary=(idx == 0),
                        display_order=idx + 1
                    )
                    db.add(img)

        # Update specs
        if "specs" in data and data["specs"] is not None and isinstance(data["specs"], dict):
            db.query(ProductSpec).filter(ProductSpec.product_id == db_product.id).delete()
            for k, v in data["specs"].items():
                if v:
                    sp = ProductSpec(
                        product_id=db_product.id,
                        spec_name=str(k),
                        spec_value=str(v)
                    )
                    db.add(sp)

        # Update variants
        if "variants" in data and data["variants"] is not None and isinstance(data["variants"], dict):
            db.query(InventoryVariant).filter(InventoryVariant.product_id == db_product.id).delete()
            weights = data["variants"].get("weights", [])
            handles = data["variants"].get("handles", [])
            if weights or handles:
                inv = InventoryVariant(
                    product_id=db_product.id,
                    sku_variant=f"{db_product.sku}-STD",
                    weight_range=weights[0] if weights else None,
                    handle_type=handles[0] if handles else None,
                    stock_quantity=db_product.stock or 0,
                    price_adjustment=0.0
                )
                db.add(inv)

        db.commit()
        db.refresh(db_product)
        return self._format_product(db_product)

    def delete(self, db: Session, product_id: int) -> bool:
        db_product = db.query(Product).filter(Product.id == product_id).first()
        if not db_product:
            return False
        db.delete(db_product)
        db.commit()
        return True

product_repo = ProductRepository()


