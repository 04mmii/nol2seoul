import {
  test,
  expect,
  homeCard,
  homeHeart,
  eventListCard,
  heartIn,
  expectSaved,
  readStorage,
  detailHeading,
  STORAGE,
  type StoredFavorite,
} from './support/test';
import { EV, SPACES, SPOTS } from './fixtures/seoul-api';

const eventsRegion = (page: import('@playwright/test').Page) => page.getByRole('region', { name: /지금 서울에서/ });

test.describe('Home (v3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
  });

  test('renders all v3 sections', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: /THIS WEEK/ })).toBeVisible();
    await expect(page.getByText('2026.11.03 TUE')).toBeVisible(); // masthead date (fixed clock, KST)
    const strip = page.getByRole('navigation', { name: '카테고리' });
    for (const label of ['문화행사', '문화공간', '지도탐색']) {
      await expect(strip.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(page.getByRole('heading', { name: /지금 서울에서/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /내 주변 문화공간을/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /에디터가 고른/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /가장 빛나는/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /그들이 고른/ })).toBeVisible();
  });

  // ---- Mapping: event → hero + grid -------------------------------------------------------
  test('hero: features an ongoing event with an image and links to its detail', async ({ page }) => {
    const hero = page.getByRole('region', { name: '이번 주 문화행사' });
    const caption = hero.getByRole('link', { name: new RegExp(EV.todayFreeClassic.title.replace(/[[\]]/g, '\\$&')) });
    await expect(caption).toBeVisible();
    await expect(caption).toContainText('FEATURED · 클래식');
    await caption.click();
    await expect(page).toHaveURL(new RegExp(`#/event/${EV.todayFreeClassic.index}$`));
    await expect(detailHeading(page, EV.todayFreeClassic.title)).toBeVisible();
  });

  test('hero: stats are computed from event + space data', async ({ page }) => {
    const stats = page.getByRole('region', { name: '이번 주 문화행사' }).locator('dl');
    // ongoing today = 2 (classic, festival); spaces = 1; starting this week = 1 (play on 11-06)
    await expect(stats.locator('div', { hasText: '진행 중 행사' }).locator('dd')).toHaveText('2');
    await expect(stats.locator('div', { hasText: '문화공간' }).locator('dd')).toHaveText('1');
    await expect(stats.locator('div', { hasText: '이번 주 시작' }).locator('dd')).toHaveText('1');
  });

  test('hero: banner controls switch the featured event', async ({ page }) => {
    const hero = page.getByRole('region', { name: '이번 주 문화행사' });
    await expect(hero.getByText('01 / 03')).toBeVisible();
    await hero.getByRole('button', { name: '다음 배너' }).click();
    await expect(hero.getByText('02 / 03')).toBeVisible();
    await expect(hero.getByRole('link', { name: /FEATURED/ })).toContainText(EV.todayFestivalFeeText.title);
    await hero.getByRole('button', { name: '배너 1' }).click();
    await expect(hero.getByText('01 / 03')).toBeVisible();
  });

  test('cards show the compact design-ref date (MM.DD — MM.DD) and the full price', async ({ page }) => {
    const card = homeCard(page, EV.todayFreeClassic.title); // 2026-11-01 ~ 2026-11-05, free
    await expect(card.getByText('11.01 — 11.05', { exact: true })).toBeVisible();
    await expect(card.getByText('무료', { exact: true })).toBeVisible();
  });

  test('오늘 tab shows only events running today', async ({ page }) => {
    await expect(eventsRegion(page).getByRole('button', { name: '오늘', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(homeCard(page, EV.todayFreeClassic.title)).toBeVisible();
    await expect(homeCard(page, EV.todayFestivalFeeText.title)).toBeVisible();
    await expect(homeCard(page, EV.thisWeekPlay.title)).toHaveCount(0);
    await expect(homeCard(page, EV.futureExhibition.title)).toHaveCount(0);
    await expect(eventsRegion(page).getByText('2건 표시 · 2건 중')).toBeVisible();
  });

  test('이번주 / 이번달 / 무료 tabs', async ({ page }) => {
    const region = eventsRegion(page);
    await region.getByRole('button', { name: '이번주', exact: true }).click();
    await expect(homeCard(page, EV.thisWeekPlay.title)).toBeVisible();
    await expect(homeCard(page, EV.futureExhibition.title)).toHaveCount(0);
    await expect(region.getByText('3건 표시 · 3건 중')).toBeVisible();

    // Month ends 2026-11-30: the December exhibition and January fillers stay out.
    await region.getByRole('button', { name: '이번달', exact: true }).click();
    await expect(region.getByText('3건 표시 · 3건 중')).toBeVisible();
    await expect(homeCard(page, EV.futureExhibition.title)).toHaveCount(0);

    // Free = not ended + Home free rule (IS_FREE or USE_FEE text).
    await region.getByRole('button', { name: '무료', exact: true }).click();
    await expect(region.getByText('2건 표시 · 2건 중')).toBeVisible();
    await expect(homeCard(page, EV.todayFreeClassic.title)).toBeVisible();
    await expect(homeCard(page, EV.todayFestivalFeeText.title)).toBeVisible();

    await region.getByRole('button', { name: '오늘', exact: true }).click();
    await expect(homeCard(page, EV.thisWeekPlay.title)).toHaveCount(0);
  });

  test('card price uses the Home free rule (IS_FREE or USE_FEE text)', async ({ page }) => {
    await expect(homeCard(page, EV.todayFreeClassic.title)).toContainText('무료');
    // IS_FREE=유료 but USE_FEE contains 무료 → Home labels it free (see BUG-03).
    await expect(homeCard(page, EV.todayFestivalFeeText.title).locator('[title]')).toHaveText('무료');
  });

  test('"전체 문화행사 보기" navigates to the event list', async ({ page }) => {
    await page.getByRole('link', { name: /전체 문화행사 보기/ }).click();
    await expect(page).toHaveURL(/#\/events$/);
    await expect(page.getByRole('heading', { name: '문화행사 탐색' })).toBeVisible();
  });

  // ---- BUG-01 regression (fixed in the v3 Home) -----------------------------------------
  test('BUG-01 fixed: card opens the event that was clicked', async ({ page }) => {
    await homeCard(page, EV.todayFreeClassic.title).getByRole('link').click();
    await expect(page).toHaveURL(new RegExp(`#/event/${EV.todayFreeClassic.index}$`));
    await expect(detailHeading(page, EV.todayFreeClassic.title)).toBeVisible();
  });

  test('BUG-01 fixed: heart saves the clicked event with the EventList ID', async ({ page }) => {
    const heart = homeHeart(homeCard(page, EV.todayFreeClassic.title));
    await expect(heart).toHaveAttribute('aria-pressed', 'false');
    await heart.click();
    await expect(heart).toHaveAttribute('aria-pressed', 'true');
    const stored = await readStorage<StoredFavorite[]>(page, STORAGE.favorites);
    expect(stored).toHaveLength(1);
    expect(stored![0]).toMatchObject({
      id: String(EV.todayFreeClassic.index),
      type: 'event',
      title: EV.todayFreeClassic.title,
      category: '클래식',
    });

    // The same event shows as saved on EventList, and no other event does.
    await page.goto('/#/events');
    await expectSaved(heartIn(eventListCard(page, EV.todayFreeClassic.title)), true);
    await expectSaved(heartIn(eventListCard(page, EV.futureExhibition.title)), false);
  });

  test('heart toggles off again', async ({ page }) => {
    const heart = homeHeart(homeCard(page, EV.todayFreeClassic.title));
    await heart.click();
    await heart.click();
    await expect(heart).toHaveAttribute('aria-pressed', 'false');
    expect(await readStorage<StoredFavorite[]>(page, STORAGE.favorites)).toEqual([]);
  });

  // ---- Mapping: space → category strip + map promo ------------------------------------
  test('category strip and map promo use space data', async ({ page }) => {
    const strip = page.getByRole('navigation', { name: '카테고리' });
    await expect(strip.getByRole('link', { name: /문화공간/ }).first()).toContainText(SPACES[0].SUBJCODE);
    // Count lines were removed from the strip (they duplicated the hero stats).
    await expect(strip).not.toContainText('건 진행 중');
    await expect(strip).not.toContainText('야경명소 1');

    const types = page.getByRole('list', { name: '공간 종류별 개수' });
    await expect(types.getByRole('listitem')).toHaveCount(1);
    await expect(types).toContainText(`${SPACES[0].SUBJCODE}1`);
    await expect(page.getByText('문화공간 1곳')).toBeVisible();
  });

  // ---- Mapping: night → After Dark ------------------------------------------------------
  test('After Dark shows night spots from the API', async ({ page }) => {
    const night = page.getByRole('region', { name: /가장 빛나는/ });
    const card = night.getByRole('article').filter({ has: page.getByRole('heading', { name: SPOTS[0].TITLE }) });
    await expect(card).toBeVisible();
    await expect(card).toContainText('FEATURED');
    await expect(card).toContainText('중구'); // district parsed from ADDR
    await expect(card).toContainText(SPOTS[0].OPERATING_TIME);
    await night.getByRole('link', { name: /지도에서 야경 보기/ }).click();
    await expect(page).toHaveURL(/#\/map$/);
  });

  test('curators render from the constants file', async ({ page }) => {
    const curators = page.getByRole('region', { name: /그들이 고른/ });
    await expect(curators.getByRole('article')).toHaveCount(3);
    await expect(curators.getByRole('heading', { name: '이도연' })).toBeVisible();
  });

  test('header nav links route correctly', async ({ page }) => {
    const nav = page.locator('header nav');
    await nav.getByRole('link', { name: '문화행사' }).click();
    await expect(page).toHaveURL(/#\/events$/);
    await nav.getByRole('link', { name: '마이페이지' }).click();
    await expect(page).toHaveURL(/#\/mypage$/);
    await nav.getByRole('link', { name: '홈' }).click();
    await expect(page).toHaveURL(/#\/$/);
  });
});

test.describe('Home (v3) states', () => {
  test('loading state while event data is pending', async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    await page.route('**/api/seoulapi**', async (route) => {
      await gate;
      await route.fallback();
    });
    await page.goto('/#/');
    await expect(page.getByText('행사를 불러오는 중...')).toBeVisible();
    release();
    await expect(homeCard(page, EV.todayFreeClassic.title)).toBeVisible();
  });

  test('network failure shows an error message in the events section', async ({ page }) => {
    await page.route('**/api/seoulapi**', (route) => route.abort('failed'));
    await page.goto('/#/');
    await expect(page.getByText('행사 정보를 불러올 수 없습니다.')).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Home (v3) — mobile 390px', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('no horizontal overflow and the grid still renders', async ({ page }) => {
    await page.goto('/#/');
    await expect(homeCard(page, EV.todayFreeClassic.title)).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
