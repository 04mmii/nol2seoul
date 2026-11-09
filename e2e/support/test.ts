import { test as base, expect, type Page, type Locator } from '@playwright/test';
import { API_RESPONSES, FIXED_NOW, FIXTURE_IMAGE_HOST, PNG_1X1 } from '../fixtures/seoul-api';

/**
 * External hosts the app is allowed to reach during tests.
 * - cdn.tailwindcss.com: the app's styles are generated at runtime by the Tailwind CDN script
 *   (DESIGN.md TECH-05). Without it, responsive `hidden`/`md:` classes don't apply.
 * - fonts.googleapis.com / fonts.gstatic.com: Material Symbols is an icon *font*. Without it,
 *   icons render as their ligature words (e.g. "chevron_right"), overflow their buttons and
 *   intercept clicks on neighbors — a test-only artifact that real users don't see.
 * - cdn.jsdelivr.net: Pretendard (Redesign v3 body font).
 * Everything else external (picsum.photos, Kakao, esm.sh, ...) is aborted so tests are
 * deterministic and don't depend on third-party availability.
 */
const ALLOWED_EXTERNAL_HOSTS = new Set([
  'cdn.tailwindcss.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net',
]);

const isLocal = (url: URL) => url.hostname === '127.0.0.1' || url.hostname === 'localhost';

/** Intercepts `/api/seoulapi?type=...` with fixture JSON. */
export async function mockSeoulApi(page: Page) {
  await page.route('**/api/seoulapi**', async (route) => {
    const type = new URL(route.request().url()).searchParams.get('type') ?? 'event';
    const body = API_RESPONSES[type];
    if (!body) return route.fulfill({ status: 400, json: { error: 'Invalid type parameter' } });
    return route.fulfill({ status: 200, json: body });
  });
}

async function guardNetwork(page: Page) {
  await page.route(
    (url) => !isLocal(url),
    async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === FIXTURE_IMAGE_HOST) {
        return route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1 });
      }
      if (ALLOWED_EXTERNAL_HOSTS.has(url.hostname)) return route.fallback();
      return route.abort();
    },
  );
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.clock.setFixedTime(FIXED_NOW);
    await guardNetwork(page);
    await mockSeoulApi(page);
    await use(page);
  },
});

export { expect };

// ---------------------------------------------------------------------------
// Helpers. The UI has no test IDs or ARIA labels yet (DESIGN.md A11Y-02), and this stage must not
// modify UI code, so locators rely on visible text plus a few structural anchors. Icon-only
// buttons are found by their Material Symbols ligature text (e.g. "favorite").
// ---------------------------------------------------------------------------

export const STORAGE = {
  favorites: 'nolseoul-favorites',
  recent: 'nolseoul-recent',
  /** BUG-08 migration flag ("2" = stable event IDs) and the untouched pre-migration copy. */
  favoritesVersion: 'nolseoul-favorites-version',
  favoritesBackup: 'nolseoul-favorites-v1-backup',
} as const;

/**
 * Seed localStorage BEFORE the app boots, once per test (a sessionStorage guard stops reloads from
 * re-seeding). Use for data written by an older app version, e.g. favorites with index IDs.
 */
export async function seedStorageOnce(page: Page, entries: Record<string, unknown>) {
  await page.addInitScript((data) => {
    if (sessionStorage.getItem('__seeded')) return;
    sessionStorage.setItem('__seeded', '1');
    for (const [k, v] of Object.entries(data)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
  }, entries);
}

export type StoredFavorite = {
  id: string;
  type: 'event' | 'space' | 'spot';
  title: string;
  location: string;
  image?: string;
  category?: string;
  date?: string;
  savedAt: number;
  orphan?: boolean;
};

export async function readStorage<T>(page: Page, key: string): Promise<T | null> {
  const raw = await page.evaluate((k) => window.localStorage.getItem(k), key);
  return raw === null ? null : (JSON.parse(raw) as T);
}

export async function writeStorage(page: Page, key: string, value: unknown) {
  await page.evaluate(([k, v]) => window.localStorage.setItem(k, v), [key, JSON.stringify(value)] as const);
}

/** EventList (v3) card: an <article> in the "문화행사 목록" region whose heading is the event title. */
export function eventListCard(page: Page, title: string): Locator {
  return page
    .getByRole('region', { name: '문화행사 목록' })
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) });
}

/** All cards on the current EventList page. */
export const eventListCards = (page: Page) => page.getByRole('region', { name: '문화행사 목록' }).getByRole('article');

/** EventList (v3) has loaded: its h1 ("서울에서 지금 하고 있는 N가지 일."). */
export const eventListHeading = (page: Page) => page.getByRole('heading', { level: 1, name: /하고 있는/ });

/** Home (v3) event card: an <article> whose heading is the event title. */
export function homeCard(page: Page, title: string): Locator {
  return page
    .getByRole('region', { name: /지금 서울에서/ })
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) });
}

/** Heart toggle inside a Home (v3) card — a button with aria-pressed and a Korean label. */
export function homeHeart(card: Locator): Locator {
  return card.getByRole('button', { name: /찜하기$|찜 해제$/ });
}

/** Heart icon button inside a container; `fill` class on the icon means "saved". */
/** Heart button of a v3 event card ("<title> 찜하기" / "<title> 찜 해제"). */
export function heartIn(container: Locator): Locator {
  return container.getByRole('button', { name: /(찜하기|찜 해제)$/ });
}

export async function expectSaved(heart: Locator, saved: boolean) {
  await expect(heart).toHaveAttribute('aria-pressed', String(saved));
}

/** EventList (v3) sidebar filter: clicks `option` inside the filter group ("카테고리" | "지역" | "관람료"). */
export async function pickFilter(page: Page, group: '카테고리' | '지역' | '관람료', option: string) {
  await page.getByRole('group', { name: group }).getByRole('button', { name: new RegExp(`^${option.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&')}(\\s|\\d|$)`) }).click();
}

export async function openSearch(page: Page) {
  // Redesign v3 header: desktop search pill is a <button> labelled by its text.
  await page.locator('header').getByRole('button', { name: /검색/ }).filter({ visible: true }).first().click();
  const input = page.getByPlaceholder('행사, 장소, 키워드를 검색해보세요');
  await expect(input).toBeVisible();
  return input;
}

/** Event detail title — an h1 since the v3 detail page (was h2 before). */
export function detailHeading(page: Page, title: string): Locator {
  return page.getByRole('heading', { level: 1, name: title, exact: true });
}
