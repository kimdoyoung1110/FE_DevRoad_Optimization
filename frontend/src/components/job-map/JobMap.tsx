"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Map as KakaoMap, CustomOverlayMap, useKakaoLoader, MarkerClusterer } from "react-kakao-maps-sdk";
import { Search, MapPin, RefreshCw, ArrowLeft, Building2, Star, Filter, X, List, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
import { getAuthTokens } from "@/lib/auth";
import JobCard from "../home/JobCard";
import LoginCheckModal from "@/components/LoginCheckModal";
import LoginModal from "@/components/LoginModal";

// 서울 용산구 — 채용 지도 첫 화면·리셋 시 고정
const SEOUL_CENTER = { lat: 37.5326, lng: 126.9900 };

// 초기 줌 레벨
const INITIAL_MAP_LEVEL = 8; 

// --- 행정구역 데이터 (시/도 -> 군/구) ---
const KOREA_DISTRICTS: Record<string, string[]> = {
  "서울": ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
  "경기": ["가평군", "고양시", "과천시", "광명시", "광주시", "구리시", "군포시", "김포시", "남양주시", "동두천시", "부천시", "성남시", "수원시", "시흥시", "안산시", "안성시", "안양시", "양주시", "양평군", "여주시", "연천군", "오산시", "용인시", "의왕시", "의정부시", "이천시", "파주시", "평택시", "포천시", "하남시", "화성시"],
  "인천": ["강화군", "계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "옹진군", "중구"],
  "부산": ["강서구", "금정구", "기장군", "남구", "동구", "동래구", "부산진구", "북구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구"],
  "대구": ["군위군", "남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구"],
  "광주": ["광산구", "남구", "동구", "북구", "서구"],
  "대전": ["대덕구", "동구", "서구", "유성구", "중구"],
  "울산": ["남구", "동구", "북구", "울주군", "중구"],
  "세종": ["세종시"],
  "강원": ["강릉시", "고성군", "동해시", "삼척시", "속초시", "양구군", "양양군", "영월군", "원주시", "인제군", "정선군", "철원군", "춘천시", "태백시", "평창군", "홍천군", "화천군", "횡성군"],
  "충북": ["괴산군", "단양군", "보은군", "영동군", "옥천군", "음성군", "제천시", "증평군", "진천군", "청주시", "충주시"],
  "충남": ["계룡시", "공주시", "금산군", "논산시", "당진시", "보령시", "부여군", "서산시", "서천군", "아산시", "연기군", "예산군", "천안시", "청양군", "태안군", "홍성군"],
  "전북": ["고창군", "군산시", "김제시", "남원시", "무주군", "부안군", "순창군", "완주군", "익산시", "임실군", "장수군", "전주시", "정읍시", "진안군"],
  "전남": ["강진군", "고흥군", "곡성군", "광양시", "구례군", "나주시", "담양군", "목포시", "무안군", "보성군", "순천시", "신안군", "여수시", "영광군", "영암군", "완도군", "장성군", "장흥군", "진도군", "함평군", "해남군", "화순군"],
  "경북": ["경산시", "경주시", "고령군", "구미시", "김천시", "문경시", "봉화군", "상주시", "성주군", "안동시", "영덕군", "영양군", "영주시", "영천시", "예천군", "울릉군", "울진군", "의성군", "청도군", "청송군", "칠곡군", "포항시"],
  "경남": ["거제시", "거창군", "고성군", "김해시", "남해군", "밀양시", "사천시", "산청군", "양산시", "의령군", "진주시", "창녕군", "창원시", "통영시", "하동군", "함안군", "함양군", "합천군"],
  "제주": ["서귀포시", "제주시"]
};

// ✅ [수정] 지역별 중심 좌표 (중복 구 이름은 '시도 구' 형태로 키 설정)
const REGION_COORDINATES: Record<string, { lat: number, lng: number }> = {
    // --- 광역 시/도 ---
    "서울": { lat: 37.5665, lng: 126.9780 },
    "경기": { lat: 37.4138, lng: 127.5183 },
    "인천": { lat: 37.4563, lng: 126.7052 },
    "부산": { lat: 35.1796, lng: 129.0756 },
    "대구": { lat: 35.8714, lng: 128.6014 },
    "광주": { lat: 35.1595, lng: 126.8526 },
    "대전": { lat: 36.3504, lng: 127.3845 },
    "울산": { lat: 35.5384, lng: 129.3114 },
    "세종": { lat: 36.4800, lng: 127.2892 },
    "강원": { lat: 37.8228, lng: 128.1555 },
    "충북": { lat: 36.6350, lng: 127.4914 },
    "충남": { lat: 36.6588, lng: 126.6728 },
    "전북": { lat: 35.7175, lng: 127.1530 },
    "전남": { lat: 34.8163, lng: 126.4629 },
    "경북": { lat: 36.5760, lng: 128.5056 },
    "경남": { lat: 35.2383, lng: 128.6922 },
    "제주": { lat: 33.4890, lng: 126.4983 },

    // --- 서울특별시 구 ---
    "서울 강남구": { lat: 37.5172, lng: 127.0473 },
    "강남구": { lat: 37.5172, lng: 127.0473 },
    "서울 서초구": { lat: 37.4837, lng: 127.0324 },
    "서초구": { lat: 37.4837, lng: 127.0324 },
    "서울 송파구": { lat: 37.5145, lng: 127.1066 },
    "송파구": { lat: 37.5145, lng: 127.1066 },
    "서울 마포구": { lat: 37.5663, lng: 126.9016 },
    "서울 영등포구": { lat: 37.5264, lng: 126.8962 },
    "서울 용산구": { lat: 37.5326, lng: 126.9900 },
    "서울 종로구": { lat: 37.5730, lng: 126.9794 },
    "서울 성동구": { lat: 37.5633, lng: 127.0371 },
    "서울 광진구": { lat: 37.5385, lng: 127.0823 },
    "서울 구로구": { lat: 37.4954, lng: 126.8874 },
    "서울 금천구": { lat: 37.4568, lng: 126.8954 },
    
    // 🔥 중복 이름 구 처리
    "서울 중구": { lat: 37.5637, lng: 126.9975 },
    "인천 중구": { lat: 37.4738, lng: 126.6217 },
    "부산 중구": { lat: 35.1062, lng: 129.0324 },
    "대구 중구": { lat: 35.8693, lng: 128.6062 },
    "대전 중구": { lat: 36.3252, lng: 127.4214 },
    "울산 중구": { lat: 35.5693, lng: 129.3328 },

    "서울 강서구": { lat: 37.5509, lng: 126.8497 },
    "부산 강서구": { lat: 35.2122, lng: 128.9806 },

    "인천 동구": { lat: 37.4739, lng: 126.6328 },
    "부산 동구": { lat: 35.1293, lng: 129.0455 },
    "대구 동구": { lat: 35.8865, lng: 128.6355 },
    "광주 동구": { lat: 35.1456, lng: 126.9232 },
    "대전 동구": { lat: 36.3333, lng: 127.4567 },
    "울산 동구": { lat: 35.5047, lng: 129.4166 },

    "인천 서구": { lat: 37.5454, lng: 126.6760 },
    "부산 서구": { lat: 35.0979, lng: 129.0242 },
    "대구 서구": { lat: 35.8717, lng: 128.5591 },
    "광주 서구": { lat: 35.1520, lng: 126.8577 },
    "대전 서구": { lat: 36.3553, lng: 127.3835 },

    "인천 남구": { lat: 37.4635, lng: 126.6502 }, 
    "부산 남구": { lat: 35.1365, lng: 129.0843 },
    "대구 남구": { lat: 35.8459, lng: 128.5977 },
    "광주 남구": { lat: 35.1329, lng: 126.9025 },
    "울산 남구": { lat: 35.5435, lng: 129.3301 },

    "부산 북구": { lat: 35.1972, lng: 128.9904 },
    "대구 북구": { lat: 35.8856, lng: 128.5830 },
    "광주 북구": { lat: 35.1742, lng: 126.9122 },
    "울산 북구": { lat: 35.5826, lng: 129.3608 },

    // --- 기타 주요 지역 ---
    "성남시": { lat: 37.4200, lng: 127.1265 },
    "수원시": { lat: 37.2636, lng: 127.0286 },
    "용인시": { lat: 37.2410, lng: 127.1775 },
    "고양시": { lat: 37.6584, lng: 126.8320 },
    "안양시": { lat: 37.3943, lng: 126.9568 },
    "안산시": { lat: 37.3219, lng: 126.8309 },
    "부천시": { lat: 37.5034, lng: 126.7660 },
    "화성시": { lat: 37.1995, lng: 126.8315 },
    "평택시": { lat: 36.9921, lng: 127.1127 },
    "천안시": { lat: 36.8151, lng: 127.1139 },
    "청주시": { lat: 36.6424, lng: 127.4890 },
    "전주시": { lat: 35.8242, lng: 127.1480 },
    "창원시": { lat: 35.2279, lng: 128.6818 },
    "제주시": { lat: 33.4996, lng: 126.5312 },
};

// --- 커스텀 훅: 디바운스 (입력 지연 처리) ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// --- 데이터 타입 정의 ---
interface Job {
  id: number;
  title: string;
  url: string;
  deadline: string | null;
}

interface Company {
  id: number;
  name: string;
  logo_url: string; 
  address: string;
  latitude: number;  
  longitude: number; 
}

export default function JobMap() {
  const searchParams = useSearchParams();
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_KEY as string,
    libraries: ["clusterer", "services"],
  });

  // --- 상태 관리 ---
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [visibleCompanies, setVisibleCompanies] = useState<Company[]>([]);
  
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const [center, setCenter] = useState(SEOUL_CENTER);
  const [level, setLevel] = useState(INITIAL_MAP_LEVEL);

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyJobs, setCompanyJobs] = useState<Job[]>([]); 
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isJobsLoading, setIsJobsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");
  const [favoriteCompanyIds, setFavoriteCompanyIds] = useState<number[]>([]);
  const hasMapIdleFired = useRef(false);

  // --- 필터 상태 ---
  const [searchQuery, setSearchQuery] = useState("");
  const [careerYear, setCareerYear] = useState<string>("");
  const [jobSearch, setJobSearch] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // ✅ 로그인 모달 상태
  const [showLoginCheck, setShowLoginCheck] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const debouncedCareer = useDebounce(careerYear, 500);
  const debouncedJobSearch = useDebounce(jobSearch, 500);
  const debouncedCity = useDebounce(city, 500);
  const debouncedDistrict = useDebounce(district, 500);

  // 1. 초기 데이터 로드
  useEffect(() => {
    const fetchAllData = async () => {
      setIsDataLoading(true);
      try {
        const { accessToken } = getAuthTokens();
        if (accessToken) {
          try {
            const bookmarksResponse = await api.get('/jobs/corp-bookmarks/');
            const bookmarks = bookmarksResponse.data.results || bookmarksResponse.data || [];
            const favoriteIds = bookmarks.map((b: any) => b.corp?.id || b.corp_id);
            setFavoriteCompanyIds(favoriteIds);
          } catch (error: any) {
            console.error('즐겨찾기 로드 실패:', error);
          }
        }

        const response = await api.get('/jobs/corps/?page_size=1000');
        const rawCorps = Array.isArray(response.data) ? response.data : response.data.results || [];
        const enriched = rawCorps
          .map((c: any) => ({
            ...c,
            latitude: parseFloat(c.latitude ?? c.lat ?? '0'),
            longitude: parseFloat(c.longitude ?? c.lng ?? '0')
          }))
          .filter((c: any) => !isNaN(c.latitude) && !isNaN(c.longitude) && c.latitude !== 0 && c.longitude !== 0);

        setAllCompanies(enriched);
        setCompanies(enriched);

      } catch (e: any) {
        console.error("데이터 로드 에러:", e);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // 2. 상세 필터링
  useEffect(() => {
    const filterCompanies = async () => {
      if (!debouncedCareer && !debouncedJobSearch && !debouncedCity && !debouncedDistrict) {
        setCompanies(allCompanies);
        return;
      }

      setIsDataLoading(true);
      const apiParams: Record<string, number | string> = {};
      const year = parseInt(debouncedCareer, 10);
      if (debouncedCareer !== "" && !isNaN(year) && year >= 0) apiParams.career_year = year;
      if (debouncedJobSearch?.trim()) apiParams.job_title = debouncedJobSearch.trim();
      if (debouncedCity?.trim()) apiParams.city = debouncedCity.trim();
      if (debouncedDistrict?.trim()) apiParams.district = debouncedDistrict.trim();
      apiParams.page_size = 5000;

      try {
        const res = await api.get("/jobs/job-postings/", { params: apiParams });
        const raw = Array.isArray(res.data) ? res.data : res.data?.results || [];
        const corpIds = new Set(raw.map((j: any) => j.corp?.id ?? j.corp_id).filter(Boolean).map(Number));
        const filtered = allCompanies.filter((c) => corpIds.has(c.id));
        setCompanies(filtered);
      } catch (e) {
        console.error("상세 필터 API 에러:", e);
        setCompanies([]);
      } finally {
        setIsDataLoading(false);
      }
    };

    if (allCompanies.length > 0) {
      filterCompanies();
    }
  }, [debouncedCareer, debouncedJobSearch, debouncedCity, debouncedDistrict, allCompanies]);

  // 3. 최종 리스트 계산 (사이드바용)
  const finalCompanies = useMemo(() => {
    let result = companies;
    if (activeTab === "favorites") {
      result = result.filter(c => favoriteCompanyIds.includes(c.id));
    }
    if (searchQuery) {
      result = result.filter(c => 
        c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [companies, activeTab, favoriteCompanyIds, searchQuery]);

  // 지도에 표시할 기업 목록 (검색어만 반영)
  const mapCompanies = useMemo(() => {
    let result = companies;
    if (searchQuery) {
      result = result.filter(c =>
        c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [companies, searchQuery]);

  // 4. 지도 뷰포트 내 마커 필터링
  const updateVisibleCompanies = useCallback(() => {
    if (!map) return;
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const visible = mapCompanies.filter((company) => {
      return (
        company.latitude >= sw.getLat() &&
        company.latitude <= ne.getLat() &&
        company.longitude >= sw.getLng() &&
        company.longitude <= ne.getLng()
      );
    });
    setVisibleCompanies(visible);
  }, [map, mapCompanies]);

  useEffect(() => {
    updateVisibleCompanies();
  }, [finalCompanies, updateVisibleCompanies]);

  const companiesToShow = useMemo(() => {
    if (!selectedCompany) return visibleCompanies;
    const lat = Number(selectedCompany.latitude);
    const lng = Number(selectedCompany.longitude);
    const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    if (!hasValidCoords) return visibleCompanies;
    const alreadyIn = visibleCompanies.some((c) => c.id === selectedCompany.id);
    return alreadyIn ? visibleCompanies : [selectedCompany, ...visibleCompanies];
  }, [visibleCompanies, selectedCompany]);

  // --- 지도 중심 이동 및 보정 로직 ---
  useEffect(() => {
    if (!map) return;

    // 1. 목표 지점 및 줌 레벨 결정
    const targetLat = selectedCompany ? Number(selectedCompany.latitude) : SEOUL_CENTER.lat;
    const targetLng = selectedCompany ? Number(selectedCompany.longitude) : SEOUL_CENTER.lng;
    const targetLevel = selectedCompany ? 3 : INITIAL_MAP_LEVEL;

    if (isNaN(targetLat) || isNaN(targetLng)) return;

    // 2. 줌 레벨 적용
    map.setLevel(targetLevel);

    // 3. 중심 이동 (사이드바 고려)
    const moveWithOffset = () => {
        const projection = map.getProjection();
        if (!projection) return;

        const targetPosition = new kakao.maps.LatLng(targetLat, targetLng);

        if (isSidebarOpen && window.innerWidth >= 1024) {
            const point = projection.pointFromCoords(targetPosition);
            const newCenterPoint = new kakao.maps.Point(point.x - 200, point.y);
            const newCenter = projection.coordsFromPoint(newCenterPoint);
            map.panTo(newCenter);
        } else {
            map.panTo(targetPosition);
        }
    };

    setTimeout(moveWithOffset, 150);

  }, [map, selectedCompany, isSidebarOpen]);

  // 지역 필터 변경 시 지도 이동 로직
  const moveToRegion = useCallback((regionName: string, zoomLevel: number, parentRegionName?: string) => {
    if (!map || !regionName) return;

    let coords = null;
    if (parentRegionName) {
        coords = REGION_COORDINATES[`${parentRegionName} ${regionName}`];
    }
    if (!coords) {
        coords = REGION_COORDINATES[regionName];
    }
    
    if (coords) {
        const moveLatLon = new kakao.maps.LatLng(coords.lat, coords.lng);
        map.setLevel(zoomLevel, { animate: true }); 
        
        if (isSidebarOpen && window.innerWidth >= 1024) {
            const projection = map.getProjection();
            if (projection) {
                setTimeout(() => {
                    const point = projection.pointFromCoords(moveLatLon);
                    const newCenterPoint = new kakao.maps.Point(point.x - 200, point.y);
                    const newCenter = projection.coordsFromPoint(newCenterPoint);
                    map.panTo(newCenter);
                }, 300);
            } else {
                map.panTo(moveLatLon);
            }
        } else {
            map.panTo(moveLatLon);
        }
    }
  }, [map, isSidebarOpen]);

  useEffect(() => {
    if (district) {
        moveToRegion(district, 6, city);
    } else if (city) {
        moveToRegion(city, 9);
    }
  }, [city, district, moveToRegion]);


  // --- 핸들러 함수들 ---

  const fetchCompanyJobs = async (corpId: number) => {
    setIsJobsLoading(true);
    try {
      const params: Record<string, number | string> = {};
      const year = parseInt(careerYear, 10);
      if (careerYear !== "" && !isNaN(year) && year >= 0) params.career_year = year;
      if (jobSearch?.trim()) params.job_title = jobSearch.trim();
      if (city?.trim()) params.city = city.trim();
      if (district?.trim()) params.district = district.trim();

      const response = await api.get(`/jobs/corps/${corpId}/job-postings/`, { params });
      const rawJobs = response.data?.results || response.data || [];
      setCompanyJobs(rawJobs.map((j: any) => ({
        id: j.id,
        title: j.title,
        url: j.url,
        deadline: j.expiry_date
      })));
    } catch (e) {
      setCompanyJobs([]);
    } finally {
      setIsJobsLoading(false);
    }
  };

  const resetFilters = () => {
    setCareerYear("");
    setJobSearch("");
    setCity("");
    setDistrict("");
    if(map) {
        map.setLevel(INITIAL_MAP_LEVEL, { animate: true });
        map.panTo(new kakao.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng));
    }
  };
  
  const hasActiveFilters = careerYear !== "" || jobSearch !== "" || city !== "" || district !== "";

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCity(e.target.value);
    setDistrict(""); 
  };

  // ✅ [수정] 즐겨찾기 토글 (비로그인 체크 추가)
  const toggleCompanyFavorite = async (e: React.MouseEvent, corpId: number) => {
    e.stopPropagation();
    const { accessToken } = getAuthTokens();
    
    // ✅ 토큰이 없으면 로그인 모달 띄우기
    if (!accessToken) {
        setShowLoginCheck(true);
        return;
    }

    try {
      const isFavorite = favoriteCompanyIds.includes(corpId);
      if (isFavorite) {
        try {
          const bookmarksResponse = await api.get('/jobs/corp-bookmarks/');
          const bookmarks = bookmarksResponse.data.results || bookmarksResponse.data || [];
          const bookmarkToDelete = bookmarks.find((b: any) => b.corp?.id === corpId || b.corp_id === corpId);
          if (bookmarkToDelete) {
            await api.delete(`/jobs/corp-bookmarks/${bookmarkToDelete.corp_bookmark_id || bookmarkToDelete.id}/`);
            setFavoriteCompanyIds(prev => prev.filter(id => id !== corpId));
            window.dispatchEvent(new CustomEvent('favoriteChanged', { detail: { type: 'company', action: 'removed', id: corpId } }));
          }
        } catch (error) { console.error(error); }
      } else {
        try {
          await api.post('/jobs/corp-bookmarks/', { corp_id: corpId });
          setFavoriteCompanyIds(prev => [...prev, corpId]);
          window.dispatchEvent(new CustomEvent('favoriteChanged', { detail: { type: 'company', action: 'added', id: corpId } }));
        } catch (error) { console.error(error); }
      }
    } catch (error) { console.error(error); }
  };

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    setLevel(3);
    fetchCompanyJobs(company.id);
    if (!isSidebarOpen) setIsSidebarOpen(true); 
  };

  useEffect(() => {
    const corpIdParam = searchParams?.get('corpId');
    if (corpIdParam && companies.length > 0) {
      const corpId = parseInt(corpIdParam, 10);
      if (!isNaN(corpId)) {
        const company = companies.find(c => c.id === corpId);
        if (company && (!selectedCompany || selectedCompany.id !== corpId)) {
          handleSelectCompany(company);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, companies]);

  useEffect(() => {
    const handleReset = () => {
      setSelectedCompany(null);
      setCompanyJobs([]);
      resetFilters();
      setSearchQuery("");
      setShowFilters(false);
      setCenter(SEOUL_CENTER);
      setLevel(INITIAL_MAP_LEVEL);
    };
    window.addEventListener("resetJobMap", handleReset);
    return () => window.removeEventListener("resetJobMap", handleReset);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalCompanies.length > 0) {
      handleSelectCompany(finalCompanies[0]);
    } else {
      alert("검색 결과가 없습니다.");
    }
  };

  if (loading) return <div className="w-full h-screen bg-[#1A1B1E] flex items-center justify-center text-white">지도를 로드 중...</div>;

  return (
    <div className="flex flex-col lg:flex-row w-full h-full bg-[#1A1B1E] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl relative">
      
      {/* ✅ 로그인 모달 컴포넌트 추가 */}
      <LoginCheckModal 
          isOpen={showLoginCheck} 
          onClose={() => setShowLoginCheck(false)}
          onConfirm={() => {
              setShowLoginCheck(false);
              setShowLoginModal(true);
          }}
      />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      {/* 🔴 사이드바 */}
      <div 
        className={`absolute left-0 top-0 h-full w-full md:w-[400px] bg-[#25262B] z-20 transition-transform duration-300 shadow-2xl flex flex-col border-r border-white/5 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="bg-[#2C2E33] flex-shrink-0 relative z-20">
            {/* 헤더 */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-white">채용 지도</h2>
                  <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          showFilters 
                              ? "bg-blue-600/20 text-blue-400 border-blue-500/50" 
                              : "bg-[#1A1B1E] text-gray-400 border-white/10 hover:border-white/30 hover:text-white"
                      }`}
                  >
                      <Filter size={14} className={showFilters ? "fill-blue-400" : ""} />
                      상세 필터
                      <ChevronDown size={14} className={`transition-transform duration-300 ${showFilters ? "rotate-180" : ""}`} />
                  </button>
                </div>
                
                <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-gray-400">
                    <X size={20} />
                </button>
            </div>

            {/* 필터 애니메이션 컨테이너 */}
            <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out bg-[#1A1B1E] border-b border-white/5 ${
                    showFilters ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
            >
                <div className="p-4 space-y-4">
                    {/* 필터 입력 폼 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] text-gray-400 mb-1.5 uppercase font-bold tracking-wider">경력(년)</label>
                            <input 
                              type="number" 
                              min="0" 
                              placeholder="0" 
                              value={careerYear} 
                              onChange={(e) => setCareerYear(e.target.value)} 
                              className="w-full bg-[#25262B] text-white px-3 py-2 rounded-lg border border-white/10 text-xs focus:border-blue-500 outline-none transition-colors appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-400 mb-1.5 uppercase font-bold tracking-wider">직무 분야</label>
                            <input type="text" value={jobSearch} onChange={(e) => setJobSearch(e.target.value)} placeholder="제목 검색" className="w-full bg-[#25262B] text-white px-3 py-2 rounded-lg border border-white/10 text-xs focus:border-blue-500 outline-none transition-colors" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] text-gray-400 mb-1.5 uppercase font-bold tracking-wider">시/도</label>
                            <div className="relative">
                                <select value={city} onChange={handleCityChange} className="w-full bg-[#25262B] text-white pl-3 pr-8 py-2 rounded-lg border border-white/10 text-xs focus:border-blue-500 outline-none appearance-none transition-colors cursor-pointer">
                                    <option value="">전체 지역</option>
                                    {Object.keys(KOREA_DISTRICTS).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-400 mb-1.5 uppercase font-bold tracking-wider">군/구</label>
                            <div className="relative">
                                <select 
                                    value={district} 
                                    onChange={(e) => setDistrict(e.target.value)} 
                                    disabled={!city}
                                    className={`w-full bg-[#25262B] text-white pl-3 pr-8 py-2 rounded-lg border border-white/10 text-xs focus:border-blue-500 outline-none appearance-none transition-colors ${!city ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                    <option value="">
                                        {city ? "전체" : "시/도 선택 필요"}
                                    </option>
                                    {city && KOREA_DISTRICTS[city]?.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                            </div>
                        </div>
                    </div>

                    {/* 필터 하단 정보 및 초기화 */}
                    {hasActiveFilters && (
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                             <div className="flex items-center gap-1.5 text-[10px] text-blue-400">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                필터 적용 중
                             </div>
                             <button onClick={resetFilters} className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
                                <X size={10} /> 조건 초기화
                             </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 검색 및 탭 패널 */}
            <div className="p-4 pb-0 bg-[#2C2E33]">
                <form onSubmit={handleSearchSubmit} className="relative mb-4">
                    <input 
                        type="text" placeholder="기업명 검색..." 
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#1A1B1E] text-white pl-10 pr-4 py-3 rounded-xl border border-white/10 outline-none text-sm focus:border-blue-500 transition-colors placeholder:text-gray-500"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                </form>

                {/* 탭 (전체 / 즐겨찾기) */}
                <div className="flex border-b border-white/10 px-2">
                    <button
                        onClick={() => { setActiveTab("all"); setSelectedCompany(null); }}
                        className={`flex-1 pb-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                            activeTab === "all" ? "border-blue-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"
                        }`}
                    >
                        <List size={16} />
                        전체 ({companies.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab("favorites"); setSelectedCompany(null); }}
                        className={`flex-1 pb-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                            activeTab === "favorites" ? "border-yellow-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"
                        }`}
                    >
                        <Star size={16} fill={activeTab === "favorites" ? "currentColor" : "none"} />
                        즐겨찾기 ({favoriteCompanyIds.length})
                    </button>
                </div>
            </div>
        </div>

        {/* 리스트 영역 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#1e1f23] relative z-10">
            {isDataLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                    <span>데이터를 불러오는 중...</span>
                </div>
            ) : selectedCompany ? (
                // (1) 기업 상세 보기
                <div className="animate-in slide-in-from-right duration-200">
                    <button onClick={() => setSelectedCompany(null)} className="flex items-center gap-2 text-gray-400 hover:text-white text-xs mb-3">
                        <ArrowLeft size={14} /> 목록으로 돌아가기
                    </button>
                    <div className="bg-[#25262B] p-4 rounded-xl border border-white/10 mb-4">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center p-2 shrink-0">
                                {selectedCompany.logo_url ? <img src={selectedCompany.logo_url} alt={selectedCompany.name} className="object-contain w-full h-full" /> : <Building2 className="text-gray-400 w-8 h-8" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-base font-bold text-white truncate">{selectedCompany.name}</h2>
                                    <button onClick={(e) => toggleCompanyFavorite(e, selectedCompany.id)}>
                                        <Star size={20} fill={favoriteCompanyIds.includes(selectedCompany.id) ? "#EAB308" : "none"} className={favoriteCompanyIds.includes(selectedCompany.id) ? "text-yellow-500" : "text-gray-500"} />
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1 flex items-start gap-1 break-keep">
                                    <MapPin size={12} className="shrink-0 mt-0.5" />
                                    {selectedCompany.address}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-300 px-1">진행 중인 공고 {companyJobs.length}건</h3>
                        {isJobsLoading ? (
                            <div className="text-center py-8 text-gray-500">공고 로딩 중...</div>
                        ) : companyJobs.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 bg-[#25262B] rounded-xl border border-white/5">
                                {hasActiveFilters ? "조건에 맞는 채용공고가 없습니다." : "등록된 공고가 없습니다."}
                            </div>
                        ) : (
                            companyJobs.map(job => (
                                <JobCard key={job.id} id={job.id} company={selectedCompany.name} logo={selectedCompany.logo_url} position={job.title} url={job.url} deadline={job.deadline} compact />
                            ))
                        )}
                    </div>
                </div>
            ) : (
                // (2) 기업 목록 (최종 리스트)
                <div className="space-y-2">
                    <div className="flex items-center justify-between px-1 mb-4">
                        <p className="text-xs font-bold text-gray-500 uppercase">
                            {activeTab === "favorites" ? "즐겨찾기 기업" : "검색 결과"} ({finalCompanies.length})
                        </p>
                    </div>
                    
                    {finalCompanies.length === 0 ? (
                        <div className="text-center py-20 text-gray-500 flex flex-col items-center gap-3">
                            <Building2 size={40} strokeWidth={1} />
                            <p>
                                {activeTab === "favorites" ? "즐겨찾기한 기업이 없습니다." : "조건에 맞는 기업이 없습니다."}
                            </p>
                        </div>
                    ) : (
                        finalCompanies.slice(0, 100).map(company => (
                            <div 
                                key={company.id} 
                                onClick={() => handleSelectCompany(company)}
                                className="group p-4 bg-[#25262B] border border-white/5 hover:border-blue-500/50 hover:bg-[#2C2E33] rounded-2xl cursor-pointer flex items-center gap-4 transition-all"
                            >
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1.5 shrink-0 shadow-sm">
                                    {company.logo_url ? <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain" /> : <Building2 className="text-gray-400 w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white text-base truncate group-hover:text-blue-400 transition-colors">{company.name}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5 truncate">{company.address}</p>
                                </div>
                                <button
                                    onClick={(e) => toggleCompanyFavorite(e, company.id)}
                                    className="shrink-0 p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <Star 
                                        size={16} 
                                        fill={favoriteCompanyIds.includes(company.id) ? "#EAB308" : "none"} 
                                        className={favoriteCompanyIds.includes(company.id) ? "text-yellow-500" : "text-gray-600"} 
                                    />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
      </div>

      {/* 🔵 지도 영역 */}
      <div className="flex-1 relative bg-gray-900 w-full h-full">
        {!isSidebarOpen && (
            <button 
                onClick={() => setIsSidebarOpen(true)}
                className="absolute left-4 top-4 z-10 bg-[#25262B] text-white p-3 rounded-xl shadow-lg border border-white/10 hover:bg-[#2C2E33]"
            >
                <List size={24} />
            </button>
        )}

        <KakaoMap 
            center={center} 
            style={{ width: "100%", height: "100%" }} 
            level={level} 
            onCreate={setMap}
            draggable={!isDataLoading}
            zoomable={!isDataLoading}
            onZoomChanged={(map) => setLevel(map.getLevel())}
            onIdle={(map) => {
                if (hasMapIdleFired.current) {
                    setCenter({ lat: map.getCenter().getLat(), lng: map.getCenter().getLng() });
                } else {
                    hasMapIdleFired.current = true;
                }
                updateVisibleCompanies(); 
            }}
        >
          {(() => {
            const favoriteCompanies = companiesToShow.filter(c => favoriteCompanyIds.includes(c.id));
            const nonFavoriteCompanies = companiesToShow.filter(c => !favoriteCompanyIds.includes(c.id));

            const renderMarker = (company: Company) => (
                <CustomOverlayMap 
                    key={company.id} 
                    position={{ lat: company.latitude, lng: company.longitude }} 
                    yAnchor={0.5}
                    zIndex={selectedCompany?.id === company.id ? 20 : favoriteCompanyIds.includes(company.id) ? 10 : 1}
                >
                    <div 
                        onClick={(e) => { e.stopPropagation(); handleSelectCompany(company); }} 
                        className="relative cursor-pointer group"
                    >
                        <div className="flex flex-col items-center">
                            <div className={`px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/20 flex items-center gap-1 shadow-md ${selectedCompany?.id === company.id ? "opacity-100 bg-blue-600 border-blue-400" : ""}`}>
                                {favoriteCompanyIds.includes(company.id) && <Star size={10} fill="#EAB308" className="text-yellow-500" />}
                                {company.name}
                            </div>
                            {level >= 6 ? (
                                <div className={`w-3 h-3 rounded-full shadow-lg transition-all ${favoriteCompanyIds.includes(company.id) ? "bg-yellow-500" : "bg-blue-600"}`} />
                            ) : (
                                <>
                                    {/* 즐겨찾기 상태에 따라 마커 색상 변경 */}
                                    {(() => {
                                        const isFavorite = favoriteCompanyIds.includes(company.id);
                                        const isSelected = selectedCompany?.id === company.id;
                                        const borderColorClass = isFavorite
                                            ? (isSelected ? "!border-yellow-500" : "border-yellow-500")
                                            : (isSelected ? "!border-blue-500" : "border-blue-600");
                                        const ringClass = isSelected
                                            ? "scale-125 ring-4 " + (isFavorite ? "ring-yellow-500/20" : "ring-blue-500/20")
                                            : "";
                                        const pointerColorClass = isFavorite
                                            ? (isSelected ? "border-t-yellow-500" : "border-t-yellow-600")
                                            : (isSelected ? "border-t-blue-500" : "border-t-blue-600");
                                        return (
                                            <>
                                                <div className={`w-10 h-10 rounded-full border-2 ${borderColorClass} shadow-xl flex items-center justify-center bg-white transition-all duration-300 ${ringClass}`}>
                                                    {company.logo_url ? <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain rounded-full p-1.5" /> : <Building2 size={16} className="text-gray-400" />}
                                                </div>
                                                <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] -mt-0.5 transition-colors ${pointerColorClass}`} />
                                            </>
                                        );
                                    })()}
                                </>
                            )}
                        </div>
                    </div>
                </CustomOverlayMap>
            );

            return (
              <>
                <MarkerClusterer
                  averageCenter={true}
                  minLevel={4}
                  minClusterSize={2}
                  styles={[
                    {
                      width: '30px', height: '30px',
                      background: 'rgba(51, 126, 255, 0.8)',
                      borderRadius: '50%', color: '#fff',
                      textAlign: 'center', fontWeight: 'bold',
                      lineHeight: '30px',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      range: '10' // 1-9 markers
                    },
                    {
                      width: '40px', height: '40px',
                      background: 'rgba(51, 126, 255, 0.85)',
                      borderRadius: '50%', color: '#fff',
                      textAlign: 'center', fontWeight: 'bold',
                      lineHeight: '40px',
                      border: '1px solid rgba(255, 255, 255, 0.6)',
                      range: '50' // 10-49 markers
                    },
                    {
                      width: '50px', height: '50px',
                      background: 'rgba(51, 126, 255, 0.9)',
                      borderRadius: '50%', color: '#fff',
                      textAlign: 'center', fontWeight: 'bold',
                      lineHeight: '50px',
                      border: '1px solid rgba(255, 255, 255, 0.7)',
                      range: '100' // 50-99 markers
                    },
                    {
                      width: '60px', height: '60px',
                      background: 'rgba(51, 126, 255, 0.95)',
                      borderRadius: '50%', color: '#fff',
                      textAlign: 'center', fontWeight: 'bold',
                      lineHeight: '60px',
                      border: '1px solid rgba(255, 255, 255, 0.8)',
                      range: '200' // 100-199 markers, choose a reasonable max
                    }
                  ]}
                >
                  {nonFavoriteCompanies.map(renderMarker)}
                </MarkerClusterer>
                {favoriteCompanies.map(renderMarker)}
              </>
            );
          })()}
        </KakaoMap>
      </div>
    </div>
  );
}