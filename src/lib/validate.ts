// 모델이 보낸 글에서 분석 JSON을 꺼내고 모양을 확인한다.
//
// 무료 모델은 JSON만 달라고 해도 ```json 울타리로 감싸거나, 앞뒤에 군말을 붙이거나,
// 지시문의 형식 블록을 그대로 복창한 뒤 답을 내놓는다. 그래서 후보를 여러 개 모아
// 검증을 통과하는 첫 것을 쓴다.
//
// 칸마다 엄격함을 달리한다(설계 §5.3).
//   감정      : 다섯 라벨 밖이거나 없으면 통째로 실패. 아무 감정이나 찍지 않는다
//   공감메시지: 비었거나 없으면 통째로 실패. 빈 공감은 공감이 아니다
//   강도      : 1~5 밖이면 그 칸만 버리고 null. 감정과 메시지는 살린다
//   위기신호  : 없으면 거짓으로 본다. 키워드 검사가 따로 돌기 때문이다

import { 감정목록, type 분석, type 감정 } from "./types";

function 글자인가(값: unknown): 값 is string {
  return typeof 값 === "string";
}

function 감정읽기(값: unknown): 감정 | null {
  if (!글자인가(값)) return null;
  const 다듬음 = 값.trim();
  return (감정목록 as readonly string[]).includes(다듬음)
    ? (다듬음 as 감정)
    : null;
}

/** 1~5의 정수만 받는다. 어긋나면 그 칸만 버린다. */
function 강도읽기(값: unknown): number | null {
  const 숫자 = typeof 값 === "string" ? Number(값.trim()) : 값;
  if (typeof 숫자 !== "number" || !Number.isFinite(숫자)) return null;
  const 반올림 = Math.round(숫자);
  return 반올림 >= 1 && 반올림 <= 5 ? 반올림 : null;
}

/** 모델이 "true"/"예"처럼 글자로 보내는 일이 흔해 너그럽게 읽는다. */
function 참인가(값: unknown): boolean {
  if (typeof 값 === "boolean") return 값;
  if (글자인가(값)) {
    const 다듬음 = 값.trim().toLowerCase();
    return 다듬음 === "true" || 다듬음 === "예" || 다듬음 === "yes";
  }
  return false;
}

/**
 * JSON 몸통 후보를 그럴듯한 순서로 모은다.
 * 울타리 안쪽을 먼저, 그다음 전문의 첫 `{` ~ 마지막 `}`.
 */
function 후보들찾기(원문: string): string[] {
  const 후보들: string[] = [];

  const 자르기 = (글: string) => {
    const 시작 = 글.indexOf("{");
    const 끝 = 글.lastIndexOf("}");
    if (시작 === -1 || 끝 === -1 || 끝 < 시작) return;
    후보들.push(글.slice(시작, 끝 + 1));
  };

  // 울타리가 여럿일 수 있다. 모델이 형식을 복창한 뒤 답을 내놓는 일이 흔하다.
  for (const 맞음 of 원문.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) {
    자르기(맞음[1]);
  }
  // 닫히지 않은 울타리(잘린 응답)와 울타리 없는 응답까지 덮는다.
  자르기(원문);

  return 후보들;
}

/** 모양을 확인한다. 어긋나면 null을 돌려준다. 던지지 않는다. */
function 분석만들기(날것: unknown): 분석 | null {
  if (typeof 날것 !== "object" || 날것 === null) return null;
  const 그릇 = 날것 as Record<string, unknown>;

  const 감정 = 감정읽기(그릇.감정);
  if (감정 === null) return null;

  const 공감메시지 = 그릇.공감메시지;
  if (!글자인가(공감메시지) || 공감메시지.trim().length === 0) return null;

  return {
    감정,
    강도: 강도읽기(그릇.강도),
    공감메시지: 공감메시지.trim(),
    위기신호: 참인가(그릇.위기신호),
  };
}

/**
 * @throws Error("분석형식오류") 어느 후보도 검증을 통과하지 못할 때
 */
export function 분석파싱(원문: string): 분석 {
  for (const 후보 of 후보들찾기(원문)) {
    let 날것: unknown;
    try {
      날것 = JSON.parse(후보);
    } catch {
      continue;
    }
    const 분석 = 분석만들기(날것);
    if (분석 !== null) return 분석;
  }
  throw new Error("분석형식오류");
}
