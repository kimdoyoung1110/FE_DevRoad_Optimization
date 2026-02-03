"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, TrendingUp, Scale, ExternalLink, Star, Trophy, AlertCircle, Building2, FileText, RefreshCw } from "lucide-react"; 
import TrendChart from "./TrendChart";
import StackComparison, { StackData } from "./Comparison";
import StackRelationAnalysis from "./RelationAnalysis";
import JobSection from "./JobSection";
import { api } from "@/lib/api"; 
import { getAuthTokens } from "@/lib/auth"; 

import LoginCheckModal from "@/components/LoginCheckModal";
import LoginModal from "@/components/LoginModal";

import { getTechStackRelations, getTechStackById, RelatedTechStackRelation, getExternalLogoUrl, fetchTop5ByTrends, TopTechStackItem, fetchTechTrends, TechTrendChartItem } from "@/services/trendService";
import { TechStackData } from "@/types/trend";
import type { ChartPeriod } from "./TrendChart";

// 커스텀 노드 아이콘
const NetworkIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="3" />
    <circle cx="6" cy="6" r="2" />
    <circle cx="18" cy="6" r="2" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
    <line x1="10" y1="10" x2="7.5" y2="7.5" />
    <line x1="14" y1="10" x2="16.5" y2="7.5" />
    <line x1="10" y1="14" x2="7.5" y2="16.5" />
    <line x1="14" y1="14" x2="16.5" y2="16.5" />
  </svg>
);

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface DashboardStackData extends StackData {
  officialSite: string;
  created_at?: string; 
}

const EMPTY_STACK: DashboardStackData = {
    id: 0,
    name: "",
    postCount: 0,
    jobCount: 0,
    growth: 0,
    color: "",
    logo: "",
    themeColor: "",
    description: "",
    officialSite: "",
    created_at: ""
};

