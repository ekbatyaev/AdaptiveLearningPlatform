import os
import json
import openai
from pathlib import Path
from typing import Dict
from dotenv import load_dotenv
from .sub_functions import extract_json_text

ENV_PATH = Path(".env")

load_dotenv()

api_key = os.getenv("YANDEX_CLOUD_API_KEY")
base_url = os.getenv("YANDEX_BASE_URL")
folder_id = os.getenv("YANDEX_PROJECT_ID")
model = os.getenv("MODEL_NAME")

JSON_SCHEMA = {
    "name": "ai-professor",
    "strict": True,
    "schema": {
        "type": "string",
        "title": "Answer",
        "answer": "Ответ нейросети",
        "additionalProperties": False
        }
}

SYSTEM_PROMPT = \
"""
Ты — терпеливый учитель, который объясняет сложные вещи простыми словами. 
Используешь аналогии из жизни, проверяешь понимание и адаптируешься под уровень ученика. 
Обязательно возвращай ответ в указанном ниже формате, он должен состоять ТОЛЬКО ИЗ ТЕКСТА.

Как объяснять:

1. Структура ответа:

```
-**Суть** (одно предложение)
-**Как работает** (простая аналогия)
-**Пример из жизни**
-**Как применить**
-**Проверка понимания** (один вопрос)
```

2. Три уровня объяснения:

```
-Уровень 1: "Это похоже на..." (простая аналогия)
-Уровень 2: Конкретный пример с шагами
-Уровень 3: Детали (если попросят)
```
3. Адаптация:

```
-Объясняй на языке ученика
-Делай четкую и понятную структуру темы
```

Методы объяснения (выбирай 1-2):

-Метод Фейнмана: Объясни как 12-летнему
-История-аналогия: "Представь, что..."
-Шаг за шагом: Разбей на микро-действия
-Сравнение: "Это как Х, но отличается тем-то"

Пример объяснения:

Вопрос: "Что такое блокчейн?"

Ответ:

🎯 **Суть:** Цифровой дневник, который все видят, но никто не может подделать.

🔄 **Как работает:**
Представь класс, где все ведут один конспект. 
1. Кто-то добавляет новую запись
2. Все проверяют её
3. Если всё верно — запись добавляется у всех
4. Прежние записи нельзя изменить

📊 **Пример:** Как реестр квартир — все знают, кто владелец, и это нельзя скрыть.

🛠️ **Применение:** Криптовалюты, документооборот, голосования.

❓ **Проверка:** Если бы блокчейн был библиотекой, кто бы был библиотекарем?

НИ В КОЕМ СЛУЧАЙ НЕ ДЕЛАЙ:
-Не сыпь терминами без объяснения
-Не перегружай информацией
-Не оставляй без обратной связи

ФОРМАТ ОТВЕТА:

```
{"answer": "..."
```
"""
def learning_with_llm_request(user_request, theme_name, additional_info, old_context) -> Dict:
    client = openai.OpenAI(
        api_key=api_key,
        base_url=base_url,
        project=folder_id
    )

    response = client.responses.create(
            model=f"gpt://{folder_id}/{model}/rc",
            instructions=SYSTEM_PROMPT,
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": (
                                f"""
                                Ответ пользователя: 
                                
                                ```
                                {user_request}
                                ```
                                Название темы урока:
                                
                                ```
                                {theme_name}
                                ```
                                Описание темы урока:
                                
                                ```
                                {additional_info}
                                ```
                                
                                Контекст общения:
                                
                                ```
                                {old_context}
                                ```
                                """
                            )
                        }
                    ],
                }
            ],
            extra_body={
                "json_schema": JSON_SCHEMA,
            },
        )

    raw_output = response.output_text or ""
    json_text = extract_json_text(raw_output)
    try:
        parsed = json.loads(json_text)
        return parsed

    except json.JSONDecodeError as error:
        print(
            f"Полученный ответ не соответствует JSON-схеме: {error}\nТекст ответа:\n{json_text}"
        )
        return {"error": True}

if __name__ == "__main__":
    print(learning_with_llm_request(user_request="", theme_name="Основы синтаксиса Python", additional_info="Изучение основных элементов синтаксиса Python: переменные, операторы, условия, циклы. Приобретение навыков написания простых программ.", old_context = ""))