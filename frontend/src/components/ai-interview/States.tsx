'use client';

import { motion } from 'framer-motion';
import { FileUp, Sparkles, X } from 'lucide-react'; // X 아이콘 추가
import { useAuthStore } from '@/store/authStore';
import { useInterviewStore } from '@/store/interviewStore';
import ProgressBar from '@/components/ui/ProgressBar';

export function EmptyState() {
  return (
    <motion.div 
      key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="w-full h-[600px] border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center text-white/20"
    >
      <div className="p-6 bg-white/5 rounded-full mb-4">
        <FileUp size={48} />
      </div>
      <p className="text-lg font-medium">이력서를 등록하면 AI 분석 대시보드가 활성화됩니다.</p>
    </motion.div>
  );
}

export function AnalyzingState() {
  const { user } = useAuthStore();
  // ✅ resetProcess 가져오기 (취소 기능용)
  const { progress, navMessage, resetProcess } = useInterviewStore(); 
  const displayName = user?.name || '사용자';

  // 취소 핸들러
  const handleCancel = () => {
    if (confirm("분석을 중단하고 처음으로 돌아가시겠습니까?")) {
        // 커스텀 이벤트를 발생시켜 page.tsx에서 Axios 취소 등을 처리할 수도 있지만,
        // 여기서는 Store의 상태를 리셋하여 즉시 화면을 전환합니다.
        window.dispatchEvent(new Event('cancelAnalysis')); // page.tsx에 알림
        resetProcess(); 
    }
  };

  return (
    <motion.div 
      key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="w-full h-[600px] bg-white/5 rounded-[32px] flex flex-col items-center justify-center border border-white/10 overflow-hidden relative"
    >
      {/* 배경 효과 */}
      <div className="absolute inset-0 bg-blue-500/5 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center w-full px-10">
        <motion.div 
            animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
            transition={{ rotate: { duration: 3, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }} 
            className="mb-8 p-6 bg-blue-500/10 rounded-full border border-blue-500/20"
        >
            <Sparkles size={48} className="text-blue-400" />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-white mb-2">AI가 이력서를 분석하고 있습니다</h2>
        <p className="text-gray-400 mb-8 text-center max-w-md">
            {displayName}님의 경험을 바탕으로 면접 질문을 생성 중입니다.<br/>
            잠시만 기다려주세요.
        </p>

        {/* 프로그래스 바 */}
        <ProgressBar progress={progress} label={navMessage} />

        {/* ✅ [추가] 취소 버튼 */}
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCancel}
            className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-sm transition-colors"
        >
            <X size={14} />
            분석 취소하기
        </motion.button>
      </div>
    </motion.div>
  );
}