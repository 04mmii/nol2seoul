import { test, expect, eventListCard, eventListCards, eventListHeading, pickFilter, detailHeading } from './support/test';
import { EV, EXPECT } from './fixtures/seoul-api';

const countHeading = (n: number) => ({ name: `총 ${n}건의 문화행사` });

test.describe('EventList (v3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/events');
    await expect(eventListHeading(page)).toBeVisible();
  });

  test('title shows the number of events running today; total count and the first page of 12 cards', async ({ page }) => {
    // Fixed clock 2026-11-03: todayFreeClassic and todayFestivalFeeText are running (same rule as Home 오늘).
    await expect(eventListHeading(page)).toHaveText(/하고 있는\s*2\s*가지 일/);
    await expect(page.getByRole('heading', countHeading(EXPECT.total))).toBeVisible();
    await expect(eventListCards(page)).toHaveCount(EXPECT.perPage);
    await expect(eventListCard(page, EV.futureExhibition.title)).toBeVisible();
  });

  test('pagination moves between pages', async ({ page }) => {
    const prev = page.getByRole('button', { name: '이전 페이지' });
    const next = page.getByRole('button', { name: '다음 페이지' });
    await expect(prev).toBeDisabled();

    await page.getByRole('navigation', { name: '페이지' }).getByRole('button', { name: '2', exact: true }).click();
    await expect(eventListCards(page)).toHaveCount(EXPECT.total - EXPECT.perPage);
    await expect(page.getByRole('link', { name: '[픽스처] 기타 행사 12', exact: true })).toBeVisible();
    await expect(next).toBeDisabled();

    await prev.click();
    await expect(eventListCards(page)).toHaveCount(EXPECT.perPage);
  });

  test('region filter narrows results; 필터 초기화 resets and is disabled with no filter', async ({ page }) => {
    const reset = page.getByRole('button', { name: '필터 초기화' });
    await expect(reset).toBeDisabled();
    await pickFilter(page, '지역', '강남구');
    await expect(page.getByRole('heading', countHeading(EXPECT.gangnam))).toBeVisible();
    await expect(eventListCard(page, EV.todayFreeClassic.title)).toBeVisible();
    await expect(eventListCard(page, EV.thisWeekPlay.title)).toBeVisible();
    // The selected chip is marked as pressed.
    await expect(page.getByRole('group', { name: '지역' }).getByRole('button', { name: '강남구' })).toHaveAttribute('aria-pressed', 'true');

    await reset.click();
    await expect(page.getByRole('heading', countHeading(EXPECT.total))).toBeVisible();
    await expect(reset).toBeDisabled();
  });

  test('genre (category) filter, with counts', async ({ page }) => {
    const cat = page.getByRole('group', { name: '카테고리' });
    await expect(cat.getByRole('button', { name: /^연극/ })).toContainText('1');
    await expect(cat.getByRole('button', { name: /^전체/ })).toContainText(String(EXPECT.total));
    await pickFilter(page, '카테고리', '연극');
    await expect(page.getByRole('heading', countHeading(1))).toBeVisible();
    await expect(eventListCard(page, EV.thisWeekPlay.title)).toBeVisible();
  });

  test('fee filter: 무료 = fee kind "free", 유료 = everything else (BUG-03 option D)', async ({ page }) => {
    await pickFilter(page, '관람료', '무료');
    await expect(page.getByRole('heading', countHeading(EXPECT.freeByIsFree))).toBeVisible();
    await expect(eventListCard(page, EV.todayFreeClassic.title)).toBeVisible();

    await pickFilter(page, '관람료', '유료');
    await expect(page.getByRole('heading', countHeading(EXPECT.total - EXPECT.freeByIsFree))).toBeVisible();
  });

  test('changing a filter resets pagination to page 1', async ({ page }) => {
    await page.getByRole('navigation', { name: '페이지' }).getByRole('button', { name: '2', exact: true }).click();
    await expect(eventListCards(page)).toHaveCount(EXPECT.total - EXPECT.perPage);
    await pickFilter(page, '관람료', '유료');
    await expect(eventListCards(page)).toHaveCount(EXPECT.perPage);
    await expect(page.getByRole('button', { name: '이전 페이지' })).toBeDisabled();
  });

  test('filter combination with no match shows the empty state', async ({ page }) => {
    await pickFilter(page, '지역', '강남구');
    await pickFilter(page, '카테고리', '전시/미술');
    await expect(page.getByRole('heading', countHeading(0))).toBeVisible();
    await expect(page.getByText('조건에 맞는 행사가 없습니다.')).toBeVisible();
  });

  test('period tabs use the Home tab rules; default is 전체', async ({ page }) => {
    const periods = page.getByRole('group', { name: '기간' });
    await expect(periods.getByRole('button', { name: '전체' })).toHaveAttribute('aria-pressed', 'true');
    await periods.getByRole('button', { name: '오늘' }).click();
    await expect(page.getByRole('heading', countHeading(2))).toBeVisible(); // same as Home 오늘
    await periods.getByRole('button', { name: '이번 주' }).click();
    await expect(page.getByRole('heading', countHeading(3))).toBeVisible(); // + thisWeekPlay
    await periods.getByRole('button', { name: '이번 달' }).click();
    await expect(page.getByRole('heading', countHeading(3))).toBeVisible(); // December/January events stay out
    await periods.getByRole('button', { name: '전체' }).click();
    await expect(page.getByRole('heading', countHeading(EXPECT.total))).toBeVisible();
  });

  test('sort: 기본순 = API order, 마감임박 = soonest end date first', async ({ page }) => {
    const firstTitles = async () => (await eventListCards(page).getByRole('heading').allTextContents()).slice(0, 4);
    expect(await firstTitles()).toEqual([EV.futureExhibition.title, EV.todayFreeClassic.title, EV.todayFestivalFeeText.title, EV.thisWeekPlay.title]);
    await page.getByRole('combobox').selectOption({ label: '마감임박' });
    // Ends: festival 11-04, classic 11-05, play 11-08, exhibition 12-31, fillers 2027-01-20.
    expect(await firstTitles()).toEqual([EV.todayFestivalFeeText.title, EV.todayFreeClassic.title, EV.thisWeekPlay.title, EV.futureExhibition.title]);
  });

  test('card title opens the matching event detail', async ({ page }) => {
    await eventListCard(page, EV.thisWeekPlay.title).getByRole('link', { name: EV.thisWeekPlay.title }).click();
    await expect(page).toHaveURL(new RegExp(`#/event/${EV.thisWeekPlay.id}$`));
    await expect(detailHeading(page, EV.thisWeekPlay.title)).toBeVisible();
  });

  test('"지도 보기" links to the map and sits in the toolbar on desktop', async ({ page }) => {
    const map = page.getByRole('link', { name: /지도 보기/ });
    await expect(map).toHaveAttribute('href', '#/map');
    expect(await map.evaluate((el) => getComputedStyle(el).position)).not.toBe('fixed');
    await expect(page.locator('.v3-evlist__toolbar').getByRole('link', { name: /지도 보기/ })).toBeVisible();
  });
});

