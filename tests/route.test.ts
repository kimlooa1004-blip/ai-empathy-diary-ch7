// API 경로 시험. 진짜 모델은 부르지 않는다.
//
// 키를 넣지 않고 돌리므로 분석은 늘 "키없음"으로 끝난다. 그래도 일기는 저장돼야
// 하고(설계 §5.3), 응답에 설정오류가 실려야 한다.

import { describe, it, expect, afterAll } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { 최대글자수 } from "../src/lib/types";

const 임시폴더 = mkdtempSync(join(tmpdir(), "diary-route-"));
process.env.DIARY_DB_PATH = join(임시폴더, "diary.db");
delete process.env.OPENROUTER_API_KEY;

// 환경변수를 먼저 세운 뒤에 라우트를 읽어 들인다.
const { GET, POST } = await import("../src/app/api/entries/route");
const { DELETE } = await import("../src/app/api/entries/[id]/route");

function 쓰기요청(내용: unknown) {
  return new Request("http://localhost/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 내용 }),
  });
}

afterAll(async () => {
  const { 설정읽기 } = await import("../src/lib/config");
  const { 저장소가져오기 } = await import("../src/lib/store");
  저장소가져오기(설정읽기(process.env).디비경로).닫기();
  rmSync(임시폴더, { recursive: true, force: true });
});

describe("POST /api/entries", () => {
  it("빈 글은 400으로 막는다", async () => {
    const 응답 = await POST(쓰기요청("   "));
    expect(응답.status).toBe(400);
  });

  it("200자를 넘으면 400으로 막는다", async () => {
    const 응답 = await POST(쓰기요청("가".repeat(최대글자수 + 1)));
    expect(응답.status).toBe(400);
  });

  it("내용이 글자가 아니면 400으로 막는다", async () => {
    const 응답 = await POST(쓰기요청(42));
    expect(응답.status).toBe(400);
  });

  it("키가 없어도 일기는 저장하고 설정오류를 알린다", async () => {
    const 응답 = await POST(쓰기요청("오늘은 조용한 하루였다"));
    expect(응답.status).toBe(201);

    const 몸통 = await 응답.json();
    expect(몸통.설정오류).toBe(true);
    expect(몸통.일기.감정).toBe("분석불가");
    expect(몸통.일기.강도).toBeNull();
    expect(몸통.일기.내용).toBe("오늘은 조용한 하루였다");
  });

  it("AI가 못 돌아도 위기 표현은 키워드 검사가 잡는다", async () => {
    const 응답 = await POST(쓰기요청("다 그만두고 싶다"));
    const 몸통 = await 응답.json();
    expect(몸통.일기.위기신호).toBe(true);
  });
});

describe("GET /api/entries", () => {
  it("저장한 기록을 최신순으로 돌려준다", async () => {
    const 몸통 = await (await GET()).json();
    expect(몸통.기록.length).toBeGreaterThanOrEqual(2);
    expect(몸통.기록[0].내용).toBe("다 그만두고 싶다");
  });
});

describe("DELETE /api/entries/:id", () => {
  it("지우면 204, 목록에서도 사라진다", async () => {
    const 앞목록 = await (await GET()).json();
    const 지울id = 앞목록.기록[0].id;

    const 응답 = await DELETE(new Request("http://localhost/x", { method: "DELETE" }), {
      params: Promise.resolve({ id: 지울id }),
    });
    expect(응답.status).toBe(204);

    const 뒷목록 = await (await GET()).json();
    expect(뒷목록.기록.some((한칸: { id: string }) => 한칸.id === 지울id)).toBe(
      false,
    );
  });

  it("없는 id는 404", async () => {
    const 응답 = await DELETE(new Request("http://localhost/x", { method: "DELETE" }), {
      params: Promise.resolve({ id: "없는-id" }),
    });
    expect(응답.status).toBe(404);
  });
});
