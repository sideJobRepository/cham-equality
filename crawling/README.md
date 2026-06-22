## 특정 스크립트 실행
uv run src/app/convert/refine.py

## fast api 실행 명령어
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000


## 레지스트리 배포

이미지를 빌드해서 Docker Hub 등 레지스트리에 푸시하는 경우:

```bash
docker build -t cham-eq-crawling .
docker tag cham-eq-crawling peachcoolpis/cham-eq-crawling:latest
docker push peachcoolpis/cham-eq-crawling:latest

리눅스, 맥 호환 이미지 빌드하고 업로드
docker buildx build --platform linux/amd64,linux/arm64 -t peachcoolpis/cham-eq-crawling:latest --push .
```