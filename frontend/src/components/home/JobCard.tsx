'use client';

import { motion } from 'framer-motion';
import { Calendar, Building, Briefcase } from 'lucide-react';

interface JobCardProps {
    id: number;
    company: string;
    position: string;
    logo?: string;
    deadline: string | null; // null 허용 (상시채용 대응)
    url: string;
    /** 채용 지도 등에서 카드 크기를 줄일 때 사용 */
    compact?: boolean;
}

export default function JobCard({ 
    id, 
    company, 
    position, 
    logo, 
    deadline, 
    url,
    compact = false
}: JobCardProps) {
    
    // 마감일 배지 렌더링 로직
    const renderBadge = () => {
        if (!deadline) return null; // ✅ 마감일 없으면 배지 삭제

        const today = new Date();
        const deadlineDate = new Date(deadline);
        
        // 날짜 차이 계산 (시간 무시하고 날짜로만 비교하기 위해 setHours 처리 권장하지만, 간단히 diff로 처리)
        const diffTime = deadlineDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let dDayText = "";
        let dDayColor = "bg-gray-600"; // 기본 회색

        if (diffDays > 0) {
            dDayText = `D-${diffDays}`;
            if (diffDays <= 3) dDayColor = "bg-red-500/80"; // 임박 시 빨강
        } else if (diffDays === 0) {
            dDayText = "Today";
            dDayColor = "bg-red-500/80";
        } else {
            dDayText = "마감"; // ✅ 지났으면 '마감' 표시
            dDayColor = "bg-gray-700 text-gray-300"; // 마감된 건 조금 더 어둡게
        }

        return (
            <span className={`${compact ? "text-xs" : "text-[14px]"} font-semibold px-2 py-0.5 rounded text-white flex-shrink-0 ${dDayColor}`}>
                {dDayText}
            </span>
        );
    };

    const iconSize = compact ? 18 : 24;

    return (
        <motion.div 
            whileHover={{ y: -3 }}
            className={`relative w-full rounded-xl cursor-pointer border transition-all duration-200 bg-[#25262B] border-white/5 hover:bg-[#2C2D33] hover:border-white/20 ${compact ? "min-w-0 p-3" : "min-w-[240px] p-4"}`}
        >

            {/* 카드 전체 링크 */}
            <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                <div className={`flex items-center gap-3 ${compact ? "gap-2 mb-2" : "mb-3"}`}>
                    {/* 로고 영역 */}
                    <div className={`${compact ? "w-10 h-10 p-1" : "w-16 h-16 p-1.5"} bg-white rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0`}>
                        {logo ? (
                            <img src={logo} alt={company} className="object-contain w-full h-full" />
                        ) : (
                            <Building className={`text-gray-400 ${compact ? "w-4 h-4" : "w-6 h-6"}`} />
                        )}
                    </div>
                    
                    {/* 텍스트 정보 */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className={`text-white font-bold truncate ${compact ? "text-base" : "text-xl"}`}>{company}</h4>
                            {/* 배지 표시 (마감일 없으면 안 뜸) */}
                            {renderBadge()}
                        </div>
                        <p className={`text-gray-400 truncate ${compact ? "text-xs" : "text-sm"}`}>{position}</p>
                    </div>
                </div>

                {/* 하단 정보 */}
                <div className={`flex items-center gap-3 text-gray-500 pt-2 border-t border-white/5 ${compact ? "text-xs" : "text-[14px]"}`}>
                    <div className="flex items-center gap-1">
                        <Calendar size={iconSize} />
                        {/* 마감일이 있으면 날짜, 없으면 상시채용 */}
                        <span>{deadline || "상시채용"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Briefcase size={iconSize} />
                        <span>채용중</span>
                    </div>
                </div>
            </a>
        </motion.div>
    );
}