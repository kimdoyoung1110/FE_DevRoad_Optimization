'use client';

import { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Monitor, ArrowRightLeft, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios'; // 취소 토큰 확인용으로 유지

export const dynamic = 'force-dynamic';

import { AnalyzingState } from '@/components/ai-interview/States';
import UploadSection from '@/components/ai-interview/UploadSection';
import ResumePickerModal from '@/components/ai-interview/ResumePickerModal';
import ReportModal from '@/components/ai-interview/ReportModal';
import DashboardView from '@/components/ai-interview/DashboardView'; 

import { useSimulation } from '@/hooks/useSimulation';
import type { Resume } from '@/types';
import { api } from '@/lib/api'; // ✅ 이미 설정된 api 인스턴스 사용
import { useInterviewStore } from '@/store/interviewStore';

function DropdownButton({ onClick, icon, text, hasBorder = false }: any) {
    return (
        <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-5 text-sm hover:bg-white/5 text-left font-medium transition-colors ${hasBorder ? 'border-b border-white/5' : ''}`}>
            {icon} {text}
        </button>
    );
}

function ScrollbarStyles() {
    return (
        <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar { width: 5px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 20px; transition: background 0.3s ease; }
            .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); }
            .custom-scrollbar::-webkit-scrollbar-thumb:active { background: rgba(255, 255, 255, 0.3); }
        `}</style>
    );
}

function AIInterviewContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // 파일 업로드 취소용 AbortController Ref
    const abortControllerRef = useRef<AbortController | null>(null);

    const { 
        step, setStep, 
        taskId, analyzingResumeId, setAnalysisInfo, 
        startProcess, completeProcess, resetProcess,
        setProgress 
    } = useInterviewStore();

    const [showDropdown, setShowDropdown] = useState(false);
    const [isResumePickerOpen, setIsResumePickerOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false); 
    const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [isLoadingResumes, setIsLoadingResumes] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const [reportData, setReportData] = useState<{
        feedbacks: any[];
        questions: string[];
        answers: string[];
        jobPostingTitle?: string;
    }>({ feedbacks: [], questions: [], answers: [], jobPostingTitle: undefined });

    const simulationData = useSimulation();

    // 이력서 상세 정보 가져오기
    const fetchResumeDetails = async (resumeId: number): Promise<Resume> => {
        const response = await api.get(`/resumes/${resumeId}/`);
        const resumeData = response.data;
        return {
            id: resumeData.resume_id || resumeData.id,
            title: resumeData.resume_title || resumeData.title,
            url: resumeData.resume_url || resumeData.url,
            extractedText: resumeData.extracted_text || null,
            techStacks: resumeData.tech_stacks?.map((ts: any) => ({
                techStack: {
                    id: ts.tech_stack?.id || ts.id,
                    name: ts.tech_stack?.name || ts.name,
                    logo: ts.tech_stack?.logo || ts.tech_stack?.image || ts.image || null,
                    docsUrl: ts.tech_stack?.docs_url || ts.tech_stack?.link || ts.link || null,
                    createdAt: '',
                }
            })) || [],
            createdAt: resumeData.created_at,
            updatedAt: resumeData.updated_at,
        };
    };

    // 페이지 진입 시 초기화 (URL 파라미터가 없으면 분석중이 아닐 때만 초기화)
    useEffect(() => {
        const resumeIdParam = searchParams?.get('resumeId');
        const pickResumeParam = searchParams?.get('pickResume');

        // URL 파라미터가 없고, 분석 중이 아닐 때만 상태 초기화
        if (!resumeIdParam && !pickResumeParam && step !== 'analyzing') {
            resetProcess();
            setSelectedResume(null);
        }
    }, []); // 컴포넌트 마운트 시 1회만 실행

    // 상태 복구 로직 (URL 파라미터가 있을 때만)
    useEffect(() => {
        const resumeIdParam = searchParams?.get('resumeId');
        
        const restoreState = async () => {
            // URL 파라미터가 있고, 분석 결과 상태일 때만 복구
            if (resumeIdParam && step === 'result' && analyzingResumeId && !selectedResume) {
                try {
                    const detailedResume = await fetchResumeDetails(analyzingResumeId);
                    setSelectedResume(detailedResume);
                } catch (e) {
                    console.error("이력서 복구 실패", e);
                    setStep('empty');
                }
            }
        };
        restoreState();
    }, [step, analyzingResumeId, selectedResume, setStep, searchParams]);

    // 분석 상태 폴링
    const { data: analysisData, error: pollingError } = useQuery({
        queryKey: ['analysisStatus', taskId],
        queryFn: async () => {
            if (!taskId) return null;
            
            // 폴링 시 진행률 시뮬레이션
            const currentProgress = useInterviewStore.getState().progress;
            if (currentProgress < 90) {
                useInterviewStore.getState().setProgress(currentProgress + (Math.random() * 3));
            }

            const { data } = await api.get(`/resumes/analyze/status/${taskId}/`);
            return data;
        },
        enabled: !!taskId && step === 'analyzing',
        refetchInterval: 2000,
    });

    // 분석 완료/실패 처리
    useEffect(() => {
        if (!analysisData || step !== 'analyzing') return;

        if (analysisData.status === 'SUCCESS') {
            const finishAnalysis = async () => {
                setProgress(100);
                setAnalysisInfo(null, analyzingResumeId);
                
                const resumeIdToFetch = analyzingResumeId;
                if (!resumeIdToFetch) {
                    setAnalysisError('분석된 이력서 ID 오류');
                    setStep('empty');
                    return;
                }
                
                try {
                    const detailedResume = await fetchResumeDetails(resumeIdToFetch);
                    setSelectedResume(detailedResume);
                    setStep('result');
                    completeProcess(); 
                } catch (error) {
                    setAnalysisError('분석 결과 로드 실패');
                    setStep('empty');
                }
            };
            finishAnalysis();
        } else if (analysisData.status === 'FAILURE') {
            setAnalysisInfo(null, null);
            setAnalysisError(analysisData.result || '분석 실패');
            setStep('empty');
            setProgress(0);
        }
    }, [analysisData, step, analyzingResumeId, setAnalysisInfo, setStep, completeProcess, setProgress]);

    // 폴링 에러 처리
    useEffect(() => {
        if (pollingError) {
            setAnalysisInfo(null, null);
            setAnalysisError('분석 상태 확인 오류');
            setStep('empty');
            setProgress(0);
        }
    }, [pollingError, setAnalysisInfo, setStep, setProgress]);

   const resumeKeywords = useMemo(() => {
        if (!selectedResume) return [];
        if (selectedResume.techStacks && selectedResume.techStacks.length > 0) {
            return selectedResume.techStacks.map(item => item.techStack.name);
        }
        return ['React', 'TypeScript', 'Node.js', 'AWS'];
    }, [selectedResume]);

    const resumeMatchScore = useMemo(() => {
        if (!simulationData.selectedCompany) return 0;
        return Math.min(simulationData.selectedCompany.baseScore + (resumeKeywords.length * 8), 98);
    }, [simulationData.selectedCompany, resumeKeywords]);

    const fetchResumes = async () => {
        setIsLoadingResumes(true);
        try {
            const response = await api.get('/resumes/');
            const resumeList = response.data.results || response.data || [];
            
            const formattedResumes: Resume[] = resumeList.map((resumeData: any) => ({
                id: resumeData.resume_id || resumeData.id,
                title: resumeData.resume_title || resumeData.title,
                url: resumeData.resume_url || resumeData.url,
                extractedText: null,
                techStacks: resumeData.tech_stacks?.map((ts: any) => ({
                    techStack: {
                        id: ts.tech_stack?.id || ts.id,
                        name: ts.tech_stack?.name || ts.name,
                        logo: ts.tech_stack?.logo || null,
                        docsUrl: ts.tech_stack?.docs_url || null,
                        createdAt: '',
                    }
                })) || [],
                createdAt: resumeData.created_at,
                updatedAt: resumeData.updated_at,
            }));
            setResumes(formattedResumes);
        } catch (error) {
            setResumes([]);
        } finally {
            setIsLoadingResumes(false);
        }
    };

    // 파라미터나 선택 이벤트로 인한 이력서 로드
    useEffect(() => {
        const resumeIdParam = searchParams?.get('resumeId');
        if (resumeIdParam && !taskId && step !== 'result') {
            const rid = parseInt(resumeIdParam, 10);
            const autoLoad = async () => {
                try {
                    const detailedResume = await fetchResumeDetails(rid);
                    if (detailedResume.techStacks && detailedResume.techStacks.length > 0) {
                        setSelectedResume(detailedResume);
                        setStep('result');
                        setAnalysisInfo(null, rid);
                        return;
                    }
                } catch (e) {}
                handleStartAnalysis(rid);
            };
            autoLoad();
        } else if (searchParams?.get('pickResume') === '1') {
            setIsResumePickerOpen(true);
        }
    }, [searchParams]);

    useEffect(() => {
        if (isResumePickerOpen) fetchResumes();
    }, [isResumePickerOpen]);

    // 초기화 및 취소 이벤트 리스너
    useEffect(() => {
        const handleReset = () => {
            // analyzing 상태일 때는 초기화하지 않음
            if (step === 'analyzing') {
                return;
            }

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }

            resetProcess();
            setSelectedResume(null);
            setShowDropdown(false);
            setAnalysisError(null);
            router.replace('/ai-interview');
        };

        const handleCancelAnalysis = () => {
            // 분석 취소는 무조건 실행
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }

            resetProcess();
            setSelectedResume(null);
            setShowDropdown(false);
            setAnalysisError(null);
            router.replace('/ai-interview');
        };

        window.addEventListener('resetAIInterview', handleReset);
        window.addEventListener('cancelAnalysis', handleCancelAnalysis);
        return () => {
            window.removeEventListener('resetAIInterview', handleReset);
            window.removeEventListener('cancelAnalysis', handleCancelAnalysis);
        };
    }, [router, resetProcess, step]);

    // 분석 시작 (백엔드 요청)
    const handleStartAnalysis = async (resumeId: number) => {
        setAnalysisError(null);
        setStep('analyzing');
        setAnalysisInfo(null, resumeId);
        startProcess('AI 정밀 분석 중...');
        setProgress(35);
        setShowDropdown(false);
        setIsResumePickerOpen(false);

        try {
            const response = await api.post(`/resumes/${resumeId}/analyze/`);
            if (useInterviewStore.getState().step === 'empty') return; // 취소 확인

            setAnalysisInfo(response.data.task_id, resumeId);
            setProgress(40);
        } catch (error: any) {
            if (useInterviewStore.getState().step === 'empty') return;
            const message = error.response?.data?.error || "이력서 분석 실패";
            setAnalysisError(message);
            setStep('empty');
            setProgress(0);
        }
    };
    
    // 이력서 선택 핸들러
    const handleSelectResume = async (resume: Resume) => {
        setIsResumePickerOpen(false);
        try {
            const detailedResume = await fetchResumeDetails(resume.id);
            if (detailedResume.techStacks && detailedResume.techStacks.length > 0) {
                setSelectedResume(detailedResume);
                setStep('result');
                setAnalysisInfo(null, resume.id);
                return;
            }
        } catch (error) { console.error(error); }

        handleStartAnalysis(resume.id);
    };

    // ✅ [수정] 파일 업로드 핸들러 (404 오류 해결: api 인스턴스 사용)
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. 같은 파일 재선택 가능하도록 초기화
        e.target.value = '';

        setStep('analyzing');
        setAnalysisError(null);
        startProcess('이력서 업로드 중...');
        setProgress(0);

        abortControllerRef.current = new AbortController();

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name.replace(/\.[^/.]+$/, "")); 
            
            // ✅ Axios 직접 사용 대신, 설정된 api 인스턴스 사용
            // 이렇게 하면 Base URL과 토큰이 자동으로 처리됩니다.
            const uploadResponse = await api.post('/resumes/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                signal: abortControllerRef.current.signal,
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        const scaledProgress = Math.round(percentCompleted * 0.3);
                        setProgress(scaledProgress);
                    }
                }
            });

            const newResume = uploadResponse.data;
            const resumeId = newResume.resume_id || newResume.id;
            
            setProgress(30);
            
            if (useInterviewStore.getState().step === 'empty') return;

            handleStartAnalysis(resumeId);

        } catch (error: any) {
            // 취소된 요청인지 확인
            if (axios.isCancel(error) || error.name === 'CanceledError') {
                console.log("업로드 취소됨");
            } else {
                console.error("업로드 오류:", error);
                const errorMessage = error.response?.data?.error || error.message || '업로드 중 오류 발생';
                setAnalysisError(errorMessage);
                setStep('empty');
                setProgress(0);
            }
        } finally {
            abortControllerRef.current = null;
        }
    };
    
    // 에러 표시
    useEffect(() => {
        if (analysisError) {
            alert(analysisError);
            setAnalysisError(null);
        }
    }, [analysisError]);

    const handleDeleteResume = async (id: number) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        try {
            await api.delete(`/resumes/${id}/`);
            alert("이력서가 삭제되었습니다.");
            fetchResumes();
        } catch (error) { alert("삭제 실패"); }
    };
    
    const triggerFileUpload = () => fileInputRef.current?.click();

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[#1A1B1E] flex flex-col items-center justify-start text-white overflow-y-auto print:h-auto print:overflow-visible print:bg-white">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx" />
            
            <div id="main-layout" className="max-w-[1800px] w-full h-full flex flex-col p-6 lg:p-10 scale-[0.95] origin-top">
                <header className="flex justify-between items-center mb-4 shrink-0">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tighter uppercase">AI 역량 분석 리포트</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {step === 'result' && (
                            <>
                                <button 
                                    onClick={() => setIsReportModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full font-bold text-sm shadow-lg hover:shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                                >
                                    <FileText size={16} />
                                    <span>통합 리포트</span>
                                </button>

                                <div className="relative">
                                    <button 
                                        onClick={() => setShowDropdown(!showDropdown)} 
                                        className="w-10 h-10 rounded-full bg-[#25262B] border border-white/10 flex items-center justify-center hover:bg-[#2C2D33] transition-colors group"
                                    >
                                        <ArrowRightLeft size={18} className="text-white group-hover:text-blue-400 transition-colors" />
                                    </button>
                                    <AnimatePresence>
                                        {showDropdown && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-3 w-60 bg-[#212226] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                                                <DropdownButton onClick={() => { setShowDropdown(false); setIsResumePickerOpen(true); }} icon={<User size={18} className="text-blue-400" />} text="마이페이지에서 선택" hasBorder />
                                                <DropdownButton onClick={triggerFileUpload} icon={<Monitor size={18} className="text-purple-400" />} text="내 컴퓨터에서 선택" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        )}
                    </div>
                </header>

                <ResumePickerModal 
                    open={isResumePickerOpen} 
                    resumes={resumes} 
                    isLoading={isLoadingResumes}
                    onClose={() => setIsResumePickerOpen(false)} 
                    onSelect={handleSelectResume} 
                    onDelete={handleDeleteResume}
                />

                <main className="flex-1 min-h-0">
                    <AnimatePresence mode="wait">
                        {step === 'empty' && (
                            <UploadSection onUploadClick={triggerFileUpload} onMyPageClick={() => setIsResumePickerOpen(true)} />
                        )}

                        {step === 'analyzing' && <AnalyzingState key="analyzing" />}

                        {step === 'result' && selectedResume && (
                            <DashboardView 
                                key="dashboard"
                                resumeTitle={selectedResume.title || '나의 이력서'}
                                resumeText={selectedResume.extractedText || null}
                                resumeId={selectedResume.id}
                                resumeKeywords={resumeKeywords}
                                selectedCompany={simulationData.selectedCompany}
                                setSelectedCompany={simulationData.toggleCompany} 
                                toggleFavorite={simulationData.toggleFavorite}
                                matchScore={resumeMatchScore}
                                onOpenReport={() => setIsReportModalOpen(true)}
                                onDataUpdate={setReportData}
                            />
                        )}
                    </AnimatePresence>
                </main>
            </div>
            
            <ScrollbarStyles />

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                resumeTitle={selectedResume?.title || 'Unknown'}
                resumeText={selectedResume?.extractedText || null}
                selectedCompany={simulationData.selectedCompany}
                selectedKeywords={resumeKeywords}
                feedbacks={reportData.feedbacks}
                questions={reportData.questions}
                answers={reportData.answers}
                totalScore={resumeMatchScore}
                jobPostingTitle={reportData.jobPostingTitle}
            />
        </div>
    );
}

export default function AIInterviewPage() {
    return (
        <Suspense fallback={<div className="h-screen bg-[#1A1B1E] text-white flex items-center justify-center">Loading...</div>}>
            <AIInterviewContent />
        </Suspense>
    );
}