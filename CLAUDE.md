# NOLSEOUL — Claude Code Project Instructions

> Draft v0.2, corrected against the local checkout of `04mmii/nol2seoul` (branch `design-system/foundations`, commit `6279fb6` = `main` at time of review) on 2026-11-03.  
> **Installing this file does not, by itself, install an agent harness, Figma MCP or automated tests.**  
> A second, older copy of this file exists at `~/Downloads/CLAUDE.md` (parent folder). It was intentionally left unchanged; if both are loaded and they disagree, **this project file takes precedence**.

## Mission

Evolve the existing NOLSEOUL React website into a documented, reusable design system, then connect Figma design decisions to code and quality checks. **Protect the working site and its public-data/map functionality.** Future React Native + Expo work is a separate phase.

**Read `DESIGN.md` before any UI or styling change.** Its `Current` inventory describes the existing interface; `Proposed` items are *not* approved for implementation without review.

## Hard rules

1. **Never edit, commit or push directly to `main`.** Work from a dedicated branch (suggestion: `design-system/foundations`), after confirming the current state. Do not create a branch or mutate remote files unless explicitly asked.
2. Do not rewrite the app, replace its dependencies, remove functionality or redesign multiple screens without an explicit scope.
3. Preserve the existing behavior of Home, Events, Event Detail, Space Detail, Map, MyPage and Search until changes are reviewed.
4. Do not expose keys. Do not place `SEOUL_API_KEY` in client code. `VITE_KAKAO_MAP_API_KEY` is a browser SDK key and still needs proper domain restrictions. **Never reference `process.env.API_KEY` / `process.env.GEMINI_API_KEY` in client code**: `vite.config.ts` `define` would inline the Gemini key into the bundle (DESIGN.md TECH-03).
5. Do not fabricate Figma specs, screenshot test results, browser validation, API availability or successful builds.
6. For every task: inspect relevant code → explain a small plan → make focused changes → run available checks → report results and limitations.
7. Favor incremental refactoring over giant AI-generated replacements. Show the user what was changed and why.
8. Known bugs and accessibility issues are tracked in `DESIGN.md` §7 (`BUG-*`, `A11Y-*`, `TECH-*`). **Do not fix them opportunistically inside a visual/design-system ticket**; each fix changes behavior and needs its own ticket, review and (for IDs/favorites) a data migration.

## Repository facts (verified at `6279fb6`)

- React 19, TypeScript, Vite 6, React Router DOM 7 (`HashRouter` in `App.tsx`), TanStack Query 5. (Swiper was removed 2026-11-10, TECH-13.) `gsap` is listed in `package.json` but **imported nowhere**.
- `index.html`:
  - loads Tailwind via **runtime CDN** with `forms`, `typography`, `container-queries` plugins, and an inline `tailwind.config` (colors, `fontFamily.sans`, `darkMode: 'class'`). There is no compiled Tailwind, `tailwind.config.js` or tokens package.
  - loads Google Fonts (Plus Jakarta Sans 400–800, Noto Sans KR 300–900) and Material Symbols Outlined; inline global CSS (`.material-symbols-outlined`, `.fill`, `.no-scrollbar`, global `word-break: keep-all`).
  - contains a leftover `esm.sh` import map (react, react-dom, react-router-dom); Vite bundles these, so it appears unused (not browser-verified).
  - references `/index.css`. On `main` it does not exist; on `redesign-v3` it holds the **v3 design tokens** (CSS variables as RGB channels), which `tailwind.config` maps to classes (`bone`, `ink`, `tangerine`, `font-body`, `max-w-shell`, `px-gutter`, …). Fonts on `redesign-v3` also load Space Grotesk, JetBrains Mono (Google Fonts) and Pretendard (jsdelivr).
