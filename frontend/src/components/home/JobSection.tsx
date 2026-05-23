'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from 'next/navigation';
import { Search, Briefcase, Star, TrendingUp, RefreshCw, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import JobCard from './JobCard';
import { api } from "@/lib/api";
import { getAuthTokens } from "@/lib/auth"; 

interface JobPostingData {
    id: number;
    company_name: string;
    title: string;
    url: string;
    deadline: string | null; 
    logo_url?: string; 
}

interface JobSectionProps {
    techStackId: number;   
    techStackName: string; 
}

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function JobSection({ techStackId, techStackName }: JobSectionProps) {
    const router = useRouter();
    
    // Tabs
    const [tab, setTab] = useState<'all' | 'bookmark'>('all');

    // Data State
    const [visibleJobs, setVisibleJobs] = useState<JobPostingData[]>([]);
    const [allCachedJobs, setAllCachedJobs] = useState<JobPostingData[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1); 
    const ITEMS_PER_PAGE = 20;
    
    // Filters State
    const [searchQuery, setSearchQuery] = useState("");
    const [careerFilter, setCareerFilter] = useState("");
    const [jobFilter, setJobFilter] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false); 

    const debouncedSearchQuery = useDebounce(searchQuery, 300); 
    const debouncedCareer = useDebounce(careerFilter, 300);
    const debouncedJob = useDebounce(jobFilter, 300);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastJobElementRef = useCallback((node: HTMLDivElement) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && visibleJobs.length < allCachedJobs.length) {
                setPage(prev => prev + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, visibleJobs.length, allCachedJobs.length]);

    useEffect(() => {
        setAllCachedJobs([]);
        setVisibleJobs([]);
        setPage(1);
        loadAllJobs();
    }, [tab, debouncedSearchQuery, debouncedCareer, debouncedJob, techStackId]);

    useEffect(() => {
        if (allCachedJobs.length > 0) {
            const nextBatch = allCachedJobs.slice(0, page * ITEMS_PER_PAGE);
            setVisibleJobs(nextBatch);
        }
    }, [page, allCachedJobs]);

    const sortJobsByDeadline = (list: JobPostingData[]) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const validJobs = list.filter(job => {
            if (!job.deadline) return true;
            const deadlineDate = new Date(job.deadline);
            deadlineDate.setHours(0, 0, 0, 0);
            return deadlineDate >= today; 
        });

        return validJobs.sort((a, b) => {
            if (a.deadline && !b.deadline) return -1;
            if (!a.deadline && b.deadline) return 1;
            if (a.deadline && b.deadline) {
                return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
            }
            return b.id - a.id;
        });
    };

    const formatJobs = (rawJobs: any[]): JobPostingData[] => {
        return rawJobs.map((item: any) => ({
            id: item.id,
            company_name: item.corp?.name || item.company_name || "기업명 미상",
            title: item.title,
            url: item.url,
            deadline: item.expiry_date || null, 
            logo_url: item.corp?.logo_url 
        }));
    };

    const loadAllJobs = async () => {
        setLoading(true);
        try {
            let fetchedData: any[] = [];
            const { accessToken } = getAuthTokens();

            if (tab === 'bookmark') {
                if (!accessToken) {
                    setAllCachedJobs([]);
                    setLoading(false);
                    return;
                }
                const bookmarksRes = await api.get('/jobs/corp-bookmarks/');
                const bookmarks = bookmarksRes.data.results || bookmarksRes.data || [];
                
                const promises = bookmarks.map((b: any) => {
                    const corpId = b.corp?.id || b.corp_id;
                    if (!corpId) return Promise.resolve([]);
                    
                    const params: any = {};
                    if (debouncedCareer) params.career = debouncedCareer;
                    if (debouncedJob) params.job_title = debouncedJob;
                    
                    return api.get(`/jobs/corps/${corpId}/job-postings/`, { params })
                        .then(res => Array.isArray(res.data) ? res.data : res.data.results || [])
                        .catch(() => []);
                });
                
                const results = await Promise.all(promises);
                fetchedData = results.flat();
            } 
            else if (techStackId && techStackId !== 0) {
                const response = await api.get(`/jobs/by-tech/${techStackId}/`);
                let rawData = Array.isArray(response.data) ? response.data : response.data.results || [];
                
                if (debouncedSearchQuery) {
                    const q = debouncedSearchQuery.toLowerCase();
                    rawData = rawData.filter((j: any) => 
                        j.title?.toLowerCase().includes(q) || 
                        j.corp?.name?.toLowerCase().includes(q)
                    );
                }
                fetchedData = rawData;
            } 
            else {
                const params: any = {
                    page: 1, 
                    page_size: 3303, 
                    ordering: 'expiry_date' 
                };
                if (debouncedSearchQuery) params.search = debouncedSearchQuery;
                if (debouncedCareer) params.career_year = debouncedCareer;
                if (debouncedJob) params.job_title = debouncedJob;

                const response = await api.get('/jobs/job-postings/', { params });
                fetchedData = Array.isArray(response.data) ? response.data : response.data.results || [];
            }

            const formatted = formatJobs(fetchedData);
            const sortedAll = sortJobsByDeadline(formatted);
            setAllCachedJobs(sortedAll);

        } catch (error) {
            console.error("Job load failed:", error);
            setAllCachedJobs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMoreClick = () => {
        router.push('/map');
    };

    return (
        <section className="w-full h-full flex flex-col bg-[#25262B] rounded-[32px] border border-white/5 overflow-hidden relative shadow-lg">
            
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

            {/* Header Area */}
            {/* ✅ [수정] p-5에서 pb-0으로 하단 패딩 제거, 갭핑 제거 */}
            <div className="flex flex-col bg-[#2C2E33]/50 flex-shrink-0">
                
                {/* Title & Map Link */}
                <div className="flex justify-between items-center px-5 pt-5 pb-3">
                    <h1 className="font-bold text-white flex items-center gap-2 truncate text-xl">
                        {techStackId && techStackId !== 0 ? (
                            <><Briefcase className="text-blue-400" size={24} /> {techStackName} 채용 공고</>
                        ) : (
                            <><TrendingUp className="text-red-400" size={24} /> 채용 공고</>
                        )}
                    </h1>
                    <span 
                        onClick={handleMoreClick}
                        className="text-sm text-gray-500 cursor-pointer hover:text-blue-400 transition-colors whitespace-nowrap"
                    >
                        지도로 보기
                    </span>
                </div>

                {/* Tabs & Filter Toggle */}
                {/* ✅ [수정] justify-between으로 탭과 필터 버튼 양 끝 배치 */}
                {/* ✅ [수정] border-b를 여기에 적용하여 리스트와 구분 */}
                <div className="flex justify-between items-end px-5 border-b border-white/10">
                    <div className="flex gap-2 translate-y-[1px]"> {/* translate-y로 활성 탭이 선 위에 올라오게 연출 가능 */}
                        <button 
                            onClick={() => setTab('all')}
                            className={`px-4 py-2 text-sm font-bold transition-all border-b-2 ${tab === 'all' ? 'border-blue-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            전체 공고
                        </button>
                        <button 
                            onClick={() => setTab('bookmark')}
                            className={`px-4 py-2 text-sm font-bold transition-all border-b-2 flex items-center gap-1 ${tab === 'bookmark' ? 'border-yellow-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            <Star size={14} className={tab === 'bookmark' ? "fill-yellow-500 text-yellow-500" : ""} /> 즐겨찾기
                        </button>
                    </div>

                    {/* ✅ [수정] 필터 버튼을 탭 우측으로 이동 */}
                    <button 
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`mb-2 p-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-medium ${isFilterOpen ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        title="상세 필터"
                    >
                        <Filter size={14} /> 필터
                        {isFilterOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>

                {/* Filter Area (Accordion) */}
                <div 
                    className={`flex flex-col gap-3 overflow-hidden transition-all duration-300 ease-in-out bg-[#25262B] ${isFilterOpen ? 'max-h-40 opacity-100 py-4 px-5 border-b border-white/5' : 'max-h-0 opacity-0'}`}
                >
                    <div className="relative w-full group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors" size={16} />
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="기업명"
                            className="w-full h-10 bg-[#1A1B1E] border border-white/10 rounded-lg pl-9 pr-4 text-xm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>
                    
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <input 
                                type="text" 
                                value={jobFilter}
                                onChange={(e) => setJobFilter(e.target.value)}
                                placeholder="직무명"
                                className="w-full h-9 bg-[#1A1B1E] border border-white/10 rounded-lg px-3 text-xm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
                            />
                        </div>
                        <div className="flex-1 relative">
                            <input 
                                type="number" 
                                value={careerFilter}
                                onChange={(e) => setCareerFilter(e.target.value)}
                                placeholder="경력 (년)"
                                className="w-full h-9 bg-[#1A1B1E] border border-white/10 rounded-lg px-3 text-xm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* List with Infinite Scroll */}
            {/* ✅ [수정] pt-0으로 변경하여 상단 구분선과 간격 제거 */}
            <div className="flex-1 min-h-0 hover-scroll px-4 pb-4 pt-0 space-y-3 bg-[#1e1f23]">
                {/* 상단 간격을 위한 투명 div (선택사항, 리스트 첫 항목이 너무 딱 붙지 않게 하려면 pt-3 권장하지만 요청대로 제거함) */}
                <div className="h-3" /> 

                {visibleJobs.length > 0 ? (
                    visibleJobs.map((job, index) => {
                        if (index === visibleJobs.length - 1) {
                            return (
                                <div key={job.id} ref={lastJobElementRef}>
                                    <JobCard
                                        id={job.id}
                                        company={job.company_name}
                                        position={job.title}
                                        logo={job.logo_url}
                                        deadline={job.deadline}
                                        url={job.url}
                                    />
                                </div>
                            );
                        } else {
                            return (
                                <JobCard
                                    key={job.id}
                                    id={job.id}
                                    company={job.company_name}
                                    position={job.title}
                                    logo={job.logo_url}
                                    deadline={job.deadline}
                                    url={job.url}
                                />
                            );
                        }
                    })
                ) : (
                    !loading && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm py-10 gap-3 opacity-60">
                            <Briefcase size={40} strokeWidth={1.5} className="text-gray-600" />
                            <p className="text-center">조건에 맞는 공고가 없습니다.</p>
                        </div>
                    )
                )}
                
                {loading && (
                    <div className="py-4 flex justify-center items-center gap-2 text-gray-500 text-xs">
                        <RefreshCw className="w-4 h-4 animate-spin" /> 불러오는 중...
                    </div>
                )}
            </div>
        </section>
    );
}
