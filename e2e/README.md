# E2E smoke tests (Stage 0.5)

Minimal regression safety net for NOLSEOUL. It checks **current** behavior so that design-system refactors don't silently break it. It does not test visuals (no screenshot baselines yet) and it does not cover the map.

## Run

```bash
npm install
npx playwright install chromium   # once per machine; downloads into the user cache, not the repo
npm run typecheck                 # tsc --noEmit
npm run test:e2e                  # all tests (smoke + known issues)
npm run test:e2e:smoke            # smoke only (excludes @known-issue)
npx playwright test --grep @known-issue
npm run test:e2e:report           # open the last HTML report
```

Playwright starts its own Vite dev server on `http://127.0.0.1:4310` (it does not use port 3000). If a server is already running on 4310, it is reused outside CI.

## How it is isolated

| Concern | Handling |
|---|---|
| Seoul Open API | `/api/seoulapi?type=event\|space\|night` is intercepted in the browser and answered with **synthetic fixtures** (`fixtures/seoul-api.ts`). No API key is needed, and neither the Vite proxy nor the Vercel function is exercised. |
| Date-dependent UI | Clock fixed at **2026-11-03 12:00 KST** (`page.clock.setFixedTime`). Timezone `Asia/Seoul`, locale `ko-KR`. |
| Images | Fixture image URLs (`fixtures.nolseoul.test`) are answered with a 1×1 PNG. |
| Other network | Allowed: `cdn.tailwindcss.com` (runtime styles), Google Fonts (Material Symbols icon font, plus v3 Space Grotesk / JetBrains Mono; without the icon font, icon words overflow and block clicks) and `cdn.jsdelivr.net` (v3 Pretendard). **Everything else external is aborted** (picsum.photos, Kakao SDK, esm.sh, …). |
| Storage | Every test gets a fresh browser context (empty `localStorage`). |

**Network dependency:** the tests still need internet access for the Tailwind CDN and Google Fonts. This goes away only after a compiled-Tailwind / self-hosted-font migration (DESIGN.md TECH-05).

## Coverage

| File | What it checks |
|---|---|
| `home.spec.ts` | v3 Home: all sections render; hero features an ongoing event and links to its detail; hero stats and banner controls; 오늘/이번주/이번달/무료 tabs; price uses the Home free rule; BUG-01 regression (card link + favorite ID match EventList); heart toggle; category strip + map promo from space data; After Dark from night data; curators from constants; loading/error states; 390px overflow. |
| `detail.spec.ts` | v3 EventDetail: hero spec values, status label, external links; breadcrumb; PROGRAM text + ETC_DESC image URL; empty description state; **no reviews/ratings/curator notes rendered**; map placeholder (SDK blocked / no coordinates); related events ranking (genre+district → genre → district) and navigation; related heart ID; not-found; 390px overflow. |
| `chrome.spec.ts` | v3 Header/Footer: tokens loaded, `aria-current`, keyboard search, icon names, fixed header on `/map`, footer links, mobile search icon, no overflow. |
| `event-list.spec.ts` | Total count; 12-per-page pagination (prev/next disabled states); region / genre / fee filters; reset chip; filter resets page; empty state; "상세보기" opens the right detail; FAB link; loading state; network-failure error state. |
| `search-overlay.spec.ts` | Open from header / close with 취소; grouped results (events, spaces, spots); event result → detail + overlay closes; no-result message; `nolseoul-recent` save on Enter (trimmed), de-dup, max 8, remove one, clear all, reopen shows recents. |
| `favorites.spec.ts` | `nolseoul-favorites` toggle from EventList and EventDetail; stored shape (`id` = array index, `type`, `title`, `location`, `category`, `date`, `savedAt`); persistence across reload; MyPage list, link, remove + empty state; pre-existing data from the current format still renders; corrupted JSON falls back to empty. |
| `fee.spec.ts` | BUG-03 regression (option D): EventList shows the four fee badges (무료/유료/일부 무료/가격 상이) and none for 확인 필요; Home, EventList and EventDetail agree on the same event. |
| `favorites-migration.spec.ts` | BUG-08: old index-ID favorites (seeded before boot) are re-matched by image → title+start date → title+location; backup kept; duplicates dropped; unmatched kept as orphans (MyPage note, no link, removable); runs once; no migration while the event API fails; old `/event/12` links show the outdated-link message. |
| `api-proxy.spec.ts` | TECH-10: shared proxy logic (`api/_lib/seoulApi.ts`) with a fake `fetch` — paging by `list_total_count` for all three APIs (max 5 parallel), event window (running today + starting within 3 months, KST), dedupe, field whitelist, INFO-200, partial/first-page failures and cache headers (24 h + SWR), key scrubbing, input checks; plus one request to the dev server to prove the middleware is wired. No browser, no real API. |
| `space-detail.spec.ts` | BUG-13: SpaceDetail reads live-API fields — FAC_DESC HTML as plain text, 입장료 from ENTRFREE, 교통 안내 from SUBWAY/BUSSTOP (bare numbers hidden). |
| `ended-guard.spec.ts` | TECH-10 client guard: an event that ended yesterday but is still in a (stale) API response is not shown in EventList, related events, the detail page or search. |
| `known-issues.spec.ts` | Expected-to-fail tests for open bugs (below). |

