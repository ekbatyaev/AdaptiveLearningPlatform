import os
import json
import openai
from pathlib import Path
from typing import Dict
from dotenv import load_dotenv

from app.llm.sub_functions import extract_json_text

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
        "type": "object",
        "properties": {
            "answer": {
                "type": "string",
                "title": "Answer",
                "description": "Ответ нейросети"
            }
        },
        "required": ["answer"],
        "additionalProperties": False
    }
}

SYSTEM_PROMPT = \
    """
    Ты — профессиональный преподаватель и наставник для студентов
    Твоя задача — отвечать на вопросы студента и улучшать его понимание
    
    ВАЖНО:
    — Отвечай на вопросы пользователя, опираясь на прошлые сообщения
    — Каждая новая мысль должна быть визуально отделена
    — Используй подзаголовки
    — Делай логические отступы между блоками
    — Не пиши «простыню текста»
    — Один абзац = одна мысль
    — Не забывай про отступы
    
    ПРАВИЛА ОБЪЯСНЕНИЯ:
    
    — Пиши взрослым, но понятным языком  
    — Не используй термин без пояснения  
    — Не усложняй, если можно сказать проще  
    
    НИКОГДА:
    
    — Не пиши сплошной текст без структуры  
    — Не перегружай формулами без объяснения  
    — Не пропускай блок проверки понимания  
    — Не смешивай несколько разных идей в одном абзаце  
    
    ФОРМАТИРОВАНИЕ:
    
    — Заголовки выделяй **жирным**
    — Новая мысль → новый абзац
    — Шаги → каждый с новой строки
    — Не делай огромных абзацев
    — Делай текст легко сканируемым
    — Не бойся использовать эмодзи для выделения
    — Не забывай про отступы
    
    ФОРМАТ ОТВЕТА — строго одна строка внутри JSON:
    
    ```
    {"answer": "..."}
    ```
    """


def chatting_with_user(user_request, theme_name, additional_info, old_context) -> Dict:
    client = openai.OpenAI(
        api_key=api_key,
        base_url=base_url,
        project=folder_id
    )

    response = client.responses.create(
        model=f"gpt://{folder_id}/{model}",
        instructions=SYSTEM_PROMPT,
        input=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": (
                            f"""
                                Сообщение пользователя: 

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

                                История общения:

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
    text_json = chatting_with_user(user_request="Я могу записать имя человека в тип данных int?",
                                          theme_name="Основы синтаксиса Python",
                                          additional_info="Изучение основных элементов синтаксиса Python: переменные, операторы, условия, циклы. Приобретение навыков написания простых программ.",
                                          old_context="Вопрос пользователя: Что такое синтаксис?. Ответ AI: '📌 Суть: Синтаксис Python — это набор правил, определяющих структуру и порядок написания программ на этом языке.\n\n💡 Интуитивное понимание: Представьте, что вы строите дом из блоков. Каждый блок — это элемент языка, а синтаксис — инструкция по их соединению.\n\n⚙️ Как это работает (пошагово):\n- Сначала вы определяете переменные, в которых будете хранить данные.\n- Затем используете операторы для выполнения операций с данными.\n- После этого применяете условия для принятия решений в программе.\n- Наконец, используете циклы для повторения действий.\n\n🔍 Конкретный пример: Напишите программу, которая выводит на экран приветствие, если пользователь вводит своё имя.\n\n🚀 Где это применяется: Синтаксис Python используется для разработки веб-приложений, анализа данных, машинного обучения и многих других областей IT.\n\n⚠️ Типичные ошибки и заблуждения: Часто путают переменные с константами или операторы с функциями.\n\n✅ Проверка понимания: Какие типы данных вы можете использовать в Python для хранения имени пользователя?\n'")
    print(text_json)