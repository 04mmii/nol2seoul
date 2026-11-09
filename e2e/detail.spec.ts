import { test, expect, detailHeading, readStorage, STORAGE, type StoredFavorite } from './support/test';
import { EV } from './fixtures/seoul-api';

const hero = (page: import('@playwright/test').Page, title: string) => page.getByRole('region', { name: title });
const specValue = (page: import('@playwright/test').Page, title: string, label: string) =>
  hero(page, title).locator('dl > div').filter({ has: page.locator('dt', { hasText: label }) }).locator('dd');

test.describe('EventDetail (v3)', () => {
  test('hero shows API fields, status and external links', async ({ page }) => {
    const t = EV.futureExhibition.title;
    await page.goto(`/#/event/${EV.futureExhibition.index}`);
    await expect(detailHeading(page, t)).toBeVisible();
    await expect(hero(page, t)).toContainText('전시/미술 · 기타');
    await expect(hero(page, t)).toContainText('주최 · [픽스처] 주최기관');
    await expect(specValue(page, t, '기간')).toHaveText('2026-12-01 ~ 2026-12-31');
    await expect(specValue(page, t, '장소')).toHaveText('[픽스처] 종로 갤러리');
    await expect(specValue(page, t, '관람료')).toHaveText('유료10,000원'); // fee badge + fee text
    await expect(specValue(page, t, '관람시간')).toHaveText('10:00~18:00');
    await expect(specValue(page, t, '문의')).toHaveText('02-000-0000');
    await expect(hero(page, t).getByRole('link', { name: /홈페이지 가기/ })).toHaveAttribute('href', 'https://tickets.example.test/goods/0');
    await expect(hero(page, t).getByRole('link', { name: /서울문화포털/ })).toHaveAttribute('href', /culture\.example\.test/);
    // Fixed clock 2026-11-03 → opens 2026-12-01.
    await expect(page.getByText('EVENT № 001 · D-28 · 개막 예정')).toBeVisible();
  });

  test('breadcrumb links back to home and the list', async ({ page }) => {
    await page.goto(`/#/event/${EV.todayFreeClassic.index}`);
    const crumbs = page.getByRole('navigation', { name: '현재 위치' });
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText(EV.todayFreeClassic.title);
    await expect(page.getByText(/진행 중 · 종료 D-2/)).toBeVisible();
    await crumbs.getByRole('link', { name: '문화행사' }).click();
    await expect(page).toHaveURL(/#\/events$/);
  });

  test('body renders PROGRAM text and an ETC_DESC image URL as an image', async ({ page }) => {
    await page.goto(`/#/event/${EV.futureExhibition.index}`);
    const about = page.getByRole('region', { name: /행사 소개/ });
    await expect(about).toContainText('[픽스처] 미래 전시 프로그램 소개');
    await expect(about.getByRole('img', { name: /안내 이미지/ })).toBeVisible();
    // Left info column lists only API fields.
    const info = page.getByRole('complementary', { name: '행사 정보' });
    await expect(info).toContainText('출연');
    await expect(info).toContainText('[픽스처] 작가 미상');
  });

  test('missing description shows an empty state, not invented copy', async ({ page }) => {
    await page.goto(`/#/event/${EV.todayFreeClassic.index}`);
    await expect(page.getByText('제공된 상세 소개가 없습니다.')).toBeVisible();
  });

  test('no reviews, ratings or curator notes are rendered', async ({ page }) => {
    await page.goto(`/#/event/${EV.futureExhibition.index}`);
    await expect(detailHeading(page, EV.futureExhibition.title)).toBeVisible();
    for (const text of ['방문자 후기', '먼저 다녀온 사람들', '/ 5.0', '큐레이터 노트', "EDITOR'S PICK"]) {
      await expect(page.getByText(text)).toHaveCount(0);
    }
  });

  test('map: placeholder when the Kakao SDK cannot load; "no location" without coordinates', async ({ page }) => {
    // Kakao SDK requests are aborted by the test network guard.
    await page.goto(`/#/event/${EV.futureExhibition.index}`);
    await expect(page.getByRole('img', { name: '지도를 불러올 수 없습니다' })).toBeVisible();
    await page.goto(`/#/event/${EV.todayFreeClassic.index}`);
    await expect(page.getByRole('img', { name: '위치 정보가 없습니다' })).toBeVisible();
  });

  test('"다음으로 가볼 곳": same genre AND district first, then navigates', async ({ page }) => {
    // Filler 01 (교육/체험, 서초구) → other 교육/체험 fillers in 서초구 rank first.
    await page.goto('/#/event/4');
    const related = page.getByRole('region', { name: /다음으로/ });
    const titles = related.getByRole('article').getByRole('heading');
    await expect(titles).toHaveText(['[픽스처] 기타 행사 03', '[픽스처] 기타 행사 05', '[픽스처] 기타 행사 07', '[픽스처] 기타 행사 09']);

    await related.getByRole('link', { name: '[픽스처] 기타 행사 03' }).click();
    await expect(page).toHaveURL(/#\/event\/6$/);
    await expect(detailHeading(page, '[픽스처] 기타 행사 03')).toBeVisible();
  });

  test('"다음으로 가볼 곳": falls back to same district when the genre is unique', async ({ page }) => {
    // 연극 in 강남구: no other 연극 → the other 강남구 event (classic).
    await page.goto(`/#/event/${EV.thisWeekPlay.index}`);
    const related = page.getByRole('region', { name: /다음으로/ });
    await expect(related.getByRole('article')).toHaveCount(1);
    await expect(related.getByRole('heading', { name: EV.todayFreeClassic.title })).toBeVisible();
  });

  test('related card heart saves that event with its own ID', async ({ page }) => {
    await page.goto(`/#/event/${EV.thisWeekPlay.index}`);
    await page.getByRole('region', { name: /다음으로/ }).getByRole('button', { name: /찜하기$/ }).click();
    const stored = await readStorage<StoredFavorite[]>(page, STORAGE.favorites);
    expect(stored?.map((f) => [f.id, f.title])).toEqual([[String(EV.todayFreeClassic.index), EV.todayFreeClassic.title]]);
  });

  test('unknown id shows not-found with a link back to the list', async ({ page }) => {
    await page.goto('/#/event/9999');
    await expect(page.getByText('행사 정보를 찾을 수 없습니다.')).toBeVisible();
    await page.getByRole('link', { name: '목록으로 돌아가기' }).click();
    await expect(page).toHaveURL(/#\/events$/);
  });
});

test.describe('EventDetail (v3) — mobile 390px', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('no horizontal overflow', async ({ page }) => {
    await page.goto(`/#/event/${EV.futureExhibition.index}`);
    await expect(detailHeading(page, EV.futureExhibition.title)).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
