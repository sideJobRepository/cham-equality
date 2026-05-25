import io
import json
from google.genai import types, errors
from google import genai
from pathlib import Path
from app.core.config import settings
from app.core.exceptions import GeminiApiError
from app.core.paths import GENERATED, RESOURCES


GEMINI_MODEL = settings.gemini_model

client = genai.Client(api_key=settings.gemini_api_key)

def extract(file_path: Path):

    try:
        return _query_llm_extract_hwpx(file_path)
    except errors.APIError as e:
        raise GeminiApiError(e.code, e.message) from e


def _query_llm_extract_hwpx(file_path: Path) -> str:

    prompt = """
    이 html 파일에서 재난안전 활동상황 내용을 요약해줘.
    """

    # 파일명 한글 그대로 넘기면 오류 발생해서 아래와 같이 upload 생성
    with open(file_path, 'rb') as f:
        uploaded = client.files.upload(
            file=io.BytesIO(f.read()),
            config={'mime_type': 'text/html', 'display_name': 'doc.html'}
        )

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[uploaded, prompt]
        )

    return response.text


if __name__ == '__main__':
    file_path = GENERATED / 'refine/refined2.html'
    print(extract(file_path))

    print()