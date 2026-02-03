from sqlalchemy.orm import Session
from connection_to_db import SessionLocal


def get_db() -> Session:
    """
    Dependency для получения сессии базы данных
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()