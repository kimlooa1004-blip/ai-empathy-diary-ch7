// 일기 한 칸. 쓰기 화면의 "방금 남긴 글"과 기록 화면이 함께 쓴다.

import type { 일기 } from "@/lib/types";
import { 감정꾸밈, 시각글자 } from "@/lib/emotion";
import CrisisNotice from "./CrisisNotice";

type 속성 = {
  일기값: 일기;
  /** 지우기 단추를 보일지. 쓰기 화면에서는 보이지 않는다. */
  지우기?: (id: string) => void;
  지우는중?: boolean;
};

export default function DiaryCard({ 일기값, 지우기, 지우는중 }: 속성) {
  const 꾸밈 = 감정꾸밈(일기값.감정);
  const 분석못함 = 일기값.감정 === "분석불가";

  return (
    <article className="rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-5">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-lg" aria-hidden="true">
          {꾸밈.이모지}
        </span>
        <span className="font-semibold">{꾸밈.이름}</span>
        {일기값.강도 !== null && (
          <span className="text-sm text-muted">강도 {일기값.강도}</span>
        )}
        <span className="ml-auto text-sm text-muted">
          {시각글자(일기값.작성시각)}
        </span>
      </header>

      <p className="mt-3 leading-relaxed whitespace-pre-wrap">
        {일기값.내용}
      </p>

      <p
        className={`mt-3 rounded-xl px-4 py-3 leading-relaxed ${
          분석못함
            ? "bg-background text-muted"
            : "bg-accent-soft text-foreground"
        }`}
      >
        {분석못함 ? 일기값.공감메시지 : `“${일기값.공감메시지}”`}
      </p>

      {일기값.위기신호 && <CrisisNotice />}

      {지우기 && (
        <div className="mt-3 text-right">
          <button
            type="button"
            onClick={() => 지우기(일기값.id)}
            disabled={지우는중}
            className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted transition hover:bg-background disabled:opacity-50"
          >
            {지우는중 ? "지우는 중…" : "지우기"}
          </button>
        </div>
      )}
    </article>
  );
}
