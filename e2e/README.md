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
| `chrome.spec.ts` | v3 Header/Footer: tokens loaded, `aria-current`, keyboard search, icon names, fixed header on `/map`, footer links, mobile search icon, no overflow. |
| `event-list.spec.ts` | Total count; 12-per-page pagination (prev/next disabled states); region / genre / fee filters; reset chip; filter resets page; empty state; "상세보기" opens the right detail; FAB link; loading state; network-failure error state. |
| `search-overlay.spec.ts` | Open from header / close with 취소; grouped results (events, spaces, spots); event result → detail + overlay closes; no-result message; `nolseoul-recent` save on Enter (trimmed), de-dup, max 8, remove one, clear all, reopen shows recents. |
| `favorites.spec.ts` | `nolseoul-favorites` toggle from EventList and EventDetail; stored shape (`id` = array index, `type`, `title`, `location`, `category`, `date`, `savedAt`); persistence across reload; MyPage list, link, remove + empty state; pre-existing data from the current format still renders; corrupted JSON falls back to empty. |
| `known-issues.spec.ts` | Expected-to-fail tests for open bugs (below). |

Not covered yet: MapDiscovery (needs a Kakao SDK strategy), SpaceDetail, mobile viewports, visual screenshots, accessibility audit, Vercel function behavior.

## Known issues (`@known-issue`, `test.fail()`)

These tests assert the **desired** behavior and currently fail on purpose. Playwright counts an expected failure as OK. When a bug is fixed, its test "unexpectedly passes" and the run turns red: **remove the `test.fail()` line in the fix PR.**

| Test | DESIGN.md | Current behavior (verified failure reason) |
|---|---|---|
| API error response shows the error state | BUG-02 | 500 JSON response renders "총 0건" / empty state; error text not shown |
| Free/paid label consistent between Home and EventList | BUG-03 | Home card price shows "무료", EventList badge shows "유료" for the same event. The correct rule is still an open decision. |

BUG-01 (Home card link/favorite ID) was fixed in the v3 Home on 2026-11-09. Its tests are now regular regression tests in `home.spec.ts`.
| Space search result opens the space detail | BUG-06 | Click does nothing; URL stays `#/` |

Documented in DESIGN.md §7 but **not** turned into tests (no agreed expected behavior or UI copy yet): BUG-04 (Home has no error/empty state), BUG-05 (map data errors), BUG-07, BUG-09–11 and all A11Y items.

## Writing locators

The UI has no `data-testid` or ARIA labels yet (A11Y-02), and Stage 0.5 must not change UI code. Locators therefore use visible Korean text, roles, and a few structural anchors, with helpers in `support/test.ts`:

- Icon-only buttons are found by their Material Symbols ligature text (`favorite`, `chevron_left`).
- "Saved" state is read from the icon's `fill` class.
- EventList cards are located via the title link's ancestor `div.group`; Home cards via `.swiper-slide a`.

These are brittle by nature. When components are extracted (Stage 1+), add accessible names first, then switch the helpers to `getByRole(..., { name })`. Update only the helpers, not every spec.

## Fixtures

`fixtures/seoul-api.ts` contains **synthetic** records prefixed `[픽스처]`, not real Seoul data. Array order matters because the app uses array positions as IDs (BUG-08). Index 0 is a future event, 1 and 2 run today (2 is the BUG-03 case), 3 starts this week, and 4–15 are fillers for pagination. If you change the data, update `EXPECT`.
