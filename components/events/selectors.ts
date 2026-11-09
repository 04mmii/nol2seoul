/**
 * Pure data selection for the v3 EventList page. Filter behaviour is unchanged from the pre-v3 page
 * (single-select genre / district / fee); the period tabs and the 마감임박 sort are new (approved 2026-11-09).
 */
import type { Event } from '../../types';
import { dateKeys, eventDay } from '../../utils/event';
import { isFree } from '../../utils/fee';
import { filterEventsByTab } from '../home/selectors';

export type PeriodTab = 'all' | 'today' | 'week' | 'month';
export type SortKey = 'default' | 'ending';
export type FeeFilter = '전체' | '무료' | '유료';
export const ALL = '전체';

export type EventFilters = { period: PeriodTab; category: string; region: string; fee: FeeFilter };
export const DEFAULT_FILTERS: EventFilters = { period: 'all', category: ALL, region: ALL, fee: ALL };

/** Filters other than the period tab are active (drives the 필터 초기화 button and the mobile badge). */
export const activeFilterCount = (f: EventFilters) =>
  [f.category !== ALL, f.region !== ALL, f.fee !== ALL].filter(Boolean).length;

/** Applies every filter except `skip` (used for faceted category counts). */
export function applyFilters(events: Event[], f: EventFilters, now: Date, skip?: keyof EventFilters): Event[] {
  let list = f.period === 'all' || skip === 'period' ? events : filterEventsByTab(events, f.period, now);
  if (skip !== 'category' && f.category !== ALL) list = list.filter((e) => e.CODENAME === f.category);
  if (skip !== 'region' && f.region !== ALL) list = list.filter((e) => e.GUNAME === f.region);
  if (skip !== 'fee' && f.fee === '무료') list = list.filter((e) => isFree(e));
  if (skip !== 'fee' && f.fee === '유료') list = list.filter((e) => !isFree(e));
  return list;
}

/**
 * 기본순 = API order. 마감임박 = not ended (KST-agnostic UTC date, same as the Home tabs), soonest END_DATE
 * first; ties keep API order (stable sort); rows without an end date go last.
 */
export function sortEvents(events: Event[], sort: SortKey, now: Date): Event[] {
  if (sort === 'default') return events;
  const { today } = dateKeys(now);
  const end = (e: Event) => eventDay(e.END_DATE) || '9999-12-31';
  return events.filter((e) => end(e) >= today).slice().sort((a, b) => (end(a) < end(b) ? -1 : end(a) > end(b) ? 1 : 0));
}

/** Category list with counts under the other active filters, most frequent first (all categories kept). */
export function categoryOptions(events: Event[], f: EventFilters, now: Date): Array<{ name: string; count: number }> {
  const base = applyFilters(events, f, now, 'category');
  const counts = new Map<string, number>();
  for (const e of base) if (e.CODENAME) counts.set(e.CODENAME, (counts.get(e.CODENAME) ?? 0) + 1);
  const total = new Map<string, number>();
  for (const e of events) if (e.CODENAME) total.set(e.CODENAME, (total.get(e.CODENAME) ?? 0) + 1);
  const names = [...total.keys()].sort((a, b) => (total.get(b)! - total.get(a)!) || a.localeCompare(b, 'ko'));
  return [{ name: ALL, count: base.length }, ...names.map((name) => ({ name, count: counts.get(name) ?? 0 }))];
}

/** Districts present in the data, sorted (same as the pre-v3 page). */
export function regionOptions(events: Event[]): string[] {
  return [ALL, ...[...new Set(events.map((e) => e.GUNAME).filter(Boolean))].sort()];
}

/** Events running today (same rule as the Home "오늘" tab and the Home 진행 중 stat). */
export const ongoingCount = (events: Event[], now: Date) => filterEventsByTab(events, 'today', now).length;

/** Page numbers with ellipses (unchanged logic from the pre-v3 page). */
export function pageNumbers(page: number, totalPages: number): Array<number | '…'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: Array<number | '…'> = [1];
  if (page > 3) pages.push('…');
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
  if (page < totalPages - 2) pages.push('…');
  pages.push(totalPages);
  return pages;
}
