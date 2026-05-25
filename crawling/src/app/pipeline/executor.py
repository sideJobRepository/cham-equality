from app.pipeline.crawl import downloads_safe_daejeon_daily_report
from app.pipeline.refine import refine
from app.pipeline.summary import extract
from app.pipeline.schemas import SummaryResult


def execute() -> SummaryResult:
    crawl_result = downloads_safe_daejeon_daily_report()
    refine_result = refine(crawl_result)
    summary_result = extract(refine_result)
    return summary_result


if __name__ == '__main__':
    print(execute().summary)
