/**
 * Night page (v3, /night). Uses its own night-spot fixture (one spot per status type) and fixes the
 * clock at three moments on Tue 2026-11-10 (Seoul sunset 17:25): 15:00, 19:30, 23:30 KST.
 */
import { test, expect } from './support/test';

const SPOTS = [
  { NUM: '1', SUBJECT_CD: '공공시설', TITLE: '[픽스처] 야경 다리', ADDR: '서울특별시 마포구 다리로 1', LA: '37.54', LO: '126.93', URL: '', OPERATING_TIME: '일몰 30분후 점등 ~ 23:00 소등', ENTR_FEE: '무료', FREE_YN: '무료', CONTENTS: '<p>[픽스처] 다리 조명 설명</p>', SUBWAY: '', BUS: '' },
  { NUM: '2', SUBJECT_CD: '공원/광장', TITLE: '[픽스처] 24시간 공원', ADDR: '서울특별시 종로구 공원길 2', LA: '37.57', LO: '126.98', URL: 'https://example.test/park', OPERATING_TIME: '상시개방', ENTR_FEE: '무료', FREE_YN: '무료', CONTENTS: '', SUBWAY: '', BUS: '' },
  { NUM: '3', SUBJECT_CD: '문화/체육', TITLE: '[픽스처] 저녁 전시', ADDR: '서울특별시 중구 전시로 3', LA: '37.56', LO: '126.97', URL: '', OPERATING_TIME: '18:00 -23:00', ENTR_FEE: '유료 3,000원', FREE_YN: '유료', CONTENTS: '', SUBWAY: '', BUS: '' },
  { NUM: '4', SUBJECT_CD: '문화/체육', TITLE: '[픽스처] 계절 궁궐', ADDR: '서울특별시 종로구 궁궐로 4', LA: '37.58', LO: '126.99', URL: '', OPERATING_TIME: '하절기(3월~10월) 09:00~18:00 동절기(11월~2월) 09:00~17:00', ENTR_FEE: '유료', FREE_YN: '유료', CONTENTS: '', SUBWAY: '', BUS: '' },
];

const at = async (page: import('@playwright/test').Page, kst: string) => {
  await page.clock.setFixedTime(new Date(`2026-11-10T${kst}:00+09:00`));
  await page.route('**/api/seoulapi?type=night', (r) => r.fulfill({ json: { viewNightSpot: { list_total_count: SPOTS.length, row: SPOTS } } }));
  await page.goto('/#/night');
  await expect(page.getByRole('heading', { level: 1, name: /서울이 켜진다/ })).toBeVisible();
};
const card = (page: import('@playwright/test').Page, title: string) => page.getByRole('article').filter({ has: page.getByRole('heading', { name: title }) });
const stat = (page: import('@playwright/test').Page, label: string) => page.locator('.v3-night__stats div', { hasText: label }).locator('dd');

test.describe('Night page — time states', () => {
  test('before sunset (15:00): "곧 켜져요", countdown, bridge shows its switch-on time', async ({ page }) => {
    await at(page, '15:00');
    await expect(page.getByRole('status').filter({ hasText: '곧 켜져요' })).toHaveText(/곧 켜져요 · 일몰까지 2시간 25분/);
    await expect(stat(page, '오늘 일몰')).toHaveText('17:25');
    await expect(stat(page, '점등 중')).toHaveText('0곳');
    await expect(stat(page, '운영 중')).toHaveText('1곳');
    await expect(card(page, '[픽스처] 야경 다리')).toContainText('17:55 점등');
    await expect(card(page, '[픽스처] 저녁 전시')).toContainText('운영 종료');
    await expect(page.locator('.v3-night')).toHaveClass(/is-before/);
  });

  test('after sunset (19:30): "지금 켜져 있어요", lights on', async ({ page }) => {
    await at(page, '19:30');
    await expect(page.getByRole('status').filter({ hasText: '켜져 있어요' })).toBeVisible();
    await expect(stat(page, '점등 중')).toHaveText('1곳');
    await expect(stat(page, '운영 중')).toHaveText('2곳');
    await expect(card(page, '[픽스처] 야경 다리')).toContainText('● 점등 중');
    await expect(card(page, '[픽스처] 저녁 전시')).toContainText('운영 중');
    // Seasonal times: no badge, raw text only.
    await expect(card(page, '[픽스처] 계절 궁궐').locator('.v3-night__badge')).toHaveCount(0);
    await expect(card(page, '[픽스처] 계절 궁궐')).toContainText('하절기(3월~10월)');
    // Hero lights: glowing spots = lit bridge + open spots
    await expect(page.locator('.v3-night__hero .v3-night-lights__spot.is-on')).toHaveCount(3);
  });

  test('after 23:00 (23:30): "대부분 꺼졌어요"; only places still open glow', async ({ page }) => {
    await at(page, '23:30');
    await expect(page.getByRole('status').filter({ hasText: '대부분 꺼졌어요' })).toBeVisible();
    await expect(card(page, '[픽스처] 야경 다리')).toContainText('소등');
    await expect(card(page, '[픽스처] 저녁 전시')).toContainText('운영 종료');
    await expect(card(page, '[픽스처] 24시간 공원')).toContainText('운영 중');
    await expect(page.locator('.v3-night__hero .v3-night-lights__spot.is-on')).toHaveCount(1);
  });
});

