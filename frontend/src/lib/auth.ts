/**
 * Google OAuth 로그인 시작
 * 세션 쿠키를 위해 credentials: 'include' 필요 (state 검증용)
 */
export async function startGoogleLogin() {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(
      `${API_URL}/api/v1/users/auth/google/start/`,
      { credentials: 'include' }
    );

    if (!response.ok) {
      throw new Error("OAuth URL을 가져올 수 없습니다.");
    }

    const data = await response.json();
    if (data.redirectUrl) {
      window.location.href = data.redirectUrl;
    } else {
      throw new Error("리다이렉트 URL을 받지 못했습니다.");
    }
  } catch (error) {
    console.error("Google 로그인 시작 실패:", error);
    throw error;
  }
}

// ========== 일반 JWT 로그인/회원가입 (주석 처리, 구글 소셜 로그인만 사용) ==========
// /**
//  * 일반 JWT 로그인
//  */
// export async function login(email: string, password: string) {
//   try {
//     const { api } = await import('./api');
//     const response = await api.post('/users/login', {
//       email,
//       password,
//     });
//     const data = response.data;
//     if (!data.access || !data.refresh) {
//       console.error("응답 데이터:", data);
//       throw new Error("토큰을 받지 못했습니다.");
//     }
//     setAuthTokens(data.access, data.refresh);
//     if (data.user?.profile_image) {
//       setUserProfileImage(data.user.profile_image);
//     }
//     window.dispatchEvent(new Event('authSuccess'));
//     return data;
//   } catch (error: any) {
//     console.error("로그인 실패:", error);
//     const errorMessage = error.response?.data?.error || error.message || '로그인에 실패했습니다.';
//     throw new Error(errorMessage);
//   }
// }
//
// /**
//  * 일반 JWT 회원가입
//  */
// export async function signup(email: string, username: string, name: string, password: string, passwordConfirm: string) {
//   try {
//     const { api } = await import('./api');
//     const baseURL = process.env.NEXT_PUBLIC_API_URL;
//     const fullUrl = `${baseURL}/api/v1/users/signup/`;
//     console.log('회원가입 요청 URL:', fullUrl);
//     console.log('요청 데이터:', { email, username, name, password: '***', password_confirm: '***' });
//     const response = await api.post('/users/signup', {
//       email,
//       username,
//       name,
//       password,
//       password_confirm: passwordConfirm,
//     });
//     return response.data;
//   } catch (error: any) {
//     console.error("회원가입 실패:", error);
//     console.error("에러 상세:", {
//       message: error.message,
//       status: error.response?.status,
//       statusText: error.response?.statusText,
//       data: error.response?.data,
//       url: error.config?.url,
//       baseURL: error.config?.baseURL,
//       fullURL: error.config?.baseURL ? `${error.config.baseURL}${error.config.url}` : error.config?.url,
//     });
//     const errorMessage = error.response?.data?.error ||
//       error.response?.data?.detail ||
//       error.response?.data?.message ||
//       error.message ||
//       '회원가입에 실패했습니다.';
//     throw new Error(errorMessage);
//   }
// }

/**
 * JWT 토큰 저장
 */
export function setAuthTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
}

/**
 * 프로필 이미지 URL 저장
 */
export function setUserProfileImage(imageUrl: string) {
  if (typeof window === "undefined" || !imageUrl) return;
  localStorage.setItem("user_profile_image", imageUrl);
}

/**
 * 저장된 JWT 토큰 가져오기
 */
export function getAuthTokens() {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null };
  }
  return {
    accessToken: localStorage.getItem("access_token"),
    refreshToken: localStorage.getItem("refresh_token"),
  };
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

/**
 * 저장된 프로필 이미지 가져오기
 */
export function getUserProfileImage(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("user_profile_image");
}

/**
 * 토큰 및 사용자 정보 삭제 (리다이렉트 없음)
 * api.ts 등에서 사용하기 위해 분리함
 */
export function clearAuthTokens() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_profile_image");
  }
}

/**
 * 로그아웃 (백엔드 API 호출 + 토큰 삭제 후 홈으로 이동)
 */
export async function logout() {
  const refreshToken = getRefreshToken();

  // 백엔드 API 호출하여 refresh token 블랙리스트 처리
  if (refreshToken) {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const accessToken = getAccessToken();

      await fetch(`${API_URL}/api/v1/users/auth/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ refresh: refreshToken })
      });

      // API 호출 성공 여부와 관계없이 로컬 토큰 삭제
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
      // 네트워크 오류 등이 발생해도 로컬 토큰은 삭제
    }
  }

  clearAuthTokens(); // 로컬 토큰 삭제

  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}

/**
 * 인증된 API 요청 (fetch wrapper)
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAccessToken();
  
  const headers: HeadersInit = {
    ...options.headers,
  };

  if (token) {
    (headers as any).Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // 401 에러 시 자동 로그아웃
  if (response.status === 401) {
    logout();
    throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
  }
  
  return response;
}

/**
 * JWT 토큰 갱신
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) return null;
  
  try {
    const { api } = await import('./api');
    const response = await api.post('/users/auth/token/refresh', {
      refresh: refreshToken,
    });
    
    const data = response.data;
    setAuthTokens(data.access, data.refresh);
    
    return data.access;
  } catch (error) {
    console.error("토큰 갱신 중 오류 발생:", error);
    logout(); // 갱신 실패 시 로그아웃 처리
    return null;
  }
}