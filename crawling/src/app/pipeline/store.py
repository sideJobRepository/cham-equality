from sqlalchemy import func

from app.core.db import daily_report, engine
from app.pipeline.schemas import SummaryResult


def save(summary_result: SummaryResult) -> None:
    crawl_result = summary_result.refine_result.crawl_result

    stmt = daily_report.insert().values(
        ORIGIN_TITLE=crawl_result.title,
        ORIGIN_URL=crawl_result.origin_url,
        REFINED_HTML=summary_result.refine_result.refined_html,
        SUMMARY=summary_result.summary,
        CREATE_DATE=func.now(),
        MODIFY_DATE=func.now(),
    )

    with engine.begin() as conn:    
        conn.execute(stmt)
