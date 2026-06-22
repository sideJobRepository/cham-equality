FROM python:3.14-slim

# uv (의존성 관리)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# 빌드 도구 (3.14용 prebuilt wheel이 없는 패키지는 소스 빌드 — gcc/rust 필요)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl gcc build-essential \
    && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \
    && rm -rf /var/lib/apt/lists/*
ENV PATH="/root/.cargo/bin:${PATH}"

ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_DOWNLOADS=0
ENV PATH="/app/.venv/bin:${PATH}"

WORKDIR /app

# 의존성 먼저 설치 (캐시 활용)
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# 애플리케이션 코드 복사 후 프로젝트 설치
COPY src ./src
COPY resources ./resources
COPY README.md ./
RUN uv sync --frozen --no-dev

# Playwright Chromium + 배포판에 맞는 시스템 라이브러리 설치
RUN playwright install --with-deps chromium \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
