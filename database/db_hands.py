from sqlalchemy import select, exists
from datetime import datetime

from db_models import (
    Topic, TopicDependency, UserTopicProgress
)


def get_available_topics(session, user_id: int):
    subq = (
        select(1)
        .select_from(TopicDependency)
        .join(
            UserTopicProgress,
            (UserTopicProgress.topic_id == TopicDependency.from_topic_id) &
            (UserTopicProgress.user_id == user_id),
            isouter=True
        )
        .where(
            TopicDependency.to_topic_id == Topic.id,
            (UserTopicProgress.status != "completed") |
            (UserTopicProgress.status.is_(None))
        )
    )

    stmt = select(Topic).where(~exists(subq))
    return session.scalars(stmt).all()


def complete_topic(session, user_id: int, topic_id: int):
    progress = session.get(
        UserTopicProgress, (user_id, topic_id)
    )

    if not progress:
        raise ValueError("Topic not available for user")

    progress.status = "completed"
    progress.completed_at = datetime.utcnow()
    session.commit()