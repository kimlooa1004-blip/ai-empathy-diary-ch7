# 작업 계획 — AI 공감 다이어리

오늘 있었던 일을 한 줄로 쓰면, AI가 감정을 분석하고 공감하며 위로해 주는 일기 앱을 만든다.
강의 7장 7.3~7.4절의 단계 구분을 따르되, **1단계(로컬)**와 **2단계(로그인·DB·배포)**로 나눈다.

## 왜 나눠 만드는가

노션 7.4절의 절차는 Supabase `DATABASE_URL`과 구글 OAuth 클라이언트가 있어야 3단계부터
돌아간다. 지금 두 값이 모두 없으므로, 계정 설정을 기다리느라 아무것도 돌려 보지 못하는
상태를 피하려고 로그인 없이 도는 앱을 먼저 완성한다. 저장소를 인터페이스 뒤에 숨겨 두어
2단계에서 구현만 갈아 끼운다.

## 진행 현황

| 단계 | 할 일 | 맡는 에이전트 | 상태 |
|---|---|---|---|
| 0단계 | PRD로 기능과 범위 정하기 | product-manager | 완료 |
| 1단계 | 뼈대 — 타입, 설정, 저장소, API 명세 | backend-developer | 완료 |
| 2단계 | 병렬 구현 — 저장 / AI 분석 / 화면 | backend-developer, ai-integration-specialist, frontend-developer | 완료 |
| 3단계 | 통합 — 세 갈래 합치고 로컬에서 띄우기 | backend-developer | 완료 |
| 4단계 | QA — 기능 시험과 오류 처리 검증 | qa-engineer | 완료 |
| 5단계 | 배포 — 구글 로그인, Supabase, Vercel | backend-developer | 2단계로 미룸 |

## 단계별 내용

### 0단계 PRD (완료)

- `docs/PRD.md`에 기능 F1~F7과 범위 밖을 적는다.
- **확인**: PRD의 기능 표에 번호와 확인 방법이 있고, 로그인이 "2단계"로 적혀 있다.

### 1단계 뼈대 (완료)

- 데이터 모양(`일기`), 저장소 인터페이스(`일기저장소`), 환경변수 읽기(`설정읽기`), API 명세를 먼저 정한다.
- 뼈대를 먼저 두는 까닭: 2단계에서 저장·AI·화면을 나눠 만들려면 주고받는 값이 먼저 정해져야 한다.
- **확인**: `npm run build`와 `npx tsc --noEmit`이 통과한다.

### 2단계 병렬 구현 (완료)

| 갈래 | 맡는 에이전트 | 만드는 것 |
|---|---|---|
| 2-A 저장과 API | backend-developer | `src/lib/store.ts`, `src/app/api/entries/...` |
| 2-B AI 분석과 위기 감지 | ai-integration-specialist | `src/lib/model.ts`, `src/lib/validate.ts`, `src/lib/crisis.ts` |
| 2-C 화면 | frontend-developer | `src/app/page.tsx`, `src/app/history/page.tsx`, `src/components/...` |

- 같은 파일을 두 갈래가 고치지 않게 담당 구역을 나눴다.
- **확인**: `npm test`가 통과하고, 갈래마다 맡은 파일이 생겼다.

### 3단계 통합 (완료)

- 세 갈래를 합쳐 `npm run dev`로 띄우고, 일기 쓰기 → 분석 → 기록 → 삭제가 이어지는지 본다.
- **확인**: `http://localhost:3000`에서 일기를 쓰면 감정과 공감 메시지가 뜨고, 지난 기록에 남는다.

### 4단계 QA (완료)

- 빈 글, 200자 초과, AI 실패, 키 없음, 위기 표현, 삭제를 시험한다.
- **확인**: `docs/qa/` 보고에 적힌 심각도 높음 문제가 없다.

### 5단계 배포 (2단계로 미룸)

`node:sqlite` 파일은 Vercel의 서버리스 파일시스템에서 살아남지 못한다. 그래서 배포는
Supabase로 저장소를 바꾸는 2단계와 함께 간다. 2단계에 할 일:

1. 구글 클라우드에서 OAuth 클라이언트 만들기(`.env`의 `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`)
2. Auth.js로 구글 로그인 붙이고, 일기에 `사용자id` 칸 더하기
3. Supabase Postgres에 `diary` 스키마를 새로 만들고 `일기저장소`의 Postgres 구현 끼우기
4. 깃허브 저장소 `ai-empathy-diary-ch7`에 올리고 Vercel로 가져오기
5. 구글 클라이언트에 배포 주소의 원본과 리디렉션 URI 더하기
