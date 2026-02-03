"use client";

import { useState, useEffect } from "react";
import SideNav from "./SideNav";
import FavoritesSection from "./FavoritesSection";
import ResumesSection from "./ResumesSection";

type TabKey = "resume" | "favorites";

export default function MyPageShell() {
  const [tab, setTab] = useState<TabKey>("resume");

  // Navbar에서 'resetMyPage' 이벤트 시 마이페이지 첫 화면(이력서 관리)으로 복귀
  useEffect(() => {
    const handleReset = () => setTab("resume");
    window.addEventListener("resetMyPage", handleReset);
    return () => window.removeEventListener("resetMyPage", handleReset);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1A1B1E] text-white">
      {/* 배경 효과 */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[80%] w-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[70%] w-[40%] rounded-full bg-purple-600/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* 사이드바 */}
          <aside className="lg:col-span-3">
            <SideNav active={tab} onChange={setTab} />
          </aside>

          {/* 메인 컨텐츠 영역 */}
          <main className="lg:col-span-9 min-w-0">
            {tab === "resume" && <ResumesSection />}
            {tab === "favorites" && <FavoritesSection />}
          </main>
        </div>
      </div>
    </div>
  );
}