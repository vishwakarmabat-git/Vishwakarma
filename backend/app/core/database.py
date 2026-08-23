from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

def get_db_url(url: str) -> str:
    if url.startswith("mysql://"):
        return url.replace("mysql://", "mysql+pymysql://")
    if url.startswith("postgres://") or url.startswith("postgresql://"):
        return url.replace("postgres://", "postgresql+psycopg2://").replace("postgresql://", "postgresql+psycopg2://")
    return url

db_url = get_db_url(settings.SQLALCHEMY_DATABASE_URI)
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = create_engine(
    db_url, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
