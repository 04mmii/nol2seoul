/**
 * Pure data shaping for the v3 map page (design-ref/src/page-map.jsx). One normalized `MapItem` for
 * events, cultural spaces and night spots, so the sidebar list, pins and the selected card share it.
 */
import type { Event, CulturalSpace, NightViewSpot } from '../../types';
import type { FavoriteItem } from '../../hooks/useFavorites';
import { eventCardDate, eventVenue } from '../../utils/event';
import { eventId } from '../../utils/eventId';
import { matchesNightFilter, type NightFilter, type NightSpotView } from '../night/selectors';

export type MapKind = 'event' | 'space' | 'night';
export type MapCategory = '전체' | '문화행사' | '문화공간' | '야경명소';

export const KIND_LABEL: Record<MapKind, Exclude<MapCategory, '전체'>> = { event: '문화행사', space: '문화공간', night: '야경명소' };
export const MAP_CATEGORIES: MapCategory[] = ['전체', '문화행사', '문화공간', '야경명소'];
export const ALL = '전체';
export const LIST_PAGE = 30;

export type MapItem = {
  key: string; // unique across kinds
  kind: MapKind;
  sub: string; // CODENAME / SUBJCODE / SUBJECT_CD
  title: string;
  /** Secondary line in the list: event "11.01 — 11.05 · 장소", space address, night hours (or address). */
  line: string;
  address: string;
  lat: number | null;
  lng: number | null;
  image?: string;
  /** Route of the detail page; night spots have none. */
  detailTo: string | null;
  fav: Omit<FavoriteItem, 'savedAt'>;
  event?: Event;
  space?: CulturalSpace;
  night?: NightViewSpot;
  /** Night spots: status from the night page's sunset/OPERATING_TIME rules (components/night/selectors). */
  nightView?: NightSpotView;
  /** Night spot lit right now ("점등 중") → ember pin. */
  lit?: boolean;
};

const num = (v: unknown) => {
  const n = parseFloat(String(v ?? ''));
  return Number.isFinite(n) && n !== 0 ? n : null;
};

export function eventItem(e: Event): MapItem {
  const id = eventId(e);
  return {
    key: `event:${id}`,
    kind: 'event',
    sub: e.CODENAME || '',
    title: e.TITLE,
    line: [eventCardDate(e), eventVenue(e)].filter(Boolean).join(' · '),
    address: eventVenue(e),
    lat: num(e.LAT),
    lng: num(e.LOT),
    image: e.MAIN_IMG || undefined,
    detailTo: `/event/${id}`,
    fav: { id, type: 'event', title: e.TITLE, location: eventVenue(e), image: e.MAIN_IMG, category: e.CODENAME, date: e.DATE }, // same shape the pre-v3 map stored
    event: e,
  };
}

/** Space/night IDs are still array indexes (BUG-08 is resolved for events only). */
export function spaceItem(s: CulturalSpace, index: number): MapItem {
  const id = String(index);
  return {
    key: `space:${id}`,
    kind: 'space',
    sub: s.SUBJCODE || '',
    title: s.FAC_NAME,
    line: s.ADDR,
    address: s.ADDR,
    // The API sends X_COORD = latitude (37.x), Y_COORD = longitude (127.x).
    lat: num(s.X_COORD),
    lng: num(s.Y_COORD),
    image: s.MAIN_IMG || undefined,
    detailTo: `/space/${id}`,
    fav: { id, type: 'space', title: s.FAC_NAME, location: s.ADDR, image: s.MAIN_IMG, category: s.SUBJCODE || '문화공간', date: s.CLOSEDAY ? `휴관일: ${s.CLOSEDAY}` : '' },
    space: s,
  };
}

export function nightItem(n: NightViewSpot, index: number, view?: NightSpotView): MapItem {
  const id = String(index);
  return {
    key: `night:${id}`,
    kind: 'night',
    sub: n.SUBJECT_CD || '',
    title: n.TITLE,
    line: n.OPERATING_TIME || n.ADDR,
    address: n.ADDR,
    lat: num(n.LA),
    lng: num(n.LO),
    detailTo: null,
    fav: { id, type: 'spot', title: n.TITLE, location: n.ADDR, category: '야경명소', date: n.OPERATING_TIME },
    night: n,
    nightView: view,
    lit: view?.state.badge === 'lit',
  };
}

/** All items. 전체 interleaves the three kinds (round robin), like the pre-v3 "recent" strip. */
export function buildMapItems(events: Event[], spaces: CulturalSpace[], spots: NightViewSpot[], nightViews: NightSpotView[] = []) {
  const ev = events.map(eventItem);
  const sp = spaces.map(spaceItem);
  const ni = spots.map((n, i) => nightItem(n, i, nightViews[i]));
  const mixed: MapItem[] = [];
  for (let i = 0; i < Math.max(ev.length, sp.length, ni.length); i++) {
    if (ev[i]) mixed.push(ev[i]);
    if (ni[i]) mixed.push(ni[i]);
    if (sp[i]) mixed.push(sp[i]);
  }
  return { all: mixed, byKind: { event: ev, space: sp, night: ni } as Record<MapKind, MapItem[]> };
}

/** Sub-category chips: spaces (SUBJCODE) and night spots (SUBJECT_CD) only, as before (events have their own page). */
export function subCategories(items: MapItem[], category: MapCategory): string[] {
  if (category !== '문화공간' && category !== '야경명소') return [];
  const kind: MapKind = category === '문화공간' ? 'space' : 'night';
  return [ALL, ...new Set(items.filter((i) => i.kind === kind && i.sub).map((i) => i.sub))];
}

/** Category + sub-category + text query (name or address) + "지금 켜진 곳만 / 지금 갈 수 있는 곳만". Drives list and pins. */
export function filterMapItems(
  built: ReturnType<typeof buildMapItems>,
  category: MapCategory,
  sub: string,
  query: string,
  nowFilter: NightFilter = null,
): MapItem[] {
  let list = category === ALL ? built.all : built.byKind[category === '문화행사' ? 'event' : category === '문화공간' ? 'space' : 'night'];
  if (sub !== ALL) list = list.filter((i) => i.sub === sub);
  const q = query.trim().toLowerCase();
  if (q) list = list.filter((i) => i.title.toLowerCase().includes(q) || i.address.toLowerCase().includes(q));
  // Same definitions as the night page: 'lit' = 점등 중 only, 'open' = 운영 중 only.
  if (nowFilter) list = list.filter((i) => i.kind === 'night' && matchesNightFilter(i.nightView?.state.badge, nowFilter));
  return list;
}

/** Kakao Map directions link (opens map.kakao.com with the place as destination). */
export const directionsUrl = (item: Pick<MapItem, 'title' | 'lat' | 'lng'>) =>
  item.lat !== null && item.lng !== null
    ? `https://map.kakao.com/link/to/${encodeURIComponent(item.title)},${item.lat},${item.lng}`
    : null;
