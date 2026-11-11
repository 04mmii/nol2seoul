import { test, expect } from './support/test';

const SEARCH_INPUT = '행사, 장소, 키워드를 검색해보세요';

test.describe('Site chrome (Redesign v3 header/footer)', () => {
  test('v3 tokens are loaded (index.css + tailwind config)', async ({ page }) => {
    await page.goto('/#/');
    const header = page.locator('header');
    await expect(header).toHaveCSS('background-color', 'rgb(246, 242, 234)'); // --v3-bone
    await expect(page.locator('footer')).toHaveCSS('background-color', 'rgb(20, 19, 15)'); // --v3-ink
  });

  test('active nav item is exposed with aria-current', async ({ page }) => {
    await page.goto('/#/events');
    const nav = page.getByRole('navigation', { name: '주요 메뉴' });
    await expect(nav.getByRole('link', { name: '문화행사' })).toHaveAttribute('aria-current', 'page');
    await expect(nav.getByRole('link', { name: '홈' })).not.toHaveAttribute('aria-current', /.*/);
  });

  test('search pill opens the overlay with the keyboard', async ({ page }) => {
    await page.goto('/#/');
    const pill = page.locator('header').getByRole('button', { name: /행사 · 장소 · 동네 검색/ });
    await pill.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByPlaceholder(SEARCH_INPUT)).toBeVisible();
  });

  test('icon controls have accessible names; avatar links to MyPage', async ({ page }) => {
    await page.goto('/#/');
    const header = page.locator('header');
    await expect(header.getByRole('button', { name: '알림' })).toBeVisible();
    await expect(header.getByRole('button', { name: '찜' })).toBeVisible();
    await header.getByRole('link', { name: '마이페이지' }).last().click();
    await expect(page).toHaveURL(/#\/mypage$/);
  });

  test('header is fixed on the map route and sticky elsewhere', async ({ page }) => {
    await page.goto('/#/events');
    await expect(page.locator('header')).toHaveCSS('position', 'sticky');
    await page.goto('/#/map');
    await expect(page.locator('header')).toHaveCSS('position', 'fixed');
  });

  test('footer service links route to existing pages', async ({ page }) => {
    await page.goto('/#/');
    const footer = page.locator('footer');
    await footer.getByRole('link', { name: '문화행사 탐색' }).click();
    await expect(page).toHaveURL(/#\/events$/);
    await page.locator('footer').getByRole('link', { name: '지도 탐색' }).click();
    await expect(page).toHaveURL(/#\/map$/);
  });
});

test.describe('Site chrome — mobile (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('nav and search pill are hidden; search icon still opens the overlay', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.getByRole('navigation', { name: '주요 메뉴' })).toBeHidden();
    await expect(page.locator('header').getByRole('button', { name: /행사 · 장소 · 동네 검색/ })).toBeHidden();
    await page.locator('header').getByRole('button', { name: '검색', exact: true }).click();
    await expect(page.getByPlaceholder(SEARCH_INPUT)).toBeVisible();
  });

  test('header does not overflow horizontally', async ({ page }) => {
    await page.goto('/#/');
    const overflow = await page.locator('header').evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
