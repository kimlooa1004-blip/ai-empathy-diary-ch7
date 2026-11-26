"use client";

// 쓰기 화면. 한 줄을 남기면 감정과 공감 한마디가 바로 아래에 뜬다.

import { useState } from "react";
import Link from "next/link";
import PrivacyNotice from "@/components/PrivacyNotice";
import DiaryCard from "@/components/DiaryCard";
import { 최대글자수, type 일기, type 저장응답 } from "@/lib/types";

export default function Home() {
  const [내용, 내용바꾸기] = useState("");
  const [보내는중, 보내는중바꾸기] = useState(false);
  const [방금글, 방금글바꾸기] = useState<일기 | null>(null);
  const [설정오류, 설정오류바꾸기] = useState(false);
  const [오류, 오류바꾸기] = useState<string | null>(null);

  const 글자수 = 내용.trim().length;
  const 보낼수있나 = 글자수 > 0 && 글자수 <= 최대글자수 && !보내는중;

  async function 남기기(사건: React.FormEvent) {
    사건.preventDefault();
    if (!보낼수있나) return;

    보내는중바꾸기(true);
    오류바꾸기(null);
    설정오류바꾸기(false);

    try {
      const 응답 = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 내용 }),
      });

      if (!응답.ok) {
        const 몸통 = await 응답.json().catch(() => null);
        오류바꾸기(몸통?.까닭 ?? "저장하지 못했습니다");
        return;
      }

      const 몸통: 저장응답 = await 응답.json();
      방금글바꾸기(몸통.일기);
      설정오류바꾸기(몸통.설정오류 === true);
      내용바꾸기("");
    } catch {
      오류바꾸기("서버에 연결하지 못했습니다");
    } finally {
      보내는중바꾸기(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <header className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">공감 다이어리</h1>
        <p className="mt-2 text-muted">
          오늘 하루를 한 줄로 남겨 보세요. 마음을 살펴 드릴게요.
        </p>
      </header>

      <PrivacyNotice />

      <form onSubmit={남기기} className="mt-6">
        <label htmlFor="일기칸" className="sr-only">
          오늘 있었던 일
        </label>
        <textarea
          id="일기칸"
          value={내용}
          onChange={(사건) => 내용바꾸기(사건.target.value)}
          maxLength={최대글자수}
          rows={3}
          placeholder="오늘 발표가 잘 끝나서 마음이 놓였다"
          className="w-full resize-none rounded-2xl border border-line bg-card p-4 leading-relaxed outline-none placeholder:text-muted/70 focus:border-accent"
        />

        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-muted">
            {글자수} / {최대글자수}
          </span>
          <button
            type="submit"
            disabled={!보낼수있나}
            className="rounded-xl bg-accent px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {보내는중 ? "마음을 살피는 중…" : "남기기"}
          </button>
        </div>
      </form>

      {오류 && (
        <p className="mt-4 rounded-xl border border-crisis/30 bg-crisis-soft px-4 py-3 text-sm text-crisis">
          {오류}
        </p>
      )}

      {설정오류 && (
        <p className="mt-4 rounded-xl border border-line bg-warn-soft px-4 py-3 text-sm text-warn">
          서버에 API 키가 설정되지 않아 분석 없이 저장했습니다. `.env`의
          OPENROUTER_API_KEY를 넣고 다시 써 보세요.
        </p>
      )}

      {방금글 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-muted">
            ── 방금 남긴 글 ──
          </h2>
          <DiaryCard 일기값={방금글} />
        </section>
      )}

      <div className="mt-10 text-center">
        <Link
          href="/history"
          className="rounded-xl border border-line px-4 py-2 text-sm transition hover:bg-card"
        >
          지난 기록 보기
        </Link>
      </div>
    </main>
  );
}
