import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { 에스큐엘저장소만들기, type 일기저장소 } from "../src/lib/store";
import type { 일기 } from "../src/lib/types";

let 임시폴더 = "";
let 저장소: 일기저장소;

function 시험일기(덧붙임: Partial<일기> = {}): 일기 {
  return {
    id: crypto.randomUUID(),
    내용: "오늘은 조용한 하루였다",
    감정: "평온",
    강도: 2,
    공감메시지: "잔잔한 하루였네요.",
    위기신호: false,
    작성시각: new Date().toISOString(),
    ...덧붙임,
  };
}

beforeEach(() => {
  임시폴더 = mkdtempSync(join(tmpdir(), "diary-"));
  저장소 = 에스큐엘저장소만들기(join(임시폴더, "diary.db"));
});

afterEach(() => {
  // 윈도에서는 파일을 열어 둔 채로 폴더를 지울 수 없다.
  저장소.닫기();
  rmSync(임시폴더, { recursive: true, force: true });
});

describe("일기저장소", () => {
  it("더한 일기를 그대로 돌려준다", async () => {
    const 하나 = 시험일기();
    await 저장소.더하기(하나);

    const 모두 = await 저장소.모두가져오기();
    expect(모두).toHaveLength(1);
    expect(모두[0]).toEqual(하나);
  });

  it("최신순으로 돌려준다", async () => {
    await 저장소.더하기(시험일기({ 작성시각: "2026-11-24T10:00:00.000Z" }));
    const 나중 = 시험일기({ 작성시각: "2026-11-26T10:00:00.000Z" });
    await 저장소.더하기(나중);

    const 모두 = await 저장소.모두가져오기();
    expect(모두[0].id).toBe(나중.id);
  });

  it("강도가 null인 기록도 담는다", async () => {
    await 저장소.더하기(시험일기({ 감정: "분석불가", 강도: null }));
    const 모두 = await 저장소.모두가져오기();
    expect(모두[0].강도).toBeNull();
  });

  it("위기신호 참거짓이 오가며 뒤집히지 않는다", async () => {
    await 저장소.더하기(시험일기({ 위기신호: true }));
    const 모두 = await 저장소.모두가져오기();
    expect(모두[0].위기신호).toBe(true);
  });

  it("지우면 목록에서 사라진다", async () => {
    const 하나 = 시험일기();
    await 저장소.더하기(하나);

    expect(await 저장소.지우기(하나.id)).toBe(true);
    expect(await 저장소.모두가져오기()).toHaveLength(0);
  });

  it("없는 id를 지우면 거짓을 돌려준다", async () => {
    expect(await 저장소.지우기("없는-id")).toBe(false);
  });
});
