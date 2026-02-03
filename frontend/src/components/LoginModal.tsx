'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { startGoogleLogin } from '@/lib/auth';

const GOOGLE_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await startGoogleLogin();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google 로그인을 시작할 수 없습니다.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 250 }}
            className="relative w-full max-w-[480px] bg-[#1A1B1E] rounded-[32px] shadow-2xl overflow-hidden flex flex-col items-center pt-16 pb-36 px-10 text-center"
          >
            <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-3xl font-bold text-white mb-6">로그인</h2>
            <p className="text-[#9FA0A8] text-[15px] leading-relaxed mb-10">
              지금 로그인하고 맞춤 채용 콘텐츠로 하루를 시작하세요. <br/> 즐겨찾기와 AI 면접 대비 기능을 사용해보세요.
            </p>

            <div className="w-full space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex items-center justify-center gap-3 w-full bg-white text-gray-900 font-bold py-4 rounded-full hover:bg-gray-100 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img src={GOOGLE_LOGO_URL} alt="Google" className="w-6 h-6" />
                <span className="text-lg">{isLoading ? '연결 중...' : 'Google로 로그인'}</span>
              </button>
            </div>

            <p className="mt-8 text-[12px] text-gray-500 leading-normal">
              로그인은 <span className="underline underline-offset-2 cursor-pointer">개인 정보 보호 정책</span> 및
              <span className="underline underline-offset-2 cursor-pointer"> 서비스 약관</span>에 동의하는 것을 의미하며,<br/> 서비스 이용을 위해 이메일과 이름, 프로필 이미지를 수집합니다.
            </p>

            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
              <svg className="relative block w-full h-[120px]" viewBox="0 24 150 28" preserveAspectRatio="none">
                <defs>
                  <path id="wave-path" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
                </defs>
                <g>
                  <use href="#wave-path" x="48" y="0" fill="rgba(59, 130, 246, 0.2)" className="animate-wave-mid" />
                  <use href="#wave-path" x="48" y="3" fill="rgba(59, 130, 246, 0.4)" className="animate-wave-fast" />
                  <use href="#wave-path" x="48" y="5" fill="#3B82F6" className="animate-wave-slow" />
                </g>
              </svg>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
