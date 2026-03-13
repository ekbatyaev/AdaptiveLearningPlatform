from fastapi import FastAPI, HTTPException, Depends, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import bcrypt
from sqlalchemy import select, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from .table_models import User, Topic
from .connection_to_database import init_db, get_db
from app.llm.theme_learning_requests import learning_with_llm_request
from app.llm.study_program_generating import generate_learning_program
from app.llm.final_theme_assesment_generating import final_theme_test

# Создаем приложение
app = FastAPI(
    title="Learning Topics API",
    description="API для управления пользователями и темами",
    version="1.0.0"
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic модели

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username: str
    password: str

class UserInfoResponse(BaseModel):
    id: int
    username: str
    achievements_count: int
    last_used: datetime

    class Config:
        from_attributes = True

class UserThemeLearning(BaseModel):
    username: str
    password: str
    user_request: str
    theme_name: str
    additional_info: str
    old_context: str

class TopicFinalTest(BaseModel):
    username: str
    password: str
    title: str
    description: str

class UserResponse(BaseModel):
    id: int
    username: str
    achievements_count: int
    last_used: datetime

    class Config:
        from_attributes = True

class TopicCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., max_length=1000)
    data_json: Optional[Dict[str, Any]] = None

    @validator('title')
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()


class TopicUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    data_json: Optional[Dict[str, Any]] = None

    @validator('title')
    def title_not_empty(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip() if v else v


class TopicResponse(BaseModel):
    id: int
    title: str
    description: str
    data_json: Optional[Dict[str, Any]]
    created_at: datetime
    creator_id: Optional[int]
    creator_username: Optional[str] = None

    class Config:
        from_attributes = True


# Зависимости


def get_current_user(username: str = Header(...), password: str = Header(...), db: Session = Depends(get_db)) -> User:
    """
    Получение текущего пользователя по username и password в заголовках.
    """
    user = db.scalar(select(User).where(User.username == username))
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    # обновляем время последнего использования
    user.last_used = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


# Инициализация базы данных при запуске
@app.on_event("startup")
def startup_event():
    """Инициализация при запуске"""
    init_db()
    print("Database initialized")


# Ручки для пользователей

@app.post("/user_register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Регистрация нового пользователя
    """
    # Проверяем, не существует ли уже пользователь с таким логином
    existing_user_by_username = db.scalar(
        select(User).where(User.username == user_data.username)
    )

    if existing_user_by_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    # Хэшируем пароль
    password_hash = bcrypt.hashpw(
        user_data.password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    # Создаем нового пользователя
    new_user = User(
        username=user_data.username,
        password_hash=password_hash,
        last_used=datetime.utcnow()
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}"
        )

    return new_user


@app.post("/user_login", response_model=UserResponse)
def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.username == login_data.username))
    if not user or not bcrypt.checkpw(login_data.password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    # обновляем время последнего использования
    user.last_used = datetime.utcnow()
    db.commit()
    db.refresh(user)

    return user


@app.get("/users/info", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Получение информации о текущем пользователе
    """
    return current_user


@app.get("/users/{user_id}", response_model=UserInfoResponse)
def get_user_by_id(
        user_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Получение информации о пользователе по ID
    Только для аутентифицированных пользователей
    """
    user = db.get(User, user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserInfoResponse(
        id=user.id,
        username=user.username,
        achievements_count=user.achievements_count,
        last_used=user.last_used
    )

# Ручки для тем

@app.post("/get_final_theme_test",  status_code=status.HTTP_201_CREATED)
def get_final_test(
        topic_data: TopicFinalTest,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    current_user.last_used = datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    try:
        model_response = final_theme_test(title = topic_data.title,
                         description = topic_data.description)

    except Exception as e:
        print("Ошибка: ", e)
        return {"model_response": True}

    return model_response


@app.post("/create_topic", response_model=TopicResponse, status_code=status.HTTP_201_CREATED)
def create_topic(
        topic_data: TopicCreate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    try:
        data_json = generate_learning_program(
            title=topic_data.title,
            description=topic_data.description
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Learning program generation failed: {str(e)}"
        )
    """
    Создание новой темы
    """
    new_topic = Topic(
        title=topic_data.title,
        description=topic_data.description,
        data_json=data_json,
        creator_id=current_user.id
    )

    try:
        db.add(new_topic)
        db.commit()
        db.refresh(new_topic)

    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create topic: {str(e)}"
        )

    # Добавляем имя создателя в ответ
    response_dict = {
        "id": new_topic.id,
        "title": new_topic.title,
        "description": new_topic.description,
        "data_json": new_topic.data_json,
        "created_at": new_topic.created_at,
        "creator_id": new_topic.creator_id,
        "creator_username": current_user.username
    }

    return TopicResponse(**response_dict)

@app.post("/theme_learning", status_code=status.HTTP_201_CREATED)
def get_theme_learning_conversation(
        topic_data: UserThemeLearning,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):

    current_user.last_used = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    print("user_request: ", topic_data.user_request)
    print("theme_name: ", topic_data.theme_name)
    print("additional_info: ", topic_data.additional_info)
    print("old_context: ", topic_data.old_context)
    try:
        answer = learning_with_llm_request(user_request = topic_data.user_request, theme_name = topic_data.theme_name,
                                  additional_info = topic_data.additional_info, old_context = topic_data.old_context)
        return answer
    except Exception as e:
        print("Ошибка: ", e)
        return {"model_response": True}


@app.get("/topics", response_model=List[TopicResponse])
def get_all_topics(
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        db: Session = Depends(get_db)
):
    """
    Получение списка всех тем с пагинацией и поиском
    """

    query = select(Topic)

    # Добавляем поиск по названию или описанию
    if search:
        query = query.where(
            or_(
                Topic.title.ilike(f"%{search}%"),
                Topic.description.ilike(f"%{search}%")
            )
        )

    # Сортировка по дате создания
    query = query.order_by(Topic.created_at.desc())

    # Применяем пагинацию
    query = query.offset(skip).limit(limit)

    topics = db.scalars(query).all()

    # Формируем ответ с информацией о создателях
    result = []
    for topic in topics:
        topic_dict = {
            "id": topic.id,
            "title": topic.title,
            "description": topic.description,
            "data_json": topic.data_json,
            "created_at": topic.created_at,
            "creator_id": topic.creator_id,
            "creator_username": None
        }

        if topic.creator:
            topic_dict["creator_username"] = topic.creator.username

        result.append(topic_dict)

    return result


@app.get("/topics/get_info_{topic_id}", response_model=TopicResponse)
def get_topic_by_id(topic_id: int, db: Session = Depends(get_db)):
    """
    Получение информации о конкретной теме по ID
    """
    topic = db.get(Topic, topic_id)

    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )

    topic_dict = {
        "id": topic.id,
        "title": topic.title,
        "description": topic.description,
        "data_json": topic.data_json,
        "created_at": topic.created_at,
        "creator_id": topic.creator_id,
        "creator_username": None
    }

    if topic.creator:
        topic_dict["creator_username"] = topic.creator.username

    return topic_dict


@app.put("/topics/update_{topic_id}", response_model=TopicResponse)
def update_topic(
        topic_id: int,
        topic_data: TopicUpdate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Обновление темы (только создатель может обновлять)
    """
    topic = db.get(Topic, topic_id)

    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )

    # Проверяем права доступа
    if topic.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own topics"
        )

    # Обновляем только переданные поля
    update_data = topic_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(topic, field, value)

    db.commit()
    db.refresh(topic)

    # Обновляем словарь для ответа
    topic_dict = {
        "id": topic.id,
        "title": topic.title,
        "description": topic.description,
        "data_json": topic.data_json,
        "created_at": topic.created_at,
        "creator_id": topic.creator_id,
        "creator_username": current_user.username
    }

    return topic_dict


@app.delete("/topics/delete_{topic_id}")
def delete_topic(
        topic_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Удаление темы (только создатель может удалять)
    """
    topic = db.get(Topic, topic_id)

    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )

    # Проверяем права доступа
    if topic.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own topics"
        )

    db.delete(topic)
    db.commit()

    return {"message": "Topic deleted successfully"}


@app.get("/users/me/topics", response_model=List[TopicResponse])
def get_my_topics(
        current_user: User = Depends(get_current_user),
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
):
    """
    Получение списка тем, созданных текущим пользователем
    """
    topics = db.scalars(
        select(Topic)
        .where(Topic.creator_id == current_user.id)
        .order_by(Topic.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).all()

    result = []
    for topic in topics:
        topic_dict = {
            "id": topic.id,
            "title": topic.title,
            "description": topic.description,
            "data_json": topic.data_json,
            "created_at": topic.created_at,
            "creator_id": topic.creator_id,
            "creator_username": current_user.username
        }
        result.append(topic_dict)

    return result


# Статистика

@app.get("/stats")
def get_statistics(db: Session = Depends(get_db)):
    """
    Получение общей статистики
    """
    from sqlalchemy import func

    # Количество пользователей
    users_count = db.scalar(select(func.count()).select_from(User))

    # Количество тем
    topics_count = db.scalar(select(func.count()).select_from(Topic))

    return {
        "users_count": users_count,
        "topics_count": topics_count,
        "timestamp": datetime.utcnow().isoformat()
    }


# Эндпоинт для проверки здоровья

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Проверка здоровья приложения и базы данных
    """
    try:
        # Проверяем соединение с базой данных
        db.execute(select(1))
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {str(e)}"
        )