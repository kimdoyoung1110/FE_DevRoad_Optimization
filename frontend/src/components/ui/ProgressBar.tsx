'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
    progress: number; // 0 ~ 100
    label?: string;   // "분석 중..." 같은 텍스트
}

export default function ProgressBar({ progress, label }: ProgressBarProps) {
    return (
        <div className="w-full max-w-md mx-auto">
            <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-blue-400 animate-pulse">
                    {label || "처리 중..."}
                </span>
                <span className="text-xs font-mono text-gray-400">
                    {Math.round(progress)}%
                </span>
            </div>
            
            {/* 트랙 (배경) */}
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                {/* 바 (게이지) */}
                <motion.div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }} // 부드러운 움직임
                />
            </div>
        </div>
    );
}