/**
 * TECH-10 (final): tests for the shared Seoul API proxy logic (api/_lib/seoulApi.ts), used by the
 * Vercel function and the Vite dev server. No browser and no real API: `fetchImpl` is a fake.
 * The last test checks that the dev server actually serves /api/seoulapi through this code.
 */
import { test, expect } from '@playwright/test';
import { seoulApiResponse, addMonths, inEventWindow, kstToday, CACHE_OK, CACHE_PARTIAL, CACHE_NONE, MAX_PARALLEL } from '../api/_lib/seoulApi';

const KEY = 'TEST_KEY_123';
// 2026-11-09 15:30 UTC = 2026-11-10 00:30 KST → "today" is 2026-11-10 in Korea, 11-09 in UTC.
const NOW = new Date('2026-11-09T15:30:00Z');

type Row = Record<string, string>;
const ev = (code: number, start: string, end: string, extra: Row = {}): Row => ({
  TITLE: `행사 ${code}`,
  STRTDATE: start ? `${start} 00:00:00.0` : '',
  END_DATE: end ? `${end} 00:00:00.0` : '',
  PLACE: '장소',
  HMPG_ADDR: `https://culture.seoul.go.kr/culture/culture/cultureEvent/view.do?cultcode=${code}&menuNo=200008`,
  ...extra,
});
const block = (endpoint: string, rows: Row[], total: number) => JSON.stringify({ [endpoint]: { list_total_count: total, RESULT: { CODE: 'INFO-000' }, row: rows } });
const ok = (text: string) => ({ ok: true, status: 200, text: async () => text });
type Resp = { ok: boolean; status: number; text(): Promise<string> };

/** Fake fetch answering by endpoint + start row; records URLs and the peak number of calls in flight. */
function fakeFetch(handlers: Record<string, Record<number, () => Resp | Promise<Resp>>>) {
  const calls: string[] = [];
  let inFlight = 0, peak = 0;
  const impl = async (url: string) => {
    calls.push(url);
    const m = /\/json\/(\w+)\/(\d+)\/(\d+)\//.exec(url)!;
    const h = handlers[m[1]]?.[Number(m[2])];
    if (!h) throw new Error(`unexpected ${url}`);
    inFlight++; peak = Math.max(peak, inFlight);
    try { await new Promise((r) => setTimeout(r, 5)); return await h(); } finally { inFlight--; }
  };
  return { impl, calls, peak: () => peak };
}
const range = (url: string) => /\/(\d+\/\d+)\/$/.exec(url)![1];

test.describe('Seoul API proxy — paging (all three APIs)', () => {
  test('reads list_total_count from page 1, then fetches every remaining page (last page clipped)', async () => {
    const E = 'culturalEventInfo';
    const pages: Record<number, () => Resp> = {};
    for (let s = 1; s <= 12_001; s += 1000) pages[s] = () => ok(block(E, [ev(s, '2026-10-01', '2026-12-31')], 12_345));
    const f = fakeFetch({ [E]: pages });
    const r = await seoulApiResponse('event', KEY, { fetchImpl: f.impl, now: NOW });
    expect(f.calls).toHaveLength(13);
    expect(range(f.calls[0])).toBe('1/1000');
    expect(f.calls.map(range)).toContain('12001/12345');
    expect(f.peak()).toBeLessThanOrEqual(MAX_PARALLEL);
    expect(f.calls.every((u) => u.startsWith(`http://openapi.seoul.go.kr:8088/${KEY}/json/${E}/`))).toBe(true);
    expect(r.status).toBe(200);
    expect((r.body as any)[E].source_total).toBe(12_345);
    expect((r.body as any)[E].row).toHaveLength(13);
  });

  test('type=space fetches all pages (1,099 → 2 calls), unfiltered, cached 24 h', async () => {
    const S = 'culturalSpaceInfo';
    const f = fakeFetch({ [S]: {
      1: () => ok(block(S, Array.from({ length: 1000 }, (_, i) => ({ FAC_NAME: `공간 ${i}` })), 1099)),
      1001: () => ok(block(S, Array.from({ length: 99 }, (_, i) => ({ FAC_NAME: `공간 ${1000 + i}` })), 1099)),
    } });
    const r = await seoulApiResponse('space', KEY, { fetchImpl: f.impl });
    expect(f.calls.map(range)).toEqual(['1/1000', '1001/1099']);
    expect(r.headers['Cache-Control']).toBe(CACHE_OK);
    expect((r.body as any)[S].row).toHaveLength(1099);
    expect((r.body as any)[S].list_total_count).toBe(1099);
  });

  test('type=night with fewer than 1,000 rows → a single call', async () => {
    const N = 'viewNightSpot';
    const f = fakeFetch({ [N]: { 1: () => ok(block(N, [{ TITLE: '야경 1' }], 51)) } });
    const r = await seoulApiResponse('night', KEY, { fetchImpl: f.impl });
    expect(f.calls.map(range)).toEqual(['1/1000']);
    expect(r.headers['Cache-Control']).toBe(CACHE_OK);
  });

  test('cache header: 24 h at the CDN with stale-while-revalidate, nothing in the browser', () => {
    expect(CACHE_OK).toContain('s-maxage=86400');
    expect(CACHE_OK).toContain('stale-while-revalidate');
    expect(CACHE_OK).toContain('max-age=0');
  });
});

