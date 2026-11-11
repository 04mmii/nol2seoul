/**
 * Search (v3 panel). Same fields as before the redesign: events — title, place, genre, district;
 * cultural spaces — name, address; night spots — name, address. Each group shows up to 4 results plus
 * its total. No query → nothing (the panel shows recent searches + shortcuts instead).
 */
import type { Event, CulturalSpace, NightViewSpot } from '../../types';

export const GROUP_LIMIT = 4;

const has = (v: string | undefined, q: string) => !!v && v.toLowerCase().includes(q);

export type SearchGroups = {
  events: { total: number; items: Event[] };
  spaces: { total: number; items: Array<{ space: CulturalSpace; index: number }> };
  spots: { total: number; items: Array<{ spot: NightViewSpot; index: number }> };
  total: number;
};

export function searchAll(query: string, events: Event[], spaces: CulturalSpace[], spots: NightViewSpot[]): SearchGroups {
  const q = query.trim().toLowerCase();
  if (!q) return { events: { total: 0, items: [] }, spaces: { total: 0, items: [] }, spots: { total: 0, items: [] }, total: 0 };
  const ev = events.filter((e) => has(e.TITLE, q) || has(e.PLACE, q) || has(e.CODENAME, q) || has(e.GUNAME, q));
  const sp = spaces.map((space, index) => ({ space, index })).filter(({ space }) => has(space.FAC_NAME, q) || has(space.ADDR, q));
  const ni = spots.map((spot, index) => ({ spot, index })).filter(({ spot }) => has(spot.TITLE, q) || has(spot.ADDR, q));
  return {
    events: { total: ev.length, items: ev.slice(0, GROUP_LIMIT) },
    spaces: { total: sp.length, items: sp.slice(0, GROUP_LIMIT) },
    spots: { total: ni.length, items: ni.slice(0, GROUP_LIMIT) },
    total: ev.length + sp.length + ni.length,
  };
}

/** Split `text` into plain / matched parts (case-insensitive) for highlighting. */
export function highlightParts(text: string, query: string): Array<{ text: string; hit: boolean }> {
  const q = query.trim();
  if (!q) return [{ text, hit: false }];
  const out: Array<{ text: string; hit: boolean }> = [];
  const lower = text.toLowerCase(), ql = q.toLowerCase();
  let i = 0;
  for (let j = lower.indexOf(ql); j !== -1; j = lower.indexOf(ql, i)) {
    if (j > i) out.push({ text: text.slice(i, j), hit: false });
    out.push({ text: text.slice(j, j + q.length), hit: true });
    i = j + q.length;
  }
  if (i < text.length) out.push({ text: text.slice(i), hit: false });
  return out;
}
