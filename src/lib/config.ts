// 환경변수에서 OpenRouter 설정을 읽는다.
// 모델 이름과 제한시간을 코드에 박지 않는다. 무료 모델은 수시로 막히거나 사라진다.

export type 환경꾸러미 = Record<string, string | undefined>;

export type 설정 = {
  /** 키가 없으면 null이다. 키가 없어도 일기는 저장하므로 던지지 않는다. */
  키: string | null;
  모델: string;
  폴백모델: string | null;
  제한시간: number;
  폴백제한시간: number;
  /** OpenRouter 주소. 시험에서 가짜 서버를 가리키게 하려고 환경변수로 뺐다. */
  기본주소: string;
  /** SQLite 파일 위치 */
  디비경로: string;
};

const 기본값 = {
  모델: "nvidia/nemotron-3-ultra-550b-a55b:free",
  폴백모델: "nvidia/nemotron-3.5-super-vl:free",
  제한시간: 40000,
  폴백제한시간: 50000,
  기본주소: "https://openrouter.ai/api/v1/chat/completions",
  디비경로: "data/diary.db",
} as const;

/** 빈 문자열과 공백만 있는 값을 undefined와 똑같이 "없음"으로 다룬다. */
function 글자읽기(값: string | undefined): string | null {
  const 다듬음 = 값?.trim();
  return 다듬음 ? 다듬음 : null;
}

/** 숫자로 읽되, 숫자가 아니면 기본값으로 되돌린다. */
function 숫자읽기(값: string | undefined, 기본: number): number {
  const 글자 = 글자읽기(값);
  if (글자 === null) return 기본;
  const 숫자 = Number(글자);
  return Number.isFinite(숫자) ? 숫자 : 기본;
}

export function 설정읽기(환경: 환경꾸러미): 설정 {
  return {
    키: 글자읽기(환경.OPENROUTER_API_KEY),
    모델: 글자읽기(환경.OPENROUTER_MODEL) ?? 기본값.모델,
    // 폴백은 빈 값으로 꺼 둘 수 있다. .env에서 빈 줄로 두면 1차만 시도한다.
    폴백모델:
      환경.OPENROUTER_FALLBACK_MODEL === undefined
        ? 기본값.폴백모델
        : 글자읽기(환경.OPENROUTER_FALLBACK_MODEL),
    제한시간: 숫자읽기(환경.OPENROUTER_TIMEOUT_MS, 기본값.제한시간),
    폴백제한시간: 숫자읽기(
      환경.OPENROUTER_FALLBACK_TIMEOUT_MS,
      기본값.폴백제한시간,
    ),
    기본주소: 글자읽기(환경.OPENROUTER_BASE_URL) ?? 기본값.기본주소,
    디비경로: 글자읽기(환경.DIARY_DB_PATH) ?? 기본값.디비경로,
  };
}
