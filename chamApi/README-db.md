# DB 설계 규칙 (기본 가이드)

## 1. 기본 키 (PK)
- 모든 기본 키는 BIGINT 사용
- Auto Increment 기반으로 관리

예시:
ID BIGINT PRIMARY KEY AUTO_INCREMENT

---

## 2. 숫자 타입
- 일반 숫자: INT
- Boolean (true/false): TINYINT(1)

예시:
COUNT INT
IS_ACTIVE TINYINT(1)

---

## 3. 문자열 타입

### 기본 원칙
- 일반 문자열: VARCHAR(500)
- 길이 제한이 없거나, 에디터(CKEditor 등) 내용 포함 시: TEXT

예시:
TITLE VARCHAR(500)
CONTENT TEXT

### 기준
- 일반 텍스트 → VARCHAR(500)
- 긴 글 / HTML 포함 → TEXT

---

## 4. 날짜 타입 (모든 테이블 필수)

- 모든 테이블에는 아래 컬럼을 반드시 포함한다.
- 생성일: DATETIME DEFAULT CURRENT_TIMESTAMP
- 수정일: DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

예시:
CREATE_DATE DATETIME DEFAULT CURRENT_TIMESTAMP
MODIFY_DATE DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
---

## 5. 네이밍 규칙
- 테이블: 대문자 + 언더스코어 (SNAKE_CASE)
  예: FILE_METADATA
- 컬럼: 대문자 + 언더스코어
  예: FILE_NAME, CREATE_DATE
---

## 6. 한 줄 요약
- PK → BIGINT
- 문자열 → 기본 VARCHAR(500), 긴 글(TEXT)
- 숫자 → INT
- Boolean → TINYINT(1)
- 날짜 → DATETIME