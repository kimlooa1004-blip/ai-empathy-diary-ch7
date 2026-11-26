// 서버와 화면이 함께 쓰는 데이터 모양. PRD 4절과 docs/PLAN.md 1단계에서 정했다.

/** 모델이 고를 수 있는 감정. `분석불가`는 모델이 아니라 우리가 붙인다. */
export const 감정목록 = ["기쁨", "슬픔", "분노", "불안", "평온"] as const;

export type 감정 = (typeof 감정목록)[number] | "분석불가";

/** 한 줄 일기는 200자까지 쓴다. 화면과 서버가 같은 값을 본다. */
export const 최대글자수 = 200;

export type 일기 = {
  id: string;
  내용: string;
  감정: 감정;
  /** 1~5. 분석하지 못했으면 null이다. */
  강도: number | null;
  공감메시지: string;
  위기신호: boolean;
  /** ISO 8601 */
  작성시각: string;
};

/** 모델이 돌려주는 분석 결과. 일기로 옮겨 적기 전의 모양이다. */
export type 분석 = {
  감정: 감정;
  강도: number | null;
  공감메시지: string;
  위기신호: boolean;
};

/** 분석에 실패했을 때 일기에 적는 값. 아무 감정이나 찍지 않는다. */
export const 분석실패: 분석 = {
  감정: "분석불가",
  강도: null,
  공감메시지: "분석에 실패해 글만 남겼습니다",
  위기신호: false,
};

export type 저장응답 = {
  일기: 일기;
  /** 서버에 키가 없어서 분석을 건너뛴 경우. 화면이 다른 안내를 띄운다. */
  설정오류?: true;
};

export type 목록응답 = { 기록: 일기[] };

export type 실패응답 = { 까닭: string };
