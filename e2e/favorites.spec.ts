import {
  seedStorageOnce,
  test,
  expect,
  eventListCard,
  heartIn,
  expectSaved,
  readStorage,
  detailHeading,
  STORAGE,
  type StoredFavorite,
} from './support/test';
import { EV } from './fixtures/seoul-api';

const myPageTab = (page: import('@playwright/test').Page, label: string) =>
  page.locator('section').nth(1).getByRole('button', { name: new RegExp(label) });

test.describe('Favorites (nolseoul-favorites)', () => {
  test('EventList heart toggles, persists across reload, and stores the current shape', async ({ page }) => {
    await page.goto('/#/events');
    const card = eventListCard(page, EV.todayFreeClassic.title);
    const heart = heartIn(card);
    await expectSaved(heart, false);

    await heart.click();
    await expectSaved(heart, true);
    const stored = await readStorage<StoredFavorite[]>(page, STORAGE.favorites);
    expect(stored).toHaveLength(1);
    // Contract since BUG-08: id = stable event ID (cultcode from HMPG_ADDR), type = 'event'.
    expect(stored![0]).toMatchObject({
      id: EV.todayFreeClassic.id,
      type: 'event',
      title: EV.todayFreeClassic.title,
      location: '[픽스처] 강남 콘서트홀',
      category: '클래식',
      date: '2026-11-01~2026-11-05',
    });
    expect(typeof stored![0].savedAt).toBe('number');

    await page.reload();
    await expectSaved(heartIn(eventListCard(page, EV.todayFreeClassic.title)), true);

    await heartIn(eventListCard(page, EV.todayFreeClassic.title)).click();
    await expectSaved(heartIn(eventListCard(page, EV.todayFreeClassic.title)), false);
    expect(await readStorage<StoredFavorite[]>(page, STORAGE.favorites)).toEqual([]);
  });

  test('EventDetail favorite button toggles its label', async ({ page }) => {
    await page.goto(`/#/event/${EV.thisWeekPlay.id}`);
    await expect(detailHeading(page, EV.thisWeekPlay.title)).toBeVisible();
    // v3 detail: "찜하기" ↔ "찜됨" with aria-pressed (was "관심행사 등록" / "관심행사 등록됨").
    const hero = page.getByRole('region', { name: EV.thisWeekPlay.title });
    await hero.getByRole('button', { name: '찜하기' }).click();
    await expect(hero.getByRole('button', { name: '찜됨' })).toHaveAttribute('aria-pressed', 'true');
    const stored = await readStorage<StoredFavorite[]>(page, STORAGE.favorites);
    expect(stored?.map((f) => [f.id, f.type])).toEqual([[EV.thisWeekPlay.id, 'event']]);
    // Stored date keeps the pre-v3 shape: "YYYY-MM-DD ~ YYYY-MM-DD" (BUG-10).
    expect(stored?.[0].date).toBe('2026-11-06 ~ 2026-11-08');
  });

  test('MyPage lists saved events, links to detail, and removes them', async ({ page }) => {
    await page.goto('/#/events');
    await heartIn(eventListCard(page, EV.thisWeekPlay.title)).click();

    await page.goto('/#/mypage');
    await expect(myPageTab(page, '저장한 행사').last()).toContainText('1');
    const savedTitle = page.getByRole('heading', { level: 4, name: EV.thisWeekPlay.title });
    await expect(savedTitle).toBeVisible();

    // Saved card image links to the event detail.
    await page.locator(`a[href="#/event/${EV.thisWeekPlay.id}"]`).first().click();
    await expect(detailHeading(page, EV.thisWeekPlay.title)).toBeVisible();

    await page.goto('/#/mypage');
    // Remove button's accessible name: "<title> 찜 삭제" (added with BUG-08; was the icon text "favorite").
    await page.getByRole('button', { name: `${EV.thisWeekPlay.title} 찜 삭제` }).click();
    await expect(page.getByText('저장한 행사가 없습니다')).toBeVisible();
    expect(await readStorage<StoredFavorite[]>(page, STORAGE.favorites)).toEqual([]);
  });

  test('MyPage still renders favorites saved by the pre-BUG-08 version', async ({ page }) => {
    // Seeded before boot, as an old install would have it. The event can't be matched to fixture data,
    // so the migration keeps it as an orphan; space/spot are untouched. Details: favorites-migration.spec.ts.
    const legacy: StoredFavorite[] = [
      { id: '1', type: 'event', title: '[레거시] 저장된 행사', location: '레거시 장소', category: '클래식', date: '2026-01-01', savedAt: 1700000000000 },
      { id: '0', type: 'space', title: '[레거시] 저장된 공간', location: '레거시 주소', category: '미술관', savedAt: 1700000000001 },
      { id: '0', type: 'spot', title: '[레거시] 저장된 야경', location: '레거시 야경 주소', category: '야경명소', savedAt: 1700000000002 },
    ];
    await seedStorageOnce(page, { [STORAGE.favorites]: legacy });
    await page.goto('/#/mypage');

    await expect(page.getByRole('heading', { level: 4, name: '[레거시] 저장된 행사' })).toBeVisible();
    await myPageTab(page, '저장한 장소').last().click();
    await expect(page.getByRole('heading', { level: 4, name: '[레거시] 저장된 공간' })).toBeVisible();
    await myPageTab(page, '저장한 야경').last().click();
    await expect(page.getByRole('heading', { level: 4, name: '[레거시] 저장된 야경' })).toBeVisible();
  });

  test('corrupted favorites JSON falls back to an empty list', async ({ page }) => {
    await page.goto('/#/mypage');
    await page.evaluate((k) => window.localStorage.setItem(k, '{not json'), STORAGE.favorites);
    await page.reload();
    await expect(page.getByText('저장한 행사가 없습니다')).toBeVisible();
  });
});
