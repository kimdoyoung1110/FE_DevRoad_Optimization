// src/app/map/page.tsx
import { Suspense } from "react";
import JobMap from "@/components/job-map/JobMap";

function MapPageContent() {
  return (
    // ✅ [수정] min-h-screen -> h-[calc(100vh-70px)]
    // 네비게이션 바(70px)를 뺀 나머지 높이만큼만 차지하도록 설정하고 스크롤 방지(overflow-hidden)
    <div className="h-[calc(100vh-70px)] bg-[#0F1012] p-4 lg:p-6 flex flex-col overflow-hidden">
      <JobMap />
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="h-[calc(100vh-70px)] bg-[#0F1012] flex items-center justify-center text-white">로딩 중...</div>}>
      <MapPageContent />
    </Suspense>
  );
}