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
                with page.expect_download() as dl:                  
                    page.get_by_text(".hwp").click()
                download = dl.value
                save_path = DOWNLOAD_DIR / download.suggested_filename
                download.save_as(save_path)
            except Exception as e:
                logger.warning(f'[safe대전] 게시글 {latest_post.inner_text()} 다운로드 실패')

            print(latest_post)
        except Exception as e:
            logger.warning(f'[safe대전] 게시글 {latest_post.inner_text()} 처리 실패')



        """
        selector = 'table.board_list tbody tr td.title a'
        count = page.locator(selector).count()

        for i in range(count):
            try:
                buttons = page.locator(selector)  # 루프 안에서 재탐색
                button = buttons.nth(i)
                button.click()
                page.wait_for_load_state("networkidle")

                pdf_link = page.get_by_role("link", name=".pdf")

                href = pdf_link.get_attribute("href")

                text = pdf_link.inner_text().strip()
                idx = text.rfind('.pdf')
                filename = text[:idx + 4]

                pdf_url = f'https://www.daedeok.go.kr{href}'

                response = context.request.get(pdf_url, timeout=TIMEOUT)

                save_path = DOWNLOAD_DIR / filename

                downloaded = download_file_if_not_exists(save_path, lambda: save_path.write_bytes(response.body()))

                if downloaded:
                    saved_paths.append(save_path)
            except Exception as e:
                logger.warning('[대덕구] 게시글 %d/%d 처리 실패 (skip): %s', i+1, count, e)
            finally:
                try:
                    page.go_back()
                except Exception:
                    pass
        """
        
        browser.close()

    return saved_paths


if __name__ == '__main__':
    downloads_safe_daejeon_daily_report()