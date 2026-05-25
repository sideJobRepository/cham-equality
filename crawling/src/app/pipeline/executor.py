import logging

from app.pipeline.crawl import crawl_safe_daejeon_recent_daily_report
from app.pipeline.refine import refine
from app.pipeline.schemas import CrawlStatus
from app.pipeline.store import save
from app.pipeline.summary import extract

logger = logging.getLogger(__name__)


def execute() -> None:
    crawl_result = crawl_safe_daejeon_recent_daily_report()

    if crawl_result.status == CrawlStatus.ALREADY_DONE:
        return

    refine_result = refine(crawl_result)
    summary_result = extract(refine_result)
    save(summary_result)
    logger.info("일일 재난안전관리 상황 저장 완료. title=%s", crawl_result.title)


if __name__ == '__main__':
    execute()
