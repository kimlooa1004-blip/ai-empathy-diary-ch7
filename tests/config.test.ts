import { describe, it, expect } from "vitest";
import { 설정읽기 } from "../src/lib/config";

describe("설정읽기", () => {
  it("키가 없으면 null이다. 던지지 않는다", () => {
    const 설정 = 설정읽기({});
    expect(설정.키).toBeNull();
  });

  it("공백만 있는 값은 없는 것으로 본다", () => {
    expect(설정읽기({ OPENROUTER_API_KEY: "   " }).키).toBeNull();
  });

  it("모델을 적지 않으면 기본값을 쓴다", () => {
    expect(설정읽기({}).모델).toContain("nemotron");
  });

  it("폴백을 빈 값으로 두면 1차만 쓴다", () => {
    expect(설정읽기({ OPENROUTER_FALLBACK_MODEL: "" }).폴백모델).toBeNull();
  });

  it("숫자가 아닌 제한시간은 기본값으로 되돌린다", () => {
    expect(설정읽기({ OPENROUTER_TIMEOUT_MS: "빠르게" }).제한시간).toBe(40000);
  });
});
