/**
 * Map page (v3). Two modes:
 *  - default: the network guard blocks the Kakao SDK → the map area shows its error, the sidebar still works;
 *  - with `useKakaoStub`: a test double of the SDK (e2e/fixtures/kakao-stub.js) renders pins as <img title>.
 * The stub checks our wiring (pins, selection, filters, zoom), not the real Kakao rendering.
 * Fixture places with coordinates: futureExhibition (event), SPACES[0], SPOTS[0].
 */
import { test, expect, useKakaoStub, readStorage, STORAGE, type StoredFavorite } from './support/test';
import { EV, SPACES, SPOTS } from './fixtures/seoul-api';

const pin = (page: import('@playwright/test').Page, title: string) => page.locator(`img[data-kakao-stub="marker"][title="${title}"]`);
const pins = (page: import('@playwright/test').Page) => page.locator('img[data-kakao-stub="marker"]');
const list = (page: import('@playwright/test').Page) => page.getByRole('region', { name: '장소 목록 결과' });
const listItem = (page: import('@playwright/test').Page, title: string) => list(page).getByRole('button', { name: new RegExp(title.replace(/[[\]]/g, '\\$&')) });
const card = (page: import('@playwright/test').Page) => page.getByRole('region', { name: /^선택한 장소:/ });

test.describe('Map (v3) — Kakao SDK unavailable', () => {
  test('map area shows the error; the list and the selected card still work', async ({ page }) => {
    await page.goto('/#/map');
    await expect(page.getByRole('heading', { level: 1, name: /지금 갈 곳/ })).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('지도를 불러올 수 없습니다');
    // 16 events + 1 space + 1 night spot
    await expect(list(page).getByText('18곳')).toBeVisible();
    await listItem(page, SPACES[0].FAC_NAME).click();
    await expect(card(page)).toContainText(SPACES[0].FAC_NAME);
    await expect(card(page).getByRole('link', { name: '상세 보기 →' })).toHaveAttribute('href', '#/space/0');
  });
});

const clusters = (page: import('@playwright/test').Page) => page.locator('[data-kakao-stub="cluster"]');
const level = (page: import('@playwright/test').Page) => page.locator('[data-level]');
const pinWidth = async (page: import('@playwright/test').Page, title: string) => Number(await pin(page, title).getAttribute('width'));

test('deep link from the night page: /map?cat=야경명소&spot=0 opens filtered with the spot selected', async ({ page }) => {
  await page.goto(`/#/map?cat=${encodeURIComponent('야경명소')}&spot=0`);
  await expect(page.getByRole('group', { name: '종류' }).getByRole('button', { name: '야경명소' })).toHaveAttribute('aria-pressed', 'true');
  await expect(card(page)).toContainText(SPOTS[0].TITLE);
});

test.describe('Map (v3) — clustering and pin size by zoom (Kakao SDK stub)', () => {
  test.beforeEach(async ({ page }) => {
    await useKakaoStub(page);
    await page.goto('/#/map');
    await expect(level(page)).toHaveAttribute('data-level', '8');
  });

  test('zoomed out (level 8): nearby pins are grouped into an ink cluster with a Mono count', async ({ page }) => {
    await expect(clusters(page).first()).toBeVisible();
    const c = clusters(page).first();
    await expect(c).toHaveText(/^\d+$/);
    await expect(c).toHaveCSS('background-color', 'rgb(20, 19, 15)'); // ink
    await expect(c).toHaveCSS('color', 'rgb(246, 242, 234)'); // bone
    await expect(c).toHaveCSS('width', '24px'); // < 10 pins → 24px
    expect(await c.evaluate((el) => getComputedStyle(el).fontFamily)).toContain('JetBrains Mono');
  });

  test('zooming in splits clusters (level < 6) and pins grow 6px → 9px', async ({ page }) => {
    const before = await pins(page).evaluateAll((els) => els.map((e) => (e as HTMLImageElement).width));
    for (const w of before) expect(w).toBe(8); // 6px circle + 2px canvas margin
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: '확대' }).click();
    await expect(level(page)).toHaveAttribute('data-level', '5');
    await expect(clusters(page)).toHaveCount(0);
    await expect(pins(page)).toHaveCount(3);
    expect(await pinWidth(page, SPOTS[0].TITLE)).toBe(11); // 9px circle
  });

  test('clicking a cluster zooms in', async ({ page }) => {
    await clusters(page).first().click();
    await expect(level(page)).toHaveAttribute('data-level', '7');
  });

  test('the selected pin is never inside a cluster and is always 13px', async ({ page }) => {
    await listItem(page, SPOTS[0].TITLE).click();
    await expect(pin(page, SPOTS[0].TITLE)).toBeVisible();
    expect(await pinWidth(page, SPOTS[0].TITLE)).toBe(15); // 13px circle
    expect(decodeURIComponent((await pin(page, SPOTS[0].TITLE).getAttribute('src')) ?? '')).toContain('fill="#e2542f"');
  });
});

