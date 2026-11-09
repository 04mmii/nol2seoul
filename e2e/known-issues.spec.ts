/**
 * Known issues from DESIGN.md §7, recorded as EXPECTED-TO-FAIL tests.
 *
 * Each test asserts the *desired* behavior and is marked `test.fail()`, so today it reports as
 * "expected failure" and does not break the run. When a bug is fixed, the test unexpectedly
 * passes and Playwright reports it as a failure → remove the `test.fail()` line in the fix PR.
 *
 * History: BUG-01 was fixed in the v3 Home rewrite (2026-11-09); its tests moved to home.spec.ts.
 * BUG-03 was fixed with option D (2026-11-09); its test moved to fee.spec.ts.
 *
 * Run only these: `npx playwright test --grep @known-issue`
 * Exclude them:   `npm run test:e2e:smoke`
 */
import { test, expect, openSearch } from './support/test';
import { EV, SPACES } from './fixtures/seoul-api';

test.describe('Known issues @known-issue', () => {
  test('BUG-02: API error response shows the error state, not the empty state', async ({ page }) => {
    test.fail(true, 'BUG-02: fetchers ignore res.ok; JSON error bodies become []');
    await page.route('**/api/seoulapi**', (route) =>
      route.fulfill({ status: 500, json: { error: '서울시 OpenAPI 호출 실패' } }),
    );
    await page.goto('/#/events');
    // Actual today: "총 0건" + "조건에 맞는 행사가 없습니다."
    await expect(page.getByText('문화행사를 불러올 수 없습니다.')).toBeVisible({ timeout: 5_000 });
  });

  test('BUG-06: cultural-space search result opens the space detail', async ({ page }) => {
    test.fail(true, 'BUG-06: space/spot result rows are styled as clickable but have no action');
    await page.goto('/#/');
    const input = await openSearch(page);
    await input.fill(SPACES[0].FAC_NAME);
    await page.getByText(SPACES[0].FAC_NAME, { exact: true }).last().click();
    await expect(page).toHaveURL(/#\/space\/\d+$/, { timeout: 3_000 });
  });
});
