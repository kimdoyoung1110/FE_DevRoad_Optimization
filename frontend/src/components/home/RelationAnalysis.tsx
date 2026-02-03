"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info, ArrowRightCircle, Share2, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { RelatedTechStackRelation } from "@/services/trendService";

interface StackRelationAnalysisProps {
  mainStackName: string;
  mainLogo: string;
  mainStackDescription?: string; 
  relatedStacks: RelatedTechStackRelation[];
  onClose: () => void;
  onStackSelect?: (stackId: number) => void;
}

const getExternalLogoUrl = (name: string) => {
  if (!name) return "";
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `https://cdn.simpleicons.org/${slug}`;
};

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, name: string) => {
  const target = e.target as HTMLImageElement;
  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128&bold=true`;
};

export default function StackRelationAnalysis({ 
    mainStackName, 
    mainLogo, 
    mainStackDescription, 
    relatedStacks, 
    onClose, 
    onStackSelect 
}: StackRelationAnalysisProps) {
  
  const [focusedNode, setFocusedNode] = useState<RelatedTechStackRelation | null>(null);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFocusedNode(null);
    setScale(1); 
  }, [relatedStacks.length, mainStackName]);
  
  const sortedByWeight = [...relatedStacks].sort((a, b) => b.weight - a.weight);
  
  const weights = sortedByWeight.map(r => r.weight);
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 1;
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0;

  const activeDetail = focusedNode ? {
    name: focusedNode.tech_stack.name,
    role: focusedNode.relationship_type_display,
    relationReason: `${mainStackName}와(과) ${focusedNode.relationship_type_display} 관계를 맺고 있습니다.`,
    description: focusedNode.tech_stack.description || "상세 설명이 없습니다.",
    logo: focusedNode.tech_stack.logo,
    id: focusedNode.tech_stack.id
  } : null;

  const handleZoom = (delta: number) => {
    setScale(prev => Math.min(Math.max(0.5, prev + delta), 2.0));
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
        handleZoom(0.1); 
    } else {
        handleZoom(-0.1); 
    }
  };

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col md:flex-row bg-[#25262B]/50 rounded-[32px] overflow-hidden border border-gray-800 relative">
      
      <style jsx global>{`
          .hover-scroll {
              overflow-y: auto;
              scrollbar-width: thin;
              scrollbar-color: transparent transparent;
              transition: scrollbar-color 0.3s ease;
          }
          .hover-scroll:hover {
              scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
          }
          .hover-scroll::-webkit-scrollbar {
              width: 6px;
          }
          .hover-scroll::-webkit-scrollbar-track {
              background: transparent;
          }
          .hover-scroll::-webkit-scrollbar-thumb {
              background-color: transparent;
              border-radius: 10px;
              transition: background-color 0.3s ease-in-out;
          }
          .hover-scroll:hover::-webkit-scrollbar-thumb {
              background-color: rgba(255, 255, 255, 0.2);
          }
      `}</style>

      <button onClick={onClose} className="absolute top-4 right-4 z-50 text-gray-500 hover:text-white bg-gray-900/50 p-2 rounded-full transition-colors hover:bg-gray-800">
        <X className="w-5 h-5" />
      </button>

      {/* LEFT: Graph Area */}
      <div 
        className="flex-1 relative flex items-center justify-center bg-gradient-to-br from-[#1A1B1E] to-[#141517] overflow-hidden cursor-move active:cursor-grabbing" 
        ref={containerRef}
        onWheel={handleWheel} 
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ 
                 backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', 
                 backgroundSize: '32px 32px' 
             }} 
        />
        
        <div className="absolute top-6 left-6 z-40 max-w-xs pointer-events-none">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-blue-400 text-xm font-bold uppercase tracking-wider">연관 기술 스택</span>
            </div>
        </div>

        <div className="absolute bottom-6 left-6 z-40 flex flex-col gap-2 bg-gray-900/80 rounded-xl p-2 border border-white/10 backdrop-blur-md shadow-xl">
            <button onClick={() => handleZoom(0.1)} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors" title="확대"><ZoomIn size={18}/></button>
            <button onClick={() => setScale(1)} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors" title="초기화"><Maximize size={18}/></button>
            <button onClick={() => handleZoom(-0.1)} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors" title="축소"><ZoomOut size={18}/></button>
        </div>

        <div 
            className="relative w-full h-full flex items-center justify-center transition-transform duration-500 cubic-bezier(0.25, 0.1, 0.25, 1)"
            style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
        >
            {/* Center Node (Fixed Main) */}
            <motion.div 
                className="absolute z-30 flex flex-col items-center justify-center cursor-default"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                    scale: focusedNode ? 0.9 : 1, 
                    opacity: focusedNode ? 0.5 : 1, 
                    filter: focusedNode ? "grayscale(100%) blur(1px)" : "grayscale(0%) blur(0px)" 
                }}
                transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
            >
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                    <div className="w-32 h-32 bg-[#1A1B1E] rounded-full border-4 border-blue-500 shadow-[0_0_60px_rgba(37,99,235,0.4)] flex items-center justify-center overflow-hidden p-6 relative z-10">
                        {mainLogo ? (
                            <img 
                                src={mainLogo} 
                                alt={mainStackName} 
                                className="w-full h-full object-contain drop-shadow-lg"
                                onError={(e) => handleImageError(e, mainStackName)}
                            />
                        ) : (
                            <span className="text-white font-bold text-2xl">{mainStackName.substring(0, 2).toUpperCase()}</span>
                        )}
                    </div>
                </div>
                {/* Center Node Text Size: text-2xl (24px) */}
                <span className="mt-4 text-2xl font-bold text-white tracking-tight drop-shadow-lg bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm border border-white/5">{mainStackName}</span>
            </motion.div>

            {/* Related Nodes */}
            {sortedByWeight.map((relation, index) => {
                const totalNodes = sortedByWeight.length;
                const angle = totalNodes === 1 ? -Math.PI / 2 : (index / totalNodes) * 2 * Math.PI - Math.PI / 2;
                
                const baseRadius = 240; 
                let currentRadius = baseRadius;
                if (totalNodes > 8) {
                    currentRadius = index % 2 === 0 ? 300 : 200;
                } else if (totalNodes > 4) {
                    currentRadius = 260;
                }

                const x = Math.cos(angle) * currentRadius;
                const y = Math.sin(angle) * currentRadius;
                
                const isSelected = focusedNode?.tech_stack.id === relation.tech_stack.id;
                const isDimmed = focusedNode !== null && !isSelected;
                const stack = relation.tech_stack;

                // 노드 기본 크기 계산
                let sizeRatio = 0;
                if (maxWeight !== minWeight) {
                    sizeRatio = (relation.weight - minWeight) / (maxWeight - minWeight);
                } else {
                    sizeRatio = 1; 
                }
                const nodeSize = 45 + (sizeRatio * 45); // 최소 45px ~ 최대 90px

                // ✅ 중앙 노드(128px)에 맞추기 위한 노드 스케일 계산
                const targetCenterSize = 128; 
                const selectedScale = targetCenterSize / nodeSize;

                // ✅ 텍스트 크기 보정 계산
                // 목표: 최종적으로 중앙 노드 텍스트(24px, text-2xl)와 같아져야 함.
                // 현재 텍스트(12px) * 부모스케일(selectedScale) * 텍스트보정 = 24px
                // 텍스트보정 = 24 / (12 * selectedScale) = 2 / selectedScale
                const textScaleCorrection = 2.0 / selectedScale;

                return (
                    <motion.div
                        key={`node-${stack.id}-${index}`}
                        className="absolute z-20"
                        initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                        animate={{ 
                            x: isSelected ? 0 : x, 
                            y: isSelected ? 0 : y, 
                            scale: isSelected ? selectedScale : (isDimmed ? 0.8 : 1), 
                            opacity: isDimmed ? 0.3 : 1, 
                            zIndex: isSelected ? 50 : 20,
                            translateY: isSelected ? 0 : [0, -5, 0]
                        }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 60, 
                            damping: 12, 
                            delay: index * 0.05, 
                            translateY: {
                                duration: 3 + Math.random() * 2, 
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: Math.random() * 2
                            }
                        }}
                        onClick={() => setFocusedNode(isSelected ? null : relation)}
                    >
                        {/* Connecting Line */}
                        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] pointer-events-none -z-10 overflow-visible">
                            <motion.line 
                                x1="500" 
                                y1="500" 
                                x2="500" 
                                y2="500"
                                animate={{
                                    x2: 500 - (isSelected ? 0 : x),
                                    y2: 500 - (isSelected ? 0 : y),
                                    strokeOpacity: isSelected ? 0 : (isDimmed ? 0.1 : 0.4)
                                }}
                                stroke="#3b82f6" 
                                strokeWidth={Math.max(1, relation.weight / 3)} 
                                strokeLinecap="round"
                                transition={{ duration: 0.8, delay: index * 0.05 }}
                            />
                        </svg>

                        {/* Node Circle & Text Container */}
                        <div className={`flex flex-col items-center gap-3 cursor-pointer group`}>
                            <div 
                                style={{ width: nodeSize, height: nodeSize }}
                                className={`rounded-full flex items-center justify-center border-2 transition-all duration-300 relative ${
                                    isSelected 
                                    ? 'bg-blue-600 border-white shadow-[0_0_30px_rgba(59,130,246,0.6)]' 
                                    : 'bg-[#2C2E33] border-gray-600 hover:border-blue-400 hover:bg-gray-800 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                                }`}
                            >
                                <div className="w-[60%] h-[60%] flex items-center justify-center">
                                    <img 
                                        src={stack.logo || getExternalLogoUrl(stack.name)} 
                                        alt={stack.name} 
                                        className="w-full h-full object-contain filter drop-shadow-md"
                                        onError={(e) => handleImageError(e, stack.name)}
                                    />
                                </div>
                            </div>
                            
                            {/* ✅ 텍스트 애니메이션 적용: 선택 시 부모 스케일에 맞춰 역보정하여 최종 24px로 만듦 */}
                            <motion.span 
                                animate={{ 
                                    scale: isSelected ? textScaleCorrection : 1,
                                    y: isSelected ? 10 : 0 // 선택됐을 때 원과의 거리를 살짝 조정 (중앙 노드 mt-4 효과)
                                }}
                                className={`text-[12px] font-bold px-3 py-1 rounded-full border backdrop-blur-md transition-colors whitespace-nowrap shadow-sm ${
                                    isSelected 
                                    ? 'bg-black/30 text-white border-white/5 shadow-lg' 
                                    : 'text-gray-300 bg-black/40 border-white/10 group-hover:bg-blue-900/40 group-hover:text-white group-hover:border-blue-400/50'
                                }`}
                            >
                                {stack.name}
                            </motion.span>
                        </div>
                    </motion.div>
                );
            })}
        </div>
      </div>

      {/* RIGHT: Detail Panel */}
      <AnimatePresence mode="wait">
        <motion.div 
            className="w-full md:w-[320px] bg-[#1A1B1E] border-l border-gray-800 p-6 flex flex-col hover-scroll relative z-50 shadow-[-10px_0_30px_rgba(0,0,0,0.3)]" 
            initial={{ x: 100, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 20 }}
        >
            {activeDetail ? (
                <motion.div key={activeDetail.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden p-2 shadow-inner">
                            <img 
                                src={activeDetail.logo || getExternalLogoUrl(activeDetail.name)} 
                                alt={activeDetail.name} 
                                className="w-full h-full object-contain"
                                onError={(e) => handleImageError(e, activeDetail.name)}
                            />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white tracking-tight">{activeDetail.name}</h3>
                            <span className="text-xs font-semibold text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20 inline-block mt-1">
                                {activeDetail.role}
                            </span>
                        </div>
                    </div>
                    
                    <div className="mb-6">
                        <h4 className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
                            <Info className="w-3.5 h-3.5 text-blue-400" /> 기술 설명
                        </h4>
                        <p className="text-sm text-gray-300 leading-relaxed bg-[#25262B] p-4 rounded-xl border border-white/5">
                            {activeDetail.description}
                        </p>
                    </div>
                    
                    <div className="mb-6 flex-1">
                        <h4 className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
                            <Share2 className="w-3.5 h-3.5 text-purple-400" /> 관계 분석
                        </h4>
                        <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 p-4 rounded-xl border border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 opacity-50" />
                            <p className="text-sm text-gray-200 leading-relaxed pl-2">
                                "{activeDetail.relationReason}"
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => {
                            if (activeDetail && onStackSelect) {
                                onStackSelect(activeDetail.id);
                            }
                        }}
                        className="mt-auto w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 text-sm group"
                    >
                        <span>상세 분석 보기</span>
                        <ArrowRightCircle className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                    <div className="w-24 h-24 bg-gradient-to-tr from-gray-800 to-gray-700 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/5">
                        <Share2 className="w-10 h-10 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-200 mb-2">노드 선택</h4>
                    <p className="text-gray-400 text-sm leading-relaxed max-w-[200px]">
                        그래프에서 연관 기술 노드를<br/>클릭하여 상세 관계 정보를<br/>확인하세요.
                    </p>
                </div>
            )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
