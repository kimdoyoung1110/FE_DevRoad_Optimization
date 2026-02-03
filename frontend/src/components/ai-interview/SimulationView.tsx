'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, CheckCircle2, HelpCircle, Star, Building2, MousePointerClick, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { searchTechStacks } from '@/services/trendService';
import { TechStackData } from '@/types/trend';

interface SimulationViewProps {
    simulationData: any;
}

export default function SimulationView({ simulationData }: SimulationViewProps) {
    // 🛡️ 데이터 안전장치 (undefined 방지)
    const safeData = simulationData || {};

    const {
        selectedKeywords = [],
        keywordSearch = '',
        setKeywordSearch = () => {},
        toggleKeyword = () => {},
        sortedCompanies = [],
        selectedCompany = null,
        setSelectedCompany = () => {},
        toggleFavorite = () => {}, // 기업 즐겨찾기 함수 (부모에서 주입 가정)
        matchScore = 0
    } = safeData;

    // --- State 관리 ---
    const [searchResults, setSearchResults] = useState<TechStackData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [companySearch, setCompanySearch] = useState('');
    
    // [추가] 기술 스택 즐겨찾기 로컬 상태 (UI 구현용)
    const [favoriteTechs, setFavoriteTechs] = useState<Set<string>>(new Set());

    // --- 1. 기술 스택 검색 API 호출 ---
    useEffect(() => {
        const fetchTechStacks = async () => {
            if (!keywordSearch || !keywordSearch.trim()) {
                setSearchResults([]);
                return;
            }
            setIsLoading(true);
            try {
                const data = await searchTechStacks(keywordSearch);
                setSearchResults(data);
            } catch (error) {
                console.error("기술 스택 검색 실패:", error);
                setSearchResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        const debounceTimer = setTimeout(fetchTechStacks, 300);
        return () => clearTimeout(debounceTimer);
    }, [keywordSearch]);

    // --- 2. 기업 검색 필터링 ---
    const filteredCompanies = Array.isArray(sortedCompanies)
        ? sortedCompanies.filter((company: any) =>
            company?.name?.toLowerCase().includes((companySearch || '').toLowerCase())
          )
        : [];

    // [추가] 기술 스택 즐겨찾기 토글 함수
    const toggleTechFavorite = (techName: string) => {
        setFavoriteTechs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(techName)) newSet.delete(techName);
            else newSet.add(techName);
            return newSet;
        });
    };

    return (
        <motion.div 
            key="simulation"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-[3.5fr_4.5fr_4fr] gap-8 items-start h-full"
        >
            {/* -----------------------------------------------------------------------
                1. 기술 스택 선택 (왼쪽 그리드)
            ------------------------------------------------------------------------ */}
            <section className="bg-[#212226] border border-white/5 rounded-[32px] p-6 h-[750px] flex flex-col">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-400">
                    <Sparkles size={18} /> 기술 스택 선택
                </h3>
                
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                    <input 
                        type="text" 
                        value={keywordSearch} 
                        onChange={(e) => setKeywordSearch(e.target.value)}
                        placeholder="기술 스택 검색 (예: React)"
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="text-center text-white/30 py-10">검색 중...</div>
                    ) : searchResults.length > 0 ? (
                        searchResults.map((stack) => {
                            const isSelected = selectedKeywords.includes(stack.name);
                            const isFav = favoriteTechs.has(stack.name);

                            return (
                                <motion.div 
                                    key={stack.id}
                                    layout
                                    onClick={() => toggleKeyword(stack.name)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group
                                        ${isSelected 
                                            ? 'border-blue-500 bg-blue-500/10 text-white' 
                                            : 'border-white/5 bg-white/5 text-[#9FA0A8] hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {stack.logo ? (
                                            <img src={stack.logo} alt={stack.name} className="w-6 h-6 object-contain" />
                                        ) : (
                                            <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold">
                                                {stack.name.substring(0, 1)}
                                            </div>
                                        )}
                                        <span className="font-bold">{stack.name}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        {/* 선택 체크 아이콘 */}
                                        {isSelected && <CheckCircle2 size={18} className="text-blue-500" />}
                                        
                                        {/* [추가] 기술 스택 즐겨찾기 버튼 */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleTechFavorite(stack.name); }}
                                            className="p-1 hover:scale-110 transition-transform"
                                        >
                                            <Star 
                                                size={16} 
                                                fill={isFav ? "#EAB308" : "none"} 
                                                className={isFav ? "text-yellow-500" : "text-white/10 group-hover:text-white/30"} 
                                            />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        keywordSearch && <div className="text-center text-white/30 py-10">검색 결과가 없습니다.</div>
                    )}
                    
                    {!keywordSearch && (
                        <div className="text-center text-white/20 py-10 text-sm">
                            원하는 기술 스택을 검색하여<br/>추가해보세요.
                        </div>
                    )}
                </div>
            </section>

            {/* -----------------------------------------------------------------------
                2. 기업 탐색 (가운데 그리드)
            ------------------------------------------------------------------------ */}
            <section className="bg-[#212226] border border-white/5 rounded-[32px] p-6 h-[750px] flex flex-col">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-purple-400">
                    <Building2 size={18} /> 기업 탐색
                </h3>

                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                    <input 
                        type="text" 
                        value={companySearch} 
                        onChange={(e) => setCompanySearch(e.target.value)}
                        placeholder="기업명 검색..."
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    <AnimatePresence mode='popLayout'>
                        {filteredCompanies.length > 0 ? (
                            filteredCompanies.map((company: any) => (
                                <motion.div 
                                    key={company.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    onClick={() => setSelectedCompany(company)}
                                    className={`p-6 rounded-[24px] border transition-all cursor-pointer relative overflow-hidden group
                                        ${selectedCompany?.id === company.id 
                                            ? 'bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-purple-500/50' 
                                            : 'bg-[#212226] border-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden">
                                                {company.logo ? (
                                                    <img src={company.logo} alt="" className="w-8 h-8 object-contain" />
                                                ) : (
                                                    <Building2 className="text-black/50" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg">{company.name}</h4>
                                                <p className="text-xs text-[#9FA0A8]">{company.industry}</p>
                                            </div>
                                        </div>
                                        {/* ⚠️ [수정] 요청하신 대로 매칭 퍼센트 텍스트 제거함 */}
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {/* 기업의 기술 스택 중 사용자가 선택한 키워드와 일치하는 것 강조 */}
                                        {Array.isArray(company.stack) && selectedKeywords.filter((k: string) => company.stack.includes(k)).map((k: string) => (
                                            <span key={k} className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/20">
                                                {k}
                                            </span>
                                        ))}
                                        {/* 나머지 스택 표시 */}
                                        {Array.isArray(company.stack) && company.stack.filter((k: string) => !selectedKeywords.includes(k)).slice(0, 3).map((k: string) => (
                                            <span key={k} className="px-2 py-1 rounded-md bg-white/5 text-white/20 text-xs border border-white/5">
                                                {k}
                                            </span>
                                        ))}
                                    </div>
                                    
                                    {/* [추가] 기업 즐겨찾기 버튼 */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleFavorite(company.id); }}
                                        className="absolute top-6 right-6 p-2 hover:scale-110 transition-transform"
                                    >
                                        <Star 
                                            size={20} 
                                            fill={company.isFavorite ? "#EAB308" : "none"} 
                                            className={company.isFavorite ? "text-yellow-500" : "text-white/10 group-hover:text-white/30"} 
                                        />
                                    </button>
                                </motion.div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-[#9FA0A8] opacity-50">
                                <Building2 size={40} className="mb-4 text-white/20" />
                                <p>검색 결과가 없습니다.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* -----------------------------------------------------------------------
                3. 상세 분석 (오른쪽 그리드) - 로직 연동 완료
            ------------------------------------------------------------------------ */}
            <section className="h-[750px]">
                <AnimatePresence mode='wait'>
                    {!selectedCompany ? (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="h-full bg-[#212226] border border-white/5 rounded-[32px] p-8 flex flex-col items-center justify-center text-center opacity-50"
                        >
                            <MousePointerClick className="text-white/20 mb-4" size={48} />
                            <p className="text-[#9FA0A8] text-lg">기업을 선택하면<br/>상세 분석 결과가 표시됩니다.</p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key={selectedCompany.id}
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            className="h-full flex flex-col gap-4"
                        >
                            {/* 매칭 점수 카드 */}
                            <div className="bg-[#212226] border border-white/5 rounded-[32px] p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
                                <h3 className="text-xl font-bold mb-2">매칭 분석</h3>
                                <div className="flex items-end gap-2 mb-6">
                                    <span className="text-5xl font-black text-white">{matchScore}</span>
                                    <span className="text-xl text-[#9FA0A8] mb-1">/ 100</span>
                                </div>
                                
                                <div className="relative w-full aspect-[2/1] bg-white/5 rounded-t-full overflow-hidden mt-8">
                                    <div 
                                        className="absolute bottom-0 left-0 w-full h-full bg-blue-500/20 origin-bottom transition-all duration-1000"
                                        style={{ transform: `scaleY(${matchScore / 100})` }}
                                    />
                                    <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full">
                                        <path d="M10 50 A 40 40 0 0 1 90 50" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.2" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center font-bold text-lg pt-10">{matchScore}%</div>
                                </div>
                            </div>
                            
                            {/* 상세 분석 텍스트 (동적 로직 적용) */}
                            <div className="bg-[#212226] border border-white/5 rounded-[32px] p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                                <div>
                                    <h4 className="text-xs font-black text-green-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <CheckCircle2 size={14} /> 강점 시뮬레이션
                                    </h4>
                                    <p className="text-sm leading-relaxed text-[#9FA0A8]">
                                        {selectedKeywords.length > 0 ? (
                                            <>
                                                선택하신 <span className="text-white font-bold">{selectedKeywords.join(', ')}</span> 기술은 
                                                <br /><span className="text-white font-bold">{selectedCompany.name}</span>에서 우대하는 핵심 역량과 매칭됩니다.
                                            </>
                                        ) : (
                                            "기술 스택을 선택하면 강점 분석 결과를 확인할 수 있습니다."
                                        )}
                                    </p>
                                </div>
                                
                                <div>
                                    <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <HelpCircle size={14} /> 예상 면접 질문
                                    </h4>
                                    <div className="text-lg font-bold italic leading-snug text-white/90">
                                        {selectedKeywords.length > 0 ? (
                                            `"${selectedCompany.name} 서비스 고도화를 위해 ${selectedKeywords[0]} 기술을 도입할 때 고려해야 할 트레이드오프는 무엇인가요?"`
                                        ) : (
                                            <span className="text-[#9FA0A8] text-base font-normal not-italic">
                                                기술 스택을 선택하면 예상 질문을 생성해드립니다.
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </motion.div>
    );
}