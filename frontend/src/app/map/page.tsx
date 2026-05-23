import { Suspense } from "react";
import JobMapClient from "./JobMapClient";

function MapPageContent() {
  return (
    <div className="h-[calc(100vh-70px)] bg-[#0F1012] p-4 lg:p-6 flex flex-col overflow-hidden">
      <JobMapClient />
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-70px)] bg-[#0F1012] flex items-center justify-center text-white">
          로딩 중...
        </div>
      }
    >
      <MapPageContent />
    </Suspense>
  );
}