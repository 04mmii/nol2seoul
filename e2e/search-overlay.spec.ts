import { test, expect, openSearch, readStorage, writeStorage, detailHeading, STORAGE } from './support/test';
import { EV, SPACES, SPOTS } from './fixtures/seoul-api';

const overlay = (page: import('@playwright/test').Page) => page.locator('div.fixed.inset-0').filter({
  has: page.getByPlaceholder('행사, 장소, 키워드를 검색해보세요'),
});
const resultSection = (page: import('@playwright/test').Page, heading: string) =>
  overlay(page).locator('section').filter({ has: page.getByRole('heading', { name: new RegExp(heading) }) });

test.describe('SearchOverlay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
  });

  test('opens from the header and closes with 취소', async ({ page }) => {
    await openSearch(page);
    await expect(overlay(page).getByRole('heading', { name: /추천 행사/ })).toBeVisible();
    await expect(overlay(page).getByRole('heading', { name: '인기 장르' })).toBeVisible();
    await page.getByRole('button', { name: '취소' }).click();
    await expect(page.getByPlaceholder('행사, 장소, 키워드를 검색해보세요')).toHaveCount(0);
  });

  test('groups matching events, spaces and spots', async ({ page }) => {
    const input = await openSearch(page);
    await input.fill('종로구'); // event GUNAME + space ADDR
    await expect(resultSection(page, '문화행사').getByText(EV.futureExhibition.title)).toBeVisible();
    await expect(resultSection(page, '문화공간').getByText(SPACES[0].FAC_NAME)).toBeVisible();

    await input.fill('야경');
    await expect(resultSection(page, '야경명소').getByText(SPOTS[0].TITLE)).toBeVisible();
  });

  test('event result opens the detail page and closes the overlay', async ({ page }) => {
    const input = await openSearch(page);
    await input.fill('클래식');
    await resultSection(page, '문화행사').getByRole('link').filter({ hasText: EV.todayFreeClassic.title }).click();
    await expect(page).toHaveURL(new RegExp(`#/event/${EV.todayFreeClassic.id}$`));
    await expect(detailHeading(page, EV.todayFreeClassic.title)).toBeVisible();
    await expect(page.getByPlaceholder('행사, 장소, 키워드를 검색해보세요')).toHaveCount(0);
  });

  test('no-result message', async ({ page }) => {
    const input = await openSearch(page);
    await input.fill('존재하지않는검색어');
    await expect(page.getByText("'존재하지않는검색어'에 대한 검색 결과가 없습니다")).toBeVisible();
  });

  test('Enter saves a recent search to localStorage and shows it on reopen', async ({ page }) => {
    const input = await openSearch(page);
    await input.fill('  클래식  ');
    await input.press('Enter');
    expect(await readStorage<string[]>(page, STORAGE.recent)).toEqual(['클래식']);

    await page.getByRole('button', { name: '취소' }).click();
    await openSearch(page);
    const recent = resultSection(page, '최근 검색어');
    await expect(recent.getByText('클래식', { exact: true })).toBeVisible();

    // Clicking a recent tag runs that search.
    await recent.getByText('클래식', { exact: true }).click();
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
    // Remove "a" via its close icon (a <span>, not a button — A11Y-03).
    await recent.locator('div', { hasText: /^aclose$/ }).getByText('close', { exact: true }).click();
    expect(await readStorage<string[]>(page, STORAGE.recent)).toEqual(['new', 'c', 'b', 'd', 'e', 'f', 'g']);

    await recent.getByRole('button', { name: '전체 삭제' }).click();
    expect(await readStorage<string[]>(page, STORAGE.recent)).toBeNull();
    await expect(overlay(page).getByRole('heading', { name: '최근 검색어' })).toHaveCount(0);
  });
});
