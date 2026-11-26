// 일기 저장과 목록. 설계 §5.6의 API 명세를 그대로 따른다.
//
//   POST /api/entries  일기 저장 + AI 분석 → 201
//   GET  /api/entries  기록 목록
//
// POST는 AI 분석이 실패해도 — 키가 없어서든 모델이 죽어서든 — 201을 돌려준다.
// 일기는 저장됐기 때문이다. 쓴 글을 잃는 것이 감정 라벨을 잃는 것보다 나쁘다.

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { 설정읽기 } from "@/lib/config";
import { 분석하기 } from "@/lib/model";
import { 저장소가져오기 } from "@/lib/store";
import { 위기낱말있나 } from "@/lib/crisis";
import {
  분석실패,
  최대글자수,
  type 일기,
  type 저장응답,
  type 목록응답,
  type 실패응답,
} from "@/lib/types";

export async function GET() {
  const 설정 = 설정읽기(process.env);
  const 저장소 = 저장소가져오기(설정.디비경로);
  const 몸통: 목록응답 = { 기록: await 저장소.모두가져오기() };
  return NextResponse.json(몸통);
}

export async function POST(요청: Request) {
  let 날것: unknown;
  try {
    날것 = await 요청.json();
  } catch {
    const 몸통: 실패응답 = { 까닭: "요청 형식이 올바르지 않습니다" };
    return NextResponse.json(몸통, { status: 400 });
  }

  const 보낸내용 = (날것 as { 내용?: unknown })?.내용;
  if (typeof 보낸내용 !== "string") {
    const 몸통: 실패응답 = { 까닭: "내용을 보내 주세요" };
    return NextResponse.json(몸통, { status: 400 });
  }

  const 내용 = 보낸내용.trim();
  if (내용.length === 0) {
    const 몸통: 실패응답 = { 까닭: "한 줄이라도 적어 주세요" };
    return NextResponse.json(몸통, { status: 400 });
  }
  if (내용.length > 최대글자수) {
    const 몸통: 실패응답 = {
      까닭: `${최대글자수}자까지 쓸 수 있습니다`,
    };
    return NextResponse.json(몸통, { status: 400 });
  }

  const 설정 = 설정읽기(process.env);
  const 결과 = await 분석하기(내용, 설정);
  const 분석값 = 결과.성공 ? 결과.분석 : 분석실패;

  // 위기 신호는 두 겹으로 본다. 키워드 검사는 AI가 실패해도 그대로 살아 있다.
  const 위기신호 = 위기낱말있나(내용) || 분석값.위기신호;

  const 새일기: 일기 = {
    id: randomUUID(),
    내용,
    감정: 분석값.감정,
    강도: 분석값.강도,
    공감메시지: 분석값.공감메시지,
    위기신호,
    작성시각: new Date().toISOString(),
  };

  const 저장소 = 저장소가져오기(설정.디비경로);
  await 저장소.더하기(새일기);

  const 몸통: 저장응답 = { 일기: 새일기 };
  // 키가 없어서 건너뛴 것은 모델이 죽은 것과 다른 일이다. 화면이 다른 안내를 띄운다.
  if (!결과.성공 && 결과.까닭 === "키없음") 몸통.설정오류 = true;

  return NextResponse.json(몸통, { status: 201 });
}
