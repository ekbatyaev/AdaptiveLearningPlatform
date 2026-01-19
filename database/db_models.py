from sqlalchemy import (
    Column, Integer, String, ForeignKey,
    DateTime, CheckConstraint
)
from sqlalchemy.orm import relationship
from datetime import datetime

from connection_to_db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(String)


class TopicDependency(Base):
    __tablename__ = "topic_dependencies"

    from_topic_id = Column(
        Integer, ForeignKey("topics.id", ondelete="CASCADE"),
        primary_key=True
    )
    to_topic_id = Column(
        Integer, ForeignKey("topics.id", ondelete="CASCADE"),
        primary_key=True
    )


class UserTopicProgress(Base):
    __tablename__ = "user_topic_progress"

    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )
    topic_id = Column(
        Integer, ForeignKey("topics.id", ondelete="CASCADE"),
        primary_key=True
    )
    status = Column(String, nullable=False)
    completed_at = Column(DateTime)

    __table_args__ = (
        CheckConstraint(
            "status IN ('locked', 'available', 'completed')",
            name="status_check"
        ),
    )