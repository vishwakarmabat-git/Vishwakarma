from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.schemas.user import UserCreate, UserLogin, Token
from app.repositories.user_repository import user_repo
from app.core.security import verify_password, create_access_token

class AuthService:
    def register_user(self, db: Session, user_in: UserCreate):
        existing_user = user_repo.get_by_email(db, user_in.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        return user_repo.create(db, user_in)

    def login_user(self, db: Session, user_in: UserLogin) -> Token:
        user = user_repo.get_by_email(db, user_in.email)
        if not user or not verify_password(user_in.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        access_token = create_access_token(subject=str(user.id))
        return Token(access_token=access_token, token_type="bearer")

auth_service = AuthService()
