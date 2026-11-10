import { test, expect, openSearch, readStorage, writeStorage, detailHeading, STORAGE } from './support/test';
import { EV, SPACES, SPOTS } from './fixtures/seoul-api';

const overlay = (page: import('@playwright/test').Page) => page.getByRole('dialog', { name: '검색' });
const resultSection = (page: import('@playwright/test').Page, heading: string) =>
  overlay(page).locator('section').filter({ has: page.getByRole('heading', { name: new RegExp(heading) }) });

test.describe('SearchOverlay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
  });

  test('opens from the header and closes with 취소 or Esc', async ({ page }) => {
    await openSearch(page);
    // v3: shortcut chips are names only, except the night chip (lit count / "곧 켜져요" before sunset).
    const quick = resultSection(page, '바로 가기');
    await expect(quick.getByRole('link', { name: '이번 주 무료 행사', exact: true })).toBeVisible();
    await expect(quick.getByRole('link', { name: /^지금 켜진 야경( \d+| · 곧 켜져요)$/ })).toBeVisible();
    await expect(overlay(page).getByRole('heading', { name: '인기 장르' })).toHaveCount(0);
    await page.getByRole('button', { name: '취소' }).click();
    await expect(page.getByPlaceholder('행사, 장소, 키워드를 검색해보세요')).toHaveCount(0);

    await openSearch(page);
    await page.keyboard.press('Escape');
    await expect(page.getByPlaceholder('행사, 장소, 키워드를 검색해보세요')).toHaveCount(0);
  });

  test('groups matching events, spaces and spots', async ({ page }) => {
    const input = await openSearch(page);
    await input.fill('종로구'); // event GUNAME + space ADDR
    await expect(resultSection(page, '문화행사').getByText(EV.futureExhibition.title)).toBeVisible();
    await expect(resultSection(page, '문화공간').getByText(SPACES[0].FAC_NAME)).toBeVisible();

    await input.fill('야경');
    await expect(resultSection(page, '야경명소').getByRole('link').filter({ hasText: SPOTS[0].TITLE })).toBeVisible();
  });

  test('matched text is highlighted in the result name', async ({ page }) => {
    const input = await openSearch(page);
    await input.fill('클래식');
    const row = resultSection(page, '문화행사').getByRole('link').filter({ hasText: EV.todayFreeClassic.title });
    await expect(row.locator('mark')).toHaveText('클래식');
  });

  test('space result opens /space/<index> (BUG-06 fixed)', async ({ page }) => {
    const input = await openSearch(page);
    await input.fill(SPACES[0].FAC_NAME);
    await resultSection(page, '문화공간').getByRole('link').filter({ hasText: SPACES[0].FAC_NAME }).click();
    await expect(page).toHaveURL(/#\/space\/0$/);
    await expect(page.getByPlaceholder('행사, 장소, 키워드를 검색해보세요')).toHaveCount(0);
  });

  test('night-spot result opens /night?spot=<index> (BUG-06 fixed)', async ({ page }) => {
    const input = await openSearch(page);
    await input.fill(SPOTS[0].TITLE);
    await resultSection(page, '야경명소').getByRole('link').filter({ hasText: SPOTS[0].TITLE }).click();
    await expect(page).toHaveURL(/#\/night\?spot=0$/);
  });

  test('event result opens the detail page and closes the overlay', async ({ page }) => {
    const input = await openSearch(page);
    await input.fill('클래식');
    await resultSection(page, '문화행사').getByRole('link').filter({ hasText: EV.todayFreeClassic.title }).click();
    await expect(page).toHaveURL(new RegExp(`#/event/${EV.todayFreeClassic.id}$`));
    await expect(detailHeading(page, EV.todayFreeClassic.title)).toBeVisible();
    await expect(page.getByPlaceholder('행사, 장소, 키워드를 검색해보세요')).toHaveCount(0);
  });

  test('no-result screen with shortcut chips', async ({ page }) => {
    const input = await openSearch(page);
    await input.fill('존재하지않는검색어');
    const empty = overlay(page).getByRole('status');
    await expect(empty).toContainText('‘존재하지않는검색어’와 맞는 곳이');
    await expect(empty).toContainText('없어요.');
    await expect(empty.getByRole('link', { name: '박물관·미술관', exact: true })).toBeVisible();
    await expect(empty.getByRole('link', { name: '이번 주 전시', exact: true })).toBeVisible();
    await expect(empty.getByRole('link', { name: '이번 주 무료 행사', exact: true })).toBeVisible();
  });

  test('Enter saves a recent search to localStorage and shows it on reopen', async ({ page }) => {
    const input = await openSearch(page);
    await input.fill('  클래식  ');
    await input.press('Enter');
    expect(await readStorage<string[]>(page, STORAGE.recent)).toEqual(['클래식']);

    await page.getByRole('button', { name: '취소' }).click();
    await openSearch(page);
    const recent = resultSection(page, '최근 검색어');
    await expect(recent.getByRole('button', { name: '클래식', exact: true })).toBeVisible();

    // Clicking a recent tag runs that search.
    await recent.getByRole('button', { name: '클래식', exact: true }).click();
    await expect(page.getByPlaceholder('행사, 장소, 키워드를 검색해보세요')).toHaveValue('클래식');
    await expect(resultSection(page, '문화행사').getByText(EV.todayFreeClassic.title)).toBeVisible();
  });

  test('recent searches: de-duplicate, max 8, remove one, clear all', async ({ page }) => {
    await writeStorage(page, STORAGE.recent, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    await page.reload();
    const input = await openSearch(page);
    await input.fill('c');
    await input.press('Enter');
    expect(await readStorage<string[]>(page, STORAGE.recent)).toEqual(['c', 'a', 'b', 'd', 'e', 'f', 'g', 'h']);
    await input.fill('new');
    await input.press('Enter');
    expect(await readStorage<string[]>(page, STORAGE.recent)).toEqual(['new', 'c', 'a', 'b', 'd', 'e', 'f', 'g']);

    await input.fill('');
    const recent = resultSection(page, '최근 검색어');
    // Remove "a" via its own button (v3: a real, labelled button — was an unlabelled <span>, A11Y-03).
    await recent.getByRole('button', { name: '최근 검색어 a 삭제' }).click();
    expect(await readStorage<string[]>(page, STORAGE.recent)).toEqual(['new', 'c', 'b', 'd', 'e', 'f', 'g']);

    await recent.getByRole('button', { name: '전체 삭제' }).click();
    expect(await readStorage<string[]>(page, STORAGE.recent)).toBeNull();
    await expect(overlay(page).getByRole('heading', { name: '최근 검색어' })).toHaveCount(0);
  });
});
