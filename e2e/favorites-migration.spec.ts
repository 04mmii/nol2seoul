/**
 * BUG-08: one-time migration of saved event favorites from array-index IDs to stable IDs
 * (hooks/useFavoritesMigration.ts, utils/favoritesMigration.ts).
 *
 * Old favorites are seeded before the app boots, exactly as an older version stored them.
 */
import { test, expect, eventListHeading, eventListCard, heartIn, expectSaved, readStorage, seedStorageOnce, STORAGE, type StoredFavorite } from './support/test';
import { EV, FIXTURE_IMAGE_HOST } from './fixtures/seoul-api';

const OLD: StoredFavorite[] = [
  // 1. Wrong old index (BUG-01 era) but the poster URL matches todayFreeClassic → matched by image.
  { id: '0', type: 'event', title: EV.todayFreeClassic.title, location: '[픽스처] 강남 콘서트홀', image: `https://${FIXTURE_IMAGE_HOST}/event-1.png`, category: '클래식', date: '2026-11-01~2026-11-05', savedAt: 1700000000005 },
  // 2. No image; detail-page date format "YYYY-MM-DD ~ …" → matched by title + start date (hash-ID event).
  { id: '3', type: 'event', title: EV.thisWeekPlay.title, location: '[픽스처] 강남 소극장', category: '연극', date: '2026-11-06 ~ 2026-11-08', savedAt: 1700000000004 },
  // 3. Same event as #1 saved twice under another old index → dropped as a duplicate.
  { id: '7', type: 'event', title: EV.todayFreeClassic.title, location: '[픽스처] 강남 콘서트홀', category: '클래식', date: '2026-11-01~2026-11-05', savedAt: 1700000000003 },
  // 4. Not in the current data, end date already past → orphan shown as "종료된 행사".
  { id: '12', type: 'event', title: '[레거시] 사라진 행사', location: '레거시 장소', category: '전시/미술', date: '2025-01-01~2025-01-31', savedAt: 1700000000002 },
  // 6. Not in the current data, not ended yet (detail-page date format) → "정보를 불러올 수 없는 행사".
  { id: '13', type: 'event', title: '[레거시] 아직 안 끝난 행사', location: '레거시 장소 2', category: '연극', date: '2026-11-01 ~ 2026-12-31', savedAt: 1700000000001.5 },
  // 7. Not in the current data, no end date → "정보를 불러올 수 없는 행사".
  { id: '14', type: 'event', title: '[레거시] 날짜 없는 행사', location: '레거시 장소 3', savedAt: 1700000000001.2 },
  // 5. Space favorite: out of scope, untouched.
  { id: '0', type: 'space', title: '[레거시] 저장된 공간', location: '레거시 주소', category: '미술관', savedAt: 1700000000001 },
];

