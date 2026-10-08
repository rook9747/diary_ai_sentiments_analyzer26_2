import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "Diary AI Sentiments Analyzer",
  description: "Diary AI Sentiments Analyzer — AI 감성 분석으로 하루의 마음을 보듬고 성찰하는 힐링 다이어리 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#FAF6FC] text-[#1E1B22]">
        {children}
      </body>
    </html>
  );
}