test.describe('Map (v3) — with the Kakao SDK stub (zoomed in, no clusters)', () => {
  test.beforeEach(async ({ page }) => {
    await useKakaoStub(page);
    await page.goto('/#/map');
    await expect(level(page)).toHaveAttribute('data-level', '8');
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: '확대' }).click();
    await expect(pins(page)).toHaveCount(3);
  });

  test('one pin per place with coordinates, styled by kind (no old orange/green/purple)', async ({ page }) => {
    const src = async (title: string) => decodeURIComponent((await pin(page, title).getAttribute('src')) ?? '');
    expect(await src(EV.futureExhibition.title)).toContain('fill="#14130f"'); // event: ink
    expect(await src(SPACES[0].FAC_NAME)).toMatch(/fill="#f6f2ea" stroke="#14130f"/); // space: bone + ink border
    expect(await src(SPOTS[0].TITLE)).toContain('fill="#111d38"'); // night
    const all = (await pins(page).evaluateAll((els) => els.map((e) => decodeURIComponent((e as HTMLImageElement).src)))).join(' ');
    expect(all).not.toMatch(/#ff6933|#10b981|#8b5cf6/i);
    await expect(page.getByLabel('범례')).toContainText('문화행사');
    await expect(page.getByLabel('범례')).toContainText('선택');
  });

  test('clicking a pin selects it: tangerine pin, name label, list highlight, card; map pans to it', async ({ page }) => {
    await pin(page, SPOTS[0].TITLE).click();
    expect(decodeURIComponent((await pin(page, SPOTS[0].TITLE).getAttribute('src')) ?? '')).toContain('fill="#e2542f"');
    await expect(page.locator('.v3-map-pinlabel')).toContainText(SPOTS[0].TITLE);
    await expect(listItem(page, SPOTS[0].TITLE)).toHaveAttribute('aria-pressed', 'true');
    await expect(card(page)).toContainText(SPOTS[0].TITLE);
    await expect(card(page)).toContainText(SPOTS[0].OPERATING_TIME);
    await expect(card(page)).toContainText('[픽스처] 야경 설명 입니다'); // CONTENTS HTML → plain text
    await expect(card(page)).not.toContainText('<p');
    await expect(card(page).getByRole('link', { name: '상세 보기 →' })).toHaveCount(0); // night spots have no detail page
    await expect(level(page)).toHaveAttribute('data-center', `${Number(SPOTS[0].LA).toFixed(4)},${Number(SPOTS[0].LO).toFixed(4)}`);
    // Selecting another place restores the previous pin style.
    await listItem(page, SPACES[0].FAC_NAME).click();
    expect(decodeURIComponent((await pin(page, SPOTS[0].TITLE).getAttribute('src')) ?? '')).toContain('fill="#111d38"');
  });

  test('card actions: detail link, Kakao directions link, favorite toggle', async ({ page }) => {
    await pin(page, EV.futureExhibition.title).click();
    await expect(card(page).getByRole('link', { name: '상세 보기 →' })).toHaveAttribute('href', `#/event/${EV.futureExhibition.id}`);
    const route = card(page).getByRole('link', { name: '↗ 길찾기' });
    await expect(route).toHaveAttribute('href', /^https:\/\/map\.kakao\.com\/link\/to\//);
    await expect(route).toHaveAttribute('target', '_blank');
    await card(page).getByRole('button', { name: '♡ 찜' }).click();
    await expect(card(page).getByRole('button', { name: '♥ 찜됨' })).toHaveAttribute('aria-pressed', 'true');
    const stored = await readStorage<StoredFavorite[]>(page, STORAGE.favorites);
    expect(stored?.map((f) => [f.id, f.type])).toEqual([[EV.futureExhibition.id, 'event']]);
  });

  test('category + sub-category filters drive both list and pins; 야경명소 turns on night mode', async ({ page }) => {
    await page.getByRole('group', { name: '종류' }).getByRole('button', { name: '야경명소' }).click();
    await expect(pins(page)).toHaveCount(1);
    await expect(list(page).getByText('1곳')).toBeVisible();
    await expect(page.locator('.v3-map__stage')).toHaveClass(/is-night/);
    await page.getByRole('group', { name: '종류' }).getByRole('button', { name: '문화공간' }).click();
    await expect(page.getByRole('group', { name: '분야' }).getByRole('button', { name: SPACES[0].SUBJCODE })).toBeVisible();
    await expect(pins(page)).toHaveCount(1);
  });

  test('search filters the list and the pins by name or address', async ({ page }) => {
    await page.getByPlaceholder('장소·동네 검색').fill('남산');
    await expect(list(page).getByText('1곳')).toBeVisible();
    await expect(pins(page)).toHaveCount(1);
    await expect(pin(page, SPOTS[0].TITLE)).toBeVisible();
    await page.getByPlaceholder('장소·동네 검색').fill('종로구 픽스처로');
    await expect(listItem(page, SPACES[0].FAC_NAME)).toBeVisible();
    await page.getByPlaceholder('장소·동네 검색').fill('없는장소xyz');
    await expect(page.getByText('조건에 맞는 장소가 없습니다.')).toBeVisible();
    await expect(pins(page)).toHaveCount(0);
  });

  test('zoom buttons change the map level', async ({ page }) => {
    await expect(level(page)).toHaveAttribute('data-level', '5');
    await page.getByRole('button', { name: '확대' }).click();
    await expect(level(page)).toHaveAttribute('data-level', '4');
    await page.getByRole('button', { name: '축소' }).click();
    await page.getByRole('button', { name: '축소' }).click();
    await expect(level(page)).toHaveAttribute('data-level', '6');
  });
});