test.describe('Favorites migration (BUG-08)', () => {
  test('re-matches old favorites, keeps a backup and orphans, drops duplicates', async ({ page }) => {
    await seedStorageOnce(page, { [STORAGE.favorites]: OLD });
    await page.goto('/#/mypage');

    await expect.poll(() => page.evaluate((k) => localStorage.getItem(k), STORAGE.favoritesVersion)).toBe('2');
    const stored = await readStorage<StoredFavorite[]>(page, STORAGE.favorites);
    expect(stored?.map((f) => [f.type, f.id, f.title, !!f.orphan])).toEqual([
      ['event', EV.todayFreeClassic.id, EV.todayFreeClassic.title, false],
      ['event', EV.thisWeekPlay.id, EV.thisWeekPlay.title, false],
      ['event', 'legacy-12', '[레거시] 사라진 행사', true],
      ['event', 'legacy-13', '[레거시] 아직 안 끝난 행사', true],
      ['event', 'legacy-14', '[레거시] 날짜 없는 행사', true],
      ['space', '0', '[레거시] 저장된 공간', false],
    ]);
    // Untouched copy of the original data.
    expect(await readStorage<StoredFavorite[]>(page, STORAGE.favoritesBackup)).toEqual(OLD);
  });

  test('MyPage: migrated favorites link to the right event; orphans show a note, no link, and can be removed', async ({ page }) => {
    await seedStorageOnce(page, { [STORAGE.favorites]: OLD });
    await page.goto('/#/mypage');
    await expect.poll(() => page.evaluate((k) => localStorage.getItem(k), STORAGE.favoritesVersion)).toBe('2');

    await expect(page.locator(`a[href="#/event/${EV.todayFreeClassic.id}"]`)).toHaveCount(1);
    await expect(page.locator(`a[href="#/event/${EV.thisWeekPlay.id}"]`)).toHaveCount(1);

    const orphanTitle = page.getByRole('heading', { level: 3, name: '[레거시] 사라진 행사' });
    await expect(orphanTitle).toBeVisible();
    const orphanCard = orphanTitle.locator('xpath=ancestor::article[1]');
    await expect(orphanCard.getByText('종료된 행사', { exact: true })).toBeVisible(); // ended 2025-01-31 < today (KST)
    await expect(orphanCard.getByText('2025-01-01~2025-01-31')).toBeVisible();
    await expect(orphanCard.getByText('레거시 장소')).toBeVisible();
    await expect(orphanCard.locator('a')).toHaveCount(0); // link disabled

    await orphanCard.getByRole('button', { name: '[레거시] 사라진 행사 찜 삭제' }).click();
    await expect(orphanTitle).toHaveCount(0);
    const stored = await readStorage<StoredFavorite[]>(page, STORAGE.favorites);
    expect(stored?.some((f) => f.id === 'legacy-12')).toBe(false);
  });

  test('orphan note: "종료된 행사" only when the stored end date is before today (KST)', async ({ page }) => {
    await seedStorageOnce(page, { [STORAGE.favorites]: OLD });
    await page.goto('/#/mypage');
    await expect.poll(() => page.evaluate((k) => localStorage.getItem(k), STORAGE.favoritesVersion)).toBe('2');
    const note = (title: string) =>
      page.getByRole('heading', { level: 3, name: title }).locator('xpath=ancestor::article[1]').getByRole('note');
    await expect(note('[레거시] 사라진 행사')).toHaveText('종료된 행사');
    await expect(note('[레거시] 아직 안 끝난 행사')).toHaveText('정보를 불러올 수 없는 행사');
    await expect(note('[레거시] 날짜 없는 행사')).toHaveText('정보를 불러올 수 없는 행사');
    // Matched favorites have no note.
    await expect(note(EV.todayFreeClassic.title)).toHaveCount(0);
  });

  test('runs only once: a reload does not change migrated data', async ({ page }) => {
    await seedStorageOnce(page, { [STORAGE.favorites]: OLD });
    await page.goto('/#/mypage');
    await expect.poll(() => page.evaluate((k) => localStorage.getItem(k), STORAGE.favoritesVersion)).toBe('2');
    const first = await readStorage<StoredFavorite[]>(page, STORAGE.favorites);
    await page.goto('/#/events');
    await expect(eventListHeading(page)).toBeVisible();
    await page.reload();
    await expect(eventListHeading(page)).toBeVisible();
    expect(await readStorage<StoredFavorite[]>(page, STORAGE.favorites)).toEqual(first);
  });

  test('migrated favorites show as saved on EventList', async ({ page }) => {
    await seedStorageOnce(page, { [STORAGE.favorites]: OLD });
    await page.goto('/#/events');
    await expect.poll(() => page.evaluate((k) => localStorage.getItem(k), STORAGE.favoritesVersion)).toBe('2');
    await expectSaved(heartIn(eventListCard(page, EV.todayFreeClassic.title)), true);
    await expectSaved(heartIn(eventListCard(page, EV.futureExhibition.title)), false);
  });

  test('does not migrate while event data is unavailable (API error)', async ({ page }) => {
    await page.route('**/api/seoulapi?type=event', (route) => route.fulfill({ status: 500, json: { error: 'down' } }));
    await seedStorageOnce(page, { [STORAGE.favorites]: OLD });
    await page.goto('/#/mypage');
    await expect(page.getByRole('heading', { level: 3, name: '[레거시] 사라진 행사' })).toBeVisible();
    await page.waitForTimeout(1500);
    expect(await page.evaluate((k) => localStorage.getItem(k), STORAGE.favoritesVersion)).toBeNull();
    expect(await readStorage<StoredFavorite[]>(page, STORAGE.favorites)).toEqual(OLD);
  });

  test('old index links show an "outdated link" message', async ({ page }) => {
    await page.goto('/#/event/12');
    await expect(page.getByText('오래된 링크라 행사를 찾을 수 없습니다.')).toBeVisible();
    await expect(page.getByRole('link', { name: '목록으로 돌아가기' })).toBeVisible();
  });
});
