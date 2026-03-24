# 📦 파일 업로드 (S3 Presigned URL)

## 📌 API 정보

아래 API로 Presigned URL을 요청하면 S3에 직접 업로드할 수 있습니다.

POST /api/presigned-url
Content-Type: application/json


---

## 📤 요청 예시
```json
{
  "fileType": "NOTICE",
  "files": [
    {
      "fileName": "test1.png",
      "contentType": "image/png",
      "fileSize": 123456
    },
    {
      "fileName": "test2.jpg",
      "contentType": "image/jpeg",
      "fileSize": 234567
    }
  ]
}
```

## 📤 응답 예시
```json
[
  {
    "url": "https://...",
    "objectKey": "uuid1.png",
    "fileName": "test1.png"
  },
  {
    "url": "https://...",
    "objectKey": "uuid2.jpg",
    "fileName": "test2.jpg"
  }
]
```


🚀 프론트 사용 방법

```javascript
const files = [...input.files];

// 1. Presigned URL 요청
const presignedList = await fetch("/api/presigned-url", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    files: files.map(f => ({
      fileName: f.name,
      contentType: f.type,
      fileSize: f.size
    }))
  })
}).then(res => res.json());

// 2. S3 업로드 (인덱스 기준 매칭)
await Promise.all(
  presignedList.map((p, i) => {
    return fetch(p.url, {
      method: "PUT",
      body: files[i],
      headers: {
        "Content-Type": files[i].type
      }
    });
  })
);
```