// Helper function to calculate monthly average for TechTrendChartItem
function calculateMonthlyAverage(data: TechTrendChartItem[]): TechTrendChartItem[] {
  const monthlyData: { [key: string]: { sumJobMentions: number; sumJobChangeRate: number; sumArticleMentions: number; sumArticleChangeRate: number; count: number } } = {};

  data.forEach(item => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`; // YYYY-MM format

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        sumJobMentions: 0,
        sumJobChangeRate: 0,
        sumArticleMentions: 0,
        sumArticleChangeRate: 0,
        count: 0
      };
    }

    monthlyData[monthKey].sumJobMentions += item.job_mention_count;
    monthlyData[monthKey].sumJobChangeRate += item.job_change_rate ?? 0;
    monthlyData[monthKey].sumArticleMentions += item.article_mention_count;
    monthlyData[monthKey].sumArticleChangeRate += item.article_change_rate ?? 0;
    monthlyData[monthKey].count++;
  });

  const averagedData: TechTrendChartItem[] = Object.keys(monthlyData).map(monthKey => {
    const monthStats = monthlyData[monthKey];
    const avgDate = new Date(monthKey + '-01'); // Represent as the first day of the month
    
    return {
      date: avgDate.toISOString().slice(0, 10), // YYYY-MM-DD format
      job_mention_count: monthStats.sumJobMentions / monthStats.count,
      job_change_rate: monthStats.sumJobChangeRate / monthStats.count,
      article_mention_count: monthStats.sumArticleMentions / monthStats.count,
      article_change_rate: monthStats.sumArticleChangeRate / monthStats.count,
    };
  });

  return averagedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export default function Dashboard() {
    const [isLanding, setIsLanding] = useState(true); 
    const [activeStack, setActiveStack] = useState<DashboardStackData>(EMPTY_STACK);
    const [viewMode, setViewMode] = useState<"graph" | "compare" | "chart">("graph");
    
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchBlurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    const [filteredStacks, setFilteredStacks] = useState<DashboardStackData[]>([]); 
    const [topStacks, setTopStacks] = useState<DashboardStackData[]>([]); 
    const [isSearching, setIsSearching] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    
    const [relatedStacks, setRelatedStacks] = useState<RelatedTechStackRelation[]>([]);
    const [isLoadingRelations, setIsLoadingRelations] = useState(false);

    const [stackFavorites, setStackFavorites] = useState<number[]>([]);

    const [chartPeriod, setChartPeriod] = useState<ChartPeriod>(30);
    const [chartData, setChartData] = useState<TechTrendChartItem[]>([]);
    const [chartDataLoading, setChartDataLoading] = useState(false);
    
    const [stats, setStats] = useState({ corps: 0, jobs: 0, loading: true });

    const [showLoginCheck, setShowLoginCheck] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    useEffect(() => {
        return () => {
            if (searchBlurTimeoutRef.current) clearTimeout(searchBlurTimeoutRef.current);
        };
    }, []);

    const formatSearchResults = (apiResults: any[]): DashboardStackData[] => {
        return apiResults.map((stack: any, index) => ({
            id: stack.id,
            name: stack.name,
            postCount: Number(stack.article_stack_count) || Number(stack.count) || 0,
            jobCount: Number(stack.job_stack_count) || Number(stack.job_posting_count) || 0,
            growth: 0,
            color: index % 2 === 0 ? "from-blue-500 to-indigo-500" : "from-green-500 to-emerald-500",
            logo: stack.logo || getExternalLogoUrl(stack.name), 
            themeColor: "#3B82F6", 
            description: stack.description || "상세 설명이 없습니다.",
            officialSite: stack.docs_url || "#",
            created_at: stack.created_at
        }));
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setIsInitialLoading(true);
            try {
                const { accessToken } = getAuthTokens();
                if (accessToken) {
                    try {
                        const bookmarksResponse = await api.get('/trends/tech-bookmarks/');
                        const bookmarks = bookmarksResponse.data.results || bookmarksResponse.data || [];
                        const favoriteIds = bookmarks.map((b: any) => {
                            const techStack = b.tech_stack || b;
                            return techStack.tech_stack_id || techStack.id;
                        });
                        setStackFavorites(favoriteIds);
                    } catch (error) {
                        console.error('즐겨찾기 목록 불러오기 실패:', error);
                    }
                }

                const top5Data = await fetchTop5ByTrends();
                if (top5Data.length > 0) {
                    const finalTop5 = top5Data.map((stack: TopTechStackItem, index: number) => ({
                        id: stack.id,
                        name: stack.name,
                        postCount: 0,
                        jobCount: stack.total_mentions || 0,
                        growth: 0,
                        logo: stack.logo || getExternalLogoUrl(stack.name),
                        themeColor: "#3B82F6",
                        description: "상세 설명이 없습니다.",
                        officialSite: stack.docs_url || "#",
                        created_at: "",
                        color: index % 2 === 0 ? "from-blue-500 to-indigo-500" : "from-green-500 to-emerald-500"
                    }));
                    setTopStacks(finalTop5);
                    setActiveStack(finalTop5[0]);
                } else {
                    setTopStacks([]);
                    setActiveStack(EMPTY_STACK);
                }

                try {
                    const statsRes = await api.get('/jobs/stats/');
                    setStats({
                        corps: statsRes.data.corps_count ?? 0,
                        jobs: statsRes.data.job_postings_count ?? 0,
                        loading: false
                    });
                } catch (statError) {
                    console.error("통계 데이터 계산 실패:", statError);
                    setStats(prev => ({ ...prev, loading: false }));
                }

            } catch (e) {
                console.error("Initial load error:", e);
                setTopStacks([]);
            } finally {
                setIsInitialLoading(false);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        const handleReset = () => {
            setIsLanding(true);
            setSearchQuery("");
            setFilteredStacks([]);
            if (topStacks.length > 0) {
                setActiveStack(topStacks[0]);
            }
        };
        window.addEventListener('resetDashboard', handleReset);
        return () => window.removeEventListener('resetDashboard', handleReset);
    }, [topStacks]);

    // ✅ [수정] 기술 스택 검색: API 직접 호출 방식으로 변경
    useEffect(() => {
        if (!debouncedSearchQuery.trim()) {
            setFilteredStacks([]);
            setIsSearching(false);
            return;
        }

        const fetchStacks = async () => {
            setIsSearching(true);
            try {
                // search 파라미터 사용
                const response = await api.get('/trends/tech-stacks/', {
                    params: { search: debouncedSearchQuery }
                });
                
                const data = response.data;
                const apiResults = Array.isArray(data) ? data : (data.results || []);

                const uniqueById = Array.from(new Map(apiResults.map((s: any) => [s.id, s])).values());
                const formattedResults = formatSearchResults(uniqueById);
                
                setFilteredStacks(formattedResults);
            } catch (error) {
                console.error("Stack search failed:", error);
                setFilteredStacks([]); 
            } finally {
                setIsSearching(false);
            }
        };
        fetchStacks();
    }, [debouncedSearchQuery]);

    useEffect(() => {
        if (!activeStack?.id) {
            setRelatedStacks([]);
            return;
        }

        const loadRelations = async () => {
            setRelatedStacks([]);
            setIsLoadingRelations(true);
            try {
                const relationsData = await getTechStackRelations(activeStack.id);
                const allRelatedStacks: RelatedTechStackRelation[] = [];
                if (relationsData && relationsData.relationships) {
                    Object.keys(relationsData.relationships).forEach(relType => {
                        const items = relationsData.relationships[relType];
                        if (Array.isArray(items)) {
                            allRelatedStacks.push(...items);
                        }
                    });
                }
                const uniqueStacksMap = new Map<number, RelatedTechStackRelation>();
                allRelatedStacks.forEach(relation => {
                    const stackId = relation.tech_stack.id;
                    if (!uniqueStacksMap.has(stackId) || uniqueStacksMap.get(stackId)!.weight < relation.weight) {
                        uniqueStacksMap.set(stackId, relation);
                    }
                });
                const uniqueStacks = Array.from(uniqueStacksMap.values());
                const sortedByWeight = uniqueStacks.sort((a, b) => b.weight - a.weight);
                setRelatedStacks(sortedByWeight);
            } catch (error) {
                console.error("Failed to load tech stack relations:", error);
                setRelatedStacks([]);
            } finally {
                setIsLoadingRelations(false);
            }
        };
        loadRelations();
    }, [activeStack?.id]);

    useEffect(() => {
        if (isLanding || !activeStack?.id) {
            setChartData([]);
            return;
        }
        const load = async () => {
            setChartDataLoading(true);
            try {
                let apiPeriod: 7 | 30 | 90 | 365 = 30;
                if (chartPeriod === 'weekly' || chartPeriod === 7) apiPeriod = 7;
                else if (chartPeriod === 'monthly' || chartPeriod === 30) apiPeriod = 30;
                else if (chartPeriod === 90) apiPeriod = 90;
                else if (chartPeriod === 365) apiPeriod = 365;

                let rows = await fetchTechTrends(activeStack.id, apiPeriod);
                if (apiPeriod === 365) {
                    rows = calculateMonthlyAverage(rows);
                }

                // Filtering to keep only the last 12 months of data from today
                const now = new Date();
                const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

                rows = rows.filter(item => {
                    const itemDate = new Date(item.date);
                    // Compare date parts only, by setting hours to 0 for accurate day comparison
                    itemDate.setHours(0, 0, 0, 0);
                    twelveMonthsAgo.setHours(0, 0, 0, 0);
                    return itemDate >= twelveMonthsAgo;
                });
                
                setChartData(rows);
            } catch (e) {
                console.error('트렌드 그래프 로드 실패:', e);
                setChartData([]);
            } finally {
                setChartDataLoading(false);
            }
        };
        load();
    }, [isLanding, activeStack?.id, chartPeriod]);

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, name: string) => {
        const target = e.target as HTMLImageElement;
        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128&bold=true`;
    };

    const toggleStackFavorite = async (id: number) => {
        const { accessToken } = getAuthTokens();
        if (!accessToken) {
            setShowLoginCheck(true); 
            return;
        }
        try {
            const isFavorite = stackFavorites.includes(id);
            if (isFavorite) {
                const bookmarksResponse = await api.get('/trends/tech-bookmarks/');
                const bookmarks = bookmarksResponse.data.results || bookmarksResponse.data || [];
                const bookmarkToDelete = bookmarks.find((b: any) => {
                    const techStack = b.tech_stack || b;
                    return (techStack.tech_stack_id || techStack.id) === id;
                });
                if (bookmarkToDelete) {
                    await api.delete(`/trends/tech-bookmarks/${bookmarkToDelete.tech_bookmark_id || bookmarkToDelete.id}/`);
                    const nextFavorites = stackFavorites.filter(favId => favId !== id);
                    setStackFavorites(nextFavorites);
                    window.dispatchEvent(new CustomEvent('favoriteChanged', { detail: { type: 'tech', action: 'removed', id } }));
                }
            } else {
                await api.post('/trends/tech-bookmarks/', { tech_id: id });
                const nextFavorites = [...stackFavorites, id];
                setStackFavorites(nextFavorites);
                window.dispatchEvent(new CustomEvent('favoriteChanged', { detail: { type: 'tech', action: 'added', id } }));
            }
        } catch (error) {
            console.error('즐겨찾기 토글 실패:', error);
        }
    };

    const handleTopStackClick = (stack: DashboardStackData) => {
        setActiveStack(stack);
        setIsLanding(false); 
        setSearchQuery("");
        setFilteredStacks([]);
        setViewMode("graph");
    };

    return (
      <div className="w-full h-full">
        <LoginCheckModal 
            isOpen={showLoginCheck} 
            onClose={() => setShowLoginCheck(false)}
            onConfirm={() => {
                setShowLoginCheck(false);
                setShowLoginModal(true);
            }}
        />
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

        <div className="grid grid-cols-1 gap-6 h-full lg:grid-cols-12 min-h-0">
            
            <div className="h-[800px] lg:col-span-9 lg:h-full lg:min-h-0 flex flex-col gap-6 p-6 bg-[#212226] rounded-[32px] border border-white/5 relative overflow-hidden shadow-2xl">
                
                <div className={`flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative ${searchQuery.length > 0 && isSearchFocused ? 'z-[200]' : 'z-10'}`}>
                    
                    {isLanding ? (
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <Trophy className="text-blue-400" size={48} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-2">전체 언급량 Top 5</h2>
                                <p className="text-gray-400 text-lg">검색창으로 원하는 기술 스택을 검색해보세요.</p>
                            </div>
                        </div>
                    ) : (
                        activeStack.id !== 0 ? (
                            <div className="flex items-start gap-4 max-w-2xl">
                                <div className={`w-20 h-20 shrink-0 rounded-2xl bg-gradient-to-br ${activeStack.color} p-[2px] shadow-lg`}>
                                    <div className="w-full h-full bg-[#2A2B30] rounded-2xl flex items-center justify-center p-3 overflow-hidden">
                                        <img 
                                            src={activeStack.logo || ""} 
                                            alt={activeStack.name} 
                                            className="w-full h-full object-contain object-center"
                                            onError={(e) => handleImageError(e, activeStack.name)}
                                        />
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-3xl font-bold text-white tracking-tight">{activeStack.name}</h2>
                                        <button 
                                            onClick={() => toggleStackFavorite(activeStack.id)}
                                            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                                        >
                                            <Star 
                                                size={20} 
                                                fill={stackFavorites.includes(activeStack.id) ? "#FACC15" : "none"} 
                                                className={stackFavorites.includes(activeStack.id) ? "text-yellow-400" : "text-gray-400"}
                                            />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3 text-[#9FA0A8] text-base mb-2">
                                        <p className="text-base text-gray-400 leading-relaxed line-clamp-2">
                                            {activeStack.description}
                                        </p>
                                        {(activeStack.postCount + activeStack.jobCount) > 0 && (
                                            <span className="text-base font-bold text-blue-400">
                                                총 언급량 {(activeStack.postCount + activeStack.jobCount).toLocaleString()}회
                                            </span>
                                        )}
                                        {activeStack.officialSite && activeStack.officialSite !== '#' && (
                                            <a 
                                                href={activeStack.officialSite} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="text-base hover:text-blue-400 transition-colors flex items-center gap-1 ml-2"
                                            >
                                                공식문서 <ExternalLink size={14}/>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : null
                    )}

                    <div className="flex items-center gap-4 w-full xl:w-auto">
                        <div className={`relative flex-1 group transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] w-full xl:w-72 focus-within:xl:w-[480px] ${searchQuery.length > 0 && isSearchFocused ? 'z-[210]' : ''}`}>
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-400 transition-colors" size={20} />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoComplete="off"
                                spellCheck={false}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                placeholder="기술 스택 검색..."
                                className="w-full h-16 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-xl text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-all shadow-inner"
                            />
                            
                            <AnimatePresence>
                                {(searchQuery.length > 0 && isSearchFocused) && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-[#2A2B30] border border-white/10 rounded-xl shadow-xl overflow-hidden z-[110] max-h-60 overflow-y-auto"
                                    >
                                        {isSearching ? (
                                            <div className="p-4 text-center text-white/40 text-xl">DB 검색 중...</div>
                                        ) : filteredStacks.length > 0 ? (
                                            filteredStacks.map((stack, idx) => (
                                                <button
                                                    key={`search-${stack.id}-${idx}`}
                                                    onClick={() => {
                                                        setActiveStack(stack);
                                                        setIsLanding(false); 
                                                        setSearchQuery(""); 
                                                        setFilteredStacks([]);
                                                        setViewMode("graph");
                                                    }}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-white/10 p-1 flex items-center justify-center overflow-hidden shrink-0">
                                                        <img 
                                                            src={stack.logo || ""} 
                                                            alt={stack.name} 
                                                            className="w-full h-full object-contain" 
                                                            onError={(e) => handleImageError(e, stack.name)}
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-white text-xl font-medium truncate">{stack.name}</div>
                                                        <div className="text-white/40 text-sm truncate max-w-[180px]">{stack.description}</div>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-white/40 text-sm">검색 결과가 없습니다.</div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {!isLanding && activeStack.id !== 0 && (
                            <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/10">
                                <button 
                                    onClick={() => setViewMode("graph")} 
                                    className={`p-3 rounded-xl transition-all ${viewMode === "graph" ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white"}`}
                                    title="연관 기술 맵"
                                >
                                    <NetworkIcon size={28} />
                                </button>
                                <button 
                                    onClick={() => setViewMode("compare")} 
                                    className={`p-3 rounded-xl transition-all ${viewMode === "compare" ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white"}`}
                                    title="기술 비교"
                                >
                                    <Scale size={28} />
                                </button>
                                <button 
                                    onClick={() => setViewMode("chart")} 
                                    className={`p-3 rounded-xl transition-all ${viewMode === "chart" ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white"}`}
                                    title="트렌드 차트"
                                >
                                    <TrendingUp size={28} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 relative min-h-0 min-w-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <div className="w-full h-full">
                            {isLanding ? (
                                <motion.div 
                                    key="landing-top5"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full flex flex-col justify-center items-center py-2 px-4"
                                >
                                    {topStacks.length === 0 ? (
                                        <div className="text-center text-gray-500 opacity-60">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4" />
                                            <p>데이터 분석 중...</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-6 w-full max-w-7xl">
                                            {/* ... Top5 Cards Code ... */}
                                            <div className="flex justify-center gap-6 mb-8">
                                                <div className="flex items-center gap-2 bg-[#2A2B30] border border-white/5 px-5 py-2 rounded-full shadow-lg">
                                                    <Building2 className="w-5 h-5 text-purple-400" />
                                                    <span className="text-gray-300 font-medium">분석된 기업</span>
                                                    {stats.loading ? <RefreshCw className="w-4 h-4 animate-spin text-gray-500" /> : <span className="text-white font-bold text-lg">{stats.corps.toLocaleString()}개</span>}
                                                </div>
                                                <div className="flex items-center gap-2 bg-[#2A2B30] border border-white/5 px-5 py-2 rounded-full shadow-lg">
                                                    <FileText className="w-5 h-5 text-blue-400" />
                                                    <span className="text-gray-300 font-medium">수집된 공고</span>
                                                    {stats.loading ? <RefreshCw className="w-4 h-4 animate-spin text-gray-500" /> : <span className="text-white font-bold text-lg">{stats.jobs.toLocaleString()}건</span>}
                                                </div>
                                            </div>
                                            <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-2 lg:gap-4">
                                                {/* Rank 2 */}
                                                {topStacks[1] && (
                                                    <motion.button onClick={() => handleTopStackClick(topStacks[1])} className="order-2 md:order-1 w-full md:w-56 group relative">
                                                        <div className="relative bg-[#2A2B30]/60 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 flex flex-col items-center gap-5 hover:border-gray-400/30 transition-all shadow-2xl min-h-[200px]">
                                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gray-400/20 border border-gray-400/50 px-4 py-1 rounded-full text-gray-300 text-sm font-bold shadow-lg">2등</div>
                                                            <div className="w-16 h-16 bg-white/5 rounded-2xl p-3 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                                                <img src={topStacks[1].logo} alt="" className="w-full h-full object-contain" onError={(e) => handleImageError(e, topStacks[1].name)} />
                                                            </div>
                                                            <div className="text-center">
                                                                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{topStacks[1].name}</h3>
                                                                <p className="text-base text-blue-400 font-medium mt-2">{(topStacks[1].postCount + topStacks[1].jobCount).toLocaleString()} <span className="text-xs text-gray-500">언급량</span></p>
                                                            </div>
                                                        </div>
                                                    </motion.button>
                                                )}
                                                {/* Rank 1 */}
                                                {topStacks[0] && (
                                                    <motion.button onClick={() => handleTopStackClick(topStacks[0])} className="order-1 md:order-2 w-full md:w-72 group relative mb-6">
                                                        <div className="relative bg-[#2A2B30]/80 backdrop-blur-2xl border-2 border-yellow-500/20 rounded-[40px] p-6 flex flex-col items-center gap-6 hover:border-yellow-500/40 transition-all shadow-xl">
                                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-2 rounded-full text-black font-black shadow-lg flex items-center gap-2">
                                                               언급량 1등
                                                            </div>
                                                            <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-3xl p-4 flex items-center justify-center ring-1 ring-yellow-500/20 group-hover:scale-110 transition-transform duration-500">
                                                                <img src={topStacks[0].logo} alt="" className="w-full h-full object-contain" onError={(e) => handleImageError(e, topStacks[0].name)} />
                                                            </div>
                                                            <div className="text-center">
                                                                <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-yellow-400 transition-colors">{topStacks[0].name}</h3>
                                                                <div className="flex flex-col items-center gap-1 mt-2">
                                                                    <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">{(topStacks[0].postCount + topStacks[0].jobCount).toLocaleString()}</span>
                                                                    <span className="text-sm text-gray-500 uppercase tracking-widest font-black">전체 언급량</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.button>
                                                )}
                                                {/* Rank 3 */}
                                                {topStacks[2] && (
                                                    <motion.button onClick={() => handleTopStackClick(topStacks[2])} className="order-3 w-full md:w-56 group relative">
                                                        <div className="relative bg-[#2A2B30]/60 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 flex flex-col items-center gap-5 hover:border-orange-700/30 transition-all shadow-2xl min-h-[200px]">
                                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-700/20 border border-orange-700/50 px-4 py-1 rounded-full text-orange-400 text-sm font-bold shadow-lg">3등</div>
                                                            <div className="w-16 h-16 bg-white/5 rounded-2xl p-3 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                                                <img src={topStacks[2].logo} alt="" className="w-full h-full object-contain drop-shadow-md" onError={(e) => handleImageError(e, topStacks[2].name)} />
                                                            </div>
                                                            <div className="text-center">
                                                                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{topStacks[2].name}</h3>
                                                                <p className="text-base text-blue-400 font-medium mt-2">{(topStacks[2].postCount + topStacks[2].jobCount).toLocaleString()} <span className="text-xs text-gray-500">언급량</span></p>
                                                            </div>
                                                        </div>
                                                    </motion.button>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap justify-center gap-4">
                                                {topStacks.slice(3, 5).map((stack, idx) => (
                                                    <motion.button key={stack.id} onClick={() => handleTopStackClick(stack)} className="w-full md:w-72 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 transition-all group hover:bg-white/10">
                                                        <div className="w-10 h-10 bg-white/10 rounded-xl p-2 flex items-center justify-center shrink-0">
                                                            <img src={stack.logo} alt="" className="w-full h-full object-contain" onError={(e) => handleImageError(e, stack.name)} />
                                                        </div>
                                                        <div className="flex-1 text-left min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold text-gray-500">{idx + 4}등</span>
                                                                <h4 className="text-lg font-bold text-white truncate">{stack.name}</h4>
                                                            </div>
                                                            <p className="text-sm text-gray-400 mt-0.5">{(stack.postCount + stack.jobCount).toLocaleString()} 언급량</p>
                                                        </div>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <>
                                    {viewMode === "compare" && (
                                        <motion.div key="compare" className="absolute inset-0 pb-4 pr-2 overflow-visible">
                                            <StackComparison initialBaseStack={activeStack} allStacks={topStacks} onBack={() => setViewMode("chart")} />
                                        </motion.div>
                                    )}
                                    {viewMode === "graph" && (
                                        <motion.div key="node-graph" className="absolute inset-0 overflow-hidden">
                                            <StackRelationAnalysis 
                                                mainStackName={activeStack.name} 
                                                mainLogo={activeStack.logo || ""} 
                                                mainStackDescription={activeStack.description} 
                                                relatedStacks={relatedStacks}
                                                onClose={() => setViewMode("chart")}
                                                onStackSelect={async (stackId: number) => {
                                                    try {
                                                        const targetStack = await getTechStackById(stackId);
                                                        if (targetStack) {
                                                            const formatted = formatSearchResults([targetStack]);
                                                            if (formatted.length > 0) {
                                                                setActiveStack(formatted[0]);
                                                                setViewMode("graph"); 
                                                            }
                                                        }
                                                    } catch (error) {
                                                        console.error("Failed to load tech stack:", error);
                                                    }
                                                }}
                                            />
                                        </motion.div>
                                    )}
                                    {viewMode === "chart" && (
                                        <motion.div key="trend-chart" className="absolute inset-0 pt-4 w-full h-full pb-10 min-w-0">
                                            <TrendChart
                                                color={activeStack.themeColor}
                                                data={chartData}
                                                period={chartPeriod}
                                                onPeriodChange={setChartPeriod}
                                                isLoading={chartDataLoading}
                                            />
                                        </motion.div>
                                    )}
                                </>
                            )}
                        </div>
                    </AnimatePresence>
                </div>
            </div>

            <div className="lg:col-span-3 h-full min-h-[400px] flex flex-col bg-[#212226] rounded-[32px] border border-white/5 overflow-hidden shadow-2xl relative">
                <JobSection 
                    techStackId={isLanding ? 0 : activeStack.id} 
                    techStackName={isLanding ? "전체" : activeStack.name} 
                />
            </div>

        </div>
      </div>
    );
}
