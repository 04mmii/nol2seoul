import { test, expect, eventListCard, pickFilter, detailHeading } from './support/test';
import { EV, EXPECT } from './fixtures/seoul-api';

const countHeading = (n: number) => ({ name: `총 ${n}건의 문화행사` });
const detailLinks = (page: import('@playwright/test').Page) => page.getByRole('link', { name: '상세보기', exact: true });

test.describe('EventList', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/events');
    await expect(page.getByRole('heading', { name: '문화행사 탐색' })).toBeVisible();
  });

  test('shows total count and the first page of 12 cards', async ({ page }) => {
    await expect(page.getByRole('heading', countHeading(EXPECT.total))).toBeVisible();
    await expect(detailLinks(page)).toHaveCount(EXPECT.perPage);
    await expect(eventListCard(page, EV.futureExhibition.title)).toBeVisible();
  });

  test('pagination moves between pages', async ({ page }) => {
    const prev = page.getByRole('button', { name: 'chevron_left' });
    const next = page.getByRole('button', { name: 'chevron_right' });
    await expect(prev).toBeDisabled();

    await page.getByRole('button', { name: '2', exact: true }).click();
    await expect(detailLinks(page)).toHaveCount(EXPECT.total - EXPECT.perPage);
    await expect(page.getByRole('link', { name: '[픽스처] 기타 행사 12', exact: true })).toBeVisible();
    await expect(next).toBeDisabled();

    await prev.click();
    await expect(detailLinks(page)).toHaveCount(EXPECT.perPage);
  });

  test('region filter narrows results and shows a reset chip', async ({ page }) => {
    await pickFilter(page, /^자치구 선택/, '강남구');
    await expect(page.getByRole('heading', countHeading(EXPECT.gangnam))).toBeVisible();
    await expect(eventListCard(page, EV.todayFreeClassic.title)).toBeVisible();
    await expect(eventListCard(page, EV.thisWeekPlay.title)).toBeVisible();
    // Trigger shows the selected value instead of the label.
    await expect(page.getByRole('button', { name: /^강남구/ })).toBeVisible();

    await page.getByRole('button', { name: /초기화/ }).click();
    await expect(page.getByRole('heading', countHeading(EXPECT.total))).toBeVisible();
    await expect(page.getByRole('button', { name: /초기화/ })).toHaveCount(0);
  });

  test('genre filter', async ({ page }) => {
    await pickFilter(page, /^장르/, '연극');
    await expect(page.getByRole('heading', countHeading(1))).toBeVisible();
    await expect(eventListCard(page, EV.thisWeekPlay.title)).toBeVisible();
  });

  test('fee filter: 무료 = fee kind "free", 유료 = everything else (BUG-03 option D)', async ({ page }) => {
    await pickFilter(page, /^유료\/무료/, '무료');
    await expect(page.getByRole('heading', countHeading(EXPECT.freeByIsFree))).toBeVisible();
    await expect(eventListCard(page, EV.todayFreeClassic.title)).toBeVisible();

    await pickFilter(page, /^무료/, '유료');
    await expect(page.getByRole('heading', countHeading(EXPECT.total - EXPECT.freeByIsFree))).toBeVisible();
  });

  test('changing a filter resets pagination to page 1', async ({ page }) => {
    await page.getByRole('button', { name: '2', exact: true }).click();
    await expect(detailLinks(page)).toHaveCount(EXPECT.total - EXPECT.perPage);
    await pickFilter(page, /^유료\/무료/, '유료');
    await expect(detailLinks(page)).toHaveCount(EXPECT.perPage);
    await expect(page.getByRole('button', { name: 'chevron_left' })).toBeDisabled();
  });

  test('filter combination with no match shows the empty state', async ({ page }) => {
    await pickFilter(page, /^자치구 선택/, '강남구');
    await pickFilter(page, /^장르/, '전시/미술');
    await expect(page.getByRole('heading', countHeading(0))).toBeVisible();
    await expect(page.getByText('조건에 맞는 행사가 없습니다.')).toBeVisible();
  });

  test('"상세보기" opens the matching event detail', async ({ page }) => {
    await eventListCard(page, EV.thisWeekPlay.title).getByRole('link', { name: '상세보기' }).click();
    await expect(page).toHaveURL(new RegExp(`#/event/${EV.thisWeekPlay.id}$`));
    await expect(detailHeading(page, EV.thisWeekPlay.title)).toBeVisible();
  });

  test('"지도 보기" FAB links to the map', async ({ page }) => {
    await expect(page.getByRole('link', { name: /지도 보기/ })).toHaveAttribute('href', '#/map');
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
    await expect(page.getByRole('heading', { name: '문화행사 탐색' })).toBeVisible();
  });
});
