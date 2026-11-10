/**
 * AI course remote (approved 2026-11-11). The paid model is NEVER called here:
 *  - pure logic and the server handler are tested with a fake model function;
 *  - the UI runs against the dev server with COURSE_AI_DISABLED=1 (rule-based path) or page.route fakes.
 */
import { test, expect } from './support/test';
import { EV, SPACES, SPOTS } from './fixtures/seoul-api';
import { ruleCourse, sanitizeRequest, validateAiCourse, swapStop, type Candidate, type CourseRequest } from '../api/_lib/course';
import { courseResponse, resetCourseState } from '../api/_lib/courseServer';

const C: Candidate[] = [
  { id: 'e1', kind: 'event', name: '한강 재즈 공연', area: '마포구', sub: '콘서트 · 망원한강공원', meta: '11.01 — 11.10 · 무료', lat: 37.555, lng: 126.895, free: true },
  { id: 'e2', kind: 'event', name: '종로 전시', area: '종로구', sub: '전시/미술 · 갤러리', meta: '11.01 — 11.30 · 유료', lat: 37.57, lng: 126.98 },
  { id: 's1', kind: 'space', name: '마포 문화공간', area: '마포구', sub: '공연장', meta: '', lat: 37.556, lng: 126.9 },
  { id: 's2', kind: 'space', name: '종로 미술관', area: '종로구', sub: '미술관', meta: '', lat: 37.571, lng: 126.981 },
  { id: 'n1', kind: 'night', name: '양화대교', area: '마포구', sub: '공공시설', meta: '일몰 ~ 23:00', lat: 37.543, lng: 126.902, lightsAt: '17:25' },
  { id: 'n2', kind: 'night', name: '청계천', area: '종로구', sub: '공원', meta: '24시간', lat: 37.569, lng: 126.978, openNow: true },
];
const REQ: CourseRequest = { query: '마포 재즈', candidates: C };

test.describe('course logic (pure)', () => {
  test('rule course: 행사 → 공간 → 야경, near each other, lighting time in the reason', () => {
    const r = ruleCourse(REQ);
    expect(r.stops.map((s) => s.id)).toEqual(['e1', 's1', 'n1']);
    expect(r.source).toBe('rules');
    expect(r.stops[2].reason).toContain('17:25에 불이 켜져요');
  });

  test('AI result: unknown / wrong-slot ids are dropped and filled by rules, with a note', () => {
    const r = validateAiCourse({ title: '마포 저녁', stops: [{ id: 'e1', reason: '재즈로 시작' }, { id: 'FAKE', reason: '없는 곳' }, { id: 'e2', reason: '행사를 공간 자리에' }, { id: 'n1', reason: '노을' }] }, REQ);
    expect(r.stops.map((s) => [s.kind, s.id])).toEqual([['event', 'e1'], ['space', 's1'], ['night', 'n1']]);
    expect(r.stops[0].reason).toBe('재즈로 시작');
    expect(r.source).toBe('ai');
    expect(r.note).toContain('기본 규칙으로 채웠어요');
  });

  test('context: start event and end spot are kept; swap picks another place of the same kind', () => {
    const req = { ...REQ, startId: 'e2', endId: 'n2' };
    const r = ruleCourse(req);
    expect(r.stops[0].id).toBe('e2');
    expect(r.stops[2].id).toBe('n2');
    const swapped = swapStop(req, r, 1)!;
    expect(swapped.stops[1].id).not.toBe(r.stops[1].id);
    expect(swapped.stops[1].kind).toBe('space');
  });

  test('sanitize: caps the query and rejects a request without all three kinds', () => {
    expect(sanitizeRequest({ query: 'x'.repeat(500), candidates: C })!.query).toHaveLength(200);
    expect(sanitizeRequest({ query: 'a', candidates: C.filter((c) => c.kind !== 'night') })).toBeNull();
    expect(sanitizeRequest('nope')).toBeNull();
  });
});

test.describe('course server (fake model)', () => {
  test.beforeEach(() => resetCourseState());

  test('no model → rule course labelled; model error → rule course labelled', async () => {
    const none = await courseResponse(REQ, { client: 'a', model: null });
    expect(none.status).toBe(200);
    expect(none.body).toMatchObject({ source: 'rules', note: expect.stringContaining('AI 연결이 없어') });
    const broken = await courseResponse(REQ, { client: 'b', model: async () => { throw new Error('down'); } });
    expect(broken.body).toMatchObject({ source: 'rules', note: expect.stringContaining('AI 응답을 받지 못해') });
  });

  test('same input is cached (one model call); rapid different requests are rate limited', async () => {
    let calls = 0;
    const model = async () => { calls++; return { title: 'T', stops: [{ id: 'e1', reason: 'r' }, { id: 's1', reason: 'r' }, { id: 'n1', reason: 'r' }] }; };
    const t0 = 1_000_000;
    const a = await courseResponse(REQ, { client: 'c', model, now: t0 });
    const b = await courseResponse(REQ, { client: 'c', model, now: t0 + 100 });
    expect(a.body).toMatchObject({ source: 'ai', title: 'T' });
    expect(b.headers['X-Course-Cache']).toBe('hit');
    expect(calls).toBe(1);
    const c = await courseResponse({ ...REQ, query: '다른 조건' }, { client: 'c', model, now: t0 + 500 });
    expect(c.status).toBe(429);
    const d = await courseResponse({ ...REQ, query: '다른 조건' }, { client: 'c', model, now: t0 + 4_000 });
    expect(d.status).toBe(200);
    expect(calls).toBe(2);
  });
});

