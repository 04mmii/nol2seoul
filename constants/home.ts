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
