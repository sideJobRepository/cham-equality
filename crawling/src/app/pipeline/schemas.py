from enum import Enum
from typing import Optional

from pydantic import BaseModel


class CrawlStatus(str, Enum):
    NEW = "NEW"
    ALREADY_DONE = "ALREADY_DONE"

class CrawlResult(BaseModel):
    status: CrawlStatus
    title: str
    origin_url: Optional[str] = None
    html_content: Optional[str] = None

class RefineResult(BaseModel):
    crawl_result: CrawlResult
    refined_html: str

class SummaryResult(BaseModel):
    refine_result: RefineResult
    summary: str