- `App.tsx` defines site shell + `Header` + `Footer` + routes, and owns `SearchOverlay` open state.
- `pages/`: `Home.tsx`, `EventList.tsx` (contains local `DropdownFilter`), `EventDetail.tsx`, `SpaceDetail.tsx`, `MapDiscovery.tsx`, `MyPage.tsx`.
- `components/`: `SearchOverlay.tsx` (v3 search panel; data shaping in `components/search/`), v3 screens under `components/<screen>/`, shared v3 pieces in `components/v3/`. (`NightSpotCard.tsx` was removed with TECH-13.)
- `hooks/`: `useEvents`, `useCulturalSpaces`, `useNightViewSpots` (all via `useReactQuery`), `useFavorites`, `useKakaoLoader`, re-exported from `hooks/index.ts`. Data fetchers do **not** check `res.ok` (see BUG-02). `useFavorites` keeps per-instance `useState` (no cross-instance/tab sync).
- `api/seoulapi.ts`: Vercel serverless proxy for Seoul data: `event`, `space`, `night`. Logic lives in `api/_lib/seoulApi.ts` (shared with the Vite dev server). **Decision (TECH-10): fetch every page of all three APIs + 24 h CDN cache (`s-maxage=86400, stale-while-revalidate=86400`); events are limited to running today (KST) + starting within 3 months.** Reason: long-running events can be anywhere in the API's order, and the cache keeps Seoul API calls to about one refresh a day. The proxy returns only the fields in `FIELDS` (add a field there before the UI reads it). `useEvents` also drops events ended before today (KST) via `dropEndedEvents`, so a stale cache never shows them. Returns JSON `{ error }` with 4xx/5xx on failure. Tests: `e2e/api-proxy.spec.ts`.
- `data/night-manual-rules.json`: MANUAL operating-time rules for night spots (not API data); only `enabled: true` entries apply; record `source`. Night status words: "켜진 곳" = 점등 중 only, "갈 수 있는 곳" = 운영 중 — keep the night page, map and Live Bar on these definitions.
- `scripts/match-night-photos.mjs` → `data/night-photos.json`: one-off matcher for 한국관광공사 night photos. `TOUR_API_KEY` (in `.env.local` / Vercel env, never `VITE_`) is used only by this script; the app reads the committed JSON and never calls the tourism API. Re-run with `--cache` to change criteria without API calls (daily limit 1,000; one full run ≈ 120 calls).
- `types.ts`: domain models (`Event`, `CulturalSpace`, `NightViewSpot`, unused `EventItem`/`UserProfile`) and browser Kakao map interfaces. `Event` has no unique ID field.
- `index.tsx`: TanStack Query defaults: stale 5 minutes, GC 30 minutes, retry once, no refetch on window focus.
- `vite.config.ts`: dev server port 3000, `/api/seoulapi` served by a dev/preview middleware that calls the same `api/_lib/seoulApi.ts`, `@` alias, and a leftover `define` for `GEMINI_API_KEY` (TECH-03).
- `package.json`: scripts `dev`, `build`, `preview`, plus (Stage 0.5) `typecheck` (`tsc --noEmit`), `test:e2e`, `test:e2e:smoke` (excludes `@known-issue`), `test:e2e:report`. No lint script, no unit tests.
- `e2e/` + `playwright.config.ts`: Playwright smoke tests (Chromium desktop only) with synthetic Seoul API fixtures and a fixed clock; see `e2e/README.md`. `@known-issue` tests are `test.fail()` records of open bugs. Tests still need internet for Tailwind CDN and Google Fonts.
- Checks at `6279fb6`: `npx tsc --noEmit` passes with 0 errors; `vite build` succeeds with the `/index.css` warning. No automated tests exist. Browser behavior was not verified.
- Local `dist/` is a stale, gitignored artifact; don't use it as evidence of current output.

## UX and code preservation constraints

