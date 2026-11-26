import { describe, it, expect } from "vitest";
import { 위기낱말있나, 상담연락처 } from "../src/lib/crisis";

describe("위기낱말있나", () => {
  it("위기 표현을 잡는다", () => {
    expect(위기낱말있나("다 그만두고 싶다")).toBe(true);
    expect(위기낱말있나("죽고 싶다")).toBe(true);
  });

  it("띄어쓰기가 달라도 잡는다", () => {
    expect(위기낱말있나("죽고싶어")).toBe(true);
  });

  it("평범한 일기는 잡지 않는다", () => {
    expect(위기낱말있나("오늘 발표가 잘 끝나서 마음이 놓였다")).toBe(false);
  });
});

describe("상담연락처", () => {
  it("109를 쓰고 옛 번호 1393은 쓰지 않는다", () => {
    const 번호들 = 상담연락처.map((곳) => 곳.번호);
    expect(번호들).toContain("109");
    expect(번호들).not.toContain("1393");
  });
});
