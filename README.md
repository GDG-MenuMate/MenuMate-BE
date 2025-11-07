# MenuMate BE

사용자 입력(카테고리, 필터, 프롬프트)을 받아
적절한 식단/메뉴를 추천하는 백엔드 서버입니다.


## 기술 스택
- **Node.js + Express**
- **Zod** – 요청 데이터 검증
- **dotenv** – 환경 변수 관리
- **CORS** – 클라이언트 요청 허용
- **Nodemon** – 개발용 자동 재시작  


# 폴더 구조 & 역할
src/
┣  server.js # 서버 진입점 (Express 실행, 라우트 포함)
┣  schema.js # 요청 바디 스키마 (Zod 검증)
┣  validate.js # 요청 검증 미들웨어
┗  error.js # 전역 에러 핸들러


# 주요 파일 설명
| 파일 | 역할 |
|------|------|
| `server.js` | Express 앱 실행, `/health`, `/recommend` 라우트 정의 |
| `schema.js` | 요청 데이터 검증 규칙(Zod) 정의 |
| `validate.js` | 스키마 검증 미들웨어 (에러 시 명세서 형식으로 응답) |
| `error.js` | 전역 에러 핸들러 (예외 상황 공통 처리) |



# 실행 방법

1. 의존성 설치
npm install

2. 환경 파일 설정
cp .env.example .env

3. 개발 서버 실행
npm run dev
→ Server running on http://localhost:3000 가 뜨면 성공

4. 확인
http://localhost:3000/health
→ { "ok": true } 응답이 오면 서버 정상 실행 중.


# 에러 응답 형식 (API 명세서 일치)
| 상황 | 예시 응답 |
|------|------|
|카테고리/프롬프트 누락	| { "error": "MISSING_REQUIREMENT", "msg": "카테고리 혹은 프롬프트를 입력해주세요." } |
| 다이어트 선택 시 키·몸무게 누락 | { "error": "MISSING_DIET_TYPE", "msg": "다이어트 식단 선택 시 키, 몸무게 작성이 필수입니다." } |
| 키·몸무게 값 비정상 |	{ "error": "INVALID_DIET_TYPE", "msg": "키, 몸무게 입력 값을 다시 확인해주세요." } |
| 가격 범위(min > max)	| { "error": "INVALID_PRICE_RANGE", "msg": "minPrice는 maxPrice보다 클 수 없습니다." } |


#  협업 가이드
- `A(김가희)`: 사용자 입력 처리 / 검증 / AI 요청 전처리
- `B(최병주)`: AI 응답 가공 / 결과 후처리 / 저장 로직
- `API 명세서`: Notion
- `ERD`: ERDCloud



