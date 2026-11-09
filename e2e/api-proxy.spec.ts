/**
 * TECH-10 (option B): tests for the shared Seoul API proxy logic (api/_lib/seoulApi.ts), used by the
 * Vercel function and the Vite dev server. No browser and no real API: `fetchImpl` is a fake.
 * The last test checks that the dev server actually serves /api/seoulapi through this code.
 */
import { test, expect } from '@playwright/test';
import { seoulApiResponse, EVENT_PAGES, CACHE_OK, CACHE_PARTIAL, CACHE_NONE, kstToday } from '../api/_lib/seoulApi';

const KEY = 'TEST_KEY_123';
// 2026-11-09 15:30 UTC = 2026-11-10 00:30 KST → "today" is 2026-11-10 in Korea, 11-09 in UTC.
const NOW = new Date('2026-11-09T15:30:00Z');

type Row = Record<string, string>;
const ev = (code: number, end: string, extra: Row = {}): Row => ({
  TITLE: `행사 ${code}`,
  STRTDATE: '2026-10-01 00:00:00.0',
  END_DATE: end ? `${end} 00:00:00.0` : '',
  PLACE: '장소',
  HMPG_ADDR: `https://culture.seoul.go.kr/culture/culture/cultureEvent/view.do?cultcode=${code}&menuNo=200008`,
  ...extra,
});
const page = (rows: Row[], total = 19750) => JSON.stringify({ culturalEventInfo: { list_total_count: total, RESULT: { CODE: 'INFO-000' }, row: rows } });
const ok = (text: string) => ({ ok: true, status: 200, text: async () => text });

/** Fake fetch: answers by row range; records requested URLs. */
function fakeFetch(byStart: Record<number, () => { ok: boolean; status: number; text(): Promise<string> } | Promise<never>>) {
  const calls: string[] = [];
  const impl = async (url: string) => {
    calls.push(url);
    const m = /\/json\/(\w+)\/(\d+)\/(\d+)\//.exec(url)!;
    const handler = byStart[Number(m[2])];
    if (!handler) throw new Error(`unexpected ${url}`);
    return handler();
  };
  return { impl, calls };
}

