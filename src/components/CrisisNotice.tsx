// 위기 신호가 보일 때 띄우는 상담 연락처.
//
// 공감 메시지를 **대체하지 않고** 그 아래에 함께 띄운다. 번호는 lib/crisis.ts의
// 것을 그대로 쓴다. 임의로 바꾸지 않는다.

import { 상담연락처 } from "@/lib/crisis";

export default function CrisisNotice() {
  return (
    <aside className="mt-3 rounded-xl border border-crisis/30 bg-crisis-soft px-4 py-3 text-sm text-crisis">
      <p className="font-semibold">☎ 혼자 견디지 않으셔도 됩니다</p>
      <ul className="mt-2 space-y-1">
        {상담연락처.map((곳) => (
          <li key={곳.번호}>
            <span className="font-semibold">{곳.번호}</span>
            <span className="ml-2">{곳.이름}</span>
            {곳.덧붙임 && <span className="ml-1 opacity-80">({곳.덧붙임})</span>}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs opacity-80">
        이 앱은 상담 도구도 진단 도구도 아닙니다. 힘들 때는 사람에게 이야기해
        주세요.
      </p>
    </aside>
  );
}