test.describe('Night page — photos (data/night-photos.json)', () => {
  // "청계천" has a matched 한국관광공사 night photo in the static mapping; the fixture spots don't.
  const WITH_PHOTO = { ...SPOTS[1], NUM: '9', TITLE: '청계천', ADDR: '서울특별시 종로구 청계천로 1' };
  const open = async (page: import('@playwright/test').Page, image: 'ok' | 'fail') => {
    await page.route('https://tong.visitkorea.or.kr/**', (r) => (image === 'ok' ? r.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64') }) : r.abort()));
    await page.clock.setFixedTime(new Date('2026-11-10T19:30:00+09:00'));
    await page.route('**/api/seoulapi?type=night', (r) => r.fulfill({ json: { viewNightSpot: { row: [...SPOTS, WITH_PHOTO] } } }));
    await page.goto('/#/night');
  };

  test('a matched spot shows its photo with the 한국관광공사 credit; others show the graphic with the same caption slot', async ({ page }) => {
    await open(page, 'ok');
    const photoCard = card(page, '청계천');
    await expect(photoCard.locator('img')).toHaveAttribute('src', /^https:\/\/tong\.visitkorea\.or\.kr\//);
    await expect(photoCard.locator('figcaption')).toHaveText('사진: 한국관광공사 · 촬영 IR 스튜디오');
    const graphicCard = card(page, '[픽스처] 저녁 전시');
    await expect(graphicCard.locator('figure img')).toHaveCount(0);
    await expect(graphicCard.locator('figcaption')).toHaveText('실제 위치 그래픽');
    // Same frame for both: 4:3 and the same caption position.
    const a = await photoCard.locator('.v3-night__card-art').boundingBox();
    const b = await graphicCard.locator('.v3-night__card-art').boundingBox();
    expect(Math.round((a!.width / a!.height) * 100)).toBe(133);
    expect(Math.abs(a!.height - b!.height)).toBeLessThan(1.5); // sub-pixel grid rounding
  });

  test('a photo that fails to load falls back to the graphic', async ({ page }) => {
    await open(page, 'fail');
    await expect(card(page, '청계천').locator('figcaption')).toHaveText('실제 위치 그래픽');
  });
});

test.describe('Night page — content and navigation', () => {
  test('collections and filters are derived from data', async ({ page }) => {
    await at(page, '19:30');
    await page.getByRole('button', { name: /해 지면 켜지는 불빛/ }).click();
    await expect(page.locator('.v3-night__count')).toHaveText(/^1곳/);
    await page.getByRole('button', { name: /해 지면 켜지는 불빛/ }).click(); // toggle off
    await page.getByRole('button', { name: /무료로 가는 곳/ }).click();
    await expect(page.locator('.v3-night__count')).toHaveText(/^2곳/); // FREE_YN = 무료
    await page.getByRole('button', { name: /무료로 가는 곳/ }).click();
    await page.getByRole('group', { name: '분류' }).getByRole('button', { name: '문화/체육' }).click();
    await expect(page.locator('.v3-night__count')).toHaveText(/^2곳/);
    await page.getByRole('button', { name: '● 지금 켜진 곳만' }).click();
    await expect(page.locator('.v3-night__count')).toHaveText(/^1곳/); // 저녁 전시 (open); 궁궐 has no status
  });

  test('feature spot = first lit spot; card actions (map deep link, favorite, homepage)', async ({ page }) => {
    await at(page, '19:30');
    await expect(page.getByRole('heading', { level: 2, name: '[픽스처] 야경 다리' })).toBeVisible();
    await expect(card(page, '[픽스처] 야경 다리').getByRole('link', { name: '지도에서 보기 →' })).toHaveAttribute('href', /#\/map\?cat=%EC%95%BC%EA%B2%BD%EB%AA%85%EC%86%8C&spot=0$/);
    await expect(card(page, '[픽스처] 24시간 공원').getByRole('link', { name: '홈페이지 ↗' })).toHaveAttribute('href', 'https://example.test/park');
    await card(page, '[픽스처] 24시간 공원').getByRole('button', { name: /찜하기$/ }).click();
    await expect(card(page, '[픽스처] 24시간 공원').getByRole('button', { name: /찜 해제$/ })).toHaveAttribute('aria-pressed', 'true');
  });

  test('header nav has 야경명소 between 지도탐색 and 마이페이지', async ({ page }) => {
    await at(page, '19:30');
    const nav = page.locator('header nav').first();
    await expect(nav.getByRole('link')).toHaveText(['홈', '문화행사', '지도탐색', '야경명소', '마이페이지']);
    await expect(nav.getByRole('link', { name: '야경명소' })).toHaveAttribute('aria-current', 'page');
  });

  test('reduced motion: lights do not animate', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await at(page, '19:30');
    const anim = await page.locator('.v3-night__hero .v3-night-lights__spot.is-on').first().evaluate((el) => getComputedStyle(el).animationName);
    expect(anim).toBe('none');
  });

  test('390px: no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await at(page, '19:30');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
  });
});
