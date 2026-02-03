'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Monitor, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getAuthTokens } from '@/lib/auth'; // 직접 토큰 확인
import LoginCheckModal from "@/components/LoginCheckModal";
import LoginModal from "@/components/LoginModal";

interface UploadSectionProps {
    onUploadClick: () => void;
    onMyPageClick: () => void;
}

export default function UploadSection({ onUploadClick, onMyPageClick }: UploadSectionProps) {
    const { user } = useAuthStore();
    const displayName = user?.name || '사용자';

    // ✅ 로그인 모달 상태 관리
    const [showLoginCheck, setShowLoginCheck] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    // ✅ 로그인 확인 헬퍼 함수
    const checkLogin = (callback: () => void) => {
        const { accessToken } = getAuthTokens();
        if (!accessToken) {
            setPendingAction(() => callback); // 로그인 후 실행할 수도 있으나 여기선 모달만 띄움
            setShowLoginCheck(true);
            return;
        }
        callback();
    };

    return (
        <>
            <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full min-h-[500px] lg:min-h-[600px] w-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01] hover:bg-white/[0.02] transition-all cursor-default group p-6 lg:p-10"
            >
                <div className="flex flex-col items-center justify-center w-full max-w-3xl gap-6 lg:gap-10">
                    
                    <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-blue-600/5 flex items-center justify-center border border-blue-600/10 group-hover:scale-110 transition-transform duration-500 shrink-0">
                        <UploadCloud className="text-blue-500 opacity-60 w-10 h-10 lg:w-14 lg:h-14" />
                    </div>
                    
                    <div className="text-center space-y-2 lg:space-y-4">
                        <h2 className="text-2xl lg:text-4xl font-black tracking-tighter text-white">
                            분석할 이력서를 업로드하세요
                        </h2>
                        
                        <p className="text-[#9FA0A8] text-sm lg:text-lg leading-relaxed max-w-lg mx-auto">
                            <span className="text-blue-400 font-bold">{displayName}</span>님의 이력서를 바탕으로 <br className="block md:hidden" />
                            <span className="text-blue-400 font-bold">최적의 기술 스택</span>과 <span className="text-blue-400 font-bold">가장 적합한 기업</span>을 분석해 드립니다.
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 w-full justify-center">
                        {/* ✅ 로그인 확인 후 콜백 실행 */}
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                checkLogin(onMyPageClick); 
                            }} 
                            className="px-6 py-3 lg:px-8 lg:py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm lg:text-base shrink-0"
                        >
                            <User className="w-4 h-4 lg:w-5 lg:h-5" /> 마이페이지 불러오기
                        </button>
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                checkLogin(onUploadClick); 
                            }}
                            className="px-6 py-3 lg:px-8 lg:py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] cursor-pointer text-sm lg:text-base shrink-0"
                        >
                            <Monitor className="w-4 h-4 lg:w-5 lg:h-5" /> PC에서 파일 선택
                        </button>
                    </div>

                </div>
            </motion.div>

            {/* ✅ 로그인 유도 모달 추가 */}
            <LoginCheckModal 
                isOpen={showLoginCheck} 
                onClose={() => setShowLoginCheck(false)}
                onConfirm={() => {
                    setShowLoginCheck(false);
                    setShowLoginModal(true);
                }}
            />
            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        </>
    );
}