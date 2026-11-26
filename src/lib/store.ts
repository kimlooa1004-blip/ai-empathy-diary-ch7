// 일기를 저장하는 곳.
//
// 화면과 API는 `일기저장소` 인터페이스만 본다. 1단계는 Node에 들어 있는
// `node:sqlite`로 파일에 저장하고, 2단계에서 Supabase Postgres 구현으로 갈아 끼운다.
// 그때 고치는 것은 이 파일 하나다.

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { 일기, 감정 } from "./types";

export interface 일기저장소 {
  더하기(새일기: 일기): Promise<void>;
  모두가져오기(): Promise<일기[]>;
  /** 지웠으면 참, 그런 id가 없으면 거짓 */
  지우기(id: string): Promise<boolean>;
  /** 파일을 놓아 준다. 시험에서 임시 폴더를 지우려면 필요하다. */
  닫기(): void;
}

type 디비줄 = {
  id: string;
  내용: string;
  감정: string;
  강도: number | null;
  공감메시지: string;
  위기신호: number;
  작성시각: string;
};

function 줄을일기로(줄: 디비줄): 일기 {
  return {
    id: 줄.id,
    내용: 줄.내용,
    감정: 줄.감정 as 감정,
    강도: 줄.강도,
    공감메시지: 줄.공감메시지,
    // SQLite에는 참/거짓이 없어 0과 1로 넣는다.
    위기신호: 줄.위기신호 === 1,
    작성시각: 줄.작성시각,
  };
}

/** 파일에 저장하는 구현을 만든다. 파일이 없으면 폴더째 만든다. */
export function 에스큐엘저장소만들기(디비경로: string): 일기저장소 {
  // 파일 위치를 환경변수로 받으므로 Turbopack이 "project 전체를 추적하겠다"고 경고한다.
  // 1단계의 SQLite 파일은 로컬에서만 쓰고 배포본에는 올리지 않으므로 추적을 끈다.
  const 절대경로 = resolve(/* turbopackIgnore: true */ process.cwd(), 디비경로);
  mkdirSync(dirname(절대경로), { recursive: true });

  const 디비 = new DatabaseSync(절대경로);
  디비.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      내용 TEXT NOT NULL,
      감정 TEXT NOT NULL,
      강도 INTEGER,
      공감메시지 TEXT NOT NULL,
      위기신호 INTEGER NOT NULL,
      작성시각 TEXT NOT NULL
    )
  `);

  return {
    async 더하기(새일기) {
      디비
        .prepare(
          `INSERT INTO entries (id, 내용, 감정, 강도, 공감메시지, 위기신호, 작성시각)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          새일기.id,
          새일기.내용,
          새일기.감정,
          새일기.강도,
          새일기.공감메시지,
          새일기.위기신호 ? 1 : 0,
          새일기.작성시각,
        );
    },

    async 모두가져오기() {
      const 줄들 = 디비
        .prepare(`SELECT * FROM entries ORDER BY 작성시각 DESC`)
        .all() as unknown as 디비줄[];
      return 줄들.map(줄을일기로);
    },

    async 지우기(id) {
      const 결과 = 디비.prepare(`DELETE FROM entries WHERE id = ?`).run(id);
      return Number(결과.changes) > 0;
    },

    닫기() {
      디비.close();
    },
  };
}

/**
 * 서버가 도는 동안 저장소를 하나만 쓴다.
 * 개발 서버는 모듈을 다시 읽어 들이므로 globalThis에 붙여 둔다.
 */
const 저장소보관함 = globalThis as unknown as { 일기저장소?: 일기저장소 };

export function 저장소가져오기(디비경로: string): 일기저장소 {
  if (!저장소보관함.일기저장소) {
    저장소보관함.일기저장소 = 에스큐엘저장소만들기(디비경로);
  }
  return 저장소보관함.일기저장소;
}
