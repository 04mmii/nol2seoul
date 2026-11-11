/**
 * Copy and option lists for the v3 EventList page (design-ref/src/page-events.jsx).
 * Data-derived values (counts, categories, districts) come from selectors, not from here.
 */
import type { PeriodTab, SortKey, FeeFilter } from '../components/events/selectors';

export const EVENTS_COPY = {
  eyebrow: '01 — HAPPENINGS · 문화행사 탐색',
  sub: '전시 · 공연 · 축제 · 클래스 — 지역과 카테고리로 필터해 오늘 갈 곳을 찾아보세요.',
} as const;

/** Same definitions as the Home tabs (components/home/selectors.ts), plus 전체. Default: 전체. */
export const PERIOD_TABS: ReadonlyArray<{ id: PeriodTab; label: string }> = [
  { id: 'today', label: '오늘' },
  { id: 'week', label: '이번 주' },
  { id: 'month', label: '이번 달' },
  { id: 'all', label: '전체' },
];

export const SORT_OPTIONS: ReadonlyArray<{ id: SortKey; label: string }> = [
  { id: 'default', label: '기본순' },
  { id: 'ending', label: '마감임박' },
];

/** BUG-03 option D: 무료 = fee kind "free"; 유료 = every other kind. */
export const FEE_FILTERS: ReadonlyArray<FeeFilter> = ['전체', '무료', '유료'];

export const EVENTS_PER_PAGE = 12;
