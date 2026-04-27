from sqlalchemy import (
    Column, Integer, String, ForeignKey,
    DateTime, CheckConstraint, JSON
)
from sqlalchemy.orm import relationship
from datetime import datetime
from .connection_to_database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    achievements_count = Column(Integer, default=0)
    last_used = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_themes = Column(JSON)
    # Связи
    created_topics = relationship("Topic", back_populates="creator")

    __table_args__ = (
        CheckConstraint('length(username) >= 3', name='username_min_length'),
    )


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(String(1000))
    data_json = Column(JSON)  # JSON поле для дополнительных данных
    created_at = Column(DateTime, default=datetime.utcnow)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))

    # Связи
    creator = relationship("User", back_populates="created_topics")

    # Индексы для оптимизации
    __table_args__ = (
        CheckConstraint('length(title) > 0', name='title_non_empty'),
    )