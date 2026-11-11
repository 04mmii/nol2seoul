/**
 * Space detail v3 (2026-11-11) + the BUG-13 field mapping it keeps:
 * IMG_URL → MAIN_IMG, DTLCONT → FAC_DESC (HTML shown as plain text), TICKET_YN → ENTRFREE,
 * TRAFFIC_INFO → SUBWAY / BUSSTOP. Route /space/s<NUM> (stable IDs).
 */
import { test, expect, readStorage, STORAGE, type StoredFavorite } from './support/test';
import { EV, EVENTS, SPACES } from './fixtures/seoul-api';

const info = (page: import('@playwright/test').Page, label: string) =>
  page.getByRole('complementary', { name: '공간 정보' }).getByRole('listitem').filter({ has: page.getByText(label, { exact: true }) });

test.describe('SpaceDetail v3', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/space/s1');
    await expect(page.getByRole('heading', { level: 1, name: SPACES[0].FAC_NAME })).toBeVisible();
  });

  test('breadcrumb, hero placeholder when MAIN_IMG is empty, category and address', async ({ page }) => {
    const crumbs = page.getByRole('navigation', { name: '현재 위치' });
    await expect(crumbs.getByRole('link', { name: '지도탐색' })).toHaveAttribute('href', '#/map');
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText(SPACES[0].FAC_NAME);
    await expect(page.locator('.v3-detail-hero__ph')).toBeVisible(); // fixture has no MAIN_IMG
    await expect(page.locator('.v3-detail-hero__cat')).toHaveText(`문화공간 · ${SPACES[0].SUBJCODE}`);
    await expect(page.locator('.v3-detail-hero__org')).toHaveText(SPACES[0].ADDR);
  });

  test('FAC_DESC HTML renders as plain-text paragraphs (no tags, entities decoded)', async ({ page }) => {
    await expect(page.getByText('[픽스처] 문화공간 설명 첫 문단 & 소개', { exact: true })).toBeVisible();
    await expect(page.getByText('[픽스처] 둘째 문단', { exact: true })).toBeVisible();
    await expect(page.getByText(/<div|<span|&nbsp;/)).toHaveCount(0);
  });

  test('info rows come from the API: 주소, 전화, 휴관일, 입장료 (ENTRFREE); empty 홈페이지 is not shown', async ({ page }) => {
    await expect(info(page, '주소')).toContainText(SPACES[0].ADDR);
    await expect(info(page, '전화')).toContainText(SPACES[0].PHNE);
    await expect(info(page, '휴관일')).toContainText('월요일');
    await expect(info(page, '입장료')).toContainText('유료');
    await expect(info(page, '홈페이지')).toHaveCount(0);
  });

  test('교통 안내 comes from SUBWAY / BUSSTOP; a bare number is not shown', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '교통 안내' })).toBeVisible();
    await expect(page.getByText('3호선 경복궁역 5번 출구')).toBeVisible();
    await expect(page.getByText('버스', { exact: true })).toHaveCount(0);
  });

  test('찜 toggles and stores the same shape as before', async ({ page }) => {
    await page.getByRole('button', { name: '찜하기' }).click();
    await expect(page.getByRole('button', { name: '찜됨' })).toHaveAttribute('aria-pressed', 'true');
    const stored = await readStorage<StoredFavorite[]>(page, STORAGE.favorites);
    expect(stored?.[0]).toMatchObject({ id: 's1', type: 'space', title: SPACES[0].FAC_NAME, location: SPACES[0].ADDR, category: SPACES[0].SUBJCODE });
  });

  test('no event at this space and no other space → both sections hidden', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /이 공간에서 열리는/ })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /가까운/ })).toHaveCount(0);
  });
});

test.describe('SpaceDetail v3 — events here and nearby spaces', () => {
  test('events whose PLACE contains the space name; nearby spaces by straight-line distance', async ({ page }) => {
    const base = { ...SPACES[0], MAIN_IMG: 'https://fixtures.nolseoul.test/space-1.png' };
    const spaces = [
      base,
      { ...SPACES[0], NUM: '2', FAC_NAME: '[픽스처] 가까운 극장', X_COORD: 37.571, Y_COORD: 126.981, MAIN_IMG: '' },
      { ...SPACES[0], NUM: '3', FAC_NAME: '[픽스처] 먼 도서관', X_COORD: 37.65, Y_COORD: 127.05, MAIN_IMG: '' },
    ];
    const events = [...EVENTS, { ...EVENTS[1], TITLE: '[픽스처] 미술관 기획전', PLACE: `${SPACES[0].FAC_NAME} 2층 기획전시실`, HMPG_ADDR: 'https://x.test/?cultcode=900099' }];
    const wrap = (key: string, row: unknown[]) => ({ [key]: { list_total_count: row.length, RESULT: { CODE: 'INFO-000' }, row } });
    await page.route('**/api/seoulapi?type=space', (r) => r.fulfill({ json: wrap('culturalSpaceInfo', spaces) }));
    await page.route('**/api/seoulapi?type=event', (r) => r.fulfill({ json: wrap('culturalEventInfo', events) }));
    await page.goto('/#/space/s1');

    await expect(page.locator('.v3-detail-hero__media img')).toHaveAttribute('src', base.MAIN_IMG);
    const here = page.getByRole('region', { name: /이 공간에서 열리는/ });
    await expect(here.getByRole('article')).toHaveCount(1);
    await expect(here.getByRole('link', { name: '[픽스처] 미술관 기획전' })).toHaveAttribute('href', '#/event/900099');
    await expect(here).not.toContainText(EV.todayFreeClassic.title);

    const near = page.getByRole('region', { name: /가까운/ });
    const names = near.locator('.v3-event-card__title');
    await expect(names).toHaveText(['[픽스처] 가까운 극장', '[픽스처] 먼 도서관']);
    await expect(near.getByRole('article').first()).toContainText(/약 \d+m/);
    await near.getByRole('link', { name: '[픽스처] 가까운 극장' }).click();
    await expect(page).toHaveURL(/#\/space\/s2$/);
    await expect(page.getByRole('heading', { level: 1, name: '[픽스처] 가까운 극장' })).toBeVisible();
  });
});
