/**
 * BUG-13 (fixed 2026-11-09): SpaceDetail reads the fields the live culturalSpaceInfo API sends.
 * IMG_URL → MAIN_IMG, DTLCONT → FAC_DESC (HTML shown as plain text), TICKET_YN → ENTRFREE,
 * TRAFFIC_INFO → SUBWAY / BUSSTOP. Space IDs are still array indexes (BUG-08 open for spaces).
 */
import { test, expect } from './support/test';
import { SPACES } from './fixtures/seoul-api';

test.describe('SpaceDetail (BUG-13 field mapping)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/space/s1');
    await expect(page.getByRole('heading', { name: SPACES[0].FAC_NAME })).toBeVisible();
  });

  test('FAC_DESC HTML renders as plain-text paragraphs (no tags, entities decoded)', async ({ page }) => {
    await expect(page.getByText('[픽스처] 문화공간 설명 첫 문단 & 소개', { exact: true })).toBeVisible();
    await expect(page.getByText('[픽스처] 둘째 문단', { exact: true })).toBeVisible();
    await expect(page.getByText(/<div|<span|&nbsp;/)).toHaveCount(0);
  });

  test('입장료 comes from ENTRFREE (유료 badge + row)', async ({ page }) => {
    await expect(page.getByText('입장료').locator('xpath=following-sibling::p[1]')).toHaveText('유료');
  });

  test('교통 안내 comes from SUBWAY / BUSSTOP; a bare number is not shown', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '교통 안내' })).toBeVisible();
    await expect(page.getByText('3호선 경복궁역 5번 출구')).toBeVisible();
    await expect(page.getByText('버스', { exact: true })).toHaveCount(0);
  });
});
