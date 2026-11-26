import { describe, it, expect } from "vitest";
import { 분석파싱 } from "../src/lib/validate";

const 온전한답 = JSON.stringify({
  감정: "평온",
  강도: 2,
  공감메시지: "큰 일을 넘기셨네요.",
  위기신호: false,
});

describe("분석파싱", () => {
  it("온전한 JSON을 읽는다", () => {
    expect(분석파싱(온전한답)).toEqual({
      감정: "평온",
      강도: 2,
      공감메시지: "큰 일을 넘기셨네요.",
      위기신호: false,
    });
  });

  it("```json 울타리와 군말을 걷어낸다", () => {
    const 원문 = "네, 분석했습니다.\n```json\n" + 온전한답 + "\n```";
    expect(분석파싱(원문).감정).toBe("평온");
  });

  it("강도가 범위를 벗어나면 그 칸만 버린다", () => {
    const 답 = JSON.stringify({
      감정: "슬픔",
      강도: 9,
      공감메시지: "곁에 있을게요.",
    });
    const 분석 = 분석파싱(답);
    expect(분석.감정).toBe("슬픔");
    expect(분석.강도).toBeNull();
  });

  it("감정이 목록 밖이면 통째로 실패한다", () => {
    const 답 = JSON.stringify({
      감정: "짜증",
      강도: 3,
      공감메시지: "그랬군요.",
    });
    expect(() => 분석파싱(답)).toThrow("분석형식오류");
  });

  it("공감메시지가 비면 통째로 실패한다", () => {
    const 답 = JSON.stringify({ 감정: "기쁨", 강도: 3, 공감메시지: "  " });
    expect(() => 분석파싱(답)).toThrow("분석형식오류");
  });

  it("위기신호가 없으면 거짓으로 본다", () => {
    const 답 = JSON.stringify({ 감정: "기쁨", 강도: 3, 공감메시지: "좋네요." });
    expect(분석파싱(답).위기신호).toBe(false);
  });

  it("위기신호를 글자로 보내도 읽는다", () => {
    const 답 = JSON.stringify({
      감정: "슬픔",
      강도: 4,
      공감메시지: "힘드셨겠어요.",
      위기신호: "true",
    });
    expect(분석파싱(답).위기신호).toBe(true);
  });

  it("JSON이 아예 없으면 실패한다", () => {
    expect(() => 분석파싱("오늘은 분석하기 어렵네요")).toThrow("분석형식오류");
  });
});
