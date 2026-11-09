/**
 * BUG-03 (fixed 2026-11-09, option D): one fee rule (utils/fee.ts) for EventList, Home and EventDetail.
 * Badges: 무료 / 유료 / 일부 무료 / 가격 상이. "확인 필요" shows no badge, only the fee text.
 * Replaces the former @known-issue test in known-issues.spec.ts.
 */
import { test, expect, homeCard, eventListCard } from './support/test';
import { EV } from './fixtures/seoul-api';

const BADGE = /^(무료|유료|일부 무료|가격 상이)$/;
const specValue = (page: import('@playwright/test').Page, title: string, label: string) =>
  page.getByRole('region', { name: title }).locator('dt', { hasText: label }).locator('xpath=following-sibling::dd[1]');

test.describe('Fee classification (BUG-03 option D)', () => {
  test('EventList shows the four badges, and no badge for 확인 필요', async ({ page }) => {
    await page.goto('/#/events');
    await expect(eventListCard(page, EV.todayFreeClassic.title).getByText(BADGE)).toHaveText('무료');
    await expect(eventListCard(page, EV.thisWeekPlay.title).getByText(BADGE)).toHaveText('유료');
    await expect(eventListCard(page, '[픽스처] 기타 행사 01').getByText(BADGE)).toHaveText('가격 상이');
    await expect(eventListCard(page, '[픽스처] 기타 행사 02').getByText(BADGE)).toHaveText('일부 무료');
    // IS_FREE=유료 + "무료(사전예약)" → 확인 필요: no badge, the fee text is still listed.
    const check = eventListCard(page, EV.todayFestivalFeeText.title);
    await expect(check.getByText(BADGE)).toHaveCount(0);
    await expect(check.getByText('무료(사전예약)')).toBeVisible();
  });

  test('Home, EventList and EventDetail agree on the same event', async ({ page }) => {
    await page.goto('/#/');
    await expect(homeCard(page, EV.todayFestivalFeeText.title).locator('[title]')).toHaveText('무료(사전예약)');
    await expect(homeCard(page, EV.todayFreeClassic.title).locator('[title]')).toHaveText('무료');

    await page.goto(`/#/event/${EV.todayFestivalFeeText.id}`);
    await expect(specValue(page, EV.todayFestivalFeeText.title, '관람료')).toHaveText('무료(사전예약)');
    await page.goto(`/#/event/${EV.todayFreeClassic.id}`);
    await expect(specValue(page, EV.todayFreeClassic.title, '관람료')).toHaveText('무료'); // badge only, no repeated text
  });
});
