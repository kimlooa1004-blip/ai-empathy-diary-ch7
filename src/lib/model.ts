// OpenRouter를 불러 감정 분석과 공감 메시지를 받아온다.
//
// 1차 모델이 어떤 이유로 실패하든 — HTTP 오류, 시간 초과, 빈 응답, 형식 오류 —
// 폴백 모델로 딱 한 번 더 시도한다. 둘 다 실패하면 무엇이 어떻게 실패했는지를
// 그대로 돌려준다. 실패를 성공처럼 내보내지 않는다.
//
// 키는 Authorization 헤더로만 나간다. 어디에도 찍지 않는다.

import type { 설정 } from "./config";
import { 분석파싱 } from "./validate";
import { 감정목록, type 분석 } from "./types";

export type 시도 = { 모델: string; 결과: string };

export type 분석결과 =
  | { 성공: true; 분석: 분석; 쓴모델: string }
  | { 성공: false; 까닭: "키없음" }
  | { 성공: false; 까닭: "모델실패"; 시도기록: 시도[] };

const 지시문 = [
  "너는 한국어로 쓰인 한 줄 일기를 읽고 감정을 살피는 따뜻한 상대다.",
  "아래 일기를 읽고 JSON 하나만 내놓아라. 설명도 인사도 붙이지 마라.",
  "",
  "형식:",
  "{",
  `  "감정": "${감정목록.join(" | ")}" 중 하나,`,
  '  "강도": 1에서 5 사이의 정수,',
  '  "공감메시지": "한국어 한두 문장",',
  '  "위기신호": true 또는 false',
  "}",
  "",
  "규칙:",
  "- 감정은 반드시 위의 다섯 가지 중 하나를 그대로 쓴다. 새 낱말을 만들지 않는다.",
  "- 강도는 감정의 세기다. 1이 가장 약하고 5가 가장 세다.",
  "- 공감메시지는 글쓴이의 마음을 먼저 알아주고, 짧게 곁에 있어 주는 말로 쓴다.",
  "  진단하거나 가르치거나 해결책을 늘어놓지 않는다. 두 문장을 넘기지 않는다.",
  "- 위기신호는 자해나 극단적 선택을 암시하는 표현이 보일 때만 true로 한다.",
  "- 모든 값은 한국어로 쓴다.",
].join("\n");

/** 모델을 한 번 부른다. 실패하면 사람이 읽을 수 있는 까닭을 던진다. */
async function 한번부르기(
  모델: string,
  일기글: string,
  키: string,
  제한시간: number,
  주소: string,
): Promise<분석> {
  let 응답: Response;
  try {
    응답 = await fetch(주소, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${키}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: 모델,
        messages: [
          { role: "system", content: 지시문 },
          { role: "user", content: 일기글 },
        ],
      }),
      signal: AbortSignal.timeout(제한시간),
    });
  } catch (오류) {
    const 이름 = (오류 as { name?: string })?.name;
    if (이름 === "TimeoutError" || 이름 === "AbortError") {
      throw new Error(`시간 초과(${Math.round(제한시간 / 1000)}초)`);
    }
    throw new Error("연결 실패");
  }

  if (!응답.ok) throw new Error(`HTTP ${응답.status}`);

  let 본문: unknown;
  try {
    본문 = await 응답.json();
  } catch {
    throw new Error("응답 형식 오류");
  }

  const 내용 = (본문 as { choices?: { message?: { content?: unknown } }[] })
    ?.choices?.[0]?.message?.content;

  if (typeof 내용 !== "string" || 내용.trim().length === 0) {
    throw new Error("빈 응답");
  }

  try {
    return 분석파싱(내용);
  } catch {
    throw new Error("응답 형식 오류");
  }
}

export async function 분석하기(
  일기글: string,
  설정값: 설정,
  주소?: string,
): Promise<분석결과> {
  // 키가 없어도 일기는 저장한다. 여기서는 그 사실만 알리고 돌아간다.
  if (설정값.키 === null) return { 성공: false, 까닭: "키없음" };

  const 쓸주소 = 주소 ?? 설정값.기본주소;

  const 차례: { 모델: string; 제한시간: number; 폴백인가: boolean }[] = [
    { 모델: 설정값.모델, 제한시간: 설정값.제한시간, 폴백인가: false },
  ];
  // 폴백이 설정돼 있을 때만 두 번째 시도를 준비한다.
  if (설정값.폴백모델) {
    차례.push({
      모델: 설정값.폴백모델,
      제한시간: 설정값.폴백제한시간,
      폴백인가: true,
    });
  }

  const 시도기록: 시도[] = [];

  for (const { 모델, 제한시간, 폴백인가 } of 차례) {
    try {
      const 분석 = await 한번부르기(
        모델,
        일기글,
        설정값.키,
        제한시간,
        쓸주소,
      );
      console.log(`[diary] 분석 성공 모델=${모델} 시도=${시도기록.length + 1}`);
      return { 성공: true, 분석, 쓴모델: 모델 };
    } catch (오류) {
      const 까닭 = (오류 as Error).message;
      // 1차와 폴백 이름이 비슷할 수 있으니 어느 쪽이었는지 적어 둔다.
      시도기록.push({ 모델: 폴백인가 ? `${모델}(폴백)` : 모델, 결과: 까닭 });
      console.log(`[diary] 분석 실패 모델=${모델} 까닭=${까닭}`);
    }
  }

  return { 성공: false, 까닭: "모델실패", 시도기록 };
}
