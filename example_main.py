from app.db import engine, SessionLocal, Base
from app.models import User, Topic, UserTopicProgress
from app.services import get_available_topics

Base.metadata.create_all(engine)

session = SessionLocal()

# demo data
user = User(name="Egor")
session.add(user)
session.commit()

topic1 = Topic(title="Сложение")
topic2 = Topic(title="Умножение")

session.add_all([topic1, topic2])
session.commit()

session.add_all([
    UserTopicProgress(
        user_id=user.id,
        topic_id=topic1.id,
        status="completed"
    ),
    UserTopicProgress(
        user_id=user.id,
        topic_id=topic2.id,
        status="available"
    )
])
session.commit()

topics = get_available_topics(session, user.id)
print([t.title for t in topics])