/**
 * v3 Live Bar ticker — real data only. Fixed clock 2026-11-03 12:00 KST (fixtures: 16 events, 1 night spot
 * with "18:00~24:00", so no sunset-lit spot).
 */
import { test, expect } from './support/test';
import { formatHm, seoulSunsetMinutes } from '../utils/sun';

const bar = (page: import('@playwright/test').Page) => page.getByRole('region', { name: '실시간 정보' });
const item = (page: import('@playwright/test').Page, id: string) => bar(page).locator(`[data-ticker="${id}"]`);

test.describe('Live Bar ticker', () => {
  test('shows only data-backed items, with real values', async ({ page }) => {
    await page.goto('/#/');
    await expect(item(page, 'sunset')).toHaveText(`오늘 서울 일몰 ${formatHm(seoulSunsetMinutes(2026, 11, 3))}`);
    await expect(item(page, 'ongoing')).toHaveText('지금 진행 중인 행사 2건');
    await expect(item(page, 'starts-today')).toHaveText('오늘 시작하는 행사 0건');
    await expect(item(page, 'ends-week')).toHaveText('이번 주 마감 3건'); // ends 11-04, 11-05, 11-08
    await expect(item(page, 'night')).toHaveText('야경명소 곧 켜져요'); // before sunset; fixture spot isn't sunset-lit
    await expect(item(page, 'night-open')).toHaveText('지금 갈 수 있는 야경명소 0곳'); // 18:00~24:00, closed at noon
    await expect(item(page, 'free')).toHaveText('무료 행사 1건');
    await expect(bar(page)).not.toContainText(/잔여|미세먼지|°C|ISSUE/);
    await expect(bar(page)).toContainText('LIVE · 서울 · 11.03');
    await expect(bar(page)).toContainText('12:00 KST');
  });

  test('emphasised items are ember', async ({ page }) => {
    await page.goto('/#/');
    await expect(item(page, 'ongoing')).toHaveCSS('color', 'rgb(232, 183, 129)');
    await expect(item(page, 'sunset')).not.toHaveCSS('color', 'rgb(232, 183, 129)');
  });

  test('items whose data failed are left out', async ({ page }) => {
    await page.route('**/api/seoulapi?type=event', (r) => r.abort('failed'));
    await page.goto('/#/events');
    await expect(item(page, 'night')).toBeVisible({ timeout: 15_000 });
    await expect(item(page, 'sunset')).toBeVisible();
    await expect(page.getByText('문화행사를 불러올 수 없습니다.')).toBeVisible({ timeout: 15_000 });
    for (const id of ['ongoing', 'starts-today', 'ends-week', 'free']) await expect(item(page, id)).toHaveCount(0);
  });

  test('an empty event list counts as unavailable (no "0건" everywhere)', async ({ page }) => {
    await page.route('**/api/seoulapi?type=event', (r) => r.fulfill({ json: { culturalEventInfo: { list_total_count: 0, row: [] } } }));
    await page.goto('/#/');
    await expect(item(page, 'night')).toBeVisible();
    for (const id of ['ongoing', 'starts-today', 'ends-week', 'free']) await expect(item(page, id)).toHaveCount(0);
  });

  test('map page: fixed above the fixed header; the map shrinks so nothing is cut off', async ({ page }) => {
    await page.goto('/#/map');
    await expect(page.getByRole('heading', { level: 1, name: /지금 갈 곳/ })).toBeVisible();
    await expect(bar(page)).toHaveCSS('position', 'fixed');
    const barBox = (await bar(page).boundingBox())!;
    const header = (await page.locator('header').boundingBox())!;
    expect(barBox.y).toBe(0);
    expect(Math.round(header.y)).toBe(Math.round(barBox.height)); // header starts under the bar
    const stage = (await page.locator('.v3-map__stage').boundingBox())!;
    expect(Math.abs(stage.y - (header.y + header.height))).toBeLessThanOrEqual(1); // map starts under the header (1px border overlap)
    expect(Math.round(stage.y + stage.height)).toBeLessThanOrEqual(900); // bottom not cut (viewport 900)
  });

  test('map page on mobile: the bottom sheet stays at the bottom of the screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#/map');
    await expect(bar(page)).toBeVisible();
    const side = (await page.locator('.v3-map__side').boundingBox())!;
    expect(844 - (side.y + side.height)).toBeLessThanOrEqual(1); // map frame has a 1px bottom border
    const toggle = page.getByRole('button', { name: /^목록 ·/ });
    await toggle.click();
    const opened = (await page.locator('.v3-map__side').boundingBox())!;
    expect(844 - (opened.y + opened.height)).toBeLessThanOrEqual(1);
    expect(opened.y).toBeGreaterThanOrEqual((await page.locator('header').boundingBox())!.y); // never under the header
  });

  test('pauses on hover and with the pause button', async ({ page }) => {
    await page.goto('/#/');
    const track = bar(page).locator('.v3-live__track');
    await expect(track).toHaveCSS('animation-play-state', 'running');
    await bar(page).locator('.v3-live__stream').hover();
    await expect(track).toHaveCSS('animation-play-state', 'paused');
    await page.mouse.move(1, 600);
    await expect(track).toHaveCSS('animation-play-state', 'running');
    await bar(page).getByRole('button', { name: '실시간 정보 멈추기' }).click();
    await expect(track).toHaveCSS('animation-play-state', 'paused');
  });

  test('reduced motion: no scrolling, one static copy', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#/');
    await expect(item(page, 'ongoing')).toBeVisible();
    await expect(bar(page).locator('.v3-live__track')).toHaveCSS('animation-name', 'none');
    await expect(bar(page).locator('.v3-live__list[aria-hidden="true"]')).toBeHidden();
  });
});
