"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFavoritesStore } from "@/store/favoritesStore";
import { getAuthTokens } from "@/lib/auth";
import LoginModal from "@/components/LoginModal";
import { TechStack, Corp } from "@/types"; // TechCategory 타입은 동적 처리를 위해 제거하거나 string으로 완화
import { api } from "@/lib/api";

type FavoritesTab = "tech" | "company";

// 화면에 보여줄 때 사용할 한글 라벨 매핑 (여기에 없는 키값은 그대로 출력됨)
const TECH_CATEGORY_LABEL: Record<string, string> = {
  all: "전체 기술",
  frontend: "Frontend",
  backend: "Backend",
  "ai-data": "AI / Data",
  mobile: "Mobile",
  devops: "DevOps",
  etc: "기타",
  // API에서 넘어올 수 있는 다른 카테고리 값들에 대한 예비 매핑 (필요시 추가)
  language: "Language",
  framework: "Framework",
  library: "Library",
};

// 1. 페이지네이션 크기 변경 (6 -> 8)
const PAGE_SIZE = 8;

// 2. 지역명 정규화 함수 (서울시, 서울특별시 -> 서울)
function getNormalizedRegion(address: string | null): string {
  if (!address) return "기타";
  const firstWord = address.split(" ")[0]; // 주소의 첫 어절 추출

  if (firstWord.startsWith("서울")) return "서울";
  if (firstWord.startsWith("경기")) return "경기";
  if (firstWord.startsWith("인천")) return "인천";
  if (firstWord.startsWith("부산")) return "부산";
  if (firstWord.startsWith("대구")) return "대구";
  if (firstWord.startsWith("광주")) return "광주";
  if (firstWord.startsWith("대전")) return "대전";
  if (firstWord.startsWith("울산")) return "울산";
  if (firstWord.startsWith("세종")) return "세종";
  if (firstWord.startsWith("강원")) return "강원";
  if (firstWord.startsWith("충북") || firstWord.startsWith("충청북")) return "충북";
  if (firstWord.startsWith("충남") || firstWord.startsWith("충청남")) return "충남";
  if (firstWord.startsWith("전북") || firstWord.startsWith("전라북")) return "전북";
  if (firstWord.startsWith("전남") || firstWord.startsWith("전라남")) return "전남";
  if (firstWord.startsWith("경북") || firstWord.startsWith("경상북")) return "경북";
  if (firstWord.startsWith("경남") || firstWord.startsWith("경상남")) return "경남";
  if (firstWord.startsWith("제주")) return "제주";

  return firstWord;
}

