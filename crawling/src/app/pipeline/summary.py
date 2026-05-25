from google.genai import  errors
from google import genai
from app.core.config import settings
from app.core.exceptions import GeminiApiError
from app.core.paths import GENERATED, RESOURCES
from app.pipeline.schemas import RefineResult, SummaryResult


GEMINI_MODEL = settings.gemini_model

client = genai.Client(api_key=settings.gemini_api_key)

def extract(refine_result: RefineResult) -> SummaryResult:    

    try:
        summary =  _query_llm_summary_report(refine_result.refined_html)
        return SummaryResult(refine_result=refine_result, summary=summary)
    except errors.APIError as e:
        raise GeminiApiError(e.code, e.message) from e


def _query_llm_summary_report(html_content: str) -> str:

    prompt = f"""
    이 html 파일에서 재난안전 활동상황 내용을 요약해줘.

    {html_content}
    """

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=[prompt]
    )

    return response.text