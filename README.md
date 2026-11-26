# 공감 다이어리 (AI 공감 다이어리)

하루를 한 줄로 적으면 AI가 감정과 강도를 살피고 공감 한마디를 돌려주는 웹 앱이다.
강의 7장(7.3~7.4절) 실습 결과물이며, **1단계(로그인 없이 내 컴퓨터에서 쓰는 앱)**까지 만들어져 있다.

## 쓰는 사람에게

- 오늘 있었던 일을 **200자 안쪽**으로 한 줄 적고 `남기기`를 누른다.
- 감정(기쁨·슬픔·분노·불안·평온)과 강도(1~5), 공감 한마디가 바로 아래에 뜬다.
- `지난 기록 보기`에서 날짜별로 다시 보고, 한 칸씩 지울 수 있다.

### 꼭 알아 두어야 할 것

- **일기 내용은 감정 분석을 위해 외부 AI 모델(OpenRouter)로 전송된다.** 무료 모델은 보낸
  글을 기록하거나 학습에 쓸 수 있다. 이름·연락처 같은 민감한 정보는 적지 않는 것이 좋다.
- **이 앱은 상담 도구도 진단 도구도 아니다.** 자해나 극단적 선택을 암시하는 표현이 보이면
  상담 연락처를 함께 띄우지만, 이는 낱말과 모델 판단에 기댄 거친 장치다. 평범한 문장에도
  뜰 수 있고("죽을 만큼 피곤하다"), 어형이 바뀌면 놓친다. 힘들 때는 사람에게 이야기해 주세요.

  | 번호 | 기관 |
  |---|---|
  | 109 | 자살예방 상담전화 (24시간) |
  | 1577-0199 | 정신건강 위기상담전화 |
  | 1388 | 청소년 상담전화 |
  | 119 | 당장 위험할 때 |

- **AI가 실패해도 일기는 저장된다.** 그때는 감정 자리에 `분석하지 못함`이라고 적힌다.
  아무 감정이나 찍지 않는다.

## 개발자에게

### 돌려 보기

```bash
npm install
cp .env.example .env   # 그다음 .env의 OPENROUTER_API_KEY에 내 키를 넣는다
npm run dev            # http://localhost:3000
```

키를 넣지 않아도 앱은 돈다. 일기는 저장되고 "API 키가 설정되지 않아 분석 없이 저장했습니다"
라는 안내가 뜬다.

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | production 빌드 |
| `npm test` | 시험 38개 (vitest) |
| `npm run lint` | eslint |

### 환경변수 (`.env.example` 참고)

| 변수 | 뜻 |
|---|---|
| `OPENROUTER_API_KEY` | OpenRouter 키. 없으면 분석을 건너뛴다 |
| `OPENROUTER_MODEL` | 1차 모델 |
| `OPENROUTER_FALLBACK_MODEL` | 폴백 모델. 비우면 1차만 시도한다 |
| `OPENROUTER_TIMEOUT_MS` / `OPENROUTER_FALLBACK_TIMEOUT_MS` | 제한시간(밀리초) |
| `OPENROUTER_BASE_URL` | OpenRouter 주소. 시험에서 가짜 서버로 돌릴 때 쓴다 |
| `DIARY_DB_PATH` | SQLite 파일 위치 (기본 `data/diary.db`) |

`.env`는 깃에 올리지 않는다. 변수 **이름**만 `.env.example`에 적는다.

### 짜임

```
src/lib/types.ts      일기·분석 데이터 모양, 200자 제한
src/lib/config.ts     환경변수 읽기 (모델 이름을 코드에 박지 않는다)
src/lib/model.ts      OpenRouter 호출. 1차 실패 → 폴백 한 번
src/lib/validate.ts   모델이 보낸 글에서 JSON 꺼내 모양 확인
src/lib/crisis.ts     위기 낱말 검사와 상담 연락처
src/lib/store.ts      일기저장소 인터페이스 + node:sqlite 구현
src/app/api/entries   POST(저장+분석) / GET(목록) / DELETE(삭제)
src/app/page.tsx      쓰기 화면
src/app/history       기록 화면
```

**위기 감지는 두 겹이다.** 서버의 낱말 검사와 모델의 `위기신호` 판단 중 하나라도 참이면
상담 연락처를 띄운다. 놓치는 것보다 오탐이 낫다는 판단이다. 낱말 검사는 AI 호출이
실패해도 그대로 돈다.

### 아직 안 한 것 (2단계)

구글 로그인(Auth.js), 사용자별 일기 분리, Supabase Postgres의 `diary` 스키마, Vercel 배포.
`node:sqlite` 파일은 Vercel의 서버리스 파일시스템에서 살아남지 못하므로, 배포는 저장소를
Postgres로 바꾸는 일과 함께 간다. 자세한 순서는 [docs/PLAN.md](docs/PLAN.md) 5단계에 있다.
