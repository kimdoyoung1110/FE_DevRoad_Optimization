'use client';

import { motion } from 'framer-motion';
import { MousePointerClick, LayoutDashboard } from 'lucide-react';

interface ViewSwitcherProps {
    currentView: 'dashboard' | 'simulation';
    onChange: (view: 'dashboard' | 'simulation') => void;
}

export default function ViewSwitcher({ currentView, onChange }: ViewSwitcherProps) {
    return (
        <div className="flex bg-[#25262B] p-1 rounded-xl border border-white/5 relative w-[360px]">
            {/* 배경 슬라이딩 바 */}
            <motion.div
                className="absolute inset-y-1 rounded-lg bg-[#34353A] shadow-sm"
                initial={false}
                animate={{
                    x: currentView === 'dashboard' ? 0 : '100%',
                }}
                style={{
                    width: 'calc(50% - 4px)', // 패딩 안쪽에 딱 맞게 계산
                    left: '4px'
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            
            {/* 왼쪽: 이력서 대시보드 */}
            <button
                onClick={() => onChange('dashboard')}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold transition-colors ${
                    currentView === 'dashboard' ? 'text-white' : 'text-[#9FA0A8] hover:text-white'
                }`}
            >
                <LayoutDashboard size={16} />
                이력서 대시보드
            </button>

            {/* 오른쪽: 역량 시뮬레이션 */}
            <button
                onClick={() => onChange('simulation')}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold transition-colors ${
                    currentView === 'simulation' ? 'text-white' : 'text-[#9FA0A8] hover:text-white'
                }`}
            >
                <MousePointerClick size={16} />
                역량 시뮬레이션
            </button>
        </div>
    );
}