test.describe('Seoul API proxy — type=event (TECH-10 B)', () => {
  test('fetches rows 1–4,000 as 4 calls, merges them and drops events that ended before today (KST)', async () => {
    const { impl, calls } = fakeFetch({
      1: () => ok(page([ev(1, '2026-12-31'), ev(2, '2026-11-09')])), // 2 ended yesterday in KST (still "today" in UTC)
      1001: () => ok(page([ev(3, '2026-11-10')])), // ends today (KST) → kept
      2001: () => ok(page([ev(4, '2025-05-01')])), // long ended → dropped
      3001: () => ok(page([ev(5, '2027-03-01')])),
    });
    const r = await seoulApiResponse('event', KEY, { fetchImpl: impl, now: NOW });
    expect(calls.map((u) => /\/(\d+\/\d+)\/$/.exec(u)![1]).sort()).toEqual(EVENT_PAGES.map(([s, e]) => `${s}/${e}`).sort());
    expect(calls.every((u) => u.startsWith(`http://openapi.seoul.go.kr:8088/${KEY}/json/culturalEventInfo/`))).toBe(true);
    expect(r.status).toBe(200);
    expect(r.headers['Cache-Control']).toBe(CACHE_OK);
    expect(CACHE_OK).toContain('s-maxage=3600');
    const body = r.body as { culturalEventInfo: { row: Row[]; list_total_count: number; source_total: number } };
    expect(body.culturalEventInfo.row.map((x) => x.TITLE)).toEqual(['행사 1', '행사 3', '행사 5']);
    expect(body.culturalEventInfo.list_total_count).toBe(3);
    expect(body.culturalEventInfo.source_total).toBe(19750);
  });

  test('"today" is the Korean date', () => {
    expect(kstToday(new Date('2026-11-09T14:59:00Z'))).toBe('2026-11-09');
    expect(kstToday(new Date('2026-11-09T15:00:00Z'))).toBe('2026-11-10');
  });

  test('drops duplicates across pages and keeps rows without an end date', async () => {
    const { impl } = fakeFetch({
      1: () => ok(page([ev(1, '2026-12-31'), ev(2, '')])),
      1001: () => ok(page([ev(1, '2026-12-31')])), // shifted into the next page
      2001: () => ok(page([])),
      3001: () => ok(page([])),
    });
    const r = await seoulApiResponse('event', KEY, { fetchImpl: impl, now: NOW });
    expect((r.body as any).culturalEventInfo.row.map((x: Row) => x.TITLE)).toEqual(['행사 1', '행사 2']);
  });

  test('a page past the end (INFO-200 "no data") is not an error', async () => {
    const none = () => ok(JSON.stringify({ RESULT: { CODE: 'INFO-200', MESSAGE: '해당하는 데이터가 없습니다.' } }));
    const { impl } = fakeFetch({ 1: () => ok(page([ev(1, '2026-12-31')], 1500)), 1001: () => ok(page([ev(2, '2026-12-31')], 1500)), 2001: none, 3001: none });
    const r = await seoulApiResponse('event', KEY, { fetchImpl: impl, now: NOW });
    expect(r.status).toBe(200);
    expect(r.headers['Cache-Control']).toBe(CACHE_OK);
    expect((r.body as any).culturalEventInfo.partial).toBeUndefined();
    expect((r.body as any).culturalEventInfo.row).toHaveLength(2);
  });

  test('a later page failing → partial data, flagged, cached only briefly', async () => {
    const { impl } = fakeFetch({
      1: () => ok(page([ev(1, '2026-12-31')])),
      1001: () => ({ ok: false, status: 503, text: async () => '' }),
      2001: () => ok(page([ev(3, '2026-12-31')])),
      3001: () => Promise.reject(new Error('socket hang up')),
    });
    const r = await seoulApiResponse('event', KEY, { fetchImpl: impl, now: NOW });
    expect(r.status).toBe(200);
    expect(r.headers['Cache-Control']).toBe(CACHE_PARTIAL);
    expect(r.headers['X-Seoulapi-Partial']).toBe('1');
    expect((r.body as any).culturalEventInfo.partial).toBe(true);
    expect((r.body as any).culturalEventInfo.row.map((x: Row) => x.TITLE)).toEqual(['행사 1', '행사 3']);
  });

  test('the first page failing → error status, not cached, key never in the body', async () => {
    const { impl } = fakeFetch({
      1: () => Promise.reject(new Error(`connect ECONNREFUSED http://openapi.seoul.go.kr:8088/${KEY}/json/x`)),
      1001: () => ok(page([])),
      2001: () => ok(page([])),
      3001: () => ok(page([])),
    });
    const r = await seoulApiResponse('event', KEY, { fetchImpl: impl, now: NOW });
    expect(r.status).toBe(500);
    expect(r.headers['Cache-Control']).toBe(CACHE_NONE);
    expect(JSON.stringify(r.body)).not.toContain(KEY);
    expect((r.body as any).error).toBe('서울시 OpenAPI 호출 실패');
  });

  test('XML or unexpected JSON from the API → error', async () => {
    const xml = await seoulApiResponse('event', KEY, {
      fetchImpl: fakeFetch({ 1: () => ok('<RESULT><CODE>ERROR-500</CODE></RESULT>'), 1001: () => ok(page([])), 2001: () => ok(page([])), 3001: () => ok(page([])) }).impl,
      now: NOW,
    });
    expect(xml.status).toBe(500);
    expect((xml.body as any).error).toContain('XML');
    const odd = await seoulApiResponse('event', KEY, {
      fetchImpl: fakeFetch({ 1: () => ok(JSON.stringify({ foo: 1 })), 1001: () => ok(page([])), 2001: () => ok(page([])), 3001: () => ok(page([])) }).impl,
      now: NOW,
    });
    expect(odd.status).toBe(500);
    expect((odd.body as any).error).toBe('데이터 구조가 예상과 다릅니다.');
  });
});

test.describe('Seoul API proxy — other types and input checks', () => {
  test('type=space is passed through: one call for rows 1–1,000, no CDN cache header (unchanged)', async () => {
    const calls: string[] = [];
    const r = await seoulApiResponse('space', KEY, {
      fetchImpl: async (url) => { calls.push(url); return ok(JSON.stringify({ culturalSpaceInfo: { list_total_count: 1, row: [{ FAC_NAME: '공간' }] } })); },
    });
    expect(calls).toEqual([`http://openapi.seoul.go.kr:8088/${KEY}/json/culturalSpaceInfo/1/1000/`]);
    expect(r.status).toBe(200);
    expect(r.headers['Cache-Control']).toBeUndefined();
    expect((r.body as any).culturalSpaceInfo.row).toEqual([{ FAC_NAME: '공간' }]);
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