- Maintain current routes (`/`, `/events`, `/event/:id`, `/space/:id`, `/map`, `/night` (added 2026-11-10), `/mypage`) and external API response contracts unless migration is approved.
- Preserve search, category/region/fee filters, pagination, event/space data, favorites and map markers/overlays.
- Preserve loader, error and empty states; expand them where needed. Note that these states are **incomplete today**: Home has no error/empty state, MapDiscovery shows only the Kakao SDK error, and API failures generally render as *empty* rather than *error* because fetchers ignore HTTP status (DESIGN.md §4.7, BUG-02/04/05).
- `useFavorites.ts` stores data in `localStorage` under `nolseoul-favorites`; `SearchOverlay.tsx` stores recent searches under `nolseoul-recent`. If changing persistence, design a migration and verify old data.
- Event IDs (BUG-08, resolved 2026-11-09): always use `eventId(e)` / `findEventById` from `utils/eventId.ts` (cultcode from `HMPG_ADDR`, hash fallback) for event routes and favorites. Never use `events.indexOf` or `events[Number(id)]` for events. Old favorites are migrated once by `useFavoritesMigration` (backup in `nolseoul-favorites-v1-backup`); don't remove the migration or the backup without a plan. Spaces and night spots use `spaceId` / `spotId` / `findSpace` / `findSpot` from `utils/placeId.ts` ("s<NUM>" / "n<NUM>", 2026-11-11); never use array indexes as their IDs. Old space/spot favorites are migrated once by `usePlaceFavoritesMigration` (backup `nolseoul-favorites-v2-backup`, flag `nolseoul-favorites-places-version`). `NUM` stability across API updates is not verified over time — re-check if favorites start showing as unavailable.
- Fee rule (BUG-03, resolved 2026-11-09 with option D): always classify fees with `utils/fee.ts` (`feeKind`, `isFree`, `feeLabel`) and show them with `components/v3/FeeBadge.tsx` (무료/유료/일부 무료/가격 상이; 확인 필요 = fee text, no badge). Never re-derive "free" from `IS_FREE` or `USE_FEE` in a page.
- Known technical risk: `MapDiscovery.tsx` (~680 lines) has intertwined map state, markers and presentation; refactor gradually with regression checks. Marker colors are hardcoded hex in TS and conflict with Home/Search category colors (DESIGN.md §2.4).
- Known technical risk: `index.html` loads CDN Tailwind, a leftover import map and a missing `/index.css`; check actual build/runtime behavior before moving to compiled Tailwind.
- Existing static links/buttons are placeholders (header heart/bell, 9 footer `href="#"` links, newsletter, MyPage profile/menu/membership, search results for spaces/spots, single-tab bars on detail pages). They are listed in DESIGN.md §3; decide whether to implement or label/remove rather than inventing backend functionality.

## Design-source hierarchy

0. **Redesign v3 (`design-ref/`) is approved (2026-11-09)** as the visual source of truth for tokens, type and layout. It replaces the legacy palette/fonts. Its prototype code (global `window` + Babel) is reference only; port it into typed React components and never copy it wholesale. Its dummy data (`data.jsx`) must not replace real API data. Out of scope until separately approved: 스토리 page, AI course remote (야경명소 page `/night` and the Live Bar ticker — real data only — approved and built 2026-11-10) (it needs a server API and key design), footer social column. Apply v3 **one screen per change** on branch `redesign-v3`. Done so far: tokens + Header/Footer, Home, EventDetail, EventList, Map, Search panel (2026-11-11; BUG-06 fixed), MyPage (2026-11-11), Night (`/night`, new route approved 2026-11-10; header nav 홈 / 문화행사 / 지도탐색 / 야경명소 / 마이페이지). Shared building blocks: `components/v3/EventCard.tsx` (styles in `styles/v3.css`) and `utils/event.ts` (dates, price, status, coordinates) + `utils/fee.ts` (fee kind). Never render data the API doesn't provide (reviews, ratings, like counts, curator notes); omit it or show an empty state. Conventions: shared v3 primitives in `styles/v3.css` (`.v3-btn`, `.v3-eyebrow`, `.v3-shell`, …), screen styles in `components/<screen>/<screen>-v3.css` with `v3-` prefixed classes, data selection in pure `selectors.ts`, non-API content/copy in `constants/<screen>.ts`. Migrated pages must use `.v3-shell` (= `--v3-content-max` 1400px + gutters) so every section shares one content width. Only backgrounds may go full-bleed (see DESIGN.md §2.0 "Layout rule"). Posters: event card thumbnails are 3:4 `object-fit: cover` anchored top; no text over posters — **except the Home Hero banner** (cover + bottom 45% gradient + caption with a category chip; DESIGN.md §2.0 Poster rule). Colour states follow DESIGN.md §2.0.1 (approved): opaque state tokens only (never fade tangerine with alpha), tangerine only in the 9 listed uses, text on tangerine is always ink (`--v3-accent-ink`), small accent text on bone uses `--v3-accent-text`.
1. Explicitly approved task requirements and accepted Figma frames/Variables.
2. `DESIGN.md` approved design decisions.
3. Current code and current UI for unchanged areas.
4. Proposals and AI-generated alternatives **only after review**.

