'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, CheckCircle2, AlertCircle, TrendingUp, Target, BrainCircuit, Hash, Building2 } from 'lucide-react';

interface AnalysisFeedback {
    id: string;
    type: 'strength' | 'weakness' | 'enhancement';
    targetText?: string;
    comment: string;
}

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    resumeTitle: string;
    resumeText: string | null;
    selectedCompany: any;
    selectedKeywords: string[];
    feedbacks: AnalysisFeedback[];
    questions: string[];
    answers: string[];
    totalScore: number;
    jobPostingTitle?: string;
}

export default function ReportModal({
    isOpen, onClose, resumeTitle, resumeText, selectedCompany, selectedKeywords, feedbacks, questions, answers, totalScore, jobPostingTitle
}: ReportModalProps) {
    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6 print:p-0 print:block print:static">
                    {/* ✅ [수정] PDF 출력 여백 이슈 해결을 위한 스타일 재정의 */}
                    <style>{`
                        @media print {
                            @page { margin: 10mm; size: auto; }
                            
                            body * { visibility: hidden; }
                            #printable-root, #printable-root * { visibility: visible; }

                            html, body {
                                height: auto !important;
                                min-height: 0 !important;
                                overflow: visible !important;
                                background: white !important;
                            }

                            #printable-root {
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 100% !important;
                                height: auto !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                overflow: visible !important;
                                background: white !important;
                                color: black !important;
                                border: none !important;
                                box-shadow: none !important;
                                z-index: 99999 !important;
                                transform: none !important;
                            }

                            #printable-content {
                                width: 100% !important;
                                max-width: none !important;
                                padding: 0 !important;
                                margin: 0 !important;
                                border: none !important;
                                box-shadow: none !important;
                                overflow: visible !important;
                                display: block !important;
                            }

                            .custom-scrollbar {
                                height: auto !important;
                                overflow: visible !important;
                                max-height: none !important;
                            }

                            .no-print { display: none !important; }

                            /* ✅ [핵심 수정] 섹션 간 페이지 넘김 허용 (avoid -> auto) */
                            .print-section {
                                margin-bottom: 1rem !important; /* 간격 축소 */
                                page-break-inside: auto !important; /* 내용이 길면 페이지 넘어가도록 허용 */
                                break-inside: auto !important;
                            }

                            /* ✅ [핵심 수정] 개별 카드/항목만 쪼개지지 않도록 보호 */
                            .print-item {
                                page-break-inside: avoid !important;
                                break-inside: avoid !important;
                                margin-bottom: 0.8rem !important; /* 아이템 간 간격 확보 */
                                display: block !important;
                            }

                            /* 헤더 바로 뒤에서 페이지가 끊기지 않도록 시도 */
                            h3 {
                                page-break-after: avoid !important;
                                break-after: avoid !important;
                            }

                            .print-compact-gap { gap: 0.5rem !important; }
                            .print-compact-padding { padding: 0 !important; }
                            .print-no-min-height { min-height: 0 !important; height: auto !important; }
                            .print-block { display: block !important; }
                            
                            p, span, div, h1, h2, h3, h4, li { color: black !important; }
                            .print-color-box { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        }
                    `}</style>

                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose} 
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm no-print" 
                    />

                    <motion.div 
                        id="printable-root"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl h-[90vh] bg-[#1A1B1E] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/10 print:h-auto print:rounded-none print:border-none print:shadow-none"
                    >
                        {/* 헤더 (화면용) */}
                        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-[#212226] no-print shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg"><FileText className="text-blue-400" size={48} /></div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">통합 리포트</h2>
                                    <p className="text-sm text-gray-400">선택한 기업 : {selectedCompany?.name || 'General'} <br/> 파일 이름 : {resumeTitle}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 transition-colors">
                                    <Download size={16} /> PDF 저장
                                </button>
                                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* 리포트 본문 (인쇄 대상) */}
                        <div id="printable-content" className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#151619] print:bg-white print:p-0 print:block">
                            <div className="max-w-[800px] mx-auto bg-white text-black rounded-sm shadow-xl min-h-[1000px] p-12 flex flex-col gap-10 print:shadow-none print:p-8 print:gap-2 print:min-h-0 print:w-full print:max-w-none print-no-min-height print-block">
                                
                                {/* 1. 리포트 헤더 */}
                                <div className="border-b-2 border-black/10 pb-6 print:pb-4 flex justify-between items-end print-section">
                                    <div>
                                        <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">DevRoad 면접 대비 통합 리포트</h1>
                                        <p className="text-gray-500 font-medium text-sm">당신의 꿈을 항상 응원합니다!</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        {selectedCompany?.logo_url ? (
                                            <img src={selectedCompany.logo_url} alt={selectedCompany.name} className="h-10 w-auto object-contain mb-2" />
                                        ) : (
                                            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center mb-2"><Building2 className="text-gray-400" size={24} /></div>
                                        )}
                                        <div className="text-right">
                                            <h2 className="text-lg font-bold text-gray-900 leading-tight">{selectedCompany?.name || 'Company Name'}</h2>
                                            <p className="text-sm text-gray-500 font-medium">{jobPostingTitle || '채용공고 정보 없음'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. 이력서 원본 (Resume Content) */}
                                {resumeText && (
                                    <div className="print-section">
                                        <h3 className="text-lg font-bold uppercase tracking-wider text-gray-800 mb-4 border-l-4 border-gray-400 pl-3 flex items-center gap-2 print:mb-2">
                                            <FileText size={18} className="text-gray-600"/> {resumeTitle}
                                        </h3>
                                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden print-color-box">
                                            <div className="p-6 space-y-4">
                                                {resumeText.split(/\n{2,}/).map((section, idx) => {
                                                    const lines = section.split('\n').filter(line => line.trim());
                                                    if (lines.length === 0) return null;

                                                    // 섹션 제목 감지 (직무 경험, 프로젝트 경험 등)
                                                    const firstLine = lines[0];
                                                    const isSectionTitle = firstLine.includes(':') ||
                                                                          firstLine.includes('경험') ||
                                                                          firstLine.includes('경력') ||
                                                                          firstLine.match(/^[가-힣\s]+:$/);

                                                    return (
                                                        <div key={idx} className="space-y-2">
                                                            {isSectionTitle ? (
                                                                <h4 className="text-base font-bold text-gray-800 border-b border-gray-200 pb-2">{firstLine}</h4>
                                                            ) : lines.length > 1 && !firstLine.startsWith('•') ? (
                                                                <h5 className="text-sm font-bold text-gray-700">{firstLine}</h5>
                                                            ) : null}

                                                            <div className="text-gray-600 text-sm leading-relaxed space-y-1">
                                                                {lines.slice(isSectionTitle || (!firstLine.startsWith('•') && lines.length > 1) ? 1 : 0).map((line, lineIdx) => (
                                                                    <div key={lineIdx} className={line.startsWith('•') ? 'flex items-start gap-2 ml-2' : line.match(/^-{3,}/) ? 'border-t border-gray-200 my-2' : line.match(/^={3,}/) ? 'border-t-2 border-gray-300 my-3' : ''}>
                                                                        {line.startsWith('•') ? (
                                                                            <>
                                                                                <span className="text-blue-500 font-bold shrink-0">•</span>
                                                                                <span className="flex-1">{line.substring(1).trim()}</span>
                                                                            </>
                                                                        ) : !line.match(/^[-=]{3,}/) ? (
                                                                            <span>{line}</span>
                                                                        ) : null}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 3. 기술 스택 (Tech Stack) */}
                                <div className="print-section">
                                    <h3 className="text-lg font-bold uppercase tracking-wider text-gray-800 mb-4 border-l-4 border-blue-600 pl-3 flex items-center gap-2 print:mb-2">
                                        <Hash size={18} className="text-blue-600"/> 기술 스택
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedKeywords.length > 0 ? selectedKeywords.map((k, i) => (
                                            <span key={i} className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-sm font-bold text-gray-700 print-color-box print-item">{k}</span>
                                        )) : <span className="text-gray-400 text-sm">분석된 기술 스택이 없습니다.</span>}
                                    </div>
                                </div>

                                {/* 4. 상세 분석 (Detailed Analysis) */}
                                <div className="print-section">
                                    <h3 className="text-lg font-bold uppercase tracking-wider text-gray-800 mb-4 border-l-4 border-green-600 pl-3 flex items-center gap-2 print:mb-2">
                                        <Target size={18} className="text-green-600"/> 상세 분석
                                    </h3>
                                    {feedbacks.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-4 print:gap-2 print:block">
                                            {feedbacks.map((fb, i) => {
                                                // comment를 글머리 기호(•)로 분리
                                                const items = fb.comment
                                                    .split(/[•·]/)
                                                    .map(item => item.trim())
                                                    .filter(item => item.length > 0);

                                                return (
                                                    <div key={i} className={`p-4 rounded-lg border flex flex-col gap-2 print-item print-color-box ${fb.type==='strength'?'bg-blue-50 border-blue-100':fb.type==='weakness'?'bg-orange-50 border-orange-100':'bg-green-50 border-green-100'}`}>
                                                        <div className="flex items-center gap-2 font-bold">
                                                            {fb.type==='strength' && <TrendingUp size={16} className="text-blue-600"/>}
                                                            {fb.type==='weakness' && <AlertCircle size={16} className="text-orange-600"/>}
                                                            {fb.type==='enhancement' && <CheckCircle2 size={16} className="text-green-600"/>}
                                                            <span className={fb.type==='strength'?'text-blue-800':fb.type==='weakness'?'text-orange-800':'text-green-800'}>
                                                                {fb.type==='strength'?'강점 (Strength)':fb.type==='weakness'?'약점 (Weakness)':'보완점 (Suggestion)'}
                                                            </span>
                                                        </div>
                                                        <div className="text-gray-600 text-sm leading-relaxed space-y-1">
                                                            {items.map((item, idx) => (
                                                                <div key={idx} className="flex items-start gap-2">
                                                                    <span className={`text-base font-bold ${fb.type==='strength'?'text-blue-600':fb.type==='weakness'?'text-orange-600':'text-green-600'}`}>•</span>
                                                                    <span className="flex-1">{item}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : <p className="text-gray-400 italic">상세 분석 데이터가 없습니다.</p>}
                                </div>

                                {/* 5. 예상 질문 및 답변 (Questions & Answers) */}
                                <div className="print-section">
                                    <h3 className="text-lg font-bold uppercase tracking-wider text-gray-800 mb-4 border-l-4 border-purple-600 pl-3 flex items-center gap-2 print:mb-2">
                                        <BrainCircuit size={18} className="text-purple-600"/> AI 면접 예상 질문
                                    </h3>
                                    {questions.length > 0 ? (
                                        <div className="space-y-4 print:space-y-2">
                                            {questions.map((q, i) => (
                                                <div key={i} className="print-item">
                                                    {/* 질문 */}
                                                    <div className="flex gap-4 items-start bg-purple-50 p-5 rounded-xl border border-purple-100 print-color-box">
                                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold shrink-0 shadow-md print-color-box">Q{i+1}</span>
                                                        <p className="text-gray-800 font-medium leading-relaxed flex-1">{q}</p>
                                                    </div>
                                                    {/* 답변 */}
                                                    {answers[i] && (
                                                        <div className="flex gap-4 items-start bg-green-50 p-5 rounded-xl border border-green-100 mt-2 ml-10 print-color-box">
                                                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold shrink-0 shadow-md print-color-box">A</span>
                                                            <p className="text-gray-700 leading-relaxed flex-1 text-sm">{answers[i]}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="text-gray-400 italic">생성된 면접 질문이 없습니다.</p>}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}