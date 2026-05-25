from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    MetaData,
    String,
    Table,
    Text,
    create_engine,
)

from app.core.config import settings

_DB_URI = (
    f"mysql+pymysql://{settings.db_username}:{settings.db_password}"
    f"@{settings.db_url}:{settings.db_port}/{settings.db_name}?charset=utf8mb4"
)

engine = create_engine(_DB_URI, pool_pre_ping=True, future=True)

metadata = MetaData()

daily_report = Table(
    "DAILY_REPORT",
    metadata,
    Column("DAILY_REPORT_ID", BigInteger, primary_key=True, autoincrement=True),
    Column("DAILY_REPORT_TITLE", String(255), nullable=False, unique=True),
    Column("DAILY_REPORT_ORIGIN_URL", Text, nullable=False),
    Column("DAILY_REPORT_REFINED_HTML", Text, nullable=False),
    Column("DAILY_REPORT_SUMMARY", Text, nullable=False),
    Column("CREATE_DATE", DateTime, nullable=False),
    Column("MODIFY_DATE", DateTime, nullable=False),
)
