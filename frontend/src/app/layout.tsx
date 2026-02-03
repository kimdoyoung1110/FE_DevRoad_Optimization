// src/app/layout.tsx
import AuthContext from "@/components/AuthContext"; // 방금 만든 컴포넌트 임포트
import Navbar from "@/components/Navbar";
import "./globals.css";
import { Providers } from "./providers";
import Script from "next/script";

// 서버 컴포넌트이므로 메타데이터 설정도 가능해집니다
export const metadata = {
  title: 'DevRoad',
  icons:{
    icon: '/logo.png',
  },
  description: '취준생을 위한 IT 트렌드 분석 서비스',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="transition-colors duration-300">
        <AuthContext> {/* 클라이언트 컴포넌트인 Provider로 감싸기 */}
          <Navbar />
          <Providers>{children}</Providers>
        </AuthContext>
      </body>
    </html>
  );
}