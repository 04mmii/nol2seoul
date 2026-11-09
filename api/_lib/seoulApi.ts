/**
 * Shared Seoul Open API proxy logic — used by the Vercel function (api/seoulapi.ts) AND the Vite
 * dev/preview server (vite.config.ts), so both behave the same (DESIGN.md TECH-10, final 2026-11-09).
 *
 * Files under api/_lib are not routes on Vercel (leading underscore).
 *
 * Decision: **fetch everything + 24-hour CDN cache; the event screens show running + starting within
 * 3 months.** Every type is paged the same way: rows 1–1,000 first (that response carries
 * `list_total_count`), then the remaining 1,000-row pages in parallel (max 5 at a time).
 *   - event (culturalEventInfo): long-running events can sit anywhere in the list (the API sorts by
 *     start date), so all pages are needed. Rows are deduped (cultcode) and kept only when running
 *     today (KST) or starting within 3 months; ended events and later starts are dropped.
 *   - space (culturalSpaceInfo), night (viewNightSpot): all rows, unfiltered.
 * Cache: `s-maxage=86400, stale-while-revalidate=86400` → the Seoul API is called about once a day
 * per edge region. A failed later page → partial data, flagged, cached for 60 s only.
 */

export const ENDPOINTS: Record<string, string> = {
  event: 'culturalEventInfo',
  night: 'viewNightSpot',
  space: 'culturalSpaceInfo',
};

export const PAGE_SIZE = 1000;
/** Parallel upstream calls per request (the Seoul API is a public service — stay polite). */
export const MAX_PARALLEL = 5;
/** Safety cap: never page past this many rows even if list_total_count is absurd. */
export const MAX_ROWS = 100_000;
/** Event window: running today + starting within this many months (KST). */
export const UPCOMING_MONTHS = 3;

/** CDN cache for complete responses: 24 h at the edge (+24 h stale while revalidating), never in the browser. */
export const CACHE_OK = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400';
/** Partial data (a later page failed): cache briefly so it heals soon. */
export const CACHE_PARTIAL = 'public, max-age=0, s-maxage=60';
export const CACHE_NONE = 'no-store';

const BASE = 'http://openapi.seoul.go.kr:8088';

export type ProxyResult = { status: number; headers: Record<string, string>; body: unknown };
type FetchLike = (url: string) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;
type Row = Record<string, unknown>;

/** Today's date in Korea (UTC+9, no DST) as YYYY-MM-DD. */
export const kstToday = (now: Date = new Date()) => new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

/** YYYY-MM-DD + n calendar months (day clamped to the month's last day: 11-30 + 3 → 02-28). */
export function addMonths(isoDate: string, n: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + n, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

const day = (v: unknown) => {
  const s = String(v ?? '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
};

/**
 * Event window (KST): running today (start ≤ today ≤ end, however long ago it started) or starting
 * within `UPCOMING_MONTHS` (today < start ≤ today + 3 months). A missing/invalid end date counts as
 * "not ended"; a missing/invalid start date counts as "already started".
 */
export function inEventWindow(r: Row, today: string, months = UPCOMING_MONTHS): boolean {
  const start = day(r.STRTDATE);
  const end = day(r.END_DATE);
  if (end && end < today) return false;
  if (!start || start <= today) return true;
  return start <= addMonths(today, months);
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

/** Runs `tasks` with at most `limit` in flight; results keep the input order. */
async function pool<T>(tasks: Array<() => Promise<T>>, limit: number): Promise<T[]> {
  const out: T[] = new Array(tasks.length);
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const i = next++;
      out[i] = await tasks[i]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return out;
}

type AllRows = { kind: 'ok'; rows: Row[]; total: number; partial: boolean } | Extract<PageResult, { kind: 'error' }>;

/** Page 1 first (for list_total_count), then every remaining page. Same for all three APIs. */
export async function fetchAllRows(fetchImpl: FetchLike, apiKey: string, endpoint: string): Promise<AllRows> {
  const first = await fetchPage(fetchImpl, apiKey, endpoint, 1, PAGE_SIZE);
  if (first.kind === 'error') return first;
  if (first.kind === 'empty') return { kind: 'ok', rows: [], total: 0, partial: false };
  const total = Math.min(first.total, MAX_ROWS);
  const ranges: Array<[number, number]> = [];
  for (let s = PAGE_SIZE + 1; s <= total; s += PAGE_SIZE) ranges.push([s, Math.min(s + PAGE_SIZE - 1, total)]);
  const rest = await pool(ranges.map(([s, e]) => () => fetchPage(fetchImpl, apiKey, endpoint, s, e)), MAX_PARALLEL);
  const rows = [first, ...rest].flatMap((p) => (p.kind === 'rows' ? p.rows : []));
  return { kind: 'ok', rows, total: first.total, partial: rest.some((p) => p.kind === 'error') };
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
 * fetchers don't change. `list_total_count` = rows returned, `source_total` = the API's full count.
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

  const all = await fetchAllRows(fetchImpl, apiKey, endpoint);
  if (all.kind === 'error') return fail(all, apiKey);

  const rows = endpoint === ENDPOINTS.event
    ? dedupeEvents(all.rows).filter((r) => inEventWindow(r, kstToday(opts.now)))
    : all.rows;
  return {
    status: 200,
    headers: { 'Cache-Control': all.partial ? CACHE_PARTIAL : CACHE_OK, ...(all.partial ? { 'X-Seoulapi-Partial': '1' } : {}) },
    body: { [endpoint]: { list_total_count: rows.length, source_total: all.total, ...(all.partial ? { partial: true } : {}), row: rows } },
  };
}
