import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// 라우트 코드가 쓰는 "@/..." 별칭을 시험에서도 똑같이 풀어 준다.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
  },
});