// 커스텀 드롭다운 컴포넌트
function CustomDropdown({
  value,
  options,
  onChange,
  labelMap,
}: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
  labelMap?: Record<string, string>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
      >
        <span>{labelMap ? labelMap[value] || value : value}</span>
        <svg
          className={`h-4 w-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <div
        className={`absolute right-0 z-50 mt-2 w-48 origin-top-right overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800 shadow-xl transition-all duration-200 ease-out ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-zinc-700 ${
                value === option ? "font-bold text-blue-400" : "text-zinc-300"
              }`}
            >
              {labelMap ? labelMap[option] || option : option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FavoritesSection() {
  const router = useRouter();
  const [tab, setTab] = useState<FavoritesTab>("tech");

  // 필터 상태
  const [techFilter, setTechFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("전체 지역");

  const [page, setPage] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [techStacks, setTechStacks] = useState<TechStack[]>([]);
  const [corps, setCorps] = useState<Corp[]>([]);
  const [isLoadingTechs, setIsLoadingTechs] = useState(false);
  const [isLoadingCorps, setIsLoadingCorps] = useState(false);

  // Store Hooks
  const { toggleTechFavorite, toggleCorpFavorite } = useFavoritesStore();

  // 로그인 상태 확인
  useEffect(() => {
    const { accessToken } = getAuthTokens();
    setIsLoggedIn(!!accessToken);
  }, []);

  // --- 데이터 페칭 ---
  const fetchFavoriteTechStacks = useCallback(async () => {
    const { accessToken } = getAuthTokens();
    if (!accessToken) return setTechStacks([]);

    setIsLoadingTechs(true);
    try {
      const response = await api.get("/trends/tech-bookmarks/");
      const bookmarks = response.data.results || response.data || [];
      const formatted = bookmarks.map((b: any) => {
        const t = b.tech_stack || b;
        // 카테고리 데이터 처리 강화: 배열의 첫 번째 요소를 가져오되, 소문자로 변환하여 일관성 유지 (선택사항)
        // API가 주는 Raw Data를 우선 사용
        const rawCategory = t.category_name?.[0] || "etc";
        
        return {
          id: t.tech_stack_id || t.id,
          name: t.tech_name || t.name,
          logo: t.logo || null,
          docsUrl: t.docs_url || null,
          createdAt: b.created_at || t.created_at,
          category: rawCategory,
        };
      });
      setTechStacks(formatted);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingTechs(false);
    }
  }, []);

  const fetchFavoriteCorps = useCallback(async () => {
    const { accessToken } = getAuthTokens();
    if (!accessToken) return setCorps([]);

    setIsLoadingCorps(true);
    try {
      const response = await api.get("/jobs/corp-bookmarks/");
      const bookmarks = response.data.results || response.data || [];
      const formatted = bookmarks.map((b: any) => {
        const c = b.corp || b;
        return {
          id: c.id,
          name: c.name,
          logoUrl: c.logo_url || null,
          address: c.address || null,
          latitude: c.latitude,
          longitude: c.longitude,
          siteUrl: c.site_url,
        };
      });
      setCorps(formatted);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingCorps(false);
    }
  }, []);

  useEffect(() => {
    fetchFavoriteTechStacks();
    fetchFavoriteCorps();
  }, [isLoggedIn, fetchFavoriteTechStacks, fetchFavoriteCorps]);

  // --- 필터링 로직 ---

  // 3. 기술 스택 필터 옵션 동적 생성 (API 데이터 기반)
  const techOptions = useMemo(() => {
    const categories = new Set<string>();
    techStacks.forEach((t) => {
      if (t.category) categories.add(t.category);
    });
    // 'all'을 맨 앞에 두고, 나머지는 알파벳 순 정렬
    return ["all", ...Array.from(categories).sort()];
  }, [techStacks]);

  // 기술 스택 필터링
  const filteredTechs = useMemo(() => {
    let list = [...techStacks];
    if (techFilter !== "all") {
      list = list.filter((t) => t.category === techFilter);
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [techStacks, techFilter]);

  // 기업 지역 목록 추출 (정규화 적용)
  const regionOptions = useMemo(() => {
    const regions = new Set<string>();
    corps.forEach((c) => {
      // 정규화된 지역명으로 옵션 생성
      const normalized = getNormalizedRegion(c.address);
      regions.add(normalized);
    });
    return ["전체 지역", ...Array.from(regions).sort()];
  }, [corps]);

  // 기업 필터링 (정규화 적용)
  const filteredCorps = useMemo(() => {
    let list = [...corps];
    if (regionFilter !== "전체 지역") {
      list = list.filter((c) => getNormalizedRegion(c.address) === regionFilter);
    }
    // 최신순 정렬 (ID 역순 등으로 대체하거나, 북마크 생성일이 있다면 그것 사용)
    return list.reverse();
  }, [corps, regionFilter]);

  // 현재 탭 데이터 결정
  const currentData = tab === "company" ? filteredCorps : filteredTechs;

  // 페이지네이션
  const totalPages = Math.max(1, Math.ceil(currentData.length / PAGE_SIZE));
  const pagedData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return currentData.slice(start, start + PAGE_SIZE);
  }, [currentData, page]);

  // 탭 변경 시 페이지 및 필터 초기화
  const handleTabChange = (newTab: FavoritesTab) => {
    setTab(newTab);
    setPage(1);
    setRegionFilter("전체 지역");
    setTechFilter("all");
  };

  // 즐겨찾기 토글
  const handleToggle = async (id: number) => {
    if (!isLoggedIn) return setIsLoginModalOpen(true);

    // UI 낙관적 업데이트
    if (tab === "company") {
      setCorps((prev) => prev.filter((c) => c.id !== id));
      toggleCorpFavorite(id);
      try {
        // 백엔드는 페이지네이션 없이 배열로 직접 반환
        const bookmarks = (await api.get("/jobs/corp-bookmarks/")).data || [];
        const target = bookmarks.find(
          (b: any) => b.corp?.id === id || b.corp_id === id
        );
        if (target && target.corp_bookmark_id) {
          await api.delete(`/jobs/corp-bookmarks/${target.corp_bookmark_id}/`);
        }
      } catch (e) {
        console.error("기업 즐겨찾기 삭제 실패:", e);
        fetchFavoriteCorps();
      }
    } else {
      setTechStacks((prev) => prev.filter((t) => t.id !== id));
      toggleTechFavorite(id);
      try {
        // 백엔드는 배열로 직접 반환
        const bookmarks = (await api.get("/trends/tech-bookmarks/")).data || [];
        const target = bookmarks.find(
          (b: any) => b.tech_stack?.tech_stack_id === id
        );
        if (target && target.tech_bookmark_id) {
          await api.delete(`/trends/tech-bookmarks/${target.tech_bookmark_id}/`);
        }
      } catch (e) {
        console.error("기술 스택 즐겨찾기 삭제 실패:", e);
        fetchFavoriteTechStacks();
      }
    }
  };

  const renderEmpty = (text: string) => (
    <div className="flex h-60 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/50 text-zinc-400">
      <p>{text}</p>
    </div>
  );

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm transition-all">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-bold text-zinc-50">즐겨찾기</h2>

          {/* 탭 버튼 */}
          <div className="flex items-center gap-1 rounded-lg bg-zinc-950/50 p-1 ring-1 ring-zinc-800">
            <button
              onClick={() => handleTabChange("tech")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                tab === "tech"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              기술 스택
            </button>
            <button
              onClick={() => handleTabChange("company")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                tab === "company"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              기업
            </button>
          </div>
        </div>

        {/* 필터 드롭다운 (Custom Animation) */}
        <div className="z-20">
          {tab === "tech" ? (
            <CustomDropdown
              value={techFilter}
              options={techOptions}
              onChange={(val) => {
                setTechFilter(val);
                setPage(1);
              }}
              labelMap={TECH_CATEGORY_LABEL}
            />
          ) : (
            <CustomDropdown
              value={regionFilter}
              options={regionOptions}
              onChange={(val) => {
                setRegionFilter(val);
                setPage(1);
              }}
            />
          )}
        </div>
      </header>

      {/* 목록 렌더링 */}
      <div className="min-h-[300px]">
        {isLoadingTechs || isLoadingCorps ? (
          renderEmpty("로딩 중...")
        ) : !isLoggedIn ? (
          renderEmpty("로그인이 필요한 서비스입니다.")
        ) : pagedData.length === 0 ? (
          renderEmpty("조건에 맞는 즐겨찾기가 없습니다.")
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {pagedData.map((item: any) => (
              <div
                key={item.id}
                onClick={
                  tab === "company"
                    ? () => router.push(`/map?corpId=${item.id}`)
                    : undefined
                }
                className={`group relative flex items-center justify-between overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 transition-all hover:border-zinc-600 hover:bg-zinc-900 hover:shadow-lg ${
                  tab === "company" ? "cursor-pointer" : ""
                }`}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* 로고 영역 */}
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white p-1.5 shadow-inner">
                    <img
                      src={tab === "company" ? item.logoUrl : item.logo}
                      alt={item.name}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>

                  {/* 텍스트 정보 */}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-zinc-100 group-hover:text-blue-400 transition-colors">
                      {item.name}
                    </h3>
                    <p className="truncate text-xs text-zinc-500 mt-0.5">
                      {tab === "company"
                        ? item.address || "주소 정보 없음"
                        : TECH_CATEGORY_LABEL[item.category] || item.category || "미분류"}
                    </p>
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-2 pl-4">
                  {/* 링크 버튼 */}
                  {(tab === "company" ? item.siteUrl : item.docsUrl) && (
                    <a
                      href={tab === "company" ? item.siteUrl : item.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="hidden items-center justify-center rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white group-hover:flex"
                    >
                      {tab === "company" ? "Site" : "Docs"}
                    </a>
                  )}

                  {/* 즐겨찾기 별 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(item.id);
                    }}
                    className="rounded-lg p-1.5 text-yellow-500 transition-transform hover:scale-110 hover:bg-yellow-500/10 active:scale-95"
                  >
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 페이지네이션 UI */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-8 min-w-[32px] rounded-lg px-2 text-xs font-medium transition-all ${
                p === page
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}