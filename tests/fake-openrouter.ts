// 시험용 가짜 OpenRouter 서버.
// 진짜 모델을 부르지 않고도 성공·실패·형식 오류를 그대로 흉내 낼 수 있다.

import { createServer, type Server } from "node:http";

export type 응답지시 =
  | { 종류: "성공"; 내용: string }
  | { 종류: "에이치티티피오류"; 상태: number }
  | { 종류: "빈응답" }
  | { 종류: "느림"; 밀리초: number };

export type 가짜서버 = {
  주소: string;
  /** 부른 모델 이름이 차례대로 쌓인다. */
  부른모델: string[];
  끄기: () => Promise<void>;
};

/** 지시를 차례대로 하나씩 쓴다. 지시가 떨어지면 마지막 것을 되풀이한다. */
export async function 가짜서버띄우기(
  지시들: 응답지시[],
): Promise<가짜서버> {
  const 부른모델: string[] = [];
  let 차례 = 0;

  const 서버: Server = createServer((요청, 응답) => {
    let 몸통 = "";
    요청.on("data", (조각) => (몸통 += 조각));
    요청.on("end", async () => {
      try {
        부른모델.push(JSON.parse(몸통).model);
      } catch {
        부른모델.push("(읽지 못함)");
      }

      const 지시 = 지시들[Math.min(차례, 지시들.length - 1)];
      차례 += 1;

      if (지시.종류 === "에이치티티피오류") {
        응답.writeHead(지시.상태).end("{}");
        return;
      }
      if (지시.종류 === "빈응답") {
        응답
          .writeHead(200, { "Content-Type": "application/json" })
          .end(JSON.stringify({ choices: [{ message: { content: "" } }] }));
        return;
      }
      if (지시.종류 === "느림") {
        await new Promise((끝) => setTimeout(끝, 지시.밀리초));
        응답.writeHead(200).end("{}");
        return;
      }
      응답
        .writeHead(200, { "Content-Type": "application/json" })
        .end(
          JSON.stringify({ choices: [{ message: { content: 지시.내용 } }] }),
        );
    });
  });

  await new Promise<void>((끝) => 서버.listen(0, "127.0.0.1", 끝));
  const 포트 = (서버.address() as { port: number }).port;

  return {
    주소: `http://127.0.0.1:${포트}/`,
    부른모델,
    끄기: () => new Promise<void>((끝) => 서버.close(() => 끝())),
  };
}
