/**
 * TECH-10 client guard: even if the (CDN-cached) API response still contains an event that ended
 * before today (KST), the app never shows it (utils/event.ts `dropEndedEvents`, applied in useEvents).
 * Fixed clock: 2026-11-03 12:00 KST.
 */
import { test, expect, eventListHeading, eventListCard, openSearch } from './support/test';
import { EVENTS, EXPECT, EV } from './fixtures/seoul-api';

const ENDED = {
  ...EVENTS[1],
  TITLE: '[픽스처] 어제 끝난 클래식',
  DATE: '2026-10-20~2026-11-02',
  STRTDATE: '2026-10-20 00:00:00.0',
  END_DATE: '2026-11-02 00:00:00.0', // ended yesterday (KST)
  HMPG_ADDR: 'https://culture.example.test/cultureEvent/view.do?cultcode=900777&menuNo=200008',
};

test.beforeEach(async ({ page }) => {
  // Registered after the default fixture route → takes precedence for type=event.
  await page.route('**/api/seoulapi?type=event', (route) => {
    const row = [...EVENTS, ENDED];
    return route.fulfill({ json: { culturalEventInfo: { list_total_count: row.length, row } } });
  });
});

test('EventList: an ended event in a stale response is not listed', async ({ page }) => {
  await page.goto('/#/events');
  await expect(eventListHeading(page)).toBeVisible();
  await expect(page.getByRole('heading', { name: `총 ${EXPECT.total}건의 문화행사` })).toBeVisible();
  await page.getByRole('navigation', { name: '페이지' }).getByRole('button', { name: '2', exact: true }).click();
  await expect(eventListCard(page, ENDED.TITLE)).toHaveCount(0);
});

test('EventDetail: related events and the detail itself ignore the ended event', async ({ page }) => {
  // Same genre (클래식) and district (강남구) as todayFreeClassic → would rank first if it weren't dropped.
  await page.goto(`/#/event/${EV.thisWeekPlay.id}`);
  await expect(page.getByRole('region', { name: /다음으로/ }).getByRole('heading', { name: ENDED.TITLE })).toHaveCount(0);
  await page.goto('/#/event/900777');
  await expect(page.getByText('종료된 행사입니다.')).toBeVisible();
});

test('Search: the ended event is not found', async ({ page }) => {
  await page.goto('/#/');
  const input = await openSearch(page);
  await input.fill('어제 끝난');
  await expect(page.getByRole('link', { name: new RegExp(ENDED.TITLE.replace(/[[\]]/g, '\\$&')) })).toHaveCount(0);
});
