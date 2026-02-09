import requests
from pprint import pprint

BASE_URL = "http://127.0.0.1:8000"

USERNAME = "testuser"
PASSWORD = "password123"
API_KEY = "my-secret-api-key-123"  # для регистрации

def main():
    print("\n=== 1️⃣ Регистрация пользователя ===")
    register_payload = {
        "username": USERNAME,
        "password": PASSWORD,
        "api_key": API_KEY
    }
    resp = requests.post(f"{BASE_URL}/register", json=register_payload)
    pprint(resp.json())

    headers = {
        "username": USERNAME,
        "password": PASSWORD
    }

    print("\n=== 2️⃣ Логин пользователя ===")
    login_payload = {
        "username": USERNAME,
        "password": PASSWORD
    }
    resp = requests.post(f"{BASE_URL}/login", json=login_payload)
    pprint(resp.json())

    print("\n=== 3️⃣ Получить информацию о себе ===")
    resp = requests.get(f"{BASE_URL}/users/me", headers=headers)
    pprint(resp.json())

    print("\n=== 4️⃣ Получить свой API ключ ===")
    resp = requests.get(f"{BASE_URL}/users/me/api-key", headers=headers)
    pprint(resp.json())

    print("\n=== 5️⃣ Обновить API ключ ===")
    new_api_key_payload = {"new_api_key": "new-api-key-456"}
    resp = requests.put(f"{BASE_URL}/users/me/api-key", headers=headers, json=new_api_key_payload)
    pprint(resp.json())

    print("\n=== 6️⃣ Создать тему ===")
    topic_payload = {
        "title": "Python Basics",
        "description": "Learn Python from scratch",
        "data_json": {"lessons": 5, "difficulty": "easy"}
    }
    resp = requests.post(f"{BASE_URL}/topics", json=topic_payload, headers=headers)
    topic = resp.json()
    pprint(topic)
    topic_id = topic["id"]

    print("\n=== 7️⃣ Получить все темы ===")
    resp = requests.get(f"{BASE_URL}/topics")
    pprint(resp.json())

    print("\n=== 8️⃣ Получить тему по ID ===")
    resp = requests.get(f"{BASE_URL}/topics/{topic_id}")
    pprint(resp.json())

    print("\n=== 9️⃣ Обновить тему ===")
    update_payload = {
        "title": "Python Basics Updated",
        "description": "Updated description",
    }
    resp = requests.put(f"{BASE_URL}/topics/{topic_id}", json=update_payload, headers=headers)
    pprint(resp.json())

    print("\n=== 🔟 Удалить тему ===")
    resp = requests.delete(f"{BASE_URL}/topics/{topic_id}", headers=headers)
    pprint(resp.json())

    print("\n=== 1️⃣1️⃣ Получить свои темы ===")
    resp = requests.get(f"{BASE_URL}/users/me/topics", headers=headers)
    pprint(resp.json())

    print("\n=== 1️⃣2️⃣ Статистика ===")
    resp = requests.get(f"{BASE_URL}/stats")
    pprint(resp.json())

    print("\n=== 1️⃣3️⃣ Проверка здоровья ===")
    resp = requests.get(f"{BASE_URL}/health")
    pprint(resp.json())


if __name__ == "__main__":
    main()