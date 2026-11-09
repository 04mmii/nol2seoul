/**
 * Shared Seoul Open API proxy logic — used by the Vercel function (api/seoulapi.ts) AND the Vite
 * dev/preview server (vite.config.ts), so both behave the same (DESIGN.md TECH-10, option B).
 *
 * Files under api/_lib are not routes on Vercel (leading underscore).
 *
 * type=event: the API sorts by start date (newest first) and serves at most 1,000 rows per call.
 * We fetch rows 1–4,000 in 4 parallel calls, merge them, drop duplicates and drop events that
 * ended before today (KST). Live check 2026-11-09: rows 1–4,000 hold 194 of the 197 events running
 * that day (rows 1–1,000 alone: 120), plus all 130 upcoming ones.
 * type=space / type=night: unchanged (rows 1–1,000, passed through, no CDN cache header as before).
 */

export const ENDPOINTS: Record<string, string> = {
  event: 'culturalEventInfo',
  night: 'viewNightSpot',
  space: 'culturalSpaceInfo',
};

export const EVENT_PAGES: Array<[number, number]> = [
  [1, 1000],
  [1001, 2000],
  [2001, 3000],
  [3001, 4000],
];

/** CDN cache for successful responses: 1 hour at the edge, never in the browser. */
export const CACHE_OK = 'public, max-age=0, s-maxage=3600';
/** Partial event data (a later page failed): cache briefly so it heals soon. */
export const CACHE_PARTIAL = 'public, max-age=0, s-maxage=60';
export const CACHE_NONE = 'no-store';

const BASE = 'http://openapi.seoul.go.kr:8088';

export type ProxyResult = { status: number; headers: Record<string, string>; body: unknown };
type FetchLike = (url: string) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;
type Row = Record<string, unknown>;

/** Today's date in Korea (UTC+9, no DST) as YYYY-MM-DD. */
export const kstToday = (now: Date = new Date()) => new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

/** Keep events whose END_DATE is today or later (KST). Rows without an end date are kept. */
export function dropEnded<T extends Row>(rows: T[], today: string): T[] {
  return rows.filter((r) => {
    const end = String(r.END_DATE ?? '').slice(0, 10);
    return !/^\d{4}-\d{2}-\d{2}$/.test(end) || end >= today;
  });
}

/** Dedupe across pages (rows can shift between calls if data changes): cultcode, else title|start|place. */
export function dedupeEvents<T extends Row>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    const code = (/[?&]cultcode=(\d+)/.exec(String(r.HMPG_ADDR ?? '')) || [])[1];
    const key = code ?? `${String(r.TITLE ?? '').trim()}|${String(r.STRTDATE ?? '').slice(0, 10)}|${String(r.PLACE ?? '').trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

type PageResult =
  | { kind: 'rows'; rows: Row[]; total: number }
  | { kind: 'empty' } // INFO-200 "해당하는 데이터가 없습니다" (e.g. a page past the end)
  | { kind: 'error'; status: number; error: string; raw?: string };

async function fetchPage(fetchImpl: FetchLike, apiKey: string, endpoint: string, start: number, end: number): Promise<PageResult> {
  let response;
  try {
    response = await fetchImpl(`${BASE}/${apiKey}/json/${endpoint}/${start}/${end}/`);
  } catch (e) {
    return { kind: 'error', status: 500, error: '서울시 OpenAPI 호출 실패', raw: (e as Error).message };
  }
  if (!response.ok) return { kind: 'error', status: response.status, error: `서울시 API 호출 실패 (status ${response.status})` };
  const text = await response.text();
  if (text.trim().startsWith('<')) {
    return { kind: 'error', status: 500, error: '서울시 API가 XML을 반환했습니다. 형식이 잘못됐을 수 있습니다.', raw: text.slice(0, 300) };
  }
  let data: Record<string, any>;
  try {
    data = JSON.parse(text);
  } catch {
    return { kind: 'error', status: 500, error: '서울시 API 응답을 해석할 수 없습니다.', raw: text.slice(0, 300) };
  }
  const block = data[endpoint];
  if (Array.isArray(block?.row)) return { kind: 'rows', rows: block.row, total: Number(block.list_total_count) || 0 };
  if (data.RESULT?.CODE === 'INFO-200') return { kind: 'empty' };
  return { kind: 'error', status: 500, error: '데이터 구조가 예상과 다릅니다.', raw: JSON.stringify(data).slice(0, 300) };
}

/** Error response. `raw` (upstream text / exception message) is scrubbed of the API key. */
const fail = (p: Extract<PageResult, { kind: 'error' }>, apiKey: string): ProxyResult => ({
  status: p.status,
  headers: { 'Cache-Control': CACHE_NONE },
  body: { error: p.error, ...(p.raw ? { raw: p.raw.split(apiKey).join('***') } : {}) },
});

/**
 * Handles `/api/seoulapi?type=…`. Pure apart from `fetchImpl`, so it can be tested with a fake fetch.
 * The response keeps the Seoul API shape (`{ [endpoint]: { list_total_count, row } }`), so the client
 * fetchers don't change. For events, `list_total_count` is the number of rows returned and
 * `source_total` the API's full count.
 */
export async function seoulApiResponse(
  type: string | undefined,
  apiKey: string | undefined,
  opts: { fetchImpl?: FetchLike; now?: Date } = {},
): Promise<ProxyResult> {
  const endpoint = ENDPOINTS[type || 'event'];
  if (!endpoint) return { status: 400, headers: { 'Cache-Control': CACHE_NONE }, body: { error: 'Invalid type parameter' } };
  if (!apiKey) return { status: 500, headers: { 'Cache-Control': CACHE_NONE }, body: { error: 'API_KEY is not set' } };
  const fetchImpl: FetchLike = opts.fetchImpl ?? ((url) => fetch(url));

  if (endpoint !== ENDPOINTS.event) {
    const page = await fetchPage(fetchImpl, apiKey, endpoint, 1, 1000);
    if (page.kind === 'error') return fail(page, apiKey);
    if (page.kind === 'empty') return { status: 200, headers: {}, body: { [endpoint]: { list_total_count: 0, row: [] } } };
    return { status: 200, headers: {}, body: { [endpoint]: { list_total_count: page.total, row: page.rows } } };
  }

  const pages = await Promise.all(EVENT_PAGES.map(([s, e]) => fetchPage(fetchImpl, apiKey, endpoint, s, e)));
  // The first page carries the newest events: without it the result would be misleading → error.
  if (pages[0].kind === 'error') return fail(pages[0], apiKey);
  const partial = pages.some((p) => p.kind === 'error');
  const merged = pages.flatMap((p) => (p.kind === 'rows' ? p.rows : []));
  const sourceTotal = pages[0].kind === 'rows' ? pages[0].total : 0;
  const rows = dropEnded(dedupeEvents(merged), kstToday(opts.now));
  return {
    status: 200,
    headers: { 'Cache-Control': partial ? CACHE_PARTIAL : CACHE_OK, ...(partial ? { 'X-Seoulapi-Partial': '1' } : {}) },
    body: { [endpoint]: { list_total_count: rows.length, source_total: sourceTotal, ...(partial ? { partial: true } : {}), row: rows } },
  };
}
