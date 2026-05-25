import logging
from playwright.sync_api import sync_playwright
from sqlalchemy import select

from app.core.db import daily_report, engine
from app.core.paths import GENERATED
from app.pipeline.schemas import CrawlResult, CrawlStatus

SAFE_DAEJEON_DAILY_REPORT_BOARD_URL = 'https://www.daejeon.go.kr/saf/board/boardNormalList.do?boardId=safboard002&menuSeq=1269'
TIMEOUT = 30_000  # 30초


logger = logging.getLogger(__name__)



def crawl_safe_daejeon_recent_daily_report() -> CrawlResult:
    DOWNLOAD_DIR = GENERATED / 'crawling'
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            context = browser.new_context()
            page = context.new_page()
            page.set_default_timeout(TIMEOUT)
            page.set_default_navigation_timeout(TIMEOUT)
            page.goto(SAFE_DAEJEON_DAILY_REPORT_BOARD_URL)

            latest_post = page.get_by_text("일일 재난안전관리 상황").first
            title = latest_post.inner_text().strip()

            if _already_processed(title):
                logger.info("이미 처리된 게시물입니다. title=%s", title)
                return CrawlResult(status=CrawlStatus.ALREADY_DONE, title=title)

            latest_post.click()
            page.wait_for_load_state("networkidle")

            with page.expect_popup() as popup_info:
                page.get_by_alt_text("미리보기").first.click()
            popup = popup_info.value
            popup.wait_for_load_state("networkidle")

            iframe_el = popup.wait_for_selector("iframe")
            frame = iframe_el.content_frame()
            frame.wait_for_load_state("networkidle")

            origin_url = popup.url
            html_content = frame.content()

            popup.close()

            return CrawlResult(
                status=CrawlStatus.NEW,
                title=title,
                origin_url=origin_url,
                html_content=html_content,
            )
        finally:
            browser.close()


def _already_processed(title: str) -> bool:
    stmt = select(daily_report.c.SUMMARY_ID).where(
        daily_report.c.ORIGIN_TITLE == title
    )
    with engine.connect() as conn:
        return conn.execute(stmt).first() is not None


if __name__ == '__main__':
    crawl_safe_daejeon_recent_daily_report()
