from pydantic import BaseModel


class CrawlResult(BaseModel):
    origin_url: str
    title: str
    html_content: str

class RefineResult(BaseModel):
    crawl_result: CrawlResult
    refined_html: str

class SummaryResult(BaseModel):
    refine_result: RefineResult
    summary: str

