"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, TrendingUp, Map as MapIcon, FileText, CheckCircle2, Search, Building2 } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = [
  {
    id: 1,
    title: "IT 트렌드, 데이터로 한눈에",
    desc: "최신 기술 스택의 성장세와 기업 선호도를\n직관적인 그래프로 비교 분석하세요.",
    color: "from-blue-600 to-cyan-400",
    glow: "shadow-blue-500/20",
    accent: "text-blue-400",
  },
  {
    id: 2,
    title: "내 주변 채용 공고 지도",
    desc: "관심 있는 기술 스택을 사용하는 기업의\n위치와 채용 정보를 지도 위에서 탐색하세요.",
    color: "from-purple-600 to-pink-400",
    glow: "shadow-purple-500/20",
    accent: "text-purple-400",
  },
  {
    id: 3,
    title: "AI 맞춤형 이력서 진단",
    desc: "내 이력서와 기업 요구사항의 매칭률을 분석하고,\n합격 가능성을 높이는 피드백을 받아보세요.",
    color: "from-orange-500 to-yellow-400",
    glow: "shadow-orange-500/20",
    accent: "text-orange-400",
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      if (onComplete) onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // 🎨 단계별 커스텀 일러스트 렌더링
  const renderVisual = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Trend Analysis Visualization
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* 차트 컨테이너 */}
            <div className="w-64 h-48 bg-[#1A1B1E] border border-white/10 rounded-xl shadow-2xl p-4 flex flex-col justify-end relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                
                {/* 라인 차트 */}
                <svg className="absolute top-4 left-0 w-full h-32 overflow-visible">
                    <motion.path 
                        d="M 10 100 Q 60 100 90 60 T 170 40 T 250 10"
                        fill="none"
                        stroke="#60A5FA"
                        strokeWidth="3"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                    {[10, 90, 170, 250].map((cx, i) => (
                        <motion.circle 
                            key={i} cx={cx} cy={[100, 60, 40, 10][i]} r="4" fill="#3B82F6" stroke="white" strokeWidth="2"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1 + i * 0.2 }}
                        />
                    ))}
                </svg>

                {/* 바 차트 */}
                <div className="flex justify-between items-end h-24 gap-3 z-10">
                    {[40, 70, 50, 85, 60].map((h, i) => (
                        <motion.div
                            key={i}
                            className="w-full bg-gradient-to-t from-blue-900/50 to-blue-500/50 rounded-t-md backdrop-blur-sm border-t border-x border-white/10"
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1, ease: "backOut" }}
                        />
                    ))}
                </div>
            </div>
            
            {/* 플로팅 배지 */}
            <motion.div 
                className="absolute top-1/4 right-10 bg-[#25262B] border border-white/10 p-3 rounded-lg shadow-xl flex items-center gap-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
            >
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <TrendingUp size={16} />
                </div>
                <div>
                    <div className="text-[10px] text-gray-400">Growth</div>
                    <div className="text-sm font-bold text-white">+124%</div>
                </div>
            </motion.div>
          </div>
        );

      case 1: // Map Visualization
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* 지도 배경 */}
            <div className="w-72 h-56 bg-[#1A1B1E] border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden perspective-[1000px] rotate-x-12 transform-style-3d">
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-[1px] opacity-20 pointer-events-none">
                    {Array.from({ length: 36 }).map((_, i) => (
                        <div key={i} className="bg-gray-700/30" />
                    ))}
                </div>
                
                <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent w-[200%]"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />

                <motion.div 
                    className="absolute top-1/3 left-1/4"
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: 0.3, type: "spring" }}
                >
                    <MapIcon className="text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" size={32} fill="rgba(168,85,247,0.2)" />
                </motion.div>

                <motion.div 
                    className="absolute bottom-1/3 right-1/3"
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: 0.6, type: "spring" }}
                >
                    <div className="relative">
                        <MapIcon className="text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.6)]" size={40} fill="rgba(236,72,153,0.3)" />
                        <motion.div 
                            className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" 
                        />
                    </div>
                </motion.div>
            </div>

            <motion.div 
                className="absolute bottom-16 left-12 bg-[#25262B]/90 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl w-48"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 1 }}
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                        <Building2 size={16} className="text-black" />
                    </div>
                    <div className="w-full">
                        <div className="h-2 w-2/3 bg-gray-600 rounded-full mb-1.5" />
                        <div className="h-1.5 w-1/2 bg-gray-700 rounded-full" />
                    </div>
                </div>
                <div className="flex gap-1 mt-2">
                    <div className="h-4 w-12 bg-purple-500/20 rounded border border-purple-500/30" />
                    <div className="h-4 w-10 bg-gray-700/50 rounded border border-gray-600/30" />
                </div>
            </motion.div>
          </div>
        );

      case 2: // AI Resume Visualization
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* 문서 아이콘 */}
            <motion.div 
                className="w-56 h-72 bg-[#1A1B1E] border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col items-center p-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="w-16 h-16 bg-gray-800 rounded-full mb-6 flex items-center justify-center">
                    <FileText className="text-gray-500" size={32} />
                </div>
                <div className="w-full space-y-3">
                    <div className="h-3 w-3/4 bg-gray-700 rounded-full" />
                    <div className="h-3 w-full bg-gray-800 rounded-full" />
                    <div className="h-3 w-5/6 bg-gray-800 rounded-full" />
                    <div className="h-3 w-full bg-gray-800 rounded-full" />
                </div>

                {/* 스캔 라인 */}
                <motion.div 
                    className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-[0_0_15px_#FB923C]"
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
            </motion.div>

            {/* 분석 결과 뱃지 */}
            <motion.div 
                className="absolute bottom-20 right-12 bg-[#25262B] border border-orange-500/30 p-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md"
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 1.5, type: "spring" }}
            >
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 border border-green-500/30">
                    <CheckCircle2 size={20} />
                </div>
                <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Match Rate</div>
                    <div className="text-xl font-black text-white">98%</div>
                </div>
            </motion.div>

            {/* 돋보기 아이콘 */}
            <motion.div
                className="absolute top-24 left-12 text-orange-400 opacity-90"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, x: [0, 10, 0], y: [0, 10, 0] }}
                transition={{ 
                    scale: { delay: 1, duration: 0.3 },
                    opacity: { delay: 1, duration: 0.3 },
                    x: { repeat: Infinity, duration: 3, ease: "easeInOut" },
                    y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                }}
            >
                <div className="relative">
                    {/* 돋보기 배경 글로우 */}
                    <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full" />
                    <Search size={56} strokeWidth={2.5} className="drop-shadow-[0_0_15px_rgba(251,146,60,0.6)] relative z-10" />
                </div>
            </motion.div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    // ✅ [수정 1] fixed inset-0으로 변경하여 네비바 영향 없이 화면 전체 덮기 (z-index 100)
    <div className="fixed inset-0 z-[100] h-[100dvh] w-full bg-[#0F1012] text-white overflow-hidden flex flex-col items-center justify-center">
      
      <motion.div
        animate={{
          background: `radial-gradient(circle at ${
            currentStep === 0 ? "30% 40%" : currentStep === 1 ? "70% 60%" : "50% 50%"
          }, ${
            currentStep === 0 ? "#1d4ed8" : currentStep === 1 ? "#7e22ce" : "#c2410c"
          } 0%, transparent 50%)`,
        }}
        className="absolute inset-0 opacity-15 blur-[120px] transition-all duration-1000 pointer-events-none"
      />

      {/* ✅ [수정 2] max-h를 화면 높이에 맞춰 유동적으로 조절하여 넘침 방지 */}
      <div className="w-full max-w-[1400px] relative z-10 flex flex-col lg:flex-row items-center justify-center p-6 lg:p-8 gap-8 lg:gap-16 h-full max-h-[min(800px,90vh)]">
        
        <div className="relative w-full lg:w-1/2 max-w-[400px] lg:max-w-[450px] aspect-square flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
              transition={{ duration: 0.5, ease: "backOut" }}
              className={`w-full h-full rounded-[40px] bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group ${STEPS[currentStep].glow}`}
            >
                {renderVisual(currentStep)}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left z-20 max-w-lg">
            
            <div className="flex justify-center lg:justify-start mb-8 gap-2">
                {STEPS.map((_, idx) => (
                    <motion.div 
                        key={idx}
                        className={`h-1.5 rounded-full transition-colors duration-300 ${idx === currentStep ? `w-8 bg-white` : "w-2 bg-gray-700"}`}
                        layoutId="step-indicator"
                    />
                ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-6 min-h-[120px]"
              >
                <h1 className={`text-3xl lg:text-5xl font-black mb-4 leading-tight whitespace-pre-wrap bg-clip-text text-transparent bg-gradient-to-r ${STEPS[currentStep].color}`}>
                  {STEPS[currentStep].title}
                </h1>
                <p className="text-base lg:text-lg text-gray-400 leading-relaxed whitespace-pre-wrap font-medium">
                  {STEPS[currentStep].desc}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex w-full gap-4 mt-auto">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-white group"
                >
                  <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </button>
              )}
              
              <button
                onClick={handleNext}
                className={`flex-1 h-14 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98]
                  ${currentStep === STEPS.length - 1 
                    ? `bg-gradient-to-r ${STEPS[currentStep].color} text-white shadow-${STEPS[currentStep].color}/50` 
                    : "bg-white text-black hover:bg-gray-100"
                  }`}
              >
                <span>{currentStep === STEPS.length - 1 ? "DevRoad 시작하기" : "다음으로"}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {currentStep < STEPS.length - 1 && (
              <button 
                  onClick={onComplete} 
                  className="mt-6 text-sm text-gray-500 hover:text-white transition-colors underline underline-offset-4 decoration-gray-700 hover:decoration-white"
              >
                건너뛰기
              </button>
            )}
        </div>

      </div>
    </div>
  );
}