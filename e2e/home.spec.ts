import {
  eventListHeading,
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
import { EV, EVENTS, FIXED_NOW, SPACES, SPOTS } from './fixtures/seoul-api';
import { pickHeroEvents } from '../components/home/selectors';
import type { Event } from '../types';

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
    // Curators (fictional people/quotes) were removed on 2026-11-11.
    await expect(page.getByRole('heading', { name: /그들이 고른/ })).toHaveCount(0);
  });

  // ---- Mapping: event → hero + grid -------------------------------------------------------
  test('hero: features an ongoing event with an image and links to its detail', async ({ page }) => {
    const hero = page.getByRole('region', { name: '이번 주 문화행사' });
    const caption = hero.getByRole('link', { name: new RegExp(EV.todayFreeClassic.title.replace(/[[\]]/g, '\\$&')) });
    await expect(caption).toBeVisible();
    await expect(caption).toContainText('FEATURED · 클래식');
    await caption.click();
    await expect(page).toHaveURL(new RegExp(`#/event/${EV.todayFreeClassic.id}$`));
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
    // innerText: only the visible separator counts (" — " on wide screens, "–" ≤560px).
    await expect(card.locator('.v3-event-card__date')).toHaveText('11.01 — 11.05', { useInnerText: true });
    await expect(card.getByText('무료', { exact: true })).toBeVisible();
  });

  test('narrow screens shorten the card date separator to "–"', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const card = homeCard(page, EV.todayFreeClassic.title);
    await expect(card.locator('.v3-event-card__date')).toHaveText('11.01–11.05', { useInnerText: true });
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

    // Free = not ended + fee kind "free" (BUG-03 option D). The IS_FREE=유료 + "무료(사전예약)" event is
    // "확인 필요", not free, so it stays out.
    await region.getByRole('button', { name: '무료', exact: true }).click();
    await expect(region.getByText('1건 표시 · 1건 중')).toBeVisible();
    await expect(homeCard(page, EV.todayFreeClassic.title)).toBeVisible();
    await expect(homeCard(page, EV.todayFestivalFeeText.title)).toHaveCount(0);

    await region.getByRole('button', { name: '오늘', exact: true }).click();
    await expect(homeCard(page, EV.thisWeekPlay.title)).toHaveCount(0);
  });

  test('card fee slot follows BUG-03 option D (badge, or raw text for 확인 필요)', async ({ page }) => {
    await expect(homeCard(page, EV.todayFreeClassic.title).locator('[title]')).toHaveText('무료');
    // IS_FREE=유료 but USE_FEE only says 무료 → "확인 필요": no badge, the fee text as is.
    await expect(homeCard(page, EV.todayFestivalFeeText.title).locator('[title]')).toHaveText('무료(사전예약)');
  });

  test('"전체 문화행사 보기" navigates to the event list', async ({ page }) => {
    await page.getByRole('link', { name: /전체 문화행사 보기/ }).click();
    await expect(page).toHaveURL(/#\/events$/);
    await expect(eventListHeading(page)).toBeVisible();
  });

  // ---- BUG-01 regression (fixed in the v3 Home) -----------------------------------------
  test('BUG-01 fixed: card opens the event that was clicked', async ({ page }) => {
    await homeCard(page, EV.todayFreeClassic.title).getByRole('link').click();
    await expect(page).toHaveURL(new RegExp(`#/event/${EV.todayFreeClassic.id}$`));
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
      id: EV.todayFreeClassic.id,
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
    // Same card as the night page (2026-11-11): state badge, mini map (no photo for this fixture), time, actions.
    await expect(card.locator('.v3-night__badge')).toBeVisible();
    await expect(card.locator('figcaption')).toHaveText('실제 위치 그래픽');
    await expect(card).toContainText('중구'); // district parsed from ADDR
    await expect(card).toContainText(SPOTS[0].OPERATING_TIME);
    await expect(card.getByRole('link', { name: '지도에서 보기 →' })).toHaveAttribute('href', /spot=n1$/);
    await expect(card).not.toContainText('FEATURED');
    await night.getByRole('link', { name: /야경명소 전체 보기/ }).click();
    await expect(page).toHaveURL(/#\/night$/);
  });

  test('editor picks: ids not in the data are skipped (fixtures have none of the examples → no section)', async ({ page }) => {
    await expect(page.getByRole('region', { name: '에디터가 고른 장소' })).toHaveCount(0);
    for (const name of ['이도연', 'Han Soo Min']) await expect(page.getByText(name)).toHaveCount(0);
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

// ---- Editor picks + map promo cards with matching data (data/editor-picks.json, data/map-promo-spaces.json) ----
test.describe('Home — editor picks and map promo cards', () => {
  const space = (num: string, name: string, img = `https://fixtures.nolseoul.test/space-${num}.png`) =>
    ({ ...SPACES[0], NUM: num, FAC_NAME: name, MAIN_IMG: img, X_COORD: 37.57 + Number(num) / 10000, Y_COORD: 126.98 });
  const spot32 = { ...SPOTS[0], NUM: '32', TITLE: '[픽스처] 성곽길 야경', OPERATING_TIME: '상시개방' };

  test.beforeEach(async ({ page }) => {
    const wrap = (key: string, row: unknown[]) => ({ [key]: { list_total_count: row.length, RESULT: { CODE: 'INFO-000' }, row } });
    await page.route('**/api/seoulapi?type=space', (r) => r.fulfill({ json: wrap('culturalSpaceInfo', [space('14', '[픽스처] 생활사박물관'), space('72', '[픽스처] 갤러리'), space('41', '[픽스처] 현대미술관'), space('74', '[픽스처] 고궁박물관', '')]) }));
    await page.route('**/api/seoulapi?type=night', (r) => r.fulfill({ json: wrap('viewNightSpot', [SPOTS[0], spot32]) }));
    await page.goto('/#/');
  });

  test('editor picks: spaces with photo, night spot with mini map + state; empty comment shows nothing', async ({ page }) => {
    const picks = page.getByRole('region', { name: '에디터가 고른 장소' });
    await expect(picks.getByRole('link')).toHaveCount(3);
    await expect(picks.getByRole('link', { name: /생활사박물관/ })).toHaveAttribute('href', '#/space/s14');
    await expect(picks.getByRole('link', { name: /성곽길 야경/ })).toHaveAttribute('href', '#/night?spot=n32');
    await expect(picks.locator('.v3-pick__state')).toHaveText('운영 중'); // 상시개방
    await expect(picks.locator('.v3-pick__comment')).toHaveCount(0);
  });

  test('map promo: dot map + numbered cards; a listed space without a photo is skipped', async ({ page }) => {
    const cards = page.getByRole('list', { name: '대표 문화공간' });
    await expect(cards.getByRole('link')).toHaveCount(1); // s41 only: s74 has no MAIN_IMG, s26 missing
    await expect(cards.getByRole('link', { name: /현대미술관/ })).toHaveAttribute('href', '#/space/s41');
    await expect(page.locator('.v3-map-promo__dot')).toHaveCount(4);
    await expect(page.locator('.v3-map-promo__marker')).toHaveCount(1);
  });
});

// ---- Hero banners: data/featured-events.json is empty (decision 2026-11-11) → automatic rule only.
// The hand-pick logic itself is tested on pickHeroEvents directly (the JSON is bundled at build time).
test.describe('Home — hero banners', () => {
  const picked = (code: string, title: string, start: string, end: string) => ({
    ...EVENTS[1], TITLE: title, HMPG_ADDR: `https://culture.example.test/view.do?cultcode=${code}`, STRTDATE: `${start} 00:00:00.0`, END_DATE: `${end} 00:00:00.0`, DATE: `${start}~${end}`,
  }) as unknown as Event;
  const rows = [
    ...(EVENTS as unknown as Event[]),
    picked('159961', '[픽] 스케이트장', '2026-12-18', '2027-02-09'),
    picked('159958', '[픽] 끝난 축제', '2026-10-01', '2026-11-01'), // ended before FIXED_NOW (11-03)
    picked('159960', '[픽] 광화문마켓', '2026-12-11', '2027-01-10'),
  ];

  test('pickHeroEvents: picks first in given order (upcoming allowed), ended pick skipped, gap auto-filled', () => {
    const out = pickHeroEvents(rows, FIXED_NOW, ['159960', '159958', '159961']).map((e) => e.TITLE);
    expect(out).toEqual(['[픽] 광화문마켓', '[픽] 스케이트장', EV.todayFreeClassic.title]);
  });

  test('empty featured file: banners come from the automatic rule; upcoming events and the D-n chip are not shown', async ({ page }) => {
    await page.route('**/api/seoulapi?type=event', (r) => r.fulfill({ json: { culturalEventInfo: { list_total_count: rows.length, RESULT: { CODE: 'INFO-000' }, row: rows } } }));
    await page.goto('/#/');
    const hero = page.getByRole('region', { name: '이번 주 문화행사' });
    const caption = hero.locator('.v3-hero__cap');
    // Automatic rule (ongoing + poster + ≥2 days left) → todayFreeClassic (ends 11-05) first.
    await expect(caption).toContainText(EV.todayFreeClassic.title);
    for (let i = 0; i < 2; i++) {
      await expect(caption.locator('.v3-hero__cover-dday')).toHaveCount(0);
      await hero.getByRole('button', { name: '다음 배너' }).click();
    }
    await expect(hero).not.toContainText('[픽]');
  });
});
