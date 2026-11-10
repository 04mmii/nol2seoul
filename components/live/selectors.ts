/**
 * Live Bar ticker items from real data only (approved 2026-11-10). No placeholder copy: the prototype's
 * "잔여 석", "미세먼지", temperature and issue number have no data source and are not rendered.
 * An item whose data failed to load (or is still loading) is left out.
 * Event dates use the same "today" as the Home tabs (dateKeys; DESIGN.md §12 UTC note).
 */
import type { Event, NightViewSpot } from '../../types';
import { dateKeys, eventDay } from '../../utils/event';
import { formatHm, kstDateParts, seoulSunsetMinutes } from '../../utils/sun';
import { filterEventsByTab } from '../home/selectors';
import { buildNight } from '../night/selectors';

export type TickerItem = { id: string; text: string; hot?: boolean };

export function buildTickerItems(opts: {
  now: Date;
  events: Event[] | null; // null = not available (loading or error)
  spots: NightViewSpot[] | null;
}): TickerItem[] {
  const { now, events, spots } = opts;
  const p = kstDateParts(now);
  const items: TickerItem[] = [{ id: 'sunset', text: `오늘 서울 일몰 ${formatHm(seoulSunsetMinutes(p.y, p.m, p.d))}` }];

  if (events) {
    const { today, weekLater } = dateKeys(now);
    const ongoing = filterEventsByTab(events, 'today', now).length;
    const startsToday = events.filter((e) => eventDay(e.STRTDATE) === today).length;
    const endsThisWeek = events.filter((e) => { const end = eventDay(e.END_DATE); return end >= today && end <= weekLater; }).length;
    const free = filterEventsByTab(events, 'free', now).length;
    items.push(
      { id: 'ongoing', text: `지금 진행 중인 행사 ${ongoing.toLocaleString('ko-KR')}건`, hot: true },
      { id: 'starts-today', text: `오늘 시작하는 행사 ${startsToday.toLocaleString('ko-KR')}건` },
      { id: 'ends-week', text: `이번 주 마감 ${endsThisWeek.toLocaleString('ko-KR')}건` },
    );
    if (spots) items.push(nightItem(spots, now));
    items.push({ id: 'free', text: `무료 행사 ${free.toLocaleString('ko-KR')}건` });
  } else if (spots) {
    items.push(nightItem(spots, now));
  }
  return items;
}

/** "지금 켜진 야경명소 N곳" (점등 판별). Before sunset, when none is lit yet: the first switch-on time instead. */
function nightItem(spots: NightViewSpot[], now: Date): TickerItem {
  const night = buildNight(spots, now);
  if (night.lit === 0 && night.phase === 'before') {
    const soon = night.views.map((v) => v.state).filter((s) => s.badge === 'soon').map((s) => s.label).sort()[0];
    if (soon) return { id: 'night', text: `야경명소 ${soon} 예정`, hot: true };
  }
  return { id: 'night', text: `지금 켜진 야경명소 ${night.lit}곳`, hot: true };
}
