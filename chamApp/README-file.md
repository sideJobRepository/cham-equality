# 📦 파일 업로드 (S3 Presigned URL)

## 📌 전체 흐름
1. Presigned URL 요청
2. S3 직접 업로드
3. 업로드 완료 후 서버에 파일 정보 저장 (필수)

---

## 1️⃣ Presigned URL 요청

### API
POST /api/presigned-url  
Content-Type: application/json

### 요청 예시
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
    "fileName": "test1.png",
    "bucketName": "your-bucket",
    "contentType": "image/png"
  },
  {
    "url": "https://...",
    "objectKey": "uuid2.jpg",
    "fileName": "test2.jpg",
    "bucketName": "your-bucket",
    "contentType": "image/jpeg"
  }
]
```


🚀 S3 업로드 + 서버 저장 (전체 코드)

```javascript
const files = [...input.files];

// 1. presigned 요청
const presignedList = await fetch("/api/presigned-url", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    fileType: "NOTICE",
    files: files.map(f => ({
      fileName: f.name,
      contentType: f.type,
      fileSize: f.size
    }))
  })
}).then(res => res.json());

// 2. S3 업로드
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

// 3. 서버 저장 (필수)
await fetch("/api/upload-file", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    fileType: "NOTICE",
    files: presignedList.map((p, i) => ({
      fileName: p.fileName,
      contentType: files[i].type,
      fileSize: files[i].size,
      objectKey: p.objectKey,
      bucketName: p.bucketName
    }))
  })
});
```
# 📥 파일 다운로드 (S3 Presigned URL)

## 📌 다운로드 방식

파일 다운로드는 백엔드 서버가 파일 자체를 직접 내려주는 방식이 아닙니다.  
프론트에서 파일 ID로 다운로드 API를 호출하면, 서버가 해당 파일의 Presigned Download URL을 생성하여 반환합니다.  
프론트는 반환받은 URL로 이동하여 S3에서 직접 파일을 다운로드합니다.

즉, 다운로드 흐름은 아래와 같습니다.

1. 프론트에서 파일 ID로 다운로드 API 호출
2. 서버에서 파일 정보 조회
3. 서버에서 S3 Presigned Download URL 생성
4. 서버가 Presigned URL 반환
5. 프론트가 해당 URL로 이동
6. 브라우저가 S3에서 파일 다운로드 수행

---

## 📌 다운로드 API

### 요청
GET /api/download-file/{id}

### Path Variable
- `id`: 다운로드할 파일의 ID

예시:
```http
GET /api/download-file/1
```

응답형식
```json
{
  "code": 200,
  "success": true,
  "data": "https://presigned-download-url..."
}
```