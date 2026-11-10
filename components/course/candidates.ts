/**
 * Candidate list for the course remote, built in the browser from data the app already loaded
 * (no extra API calls). Only real events / cultural spaces / night spots; nothing invented.
 * The server re-checks every id the model returns against this list (api/_lib/course.ts).
 */
import type { CulturalSpace, Event } from '../../types';
import type { Candidate } from '../../api/_lib/course';
import { queryTokens, distanceKm } from '../../api/_lib/course';
import { eventId } from '../../utils/eventId';
import { eventCardDate, eventLatLng, eventStatus, eventVenue, dateKeys, eventDay } from '../../utils/event';
import { feeLabel, isFree } from '../../utils/fee';
import { spaceId } from '../../utils/placeId';
import { districtFromAddress } from '../home/selectors';
import { formatHm } from '../../utils/sun';
import type { NightSpotView } from '../night/selectors';

export const PER_KIND = 30;

const num = (v: unknown) => { const n = parseFloat(String(v ?? '')); return Number.isFinite(n) && n !== 0 ? n : null; };

export function eventCandidate(e: Event): Candidate {
  const ll = eventLatLng(e);
  return {
    id: eventId(e), kind: 'event', name: e.TITLE, area: e.GUNAME || '', sub: `${e.CODENAME} · ${eventVenue(e)}`,
    meta: `${eventCardDate(e)} · ${feeLabel(e)}`, lat: ll?.lat ?? null, lng: ll?.lng ?? null, free: isFree(e),
  };
}

export function spaceCandidate(s: CulturalSpace): Candidate {
  return {
    id: spaceId(s), kind: 'space', name: s.FAC_NAME, area: districtFromAddress(s.ADDR) || '', sub: s.SUBJCODE || '문화공간',
    meta: s.CLOSEDAY ? `휴관 ${s.CLOSEDAY}`.slice(0, 40) : '', lat: num(s.X_COORD), lng: num(s.Y_COORD), free: s.ENTRFREE === '무료',
  };
}

export function nightCandidate(v: NightSpotView, sunset: number): Candidate {
  const lightsAt = v.rule.kind === 'sunset' ? formatHm(sunset + v.rule.offset) : '';
  return {
    id: v.id, kind: 'night', name: v.spot.TITLE, area: v.district, sub: v.spot.SUBJECT_CD || '야경명소',
    meta: (v.spot.OPERATING_TIME || '').slice(0, 60), lat: num(v.spot.LA), lng: num(v.spot.LO), free: v.free,
    lightsAt, litNow: v.state.badge === 'lit', openNow: v.state.badge === 'open',
  };
}

const matches = (c: Candidate, tokens: string[]) => tokens.reduce((s, t) => s + (`${c.name} ${c.sub} ${c.area}`.includes(t) ? 1 : 0), 0);
const nearest = (c: Candidate, anchors: Candidate[]) => anchors.reduce((m, a) => { const d = distanceKm(a, c); return d == null ? m : Math.min(m, d); }, Infinity);

/**
 * Picks up to PER_KIND candidates of each kind:
 *  - events: running today or starting within 7 days; keyword matches first, then running ones by end date;
 *  - spaces: keyword matches first, then closest to the chosen events;
 *  - night: keyword matches first, then lit / sunset-lit / open now, then closest to the events.
 * The start event / end spot from the page context is always included.
 */
export function buildCandidates(input: {
  query: string; events: Event[]; spaces: CulturalSpace[]; nightViews: NightSpotView[]; sunset: number; now: Date; startId?: string; endId?: string;
}): Candidate[] {
  const tokens = queryTokens(input.query);
  const { weekLater } = dateKeys(input.now);
  const evs = input.events
    .filter((e) => { const st = eventStatus(e, input.now); return st.kind === 'ongoing' || (st.kind === 'upcoming' && eventDay(e.STRTDATE) <= weekLater); })
    .map((e) => ({ e, c: eventCandidate(e) }));
  evs.sort((a, b) => matches(b.c, tokens) - matches(a.c, tokens)
    || Number(eventStatus(b.e, input.now).kind === 'ongoing') - Number(eventStatus(a.e, input.now).kind === 'ongoing')
    || eventDay(a.e.END_DATE).localeCompare(eventDay(b.e.END_DATE)));
  let events = evs.slice(0, PER_KIND).map((x) => x.c);
  const start = input.startId ? input.events.find((e) => eventId(e) === input.startId) : undefined;
  if (start && !events.some((c) => c.id === input.startId)) events = [eventCandidate(start), ...events.slice(0, PER_KIND - 1)];
  const anchors = (start ? [eventCandidate(start)] : events.slice(0, 8)).filter((c) => c.lat != null);

  const spaces = input.spaces.map(spaceCandidate).filter((c) => c.lat != null)
    .map((c) => ({ c, m: matches(c, tokens), d: nearest(c, anchors) }))
    .sort((a, b) => b.m - a.m || a.d - b.d)
    .slice(0, PER_KIND).map((x) => x.c);

  let night = input.nightViews.map((v) => nightCandidate(v, input.sunset))
    .map((c) => ({ c, s: matches(c, tokens) * 10 + (c.litNow ? 3 : 0) + (c.lightsAt ? 2 : 0) + (c.openNow ? 1 : 0), d: nearest(c, anchors) }))
    .sort((a, b) => b.s - a.s || a.d - b.d)
    .slice(0, PER_KIND).map((x) => x.c);
  const end = input.endId ? input.nightViews.find((v) => v.id === input.endId) : undefined;
  if (end && !night.some((c) => c.id === input.endId)) night = [nightCandidate(end, input.sunset), ...night.slice(0, PER_KIND - 1)];

  return [...events, ...spaces, ...night];
}

/** Page link for a stop. */
export function stopLink(c: Candidate): string {
  return c.kind === 'event' ? `/event/${c.id}` : c.kind === 'space' ? `/space/${c.id}` : `/night?spot=${c.id}`;
}

/** Map deep link selecting a stop (MapDiscovery `?sel=<kind>:<id>`). */
export function mapLink(c: Candidate): string {
  return `/map?sel=${encodeURIComponent(`${c.kind}:${c.id}`)}`;
}
