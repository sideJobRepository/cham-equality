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
    "DAILY_DISASTER_SAFETY_SUMMARY",
    metadata,
    Column("SUMMARY_ID", BigInteger, primary_key=True, autoincrement=True),
    Column("ORIGIN_TITLE", String(255), nullable=False, unique=True),
    Column("ORIGIN_URL", Text, nullable=False),
    Column("REFINED_HTML", Text, nullable=False),
    Column("SUMMARY", Text, nullable=False),
    Column("CREATE_DATE", DateTime, nullable=False),
    Column("MODIFY_DATE", DateTime, nullable=False),
)
