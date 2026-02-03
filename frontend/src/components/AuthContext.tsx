'use client';

// NextAuth 제거됨 - JWT 기반 인증 사용
// auth.ts의 유틸리티 함수 사용
export default function AuthContext({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}