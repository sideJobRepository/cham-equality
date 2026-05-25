import logging
import re
from playwright.sync_api import sync_playwright
from urllib.parse import urljoin
from pathlib import Path
from app.core.paths import GENERATED

SAFE_DAEJEON_DAILY_REPORT_BOARD_URL = 'https://www.daejeon.go.kr/saf/board/boardNormalList.do?boardId=safboard002&menuSeq=1269'
TIMEOUT = 30_000  # 30초


logger = logging.getLogger(__name__)

def downloads_safe_daejeon_daily_report():
    DOWNLOAD_DIR = GENERATED / 'crawling'
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

    saved_paths = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        page.set_default_timeout(TIMEOUT)
        page.set_default_navigation_timeout(TIMEOUT)
        page.goto(SAFE_DAEJEON_DAILY_REPORT_BOARD_URL)

        latest_post = page.get_by_text("일일 재난안전관리 상황").first

        try:
            latest_post.click()
            page.wait_for_load_state("networkidle")            

            try:
                with page.expect_popup() as popup_info:
                    page.get_by_alt_text("미리보기").first.click()
                popup = popup_info.value
                popup.wait_for_load_state("networkidle")

                iframe_el = popup.wait_for_selector("iframe")
                frame = iframe_el.content_frame()
                frame.wait_for_load_state("networkidle")

                title = latest_post.inner_text().strip()
                safe_title = re.sub(r'[\\/:*?"<>|\s]+', '_', title)
                save_path = DOWNLOAD_DIR / f'{safe_title}.html'
                save_path.write_text(frame.content(), encoding='utf-8')
                saved_paths.append(save_path)
                popup.close()
            except Exception as e:
                logger.warning(f'[safe대전] 게시글 {latest_post.inner_text()} 다운로드 실패')

            print(latest_post)
        except Exception as e:
            logger.warning(f'[safe대전] 게시글 {latest_post.inner_text()} 처리 실패')

        browser.close()

    return saved_paths


if __name__ == '__main__':
    downloads_safe_daejeon_daily_report()