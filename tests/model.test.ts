import { describe, it, expect, afterEach } from "vitest";
import { 분석하기 } from "../src/lib/model";
import { 설정읽기 } from "../src/lib/config";
import { 가짜서버띄우기, type 가짜서버 } from "./fake-openrouter";

const 온전한답 = JSON.stringify({
  감정: "기쁨",
  강도: 4,
  공감메시지: "좋은 하루였네요.",
  위기신호: false,
});

let 서버: 가짜서버 | null = null;

afterEach(async () => {
  await 서버?.끄기();
  서버 = null;
});

function 시험설정(덧붙임: Record<string, string> = {}) {
  return 설정읽기({
    OPENROUTER_API_KEY: "test-key",
    OPENROUTER_MODEL: "첫모델",
    OPENROUTER_FALLBACK_MODEL: "폴백모델",
    ...덧붙임,
  });
}

describe("분석하기", () => {
  it("키가 없으면 부르지 않고 키없음을 돌려준다", async () => {
    const 결과 = await 분석하기("오늘은 괜찮았다", 설정읽기({}));
    expect(결과).toEqual({ 성공: false, 까닭: "키없음" });
  });

  it("1차 모델이 성공하면 폴백을 부르지 않는다", async () => {
    서버 = await 가짜서버띄우기([{ 종류: "성공", 내용: 온전한답 }]);
    const 결과 = await 분석하기("좋은 하루", 시험설정(), 서버.주소);

    expect(결과.성공).toBe(true);
    expect(서버.부른모델).toEqual(["첫모델"]);
  });

  it("1차가 실패하면 폴백으로 한 번 더 시도한다", async () => {
    서버 = await 가짜서버띄우기([
      { 종류: "에이치티티피오류", 상태: 429 },
      { 종류: "성공", 내용: 온전한답 },
    ]);
    const 결과 = await 분석하기("좋은 하루", 시험설정(), 서버.주소);

    expect(결과.성공).toBe(true);
    if (결과.성공) expect(결과.쓴모델).toBe("폴백모델");
    expect(서버.부른모델).toEqual(["첫모델", "폴백모델"]);
  });

  it("둘 다 실패하면 시도 기록을 남긴다", async () => {
    서버 = await 가짜서버띄우기([{ 종류: "에이치티티피오류", 상태: 500 }]);
    const 결과 = await 분석하기("좋은 하루", 시험설정(), 서버.주소);

    expect(결과.성공).toBe(false);
    if (!결과.성공 && 결과.까닭 === "모델실패") {
      expect(결과.시도기록).toHaveLength(2);
      expect(결과.시도기록[0].결과).toBe("HTTP 500");
      expect(결과.시도기록[1].모델).toBe("폴백모델(폴백)");
    }
  });

  it("빈 응답은 실패로 본다", async () => {
    서버 = await 가짜서버띄우기([{ 종류: "빈응답" }]);
    const 결과 = await 분석하기("좋은 하루", 시험설정(), 서버.주소);
    expect(결과.성공).toBe(false);
  });

  it("폴백을 꺼 두면 한 번만 시도한다", async () => {
    서버 = await 가짜서버띄우기([{ 종류: "에이치티티피오류", 상태: 500 }]);
    const 결과 = await 분석하기(
      "좋은 하루",
      시험설정({ OPENROUTER_FALLBACK_MODEL: "" }),
      서버.주소,
    );

    expect(결과.성공).toBe(false);
    expect(서버.부른모델).toEqual(["첫모델"]);
  });

  it("시간이 넘으면 시간 초과로 적는다", async () => {
    서버 = await 가짜서버띄우기([{ 종류: "느림", 밀리초: 300 }]);
    const 결과 = await 분석하기(
      "좋은 하루",
      시험설정({
        OPENROUTER_TIMEOUT_MS: "50",
        OPENROUTER_FALLBACK_TIMEOUT_MS: "50",
      }),
      서버.주소,
    );

    expect(결과.성공).toBe(false);
    if (!결과.성공 && 결과.까닭 === "모델실패") {
      expect(결과.시도기록[0].결과).toContain("시간 초과");
    }
  });
});
