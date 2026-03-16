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
    "name": "ai_program_generator",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "themes": {
                "type": "array",
                "title": "Сгенерированные темы для программы изучения",
                "description": "Массив объектов, каждый из которых представляет собой тему с названием и описанием.",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Название темы."
                        },
                        "description": {
                            "type": "string",
                            "description": "Подробное описание темы, её целей и содержания."
                        }
                    },
                    "required": ["name", "description"],
                    "additionalProperties": False
                }
            }
        },
        "required": ["themes"],
        "additionalProperties": False
    }
}

SYSTEM_PROMPT = \
    """
    Задача: Сгенерируй программу обучения по указанной теме в строго заданном формате JSON.

    Контекст задания:

    Ты — эксперт по созданию образовательных программ и структурированию учебных материалов. 
    Твоя задача — разбить большую тему на логические учебные модули (темы), каждый из которых представляет собой самостоятельный блок для изучения.

    Инструкции по генерации:

    Анализ темы:
    -Изучи предоставленную тему и дополнительную информацию
    -Определи ключевые аспекты, которые необходимо осветить
    -Раздели материал на логические модули от базового к продвинутому
    -Программа должна быть составлена с учетом ДОПОЛНИТЕЛЬНОЙ ИНФОРМАЦИИ

    Требования к темам (модулям):
    -Количество тем: от 5 до 15 (в зависимости от сложности основной темы)
    -Каждая тема должна быть самодостаточной, но логически связанной с другими
    -Темы должны следовать принципу "от простого к сложному"
    -В названии темы должен быть отражен ее суть
    -Описание должно четко объяснять, что изучается в теме, какие навыки/знания приобретаются

    Требования к содержанию:
    -Будь практичным — ориентируйся на применимость знаний
    -Учитывай современные тренды и актуальность информации
    -Подбирай названия тем так, чтобы они были понятны целевой аудитории

    Формат ответа:

    {
      "themes": [
        {
          "name": "Название темы 1",
          "description": "Подробное описание темы, включая ключевые аспекты, которые будут изучены, практические навыки и связи с другими темами."
        },
        {
          "name": "Название темы 2",
          "description": "Аналогичное подробное описание второй темы."
        }
        // ... остальные темы
      ]
    }
    Критерии качества:
    -Логическая последовательность тем
    -Полнота охвата основной темы
    -Практическая ценность каждого модуля
    -Ясность и конкретность описаний
    -Отсутствие дублирования содержания между темами
"""



def generate_learning_program(title, description) -> Dict:
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
                        "text": (f"""
                        ДАННЫЕ ДЛЯ ГЕНЕРАЦИИ:
                                
                        ОСНОВНАЯ ТЕМА: ```{title}```
                        
                        ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ:
                        ```
                        {description}
                        ```""")
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

    parsed = {}
    try:
        parsed = json.loads(json_text)
        return parsed

    except json.JSONDecodeError as error:
        print(
            f"Полученный ответ не соответствует JSON-схеме: {error}\nТекст ответа:\n{json_text}"
        )
        return parsed

if __name__ == "__main__":
    print(generate_learning_program(title = "Python", description = "Хочу изучить этот язык программирования для ЕГЭ"))