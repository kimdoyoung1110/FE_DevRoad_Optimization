'use client';

import dynamic from 'next/dynamic';

const JobMap = dynamic(
  () => import('@/components/job-map/JobMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#1A1B1E] rounded-[32px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">지도를 불러오는 중...</span>
        </div>
      </div>
    ),
  }
);

export default function JobMapClient() {
  return <JobMap />;
}