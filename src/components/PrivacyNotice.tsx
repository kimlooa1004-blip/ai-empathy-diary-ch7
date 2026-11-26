// 일기 내용이 외부 모델로 나간다는 사실을 숨기지 않는다. 작은 주석이 아니라
// 화면에 보이는 경고로 둔다.

export default function PrivacyNotice() {
  return (
    <p className="rounded-xl border border-line bg-warn-soft px-4 py-3 text-sm leading-relaxed text-warn">
      ⚠ 일기 내용은 감정 분석을 위해 외부 AI 모델로 전송됩니다. 무료 모델은 보낸
      글을 기록하거나 학습에 쓸 수 있으니, 이름·연락처 같은 민감한 정보는 적지
      마세요.
    </p>
  );
}
