from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserLogin, Token, User
from app.core.database import get_db
from app.services.auth_service import auth_service

router = APIRouter()

from app.core.dependencies import get_current_active_user

@router.post("/register", response_model=User)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    return auth_service.register_user(db, user)

@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    return auth_service.login_user(db, user)

@router.get("/me", response_model=User)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user