test.describe('course remote UI', () => {
  test('button + bubble → input → rule course (no AI in tests) → swap → map link selects the first stop', async ({ page }) => {
    await page.goto('/#/');
    const fab = page.getByRole('button', { name: 'AI 코스추천 열기' });
    await expect(page.getByText('코스추천', { exact: true })).toBeVisible();
    await fab.click();
    const input = page.getByRole('textbox', { name: '코스 조건' });
    await expect(input).toBeFocused();
    await input.fill('클래식');
    await input.press('Enter');
    const panel = page.getByRole('dialog', { name: 'AI 코스추천 결과' });
    await expect(panel.locator('.v3-course__stop.is-filled')).toHaveCount(3);
    await expect(panel.getByRole('link', { name: EV.todayFreeClassic.title })).toBeVisible();
    await expect(panel.getByRole('link', { name: SPACES[0].FAC_NAME })).toHaveAttribute('href', '#/space/s1');
    await expect(panel.getByRole('link', { name: SPOTS[0].TITLE })).toHaveAttribute('href', '#/night?spot=n1');
    await expect(panel.getByText(/기본 규칙 코스/)).toBeVisible();

    // Only one space in the fixtures → nothing to swap to; the stop stays.
    await panel.locator('.v3-course__stop').nth(1).getByRole('button', { name: '↻ 다른 곳으로' }).click();
    await expect(panel.getByRole('link', { name: SPACES[0].FAC_NAME })).toBeVisible();

    await panel.getByRole('button', { name: '지도에서 보기 →' }).click();
    await expect(page).toHaveURL(new RegExp(`#/map\\?sel=event%3A${EV.todayFreeClassic.id}$`));
  });

  test('AI response (faked) is shown as AI; ids not in the list never render', async ({ page }) => {
    await page.route('**/api/course', (route) => route.fulfill({ json: {
      title: '가짜 AI 코스', source: 'ai',
      stops: [{ id: EV.todayFreeClassic.id, kind: 'event', reason: '클래식으로 시작' }, { id: 's1', kind: 'space', reason: '가까운 공간' }, { id: 'n1', kind: 'night', reason: '불 켜지는 곳' }],
    } }));
    await page.goto('/#/');
    await page.getByRole('button', { name: 'AI 코스추천 열기' }).click();
    await page.getByRole('button', { name: '무료로만' }).click();
    const panel = page.getByRole('dialog', { name: 'AI 코스추천 결과' });
    await expect(panel.getByText('가짜 AI 코스')).toBeVisible();
    await expect(panel.getByText('클래식으로 시작')).toBeVisible();
    await expect(panel.getByText(/AI 추천 · 목록에 있는 곳만/)).toBeVisible();

    await page.unroute('**/api/course');
    await page.route('**/api/course', (route) => route.fulfill({ json: {
      title: '없는 곳 코스', source: 'ai', stops: [{ id: '999999', kind: 'event', reason: '지어낸 행사' }, { id: 's1', kind: 'space', reason: 'x' }, { id: 'n1', kind: 'night', reason: 'y' }],
    } }));
    await panel.getByRole('button', { name: '다시 짜기' }).click();
    await expect(panel.getByText('지어낸 행사')).toHaveCount(0);
    await expect(panel.locator('.v3-course__stop.is-filled')).toHaveCount(3);
    await expect(panel.getByText(/기본 규칙 코스/)).toBeVisible();
  });

  test('server error / 429 → rule course, the app keeps working', async ({ page }) => {
    await page.route('**/api/course', (route) => route.fulfill({ status: 429, json: { error: 'slow down' } }));
    await page.goto('/#/');
    await page.getByRole('button', { name: 'AI 코스추천 열기' }).click();
    await page.getByRole('button', { name: '오늘 저녁 데이트' }).click();
    const panel = page.getByRole('dialog', { name: 'AI 코스추천 결과' });
    await expect(panel.getByText(/요청이 잦아/)).toBeVisible();
    await expect(panel.locator('.v3-course__stop.is-filled')).toHaveCount(3);
  });

  test('page context: event detail pre-fills that event; night page pre-fills "야경으로 마무리하는"', async ({ page }) => {
    await page.goto(`/#/event/${EV.thisWeekPlay.id}`);
    await page.getByRole('button', { name: 'AI 코스추천 열기' }).click();
    await expect(page.getByRole('textbox', { name: '코스 조건' })).toHaveValue(`${EV.thisWeekPlay.title} 보고 나서 `);
    await page.keyboard.press('Escape');
    await page.goto('/#/night');
    await page.getByRole('button', { name: 'AI 코스추천 열기' }).click();
    await expect(page.getByRole('textbox', { name: '코스 조건' })).toHaveValue('야경으로 마무리하는 ');
  });
});
