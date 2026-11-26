"use client";

// 기록 화면. 날짜로 묶어 최신순으로 보여 주고, 한 칸씩 지울 수 있다.
//
// 위기 신호가 있던 기록은 여기서도 상담 연락처를 함께 그린다. 쓴 직후에만 띄우고
// 다시 볼 때 숨기면 "위기 신호를 조용히 넘기는 것"에 가깝기 때문이다.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import DiaryCard from "@/components/DiaryCard";
import { 날짜글자 } from "@/lib/emotion";
import type { 일기, 목록응답 } from "@/lib/types";

export default function History() {
  const [기록, 기록바꾸기] = useState<일기[]>([]);
  const [불러오는중, 불러오는중바꾸기] = useState(true);
  const [오류, 오류바꾸기] = useState<string | null>(null);
  const [지우는id, 지우는id바꾸기] = useState<string | null>(null);

  useEffect(() => {
    let 살아있나 = true;

    (async () => {
      try {
        const 응답 = await fetch("/api/entries");
        if (!응답.ok) throw new Error();
        const 몸통: 목록응답 = await 응답.json();
        if (살아있나) 기록바꾸기(몸통.기록);
      } catch {
        if (살아있나) 오류바꾸기("기록을 불러오지 못했습니다");
      } finally {
        if (살아있나) 불러오는중바꾸기(false);
      }
    })();

    return () => {
      살아있나 = false;
    };
  }, []);

  const 지우기 = useCallback(async (id: string) => {
    지우는id바꾸기(id);
    try {
      const 응답 = await fetch(`/api/entries/${id}`, { method: "DELETE" });
      if (!응답.ok) throw new Error();
      기록바꾸기((앞) => 앞.filter((한칸) => 한칸.id !== id));
    } catch {
      오류바꾸기("지우지 못했습니다");
    } finally {
      지우는id바꾸기(null);
    }
  }, []);

  // 최신순으로 이미 정렬돼 온 목록을 날짜로 묶는다.
  const 날짜묶음 = new Map<string, 일기[]>();
  for (const 한칸 of 기록) {
    const 날짜 = 날짜글자(한칸.작성시각);
    const 묶음 = 날짜묶음.get(날짜) ?? [];
    묶음.push(한칸);
    날짜묶음.set(날짜, 묶음);
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold sm:text-3xl">지난 기록</h1>
        <Link
          href="/"
          className="rounded-xl border border-line px-4 py-2 text-sm transition hover:bg-card"
        >
          오늘 쓰기
        </Link>
      </header>

      {오류 && (
        <p className="rounded-xl border border-crisis/30 bg-crisis-soft px-4 py-3 text-sm text-crisis">
          {오류}
        </p>
      )}

      {불러오는중 && <p className="text-muted">불러오는 중…</p>}

      {!불러오는중 && !오류 && 기록.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-muted">
          아직 남긴 글이 없습니다. 오늘 하루를 한 줄로 적어 보세요.
        </p>
      )}

      <div className="space-y-8">
        {[...날짜묶음.entries()].map(([날짜, 묶음]) => (
          <section key={날짜}>
            <h2 className="mb-3 text-sm font-semibold text-muted">{날짜}</h2>
            <div className="space-y-4">
              {묶음.map((한칸) => (
                <DiaryCard
                  key={한칸.id}
                  일기값={한칸}
                  지우기={지우기}
                  지우는중={지우는id === 한칸.id}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
