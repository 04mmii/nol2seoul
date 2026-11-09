/**
 * Data selection for the v3 EventDetail page (design-ref/src/page-detail.jsx), fed by the event API.
 * Prototype items with no API source (curator note, reviews, rating, like count, nearby walk times,
 * "EDITOR'S PICK") are intentionally not rendered.
 */
import type { Event } from '../../types';
import { eventDateRange, eventDay, eventStatus, isFreeEvent } from '../../utils/event';

export type RelatedEvent = { event: Event; id: number };

/**
 * "다음으로 가볼 곳": up to `n` other events sharing CODENAME or GUNAME.
 * Ranking: not-ended first → same genre AND district → same genre → same district → API order.
 */
export function pickRelatedEvents(events: Event[], currentIndex: number, now: Date = new Date(), n = 4): RelatedEvent[] {
  const current = events[currentIndex];
  if (!current) return [];
  const scored: Array<{ event: Event; id: number; score: number }> = [];
  events.forEach((e, id) => {
    if (id === currentIndex) return;
    const sameGenre = !!current.CODENAME && e.CODENAME === current.CODENAME;
    const sameDistrict = !!current.GUNAME && e.GUNAME === current.GUNAME;
    if (!sameGenre && !sameDistrict) return;
    const live = eventStatus(e, now).kind !== 'ended' ? 10 : 0;
    const match = sameGenre && sameDistrict ? 3 : sameGenre ? 2 : 1;
    scored.push({ event: e, id, score: live + match });
  });
  // Array.prototype.sort is stable, so equal scores keep API order.
  return scored.sort((a, b) => b.score - a.score).slice(0, n).map(({ event, id }) => ({ event, id }));
}

/** Fee text shown on the detail page (same rule as before the redesign; BUG-03 open). */
export const detailFee = (e: Event) => e.USE_FEE?.trim() || (isFreeEvent(e) ? '무료' : '정보 없음');

export type Spec = { label: string; value: string; highlight?: boolean };

/** Hero spec grid (v3: 기간/장소/관람료/관람시간/휴관일/문의 → 휴관일 is not in the API, 대상 instead). */
export function heroSpecs(e: Event): Spec[] {
  const specs: Spec[] = [
    { label: '기간', value: eventDateRange(e) },
    { label: '장소', value: e.PLACE || e.GUNAME || '' },
    { label: '관람료', value: detailFee(e), highlight: isFreeEvent(e) },
    { label: '관람시간', value: (e.PRO_TIME ?? '').trim() },
    { label: '대상', value: (e.USE_TRGT ?? '').trim() },
    { label: '문의', value: (e.INQUIRY ?? '').trim() },
  ];
  return specs.filter((s) => s.value);
}

/** Left-column "행사 정보" rows — only fields that exist in the API. */
export function infoRows(e: Event): Array<[string, string]> {
  const rows: Array<[string, string | undefined]> = [
    ['주최·기관', e.ORG_NAME],
    ['분류', e.CODENAME],
    ['테마', e.THEMECODE],
    ['출연', e.PLAYER],
    ['자치구', e.GUNAME],
    ['등록일', eventDay(e.RGSTDATE)],
  ];
  return rows.filter((r): r is [string, string] => !!r[1]?.trim()).map(([k, v]) => [k, v.trim()]);
}

const IMAGE_URL = /^https?:\/\/\S+\.(jpe?g|png|gif|webp)(\?\S*)?$/i;
const ANY_URL = /^https?:\/\/\S+$/i;

export type BodyBlock = { kind: 'text'; text: string } | { kind: 'image'; src: string } | { kind: 'link'; href: string };

/**
 * Body content from PROGRAM and ETC_DESC. In live data ETC_DESC is sometimes just an image URL,
 * so URLs are rendered as an image or a link instead of raw text.
 */
export function bodyBlocks(e: Event): BodyBlock[] {
  const blocks: BodyBlock[] = [];
  for (const raw of [e.PROGRAM, e.ETC_DESC]) {
    const value = raw?.trim();
    if (!value) continue;
    if (IMAGE_URL.test(value)) blocks.push({ kind: 'image', src: value });
    else if (ANY_URL.test(value)) blocks.push({ kind: 'link', href: value });
    else value.split(/\n{2,}|\r\n\r\n/).forEach((p) => p.trim() && blocks.push({ kind: 'text', text: p.trim() }));
  }
  return blocks;
}

/** Primary/secondary external links: ORG_LINK (often a ticket page) and HMPG_ADDR (서울문화포털). */
export function externalLinks(e: Event): { primary?: string; portal?: string } {
  const primary = e.ORG_LINK?.trim() || e.HMPG_ADDR?.trim() || undefined;
  const portal = e.HMPG_ADDR?.trim();
  return { primary, portal: portal && portal !== primary ? portal : undefined };
}
