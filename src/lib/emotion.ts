// 감정을 화면에 어떻게 그릴지 모아 둔다. 이모지와 색은 화면 쪽 판단이다.

import type { 감정 } from "./types";

type 꾸밈 = { 이모지: string; 이름: string };

const 꾸밈표: Record<감정, 꾸밈> = {
  기쁨: { 이모지: "🙂", 이름: "기쁨" },
  슬픔: { 이모지: "😔", 이름: "슬픔" },
  분노: { 이모지: "😤", 이름: "분노" },
  불안: { 이모지: "😟", 이름: "불안" },
  평온: { 이모지: "😌", 이름: "평온" },
  분석불가: { 이모지: "❓", 이름: "분석하지 못함" },
};

export function 감정꾸밈(감정값: 감정): 꾸밈 {
  return 꾸밈표[감정값] ?? 꾸밈표.분석불가;
}

/** "2026-11-26 (목)"처럼 적는다. 기록을 날짜로 묶을 때 쓴다. */
export function 날짜글자(작성시각: string): string {
  const 때 = new Date(작성시각);
  const 요일 = ["일", "월", "화", "수", "목", "금", "토"][때.getDay()];
  const 두자리 = (숫자: number) => String(숫자).padStart(2, "0");
  return `${때.getFullYear()}-${두자리(때.getMonth() + 1)}-${두자리(때.getDate())} (${요일})`;
}

/** "오후 9:14"처럼 적는다. */
export function 시각글자(작성시각: string): string {
  return new Date(작성시각).toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  });
}
