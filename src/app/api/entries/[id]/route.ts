// 기록 하나 지우기. 없는 id면 404.

import { NextResponse } from "next/server";
import { 설정읽기 } from "@/lib/config";
import { 저장소가져오기 } from "@/lib/store";
import type { 실패응답 } from "@/lib/types";

export async function DELETE(
  _요청: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const 설정 = 설정읽기(process.env);
  const 저장소 = 저장소가져오기(설정.디비경로);

  const 지웠나 = await 저장소.지우기(id);
  if (!지웠나) {
    const 몸통: 실패응답 = { 까닭: "그런 기록이 없습니다" };
    return NextResponse.json(몸통, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
