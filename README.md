<div align="center">

# NOLSEOUL (놀서울)

**서울의 모든 문화와 예술을 하나의 플랫폼에서**

</div>

## 소개

놀서울은 서울시 공공데이터를 활용한 문화행사 & 명소 탐색 플랫폼입니다.
서울 곳곳에서 열리는 문화행사, 문화공간, 야경명소를 쉽게 검색하고 지도에서 탐색할 수 있습니다.

## 주요 기능

- **문화행사 탐색** - 서울시 문화행사 실시간 조회, 자치구/장르별 필터링, 정렬
- **문화공간 검색** - 박물관, 미술관, 공연장 등 문화시설 정보
- **야경명소** - 서울의 야경 스팟 정보 및 위치
- **지도 탐색** - 카카오맵 기반 문화행사/공간/야경명소 지도 시각화
- **통합 검색** - 행사, 장소, 키워드 실시간 검색

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS |
| 상태 관리 | TanStack React Query |
| 라우팅 | React Router DOM v7 |
| 지도 | Kakao Maps SDK |
| UI | Swiper, GSAP |
| 배포 | Vercel (Serverless Functions) |

## API

| API | 용도 |
|-----|------|
| [서울 열린데이터광장](http://data.seoul.go.kr) | 문화행사, 문화공간, 야경명소 데이터 |
| [카카오맵](https://developers.kakao.com) | 지도 시각화 |

## 로컬 실행

**사전 요구사항:** Node.js 18+

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정 (.env.local)
SEOUL_API_KEY=서울시_API_키
VITE_KAKAO_MAP_API_KEY=카카오맵_JavaScript_앱키

# 3. 개발 서버 실행
npm run dev
```

> 카카오맵 사용 시 [Kakao Developers](https://developers.kakao.com)에서 플랫폼 도메인 등록이 필요합니다.

## 프로젝트 구조

```
├── api/                  # Vercel Serverless Functions
│   └── seoulapi.ts       # 서울시 Open API 프록시
├── components/           # 공통 컴포넌트
│   └── SearchOverlay.tsx # 검색 오버레이
├── hooks/                # Custom Hooks
│   ├── useEvents.ts      # 문화행사 데이터
│   ├── useCulturalSpaces.ts # 문화공간 데이터
│   ├── useNightViewSpots.ts # 야경명소 데이터
│   └── useKakaoLoader.ts # 카카오맵 SDK 로더
├── pages/                # 페이지 컴포넌트
│   ├── Home.tsx          # 메인 페이지
│   ├── EventList.tsx     # 행사 목록
│   ├── EventDetail.tsx   # 행사 상세
│   ├── MapDiscovery.tsx  # 지도 탐색
│   └── MyPage.tsx        # 마이페이지
├── App.tsx               # 라우터 & 레이아웃
├── types.ts              # TypeScript 타입 정의
└── vite.config.ts        # Vite 설정 (프록시 포함)
```

## 배포

Vercel에 연결하면 자동 배포됩니다. 환경변수에 `SEOUL_API_KEY`를 설정해주세요.

## 라이선스

MIT
