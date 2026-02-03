import { useState, useMemo, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { getAuthTokens } from '@/lib/auth';

// CATEGORY_INFO가 없을 경우를 대비한 기본값
const DEFAULT_CATEGORY_INFO: Record<string, any> = {};

// 초기 기업 데이터
const INITIAL_COMPANIES = [
    { id: 1, name: 'Toss', category: '금융/핀테크', logo: '/logos/toss.svg', baseScore: 65, favorite: false },
    { id: 2, name: 'Woowahan', category: '배달/커머스', logo: '/logos/baemin.svg', baseScore: 60, favorite: false },
    { id: 3, name: 'Line', category: '메신저/플랫폼', logo: '/logos/line.svg', baseScore: 55, favorite: false },
    { id: 4, name: 'Karrot', category: '지역/커뮤니티', logo: '/logos/daangn.svg', baseScore: 50, favorite: false },
    { id: 5, name: 'ZigZag', category: '패션/커머스', logo: '/logos/zigzag.svg', baseScore: 45, favorite: false },
    { id: 6, name: 'Bucketplace', category: '인테리어', logo: '/logos/ohou.svg', baseScore: 40, favorite: false },
];

export function useSimulation() {
    const [companies, setCompanies] = useState(INITIAL_COMPANIES);
    const [selectedCompany, setSelectedCompany] = useState<any>(null);
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
    const [keywordSearch, setKeywordSearch] = useState('');

    // ✅ 초기 즐겨찾기 상태를 백엔드에서 가져오기
    useEffect(() => {
        const loadFavorites = async () => {
            const { accessToken } = getAuthTokens();
            if (!accessToken) return;

            try {
                const bookmarksResponse = await api.get('/jobs/corp-bookmarks/');
                const bookmarks = bookmarksResponse.data.results || bookmarksResponse.data || [];
                const favoriteIds = new Set(bookmarks.map((b: any) => b.corp?.id || b.corp_id));
                
                setCompanies(prev => prev.map(c => ({
                    ...c,
                    favorite: favoriteIds.has(c.id)
                })));
            } catch (error) {
                console.error('즐겨찾기 목록 불러오기 실패:', error);
            }
        };

        loadFavorites();
    }, []);

    // ✅ [수정됨] 기술 스택 목록에서 기업 이름 제외
    const allTechKeywords = useMemo(() => {
        const keywords = new Set<string>();
        // 비교를 위해 기업 이름을 소문자로 변환하여 Set에 저장
        const companyNames = new Set(INITIAL_COMPANIES.map(c => c.name.toLowerCase()));

        // CATEGORY_INFO가 없으면 빈 배열 반환
        try {
            // 동적 import 시도 (파일이 있으면 사용, 없으면 기본값 사용)
            const categoryInfo = DEFAULT_CATEGORY_INFO;
            Object.values(categoryInfo).forEach((cat: any) => {
                if (cat && cat.company && cat.community) {
                    // company.nodes와 community.nodes 모두 돌면서 확인
                    [...(cat.company.nodes || []), ...(cat.community.nodes || [])].forEach((node: any) => {
                        // 기업 목록에 없는 키워드만 추가
                        if (node && node.id && !companyNames.has(node.id.toLowerCase())) {
                            keywords.add(node.id);
                        }
                    });
                }
            });
        } catch (error) {
            // CATEGORY_INFO가 없어도 에러 없이 동작
            console.warn('CATEGORY_INFO를 불러올 수 없습니다. 기본 키워드만 사용됩니다.');
        }
        
        // 기본 기술 스택 키워드 추가 (CATEGORY_INFO가 없을 때 사용)
        const defaultKeywords = ['React', 'TypeScript', 'Next.js', 'Node.js', 'Python', 'Django', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API'];
        defaultKeywords.forEach(keyword => {
            if (!companyNames.has(keyword.toLowerCase())) {
                keywords.add(keyword);
            }
        });
        
        return Array.from(keywords).sort();
    }, []);

    // ✅ 즐겨찾기 된 기업을 상단으로 정렬
    const sortedCompanies = useMemo(() => {
        return [...companies].sort((a, b) => {
            if (a.favorite === b.favorite) return 0;
            return a.favorite ? -1 : 1; 
        });
    }, [companies]);

    // 점수 계산
    const matchScore = useMemo(() => {
        if (!selectedCompany) return 0;
        const base = selectedCompany.baseScore;
        const bonus = selectedKeywords.length * 5;
        return Math.min(base + bonus, 100);
    }, [selectedCompany, selectedKeywords]);

    // 핸들러: 기업 선택 (토글 방식)
    const toggleCompany = useCallback((company: any) => {
        setSelectedCompany((prev: any) => (prev?.id === company.id ? null : company));
    }, []);

    // 핸들러: 즐겨찾기 (백엔드 API 연동)
    const toggleFavorite = useCallback(async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        
        const { accessToken } = getAuthTokens();
        if (!accessToken) {
            // 로그인 필요 (필요시 모달 표시)
            return;
        }

        try {
            const company = companies.find(c => c.id === id);
            const isFavorite = company?.favorite || false;
            
            if (isFavorite) {
                // 즐겨찾기 제거
                try {
                    const bookmarksResponse = await api.get('/jobs/corp-bookmarks/');
                    const bookmarks = bookmarksResponse.data.results || bookmarksResponse.data || [];
                    const bookmarkToDelete = bookmarks.find((b: any) => b.corp?.id === id || b.corp_id === id);
                    
                    if (bookmarkToDelete) {
                        await api.delete(`/jobs/corp-bookmarks/${bookmarkToDelete.corp_bookmark_id || bookmarkToDelete.id}/`);
                        setCompanies(prev => prev.map(c => c.id === id ? { ...c, favorite: false } : c));
                        // 즐겨찾기 변경 이벤트 발생
                        window.dispatchEvent(new CustomEvent('favoriteChanged', { detail: { type: 'company', action: 'removed', id } }));
                    }
                } catch (error) {
                    console.error('즐겨찾기 제거 실패:', error);
                }
            } else {
                // 즐겨찾기 추가
                try {
                    await api.post('/jobs/corp-bookmarks/', { corp_id: id });
                    setCompanies(prev => prev.map(c => c.id === id ? { ...c, favorite: true } : c));
                    // 즐겨찾기 변경 이벤트 발생
                    window.dispatchEvent(new CustomEvent('favoriteChanged', { detail: { type: 'company', action: 'added', id } }));
                } catch (error) {
                    console.error('즐겨찾기 추가 실패:', error);
                }
            }
        } catch (error) {
            console.error('즐겨찾기 토글 실패:', error);
        }
    }, [companies]);

    // 핸들러: 키워드 선택
    const toggleKeyword = useCallback((k: string) => {
        setSelectedKeywords(prev => prev.includes(k) ? prev.filter(item => item !== k) : [...prev, k]);
    }, []);

    return {
        allTechKeywords,
        sortedCompanies,
        selectedCompany,
        selectedKeywords,
        keywordSearch,
        matchScore,
        setKeywordSearch,
        toggleKeyword,
        toggleFavorite,
        toggleCompany,
        setSelectedCompany 
    };
}