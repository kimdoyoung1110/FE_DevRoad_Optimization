import axios from 'axios';
import { getAuthTokens, refreshAccessToken, clearAuthTokens } from './auth';

// ✅ [수정됨] 환경변수(localhost:8000) 뒤에 API 버전(/api/v1)을 붙임
// 환경변수가 없으면 기본값 사용 (개발 환경)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const BASE_URL = `${API_URL}/api/v1`;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/**
 * 공개 API용 인스턴스 (AllowAny 엔드포인트 전용)
 * - withCredentials: false, Authorization 미첨부 → CORS preflight(OPTIONS) 발생 안 함
 * - /trends/tech-stacks/, /trends/tech-stacks/:id/relations/ 등에 사용
 */
export const apiPublic = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// apiPublic: Django 슬래시 규칙만 적용 (Authorization 없음)
apiPublic.interceptors.request.use(
  (config) => {
    if (config.url && !config.url.includes('?')) {
      if (!config.url.endsWith('/')) config.url += '/';
    } else if (config.url && config.url.includes('?')) {
      const [path, query] = config.url.split('?');
      if (path && !path.endsWith('/')) config.url = `${path}/?${query}`;
    }
    return config;
  },
  (e) => Promise.reject(e)
);

// --- 인터셉터 설정 (그대로 유지) ---

api.interceptors.request.use(
  async (config) => {
    const { accessToken } = getAuthTokens();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    // Django 호환성: URL 끝에 슬래시(/) 자동 추가
    // 쿼리 파라미터가 있는 경우는 이미 슬래시가 있을 수 있으므로 확인 필요
    if (config.url && !config.url.includes('?')) {
      // 쿼리 파라미터가 없고 슬래시로 끝나지 않으면 추가
      if (!config.url.endsWith('/')) {
        config.url += '/';
      }
    } else if (config.url && config.url.includes('?')) {
      // 쿼리 파라미터가 있는 경우: /path/?param=value 형태로 유지
      // /path?param=value 형태를 /path/?param=value로 변환
      const [path, query] = config.url.split('?');
      if (path && !path.endsWith('/')) {
        config.url = `${path}/?${query}`;
      }
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("토큰 갱신 실패:", refreshError);
      }
      
      clearAuthTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;