Not covered yet: MapDiscovery (needs a Kakao SDK strategy), most of SpaceDetail (only the BUG-13 fields), mobile viewports, visual screenshots, accessibility audit, Vercel function behavior.

## Known issues (`@known-issue`, `test.fail()`)

These tests assert the **desired** behavior and currently fail on purpose. Playwright counts an expected failure as OK. When a bug is fixed, its test "unexpectedly passes" and the run turns red: **remove the `test.fail()` line in the fix PR.**

| Test | DESIGN.md | Current behavior (verified failure reason) |
|---|---|---|
| API error response shows the error state | BUG-02 | 500 JSON response renders "총 0건" / empty state; error text not shown |
| Space search result opens the space detail | BUG-06 | Click does nothing; URL stays `#/` |

BUG-01 (Home card link/favorite ID) was fixed in the v3 Home on 2026-11-09. Its tests are now regular regression tests in `home.spec.ts`.
BUG-03 (free/paid rule) was fixed with option D on 2026-11-09 (`utils/fee.ts`). Its test is now the regular `fee.spec.ts`.

Documented in DESIGN.md §7 but **not** turned into tests (no agreed expected behavior or UI copy yet): BUG-04 (Home has no error/empty state), BUG-05 (map data errors), BUG-07, BUG-09–11 and all A11Y items.

## Writing locators

The UI has no `data-testid` or ARIA labels yet (A11Y-02), and Stage 0.5 must not change UI code. Locators therefore use visible Korean text, roles, and a few structural anchors, with helpers in `support/test.ts`:

- Icon-only buttons are found by their Material Symbols ligature text (`favorite`, `chevron_left`).
- "Saved" state is read from the icon's `fill` class.
- EventList cards are located via the title link's ancestor `div.group`; Home cards via `.swiper-slide a`.

These are brittle by nature. When components are extracted (Stage 1+), add accessible names first, then switch the helpers to `getByRole(..., { name })`. Update only the helpers, not every spec.

## Fixtures

`fixtures/seoul-api.ts` contains **synthetic** records prefixed `[픽스처]`, not real Seoul data. Event IDs are the synthetic `cultcode`s in `HMPG_ADDR` (`9000xx`, `EV.*.id`, `fillerId(n)`); `thisWeekPlay` has no cultcode and uses the hash fallback (BUG-08). `EV.*.index` (array position) is only used to build old-format favorites in migration tests. Index 0 is a future event, 1 and 2 run today (2 is the BUG-03 case), 3 starts this week, and 4–15 are fillers for pagination. If you change the data, update `EXPECT`.
