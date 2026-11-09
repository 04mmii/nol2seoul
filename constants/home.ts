/**
 * Home content that the Seoul Open API does NOT provide (copy, editorial content).
 * Edit here, not inside components. Everything data-driven lives in components/home/selectors.ts.
 */
import type { EventTab } from '../components/home/selectors';

export const HERO_COPY = {
  mastheadBrand: 'NOLSEOUL',
  mastheadLabel: '이번 주 문화행사',
  sub: '전시, 공연, 축제, 체험까지. 이번 주 서울 곳곳에서 열리는 문화행사를 날짜와 동네, 취향으로 골라보세요.',
  ctaEvents: '이번 주 행사 보기 →',
  ctaMap: '지도에서 탐색',
} as const;

export const EVENT_TABS: ReadonlyArray<{ id: EventTab; label: string }> = [
  { id: 'today', label: '오늘' },
  { id: 'week', label: '이번주' },
  { id: 'month', label: '이번달' },
  { id: 'free', label: '무료' },
];

/** Max cards in the Home event grid (v3: 4 × 2). */
export const HOME_EVENT_LIMIT = 8;

export const MAP_DESCRIPTION = '행사 · 문화공간 · 야경명소를 지도에서 한 번에';

/**
 * ⚠️ PLACEHOLDER CONTENT — copied from the v3 prototype (design-ref/src/data.jsx).
 * These people, roles and quotes are illustrative. They are not real curators and must be
 * replaced with real, consented content (or the section hidden) before production.
 */
export const CURATORS_ARE_PLACEHOLDERS = true;

export type Curator = { name: string; role: string; quote: string; picks: string };

export const CURATORS: readonly Curator[] = [
  {
    name: '이도연',
    role: 'Editor · @SeoulCity Mag',
    quote: '지금 서울에서 가장 흥미로운 건 사라지는 것들과 새로 생기는 것들이 한 골목에 같이 있다는 점.',
    picks: 'PICKS — 낙산공원 · 익선동 골목 · 동묘 벼룩시장',
  },
  {
    name: 'Han Soo Min',
    role: 'Photographer',
    quote: '야경은 빛이 아니라 그 빛 사이의 어둠을 찍는 일이라고 생각해요.',
    picks: 'PICKS — 응봉산 · 한강 다리 5선 · 북악 스카이웨이',
  },
  {
    name: '박재희',
    role: 'Festival Programmer',
    quote: '5월의 서울은 도시 전체가 무대예요. 매주 새로운 페스티벌이 열립니다.',
    picks: 'PICKS — 한강 야시장 · 마포 재즈 · 종로 등불축제',
  },
];