When sources disagree, **ask or flag the conflict**; do not silently override brand colors, spacing or implementation constraints.

## Workflow for each UI ticket

### A. Before editing
- State target route/frame, desired UX outcome, files likely touched, and behavior to preserve.
- Read `DESIGN.md` (inventory §2–4, open backlog items for the target screen in §7, open decisions in §12), relevant components/pages, and current tokens.
- Only use tokens labelled **Current** as existing design decisions; **Unused** tokens and **Proposed** mappings need approval first.
- Confirm branch is not `main`; inspect `git status` and avoid overwriting uncommitted work.
- If a Figma frame is supplied, fetch it via a *configured* Figma MCP; verify access before claiming to use it.

### B. Implement
- Reuse common components and existing hooks where practical.
- Create semantic design tokens instead of adding arbitrary hardcoded colors for every new component.
- Introduce component props/variants based on real needs; avoid premature abstraction.
- Keep JSX accessible: semantic buttons/links, labels, focus styles, keyboard interactions.
- Do not modify the serverless proxy or map integration for a purely visual task.
- Keep changes restricted to one screen/pattern per iteration.

### C. Validate
- Run `npm run build` if dependencies/environment permit. If not, report why. `npm run build` overwrites `dist/`; when a task forbids modifying files, build to a temp directory instead (`npx vite build --outDir <tmp> --emptyOutDir`). The `/index.css doesn't exist at build time` warning is pre-existing (TECH-01).
- Where possible run TypeScript checking (e.g., `npx tsc --noEmit`) without hiding errors.
- Run `npm run typecheck` and `npm run test:e2e`. Report smoke results and known-issue results separately. A green run means "no regression in covered flows", **not** "the app works"; the map, SpaceDetail, mobile layouts and visuals are not covered. Never claim tests passed solely because a build passed.
- If a `@known-issue` test starts passing unexpectedly, report it; remove its `test.fail()` only in the PR that intentionally fixes that bug.
- If a UI change breaks a smoke locator (text/structure based), fix the helper in `e2e/support/test.ts` and explain why. Don't weaken the assertion.
- Manually or with configured browser tooling verify affected routes, console errors, real/fixture data, mobile view, search/filter/favorite behavior and any affected map features.
- Figma screenshot comparison requires actual frame/viewport references and a configured capture tool; do not claim pixel-perfect parity from code inspection alone.

### D. Report back
Summarize: changed files; behavior intentionally preserved; checks executed + pass/fail/not run; screenshots or evidence if available; remaining risks; suggested next small task.

## Design harness — incremental rollout

**Stage 0: Documentation** — v0.2 corrected against code (2026-11-03), pending review.
- `DESIGN.md` (current inventory with Current/Unused/Proposed labels, component variants, improvement backlog).
- `CLAUDE.md` (agent workflow, safety rails, verification requirements).

