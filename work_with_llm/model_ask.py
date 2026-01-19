import os
import json
import openai
from pathlib import Path
from typing import Dict
from dotenv import load_dotenv

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


def extract_json_text(raw_text: str) -> str:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.split("\n", 1)[-1]
    if cleaned.endswith("```"):
        cleaned = cleaned.rsplit("\n", 1)[0]
    return cleaned.strip()

def request_to_model(user_request, old_context = "") -> Dict:
    client = openai.OpenAI(
        api_key=api_key,
        base_url=base_url,
        project=folder_id
    )

    response = client.responses.create(
            model=f"gpt://{folder_id}/{model}/rc",
            instructions=(
                "Ты — учитель по математике. Ты должен объясни четко и понятно выбранную учеником тему и ответить на его вопросы. "
                "Обязательно учитывай прошлый контекст, если он есть"
                "Ответ возвращай строго как JSON c полем answer."
            ),
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": ("Запрос пользователя: " + f"«{user_request}»." + "Прошлый контекст: " f"«{old_context}».")
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
    answer = json.loads(json_text)
    print(answer)

print(request_to_model("Как научиться умножению?"))