test.describe('Seoul API proxy — event window (running today + starting within 3 months, KST)', () => {
  test('keeps long-running events, today’s and upcoming ≤ 3 months; drops ended and later starts', async () => {
    const E = 'culturalEventInfo';
    const f = fakeFetch({ [E]: {
      1: () => ok(block(E, [
        ev(1, '2026-10-01', '2026-12-31'), // running
        ev(2, '2026-11-01', '2026-11-09'), // ended yesterday in KST (still "today" in UTC) → dropped
        ev(3, '2026-11-10', '2026-11-10'), // today only → kept
        ev(4, '2027-02-10', '2027-03-01'), // starts exactly today + 3 months → kept
        ev(5, '2027-02-11', '2027-03-01'), // starts the day after → dropped
      ], 1500)),
      1001: () => ok(block(E, [
        ev(6, '2021-11-17', '2099-12-31'), // long-running, far down the list → kept
        ev(7, '2023-01-01', '2024-01-01'), // long ended → dropped
        ev(8, '', ''), // no dates → treated as running → kept
        ev(1, '2026-10-01', '2026-12-31'), // duplicate of 1 (rows shifted between pages) → dropped
      ], 1500)),
    } });
    const r = await seoulApiResponse('event', KEY, { fetchImpl: f.impl, now: NOW });
    expect(r.headers['Cache-Control']).toBe(CACHE_OK);
    expect((r.body as any)[E].row.map((x: Row) => x.TITLE)).toEqual(['행사 1', '행사 3', '행사 4', '행사 6', '행사 8']);
    expect((r.body as any)[E].list_total_count).toBe(5);
  });

  test('"today" is the Korean date; +3 months clamps to the month end', () => {
    expect(kstToday(new Date('2026-11-09T14:59:00Z'))).toBe('2026-11-09');
    expect(kstToday(new Date('2026-11-09T15:00:00Z'))).toBe('2026-11-10');
    expect(addMonths('2026-11-09', 3)).toBe('2027-02-09');
    expect(addMonths('2026-11-30', 3)).toBe('2027-02-28');
    expect(inEventWindow({ STRTDATE: '2026-12-01', END_DATE: '' }, '2026-11-10')).toBe(true);
    expect(inEventWindow({ STRTDATE: '', END_DATE: '2026-11-01' }, '2026-11-10')).toBe(false);
  });
});

test.describe('Seoul API proxy — failures and input checks', () => {
  test('a later page failing → partial data, flagged, cached only briefly', async () => {
    const E = 'culturalEventInfo';
    const f = fakeFetch({ [E]: {
      1: () => ok(block(E, [ev(1, '2026-10-01', '2026-12-31')], 3000)),
      1001: () => ({ ok: false, status: 503, text: async () => '' }),
      2001: () => Promise.reject(new Error('socket hang up')),
    } });
    const r = await seoulApiResponse('event', KEY, { fetchImpl: f.impl, now: NOW });
    expect(r.status).toBe(200);
    expect(r.headers['Cache-Control']).toBe(CACHE_PARTIAL);
    expect(r.headers['X-Seoulapi-Partial']).toBe('1');
    expect((r.body as any)[E].partial).toBe(true);
    expect((r.body as any)[E].row).toHaveLength(1);
  });

  test('the first page failing → error status, not cached, key never in the body', async () => {
    const f = fakeFetch({ culturalEventInfo: { 1: () => Promise.reject(new Error(`connect ECONNREFUSED http://openapi.seoul.go.kr:8088/${KEY}/json/x`)) } });
    const r = await seoulApiResponse('event', KEY, { fetchImpl: f.impl, now: NOW });
    expect(r.status).toBe(500);
    expect(r.headers['Cache-Control']).toBe(CACHE_NONE);
    expect(JSON.stringify(r.body)).not.toContain(KEY);
    expect((r.body as any).error).toBe('서울시 OpenAPI 호출 실패');
  });

  test('INFO-200 ("no data") on page 1 → empty list, not an error', async () => {
    const f = fakeFetch({ viewNightSpot: { 1: () => ok(JSON.stringify({ RESULT: { CODE: 'INFO-200', MESSAGE: '해당하는 데이터가 없습니다.' } })) } });
    const r = await seoulApiResponse('night', KEY, { fetchImpl: f.impl });
    expect(r.status).toBe(200);
    expect((r.body as any).viewNightSpot.row).toEqual([]);
  });

  test('XML or unexpected JSON from the API → error', async () => {
    const xml = await seoulApiResponse('event', KEY, { fetchImpl: fakeFetch({ culturalEventInfo: { 1: () => ok('<RESULT><CODE>ERROR-500</CODE></RESULT>') } }).impl, now: NOW });
    expect(xml.status).toBe(500);
    expect((xml.body as any).error).toContain('XML');
    const odd = await seoulApiResponse('space', KEY, { fetchImpl: fakeFetch({ culturalSpaceInfo: { 1: () => ok(JSON.stringify({ foo: 1 })) } }).impl });
    expect(odd.status).toBe(500);
    expect((odd.body as any).error).toBe('데이터 구조가 예상과 다릅니다.');
  });

  test('invalid type → 400 and missing key → 500, without calling the API', async () => {
    let called = false;
    const fetchImpl = async () => { called = true; return ok('{}'); };
    expect((await seoulApiResponse('bogus', KEY, { fetchImpl })).status).toBe(400);
    expect((await seoulApiResponse('event', undefined, { fetchImpl })).status).toBe(500);
    expect(called).toBe(false);
  });

  test('the Vite dev server serves /api/seoulapi with the shared logic', async ({ request }) => {
    // Invalid type is rejected by seoulApiResponse before any upstream call (no key or network needed).
    const res = await request.get('/api/seoulapi?type=bogus');
    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({ error: 'Invalid type parameter' });
    expect(res.headers()['cache-control']).toBe(CACHE_NONE);
  });
});