**Stage 0.5: Regression safety net — minimal version installed (2026-11-04), pending review**
- Done: `typecheck` script; Playwright smoke tests with fixture-intercepted `/api/seoulapi` for Home, EventList, SearchOverlay and favorites/MyPage; known bugs recorded as `@known-issue` expected failures. Runs locally only. **No CI.**
- Not done yet: MapDiscovery (SDK-error state first), SpaceDetail, mobile viewports, baseline screenshots (375/390/768/1440), axe-core baseline, CI. Don't describe these as active.

**Stage 1: Code foundations**
- Introduce semantic source tokens after audit, then align them with Tailwind and Figma Variables.
- Extract one reusable component at a time, starting with `EventCard`, buttons or filters.
- Keep UI changes reviewable and reversible.

**Stage 2: Figma ↔ code handoff**
- Build a properly structured Figma file; HTML import is only an intermediate reference.
- Configure Figma MCP in the user's development environment; verify tool access, permissions and frame IDs.
- Map approved variables and component variants to existing React. Do not regenerate the entire app by default.

**Stage 3: Automated gates**
- Add tests deliberately, e.g. React Testing Library for components, Playwright for route/interaction regression and viewport screenshots, accessibility audit tooling.
- Establish baseline screenshots and tolerances **only after** stable fixtures, browser/tool config and viewport definitions exist.
- Optionally add CI checks for build, type-check, tests, accessibility and screenshot diff. Don't describe them as active until they are installed and actually run.

**Stage 4: Native extension (future)**
- Extract portable domain/data logic and API contracts into shared modules.
- Use Expo/React Native with native navigation, storage and map integrations. Browser-specific UI and Kakao web SDK require platform-specific work.

## Suggested next tickets (small, reviewable)

Token inventory and component states (formerly step 2 of the first ticket) are now in `DESIGN.md` v0.2.

1. ~~`Add typecheck script and fixture-based Playwright smoke tests`~~ (Stage 0.5, minimal version done). Follow-ups: mobile viewport project, map SDK-error smoke, screenshot + axe baselines.
2. **`Design review of DESIGN.md §12 decisions`** — brand contrast, category colors, free/paid rule. Human decision; no code.
3. **`Figma EventCard + DropdownFilter`** — build Figma versions with Auto Layout and variants based on DESIGN.md §4.1/§4.3.
4. After design approval, extract React components one at a time *without changing current API or route logic*; capture mobile + desktop screenshots and check filter, pagination, detail links and favorites.
5. Separately, bug tickets from DESIGN.md §7 (recommended first: BUG-02 error handling; BUG-01/BUG-08 stable IDs + favorites migration).
6. **Next (recorded 2026-11-10):** ~~map pin clustering (TECH-12, done 2026-11-10)~~; ~~remove the unused `NightSpotCard.tsx` and Swiper (TECH-13, done 2026-11-10)~~. (TECH-14, the disabled Kakao map service, was fixed by the owner on 2026-11-10.)

## Useful commands (only after checkout in a local project)

```bash
npm install
npm run dev
npm run build
npx tsc --noEmit
```

The Vite dev server and the Vercel function now share `api/_lib/seoulApi.ts`, but the Vercel runtime (ESM import with `.js` extension, env vars, CDN cache) still needs checking on a deploy when API behavior is in scope. Never commit `.env.local` or credentials.

## Change-request template

```text
Goal:
Target screen / Figma frame:
Existing behavior to preserve:
Approved visual changes:
Out of scope:
Acceptance criteria:
Validation performed / not performed:
```

---
**Document maintenance:** revise instructions after actual Figma/MCP/test tooling is connected; record changes in PRs. Re-verify "Repository facts" against the current commit when code changes. A markdown file alone is not a self-running design harness.

**Changelog**
- v0.2 (2026-11-03): Corrected repository facts (unused GSAP, import map, missing `/index.css`, `define` key risk, two NightSpot components, fetcher error handling, verified tsc/build results); added backlog rule (hard rule 8), Home index bug, free/paid inconsistency, incomplete status states, placeholder list, temp-dir build guidance, Stage 0.5 safety net, updated next tickets; noted the unchanged parent-folder copy.
- v0.1 (2026-11-03): Initial draft.
