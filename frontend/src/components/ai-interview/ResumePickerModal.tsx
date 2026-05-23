'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import type { Resume } from '@/types';

interface ResumePickerModalProps {
    open: boolean;
    resumes: Resume[];
    isLoading?: boolean;
    onClose: () => void;
    onSelect: (r: Resume) => void;
    onDelete?: (id: number) => void; // 삭제 핸들러
}

export default function ResumePickerModal({ 
    open, 
    resumes, 
    isLoading = false, 
    onClose, 
    onSelect,
    onDelete 
}: ResumePickerModalProps) {
    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    {/* 백그라운드 오버레이 */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={onClose} 
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                    />
                    
                    {/* 모달 컨텐츠 */}
                    <motion.div 
                        initial={{ scale: 0.96, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        exit={{ scale: 0.96, opacity: 0 }}
                        className="relative w-[min(500px,92vw)] rounded-[24px] border border-white/10 bg-[#1A1B1E] p-6 shadow-2xl"
                    >
                        <div className="text-xl font-bold text-white mb-5">마이페이지 이력서 선택</div>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {isLoading ? (
                                <div className="text-center text-gray-500 py-8 text-base">
                                    이력서 목록을 불러오는 중...
                                </div>
                            ) : resumes.length > 0 ? (
                                resumes.map((r) => (
                                    <div
                                        key={r.id}
                                        // ✅ [수정] onClick 제거 및 커서 변경 (영역 클릭 시 아무 동작 안 함)
                                        className="w-full rounded-2xl border border-white/10 bg-[#25262B] p-4 transition-all hover:border-white/30 hover:bg-[#2C2D33] cursor-default"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-base font-semibold text-white">{r.title}</div>
                                                <div className="mt-1 text-sm text-[#9FA0A8]">
                                                    등록일: {r.createdAt}
                                                </div>
                                            </div>

                                            {/* 버튼 그룹 */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                {/* ✅ [수정] 선택 버튼: 클릭 시에만 onSelect 실행 */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSelect(r);
                                                    }}
                                                    className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-colors cursor-pointer"
                                                >
                                                    선택
                                                </button>

                                                {/* ✅ [수정] 삭제 버튼 추가 */}
                                                {onDelete && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // 부모로 이벤트 전파 방지
                                                            if (confirm('정말 삭제하시겠습니까?')) {
                                                                onDelete(r.id);
                                                            }
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-full transition-colors cursor-pointer"
                                                        title="삭제"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-500 py-8 text-base">
                                    등록된 이력서가 없습니다.
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}