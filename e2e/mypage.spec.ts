/**
 * MyPage v3 (design-ref "Search and My v3" M1–M3, decisions 2026-11-10): title count, 4 stats,
 * fixed 마감 임박순, D-day, type tabs, ended/unavailable cards, empty state, removed placeholders.
 * Clock: FIXED_NOW = 2026-11-03 12:00 KST (before sunset).
 */
import { test, expect, seedStorageOnce, readStorage, STORAGE, type StoredFavorite } from './support/test';
import { EV, SPACES, SPOTS } from './fixtures/seoul-api';

const fav = (f: Partial<StoredFavorite> & Pick<StoredFavorite, 'id' | 'type' | 'title'>, i: number): StoredFavorite =>
  ({ location: '', savedAt: 1_700_000_000_000 - i, ...f }) as StoredFavorite;

// Stored newest first, deliberately not in the display order.
const SAVED: StoredFavorite[] = [
  fav({ id: '0', type: 'space', title: SPACES[0].FAC_NAME, location: SPACES[0].ADDR, category: '미술관' }, 0),
  fav({ id: 'legacy-9', type: 'event', title: '[레거시] 끝난 행사', location: '어딘가', category: '전시', date: '2025-01-01~2025-01-31', orphan: true }, 1),
  fav({ id: '0', type: 'spot', title: SPOTS[0].TITLE, location: SPOTS[0].ADDR, category: '야경명소' }, 2),
  fav({ id: EV.futureExhibition.id, type: 'event', title: EV.futureExhibition.title }, 3),
  fav({ id: EV.thisWeekPlay.id, type: 'event', title: EV.thisWeekPlay.title }, 4),
  fav({ id: EV.todayFreeClassic.id, type: 'event', title: EV.todayFreeClassic.title }, 5),
];

test.describe('MyPage v3', () => {
  test.beforeEach(async ({ page }) => {
    await seedStorageOnce(page, { [STORAGE.favorites]: SAVED, [STORAGE.favoritesVersion]: '2' });
    await page.goto('/#/mypage');
    await expect(page.getByRole('heading', { level: 1, name: /찜해 둔 서울,\s*6곳\./ })).toBeVisible();
  });

  test('stats come from favorites + today only', async ({ page }) => {
    const stat = (k: string) => page.locator('dl.v3-my__stats > div').filter({ has: page.getByText(k, { exact: true }) }).locator('dd');
    await expect(stat('찜한 행사')).toHaveText(/^4\s*진행 중 1$/);
    await expect(stat('이번 주 마감')).toContainText('2'); // ends 11-05 and 11-08
    await expect(stat('찜한 문화공간')).toHaveText('1');
    await expect(stat('지금 켜진 찜 야경')).toHaveText(/곧 켜져요\s*\/ 전체 1곳/); // before sunset
    await expect(page.getByText('이 브라우저에 저장돼요')).toBeVisible();
  });

  test('fixed order: events by end date → night → spaces → ended; D-day within 7 days', async ({ page }) => {
    const titles = page.locator('.v3-my__grid h3');
    await expect(titles).toHaveText([
      EV.todayFreeClassic.title, // ends 11-05
      EV.thisWeekPlay.title, // ends 11-08 (upcoming)
      EV.futureExhibition.title, // ends 12-31
      SPOTS[0].TITLE,
      SPACES[0].FAC_NAME,
      '[레거시] 끝난 행사',
    ]);
    const classic = page.locator('article').filter({ has: page.getByRole('heading', { name: EV.todayFreeClassic.title }) });
    await expect(classic.locator('.v3-event-card__dday')).toHaveText('D-2');
    const future = page.locator('article').filter({ has: page.getByRole('heading', { name: EV.futureExhibition.title }) });
    await expect(future.locator('.v3-event-card__dday')).toHaveCount(0);
  });

  test('cards link to their pages; ended favorite is labelled and removable, never auto-deleted', async ({ page }) => {
    await expect(page.getByRole('link', { name: SPACES[0].FAC_NAME })).toHaveAttribute('href', '#/space/0');
    await expect(page.getByRole('link', { name: SPOTS[0].TITLE })).toHaveAttribute('href', '#/night?spot=0');
    const ended = page.locator('article').filter({ has: page.getByRole('heading', { name: '[레거시] 끝난 행사' }) });
    await expect(ended.getByRole('note')).toHaveText('종료된 행사');
    await expect(ended.locator('a')).toHaveCount(0);
    await ended.getByRole('button', { name: '[레거시] 끝난 행사 찜 삭제' }).click();
    await expect(ended).toHaveCount(0);
    const stored = await readStorage<StoredFavorite[]>(page, STORAGE.favorites);
    expect(stored).toHaveLength(5);
  });

  test('type tabs filter the grid', async ({ page }) => {
    const tabs = page.getByRole('group', { name: '종류' });
    await tabs.getByRole('button', { name: /야경명소/ }).click();
    await expect(page.locator('.v3-my__grid h3')).toHaveText([SPOTS[0].TITLE]);
    await tabs.getByRole('button', { name: /문화공간/ }).click();
    await expect(page.locator('.v3-my__grid h3')).toHaveText([SPACES[0].FAC_NAME]);
    await tabs.getByRole('button', { name: /전체/ }).click();
    await expect(page.locator('.v3-my__grid h3')).toHaveCount(6);
  });

  test('placeholders are gone (profile, account menu, membership, sort)', async ({ page }) => {
    for (const t of ['서울여행자님', '로그아웃', '멤버십 가입', '계정 설정', '찜한 순']) await expect(page.getByText(t)).toHaveCount(0);
  });
});

test('empty MyPage links onward; shortcut names have no counts except the night chip', async ({ page }) => {
  await page.goto('/#/mypage');
  await expect(page.getByRole('heading', { level: 1, name: /아직 찜한\s*서울이 없어요/ })).toBeVisible();
  await expect(page.getByRole('link', { name: '이번 주 행사 보기 →' })).toHaveAttribute('href', '#/events');
  const nav = page.getByRole('navigation', { name: '바로 가기' });
  await expect(nav.getByRole('link')).toHaveText([/^이번 주 무료 행사\s*→$/, /^곧 마감\s*→$/, /^지금 켜진 야경( \d+| · 곧 켜져요)\s*→$/]);
});
