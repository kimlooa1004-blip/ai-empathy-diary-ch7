import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "공감 다이어리",
  description: "하루를 한 줄로 남기면 AI가 마음을 살펴 공감해 드립니다",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
