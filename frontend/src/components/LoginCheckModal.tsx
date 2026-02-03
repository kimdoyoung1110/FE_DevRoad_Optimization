"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X } from "lucide-react";

interface LoginCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LoginCheckModal({ isOpen, onClose, onConfirm }: LoginCheckModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 (Backdrop) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />

          {/* 모달 창 (화면 정중앙) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-40%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-40%" }}
            transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
            className="fixed top-1/2 left-1/2 w-full max-w-[320px] bg-[#25262B] border border-white/10 rounded-2xl p-6 shadow-2xl z-[9999] flex flex-col items-center text-center"
          >
            {/* 닫기 버튼 */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
                <X size={20} />
            </button>

            {/* 아이콘 */}
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-blue-400" />
            </div>

            {/* 텍스트 */}
            <h3 className="text-2xl font-bold text-white mb-2">로그인 필요</h3>
            <p className="text-gray-400 text-xm mb-6 leading-relaxed">
              로그인 후 사용할 수 있는 기능입니다.<br />
              로그인 하시겠습니까?
            </p>

            {/* 버튼 그룹 */}
            <div className="flex gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 text-xm font-medium transition-colors"
              >
                아니오
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xm font-bold transition-colors shadow-lg shadow-blue-500/20"
              >
                네
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}