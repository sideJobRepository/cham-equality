import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from fastapi import FastAPI
from datetime import datetime

from app.pipeline.executor import execute

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(
        execute,
        trigger=IntervalTrigger(hours=1),
        id="safe_daejeon_daily_report",
        max_instances=1,
        coalesce=True,
        next_run_time=datetime.now(),
    )
    scheduler.start()
    logger.info("safe 대전 일일 재난안전관리 상황 크롤링 시작")
    try:
        yield
    finally:
        scheduler.shutdown(wait=False)


app = FastAPI(lifespan=lifespan)