test.describe('Map (v3) — mobile bottom sheet (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('sheet starts collapsed; opening shows search + list; picking a place collapses it and shows the card', async ({ page }) => {
    await useKakaoStub(page);
    await page.goto('/#/map');
    const toggle = page.getByRole('button', { name: /^목록 ·/ });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByPlaceholder('장소·동네 검색')).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByPlaceholder('장소·동네 검색')).toBeVisible();
    await listItem(page, SPOTS[0].TITLE).click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(card(page)).toBeVisible();
    // The map shifts so the selected pin sits above the card (pan by a quarter of the map height).
    await expect(page.locator('[data-level]')).toHaveAttribute('data-panby', /^0,\d+$/);
    // Zooming keeps the selected pin in place (zoom anchored on it), so it doesn't drift off screen.
    const before = await pin(page, SPOTS[0].TITLE).boundingBox();
    await page.getByRole('button', { name: '확대' }).click();
    await expect(page.locator('[data-level]')).toHaveAttribute('data-zoom-anchor', `${Number(SPOTS[0].LA).toFixed(4)},${Number(SPOTS[0].LO).toFixed(4)}`);
    const after = await pin(page, SPOTS[0].TITLE).boundingBox();
    expect(Math.abs(after!.y - before!.y)).toBeLessThan(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
  });
});
