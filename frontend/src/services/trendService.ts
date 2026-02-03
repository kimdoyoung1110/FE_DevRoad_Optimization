import api, { apiPublic } from '@/lib/api';
import { AxiosResponse } from 'axios';
import { CategoryDetail, TechStackData } from '@/types/trend';

// 페이지네이션 응답 타입
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * ✅ [핵심] 기술 스택 이름을 기반으로 외부 CDN(Simple Icons) 주소 생성
 */
export const getExternalLogoUrl = (name: string): string => {
    // Simple Icons 슬러그 규칙 (소문자, 공백/특수문자 제거 및 변환)
    const slug = name.toLowerCase()
        .replace(/\./g, 'dot')      // . -> dot
        .replace(/\s+/g, '')        // 공백 제거
        .replace(/\+/g, 'plus')     // + -> plus
        .replace(/#/g, 'sharp');    // # -> sharp

    return `https://cdn.simpleicons.org/${slug}`;
};

/**
 * 이미지 URL 정규화 (백엔드에서 S3 URL을 반환하므로 그대로 사용, 없으면 외부 CDN)
 * 백엔드에서 이미 DB의 파일 주소를 S3 URL로 변환해서 반환하므로, 프론트엔드에서는 그대로 사용
 */
const normalizeLogoUrl = (url: string | null | undefined, name: string): string => {
    // 빈 문자열이나 null/undefined 체크
    if (!url || url.trim() === '') {
        // 없으면 외부 CDN 주소 생성
        return getExternalLogoUrl(name);
    }
    
    // 백엔드에서 이미 S3 URL로 변환해서 반환하므로 그대로 사용
    // S3 URL (https://버킷이름.s3.amazonaws.com/...) 또는 완전한 HTTP URL인 경우 그대로 반환
    return url;
};

/**
 * ✅ [핵심] 모든 페이지의 데이터를 순회하여 가져오는 함수
 */
const fetchAllPages = async (initialUrl: string): Promise<TechStackData[]> => {
    let allResults: TechStackData[] = [];
    let nextUrl: string | null = initialUrl;

    try {
        // 첫 페이지 요청
        const initialResponse = await apiPublic.get(nextUrl);
        const initialData = initialResponse.data;

        // 응답이 페이지네이션 객체가 아닌 순수 배열인 경우 (pagination_class = None)
        if (Array.isArray(initialData)) {
            return initialData; // 전체 데이터를 바로 반환
        }

        // 페이지네이션 객체인 경우, 기존 로직 수행
        if (initialData.results && Array.isArray(initialData.results)) {
            allResults = [...allResults, ...initialData.results];
        }
        nextUrl = initialData.next;

        // 다음 페이지가 있으면 계속 가져옴
        while (nextUrl) {
            const response = await apiPublic.get(nextUrl);
            const data = response.data;

            if (data.results && Array.isArray(data.results)) {
                allResults = [...allResults, ...data.results];
            }

            nextUrl = data.next; // 다음 페이지 URL (없으면 null)
        }
    } catch (error) {
        console.error("Pagination fetch failed:", error);
    }

    return allResults;
};

// 카테고리별 트렌드 조회
export const getTrendDataByCategory = async (category: string): Promise<CategoryDetail> => {
    try {
        const response = await api.get<CategoryDetail>(`/trends/${category}/`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch category trend:", error);
        throw error;
    }
};

/**
 * ✅ 기술 스택 검색 (백엔드 API의 search 파라미터 사용)
 */
let cachedAllStacks: TechStackData[] | null = null;

export const searchTechStacks = async (query: string): Promise<TechStackData[]> => {
    try {
        // 1. 검색어가 없으면 전체 데이터 반환 (캐시 사용)
        if (!query.trim()) {
            if (!cachedAllStacks || cachedAllStacks.length === 0) {
                cachedAllStacks = await fetchAllPages('/trends/tech-stacks/');
            }
            // 백엔드에서 이미 S3 URL을 반환하므로 그대로 사용, 없으면 외부 CDN
            return cachedAllStacks.map(stack => ({
                ...stack,
                logo: stack.logo || getExternalLogoUrl(stack.name)
            }));
        }

        // 2. 검색어가 있으면 백엔드 API의 search 파라미터 사용
        // 백엔드에서 이름만 부분 일치 검색 수행
        const searchUrl = `/trends/tech-stacks/?search=${encodeURIComponent(query.trim())}`;
        const searchResults = await fetchAllPages(searchUrl);

        // 3. 백엔드에서 이미 S3 URL을 반환하므로 그대로 사용, 없으면 외부 CDN
        return searchResults.map(stack => ({
            ...stack,
            logo: stack.logo || getExternalLogoUrl(stack.name)
        }));

    } catch (error) {
        console.error("Failed to search tech stacks:", error);
        return [];
    }
};

export const fetchAllTechStacks = async (): Promise<TechStackData[]> => {
    return searchTechStacks('');
};

/**
 * 대시보드 첫 화면용: job_stack_count 기준 상위 5개만 1회 요청 (기존 방식 - 사용하지 않음)
 */
export const fetchTop5TechStacksByJobCount = async (): Promise<TechStackData[]> => {
    try {
        const response = await apiPublic.get<PaginatedResponse<TechStackData>>(
            '/trends/tech-stacks/?ordering=-job_stack_count&page=1'
        );
        const results = response.data?.results ?? [];
        const top5 = results.slice(0, 5).map(s => ({
            ...s,
            logo: s.logo || getExternalLogoUrl(s.name),
        }));
        return top5;
    } catch (error) {
        console.error("fetchTop5TechStacksByJobCount failed:", error);
        return [];
    }
};

// Top 5 API 응답 타입
export interface TopTechStackItem {
    id: number;
    name: string;
    logo: string | null;
    docs_url: string | null;
    job_stack_count: number;    // 정렬 기준 (채용공고 스택 수)
    total_mentions: number;      // 표시될 언급량 (90일간 job_mention_count 합계)
}

/**
 * 대시보드 첫 화면용: 최근 90일간 TechTrend 데이터 기준 Top 5
 */
export const fetchTop5ByTrends = async (): Promise<TopTechStackItem[]> => {
    try {
        const response = await apiPublic.get<TopTechStackItem[]>('/trends/top-stacks/');
        return response.data.map(s => ({
            ...s,
            logo: s.logo || getExternalLogoUrl(s.name),
        }));
    } catch (error) {
        console.error("fetchTop5ByTrends failed:", error);
        return [];
    }
};

/**
 * 기술 스택 ID로 단일 조회 (연관 기술 탭에서 노드 선택 시 사용, fetchAllPages 회피)
 */
export const getTechStackById = async (id: number): Promise<TechStackData | null> => {
    try {
        const response = await apiPublic.get<TechStackData>(`/trends/tech-stacks/${id}/`);
        const s = response.data;
        return { ...s, logo: s.logo || getExternalLogoUrl(s.name) };
    } catch (error) {
        console.error("getTechStackById failed:", error);
        return null;
    }
};

/**
 * 관련 기술 스택 관계 타입
 */
export interface RelatedTechStackRelation {
    tech_stack: TechStackData;
    weight: number;
    relationship_type_display: string;
    direction: 'outgoing' | 'incoming';
}

export interface TechStackRelationsResponse {
    id: number;
    name: string;
    description: string;
    logo: string | null;
    docs_url: string | null;
    relationships: {
        [key: string]: RelatedTechStackRelation[];
    };
    created_at: string;
}

/** tech_trend 그래프용 항목 타입 */
export interface TechTrendChartItem {
  date: string;
  job_mention_count: number;
  job_change_rate: number;
  article_mention_count: number;
  article_change_rate: number;
}

/**
 * 기술 트렌드 목록 조회 (꺾은선 그래프용)
 * - tech_stack, days(7|30|90), ordering=reference_date 지원
 * - 페이지네이션 results 사용, page_size=100 요청으로 기간 내 전체 반환
 */
export const fetchTechTrends = async (
  techStackId: number,
  days: 7 | 30 | 90 | 365
): Promise<TechTrendChartItem[]> => {
  try {
    const url = `trends/?tech_stack=${techStackId}&days=${days}&ordering=reference_date&page_size=100`;
    const response = await apiPublic.get<{ results?: Array<{ reference_date: string; job_mention_count: number; job_change_rate: number; article_mention_count: number; article_change_rate: number }> }>(url);
    const raw = response.data?.results ?? (Array.isArray(response.data) ? response.data : []);
    return raw.map((r: { reference_date: string; job_mention_count: number; job_change_rate: number; article_mention_count?: number; article_change_rate?: number }) => ({
      date: r.reference_date,
      job_mention_count: Number(r.job_mention_count) ?? 0,
      job_change_rate: Number(r.job_change_rate) ?? 0,
      article_mention_count: Number(r.article_mention_count) ?? 0,
      article_change_rate: Number(r.article_change_rate) ?? 0,
    }));
  } catch (error) {
    console.error('fetchTechTrends failed:', error);
    return [];
  }
};

/**
 * 기술 스택의 관련 기술 스택 조회
 */
export const getTechStackRelations = async (techStackId: number): Promise<TechStackRelationsResponse> => {
    try {
        const response = await apiPublic.get<TechStackRelationsResponse>(`/trends/tech-stacks/${techStackId}/relations/`);
        
        // 백엔드에서 이미 DB의 파일 주소를 S3 URL로 변환해서 반환하므로 그대로 사용
        // 로고가 없을 때만 외부 CDN URL 생성
        if (!response.data.logo || response.data.logo.trim() === '') {
            response.data.logo = getExternalLogoUrl(response.data.name);
        }
        
        // 관련 기술 스택들의 로고 URL 처리
        // 백엔드에서 이미 S3 URL로 변환해서 반환하므로 그대로 사용
        Object.keys(response.data.relationships).forEach(relType => {
            response.data.relationships[relType].forEach(rel => {
                // 로고가 없을 때만 외부 CDN URL 생성
                if (!rel.tech_stack.logo || rel.tech_stack.logo.trim() === '') {
                    rel.tech_stack.logo = getExternalLogoUrl(rel.tech_stack.name);
                }
            });
        });
        
        return response.data;
    } catch (error) {
        console.error("Failed to fetch tech stack relations:", error);
        throw error;
    }
};