"use client"; 

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import WithdrawalThanksModal from "@/components/home/WithdrawalThanksModal";
import Dashboard from "@/components/home/Dashboard";
import Onboarding from "@/components/home/OnBoarding";
// ✅ 인증 토큰 확인 함수 임포트
import { getAuthTokens } from "@/lib/auth";

function HomeContent() {
  // Next.js 16: useSearchParams()를 사용하여 클라이언트에서 searchParams 접근
  const searchParams = useSearchParams();
  const showWithdrawalThanks = searchParams?.get('withdrawal') === "ok";
  
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const { accessToken } = getAuthTokens();
    const hasVisited = localStorage.getItem("hasVisited");

    // ✅ 로그인 안 되어 있으면 무조건 온보딩 노출 (새로고침 시 계속)
    if (!accessToken) {
        setShowOnboarding(true);
    } else {
        // 로그인 상태라면 방문 기록에 따라 처리
        if (hasVisited) {
            setShowOnboarding(false);
        }
    }
    
    setIsInitialized(true); 
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("hasVisited", "true");
    setShowOnboarding(false);
  };

  if (!isInitialized) return null;

  return (
    <>
      <AnimatePresence mode="wait">
        {showOnboarding ? (
          <Onboarding key="onboarding" onComplete={handleOnboardingComplete} />
        ) : (
          <motion.main
            key="dashboard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            // ✅ [수정 1] pt-[70px]: Navbar 높이(70px)만큼 정확히 내려서 시작
            className="min-h-screen bg-[#1A1B1E] overflow-y-auto lg:overflow-hidden pt-[70px] lg:fixed lg:inset-0"
          >
            {/* ✅ [수정 2] origin-top-left: 축소 시 왼쪽 위를 기준으로 잡아서 오른쪽 쏠림 방지
                ✅ 125% 크기 * 0.8 배율 = 100% (화면 꽉 채움) 
            */}
            <div className="w-full h-auto origin-top-left scale-100 lg:w-[125%] lg:h-[125%] lg:scale-[0.8]">
              {/* ✅ [수정 3] lg:p-10: 상하좌우 패딩을 40px로 통일
                 -> 0.8배 축소되므로 실제 눈에 보이는 간격은 32px로 네 방향 모두 동일해짐
              */}
              <div className="max-w-[2400px] mx-auto h-full px-4 pb-10 lg:p-10">
                 <Dashboard />
              </div>
            </div>

            <WithdrawalThanksModal isOpen={showWithdrawalThanks} />
          </motion.main>
        )}
      </AnimatePresence>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1A1B1E] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
    </div>}>
      <HomeContent />
    </Suspense>
  );
}