test.describe('EventList (v3) — mobile 390px', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('filters are collapsed behind a toggle; no horizontal overflow', async ({ page }) => {
    await page.goto('/#/events');
    await expect(eventListHeading(page)).toBeVisible();
    const toggle = page.getByRole('button', { name: /^필터( · \d+)?$/ });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('group', { name: '지역' })).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await pickFilter(page, '지역', '강남구');
    await expect(page.getByRole('heading', countHeading(EXPECT.gangnam))).toBeVisible();
    await expect(toggle).toHaveText(/필터 · 1/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
  });

  test('"지도 보기" is fixed at the bottom of the screen', async ({ page }) => {
    await page.goto('/#/events');
    await expect(eventListHeading(page)).toBeVisible();
    const map = page.getByRole('link', { name: /지도 보기/ });
    expect(await map.evaluate((el) => getComputedStyle(el).position)).toBe('fixed');
    const box = (await map.boundingBox())!;
    expect(box.y + box.height).toBeGreaterThan(844 - 40);
  });
});

test.describe('EventList states', () => {
  test('network failure shows the error state', async ({ page }) => {
    // Registered after the default fixture route, so it takes precedence.
    await page.route('**/api/seoulapi**', (route) => route.abort('failed'));
    await page.goto('/#/events');
    // TanStack Query retries once (index.tsx), so allow extra time.
    await expect(page.getByText('문화행사를 불러올 수 없습니다.')).toBeVisible({ timeout: 15_000 });
  });

  test('shows a loading indicator while data is pending', async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    await page.route('**/api/seoulapi**', async (route) => {
      await gate;
      await route.fallback();
    });
    await page.goto('/#/events');
    await expect(page.getByText('문화행사를 불러오는 중...')).toBeVisible();
    release();
    await expect(eventListHeading(page)).toBeVisible();
  });
});
