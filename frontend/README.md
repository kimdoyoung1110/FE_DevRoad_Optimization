# TeamA Frontend

Next.js 14 기반 프론트엔드 애플리케이션입니다.

## 기술 스택

- Next.js 14 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS 3
- Zustand (상태 관리)
- React Query (서버 상태)
- Axios (HTTP 클라이언트)

---

## 빠른 시작

### 1. 패키지 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

---

## 사용 가능한 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 린트 검사
npm run lint

# 린트 자동 수정
npm run lint:fix

# 타입 검사
npm run type-check

# 코드 포맷팅
npm run format
```

---

## 프로젝트 구조

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router 페이지
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   ├── page.tsx            # 홈페이지
│   │   ├── globals.css         # 전역 스타일
│   │   └── providers.tsx       # Context Providers
│   ├── components/             # React 컴포넌트
│   │   ├── ui/                 # 기본 UI 컴포넌트
│   │   └── ...                 # 기능별 컴포넌트
│   ├── lib/                    # 유틸리티
│   │   ├── api.ts              # API 클라이언트
│   │   └── utils.ts            # 헬퍼 함수
│   ├── store/                  # Zustand 상태 관리
│   │   └── authStore.ts        # 인증 상태
│   └── types/                  # TypeScript 타입 정의
│       └── index.ts            # 공통 타입
├── public/                     # 정적 파일
├── package.json                # 패키지 설정
├── tsconfig.json               # TypeScript 설정
├── tailwind.config.ts          # Tailwind CSS 설정
└── next.config.js              # Next.js 설정
```

---

## 주요 기능

- **인증**: JWT 기반 로그인/회원가입
- **트렌드 대시보드**: 기술 트렌드 시각화
- **채용 공고**: 채용 정보 검색 및 필터링
- **이력서 관리**: 이력서 업로드 및 분석
- **면접 연습**: AI 기반 면접 질문 및 피드백
