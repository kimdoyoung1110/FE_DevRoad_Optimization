"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAuthTokens, setUserProfileImage } from "@/lib/auth";

// 동적 렌더링 강제 (정적 생성 방지)
export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// 1. 알맹이 컴포넌트 (로직 및 화면)
function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");

    if (code) {
      // 일회용 code → JWT 교환 (토큰이 URL에 노출되지 않음)
      fetch(`${API_URL}/api/v1/users/auth/exchange-code/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        credentials: 'omit',
      })
        .then((res) => res.ok ? res.json() : Promise.reject(new Error('exchange failed')))
        .then((data) => {
          setAuthTokens(data.access, data.refresh);
          if (data.profile_image) setUserProfileImage(data.profile_image);
          window.dispatchEvent(new Event('authSuccess'));
          router.push("/");
        })
        .catch(() => router.push("/?error=auth_failed"));
      return;
    }

    router.push("/?error=auth_failed");
  }, [searchParams, router]);

  // 로딩 중 보여줄 화면
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">로그인 처리 중...</h1>
        <p className="text-gray-600">잠시만 기다려주세요.</p>
      </div>
    </div>
  );
}

// 2. 껍데기 페이지 (Suspense 적용)
// 여기서 Suspense로 감싸주어야 빌드 에러가 안 납니다.
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Loading...</div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}