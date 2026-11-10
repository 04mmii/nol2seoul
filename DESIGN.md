# NOLSEOUL — Design System Working Specification

> Status: **Draft v0.2 / current-code audit (corrected)**
> Source: local checkout of `04mmii/nol2seoul`, branch `design-system/foundations` at commit `6279fb6` (identical to `main` / `origin/main` at time of audit), reviewed 2026-11-03.
> Purpose: Document the existing UI accurately, then evolve it into a Figma ↔ React design system.
> **Do not mistake proposals below for already implemented components or approved Figma designs.**

### Status labels used in this document

| Label | Meaning |
|---|---|
| **Current** | Exists in code *and* is actually used by the UI today. |
| **Unused** | Defined in code (e.g. in `tailwind.config`) but referenced by no UI code. Safe to keep; not evidence of a design decision. |
| **Proposed** | Suggested by this document. Not implemented, not approved. Requires review before code changes. |
| **Implemented** | A Proposed item that has since been approved and merged (link the PR). *Nothing is Implemented yet.* |

Usage counts below are `grep` counts of class names in `App.tsx`, `pages/` and `components/` at commit `6279fb6`. They indicate scale, not exact rendered instances.

---

## 1. Product and design intent

NOLSEOUL is a Seoul culture discovery service for exploring events, cultural spaces and night-view spots through search, lists and a Kakao map.

**Existing product experience:** Home → event list / search / map → event or space details → favorites (MyPage). Preserve functionality as the visual system evolves.

**Design principles (Proposed; validate in Figma):**
1. **Discoverable:** make category, district, price and geography legible at a glance.
2. **Consistent:** identical meanings use identical colors, spacing, variants and states.
3. **Accessible:** keyboard and screen-reader semantics, clear focus indicators, sufficient contrast and usable tap targets.
4. **Responsive:** support narrow mobile screens without depending on hover interactions.
5. **Data-resilient:** loading, error, empty, missing images and long Korean names have explicit states.

---

## 2. Current foundations inventory (verified in code)

### 2.0 Redesign v3 — approved direction (2026-11-09)

The owner approved **Redesign v3** (`design-ref/`: `NOLSEOUL Redesign v3.html`, `src/styles-v3.css`) as the new visual source of truth. **v3 tokens replace the legacy palette and fonts below (`primary #ff6933`, navy, Plus Jakarta Sans/Noto Sans KR).** Migration happens one screen at a time on branch `redesign-v3`.

**Scope decisions:** apply v3 to the existing 6 routes only. v3's new features (LiveBar, 야경명소 page, 스토리 page, AI course-recommendation remote, social footer column) are **out of scope** for now.

| v3 token | Value | Tailwind class | Status |
|---|---|---|---|
| `--v3-bone` / `--v3-bone-2` | `#f6f2ea` / `#efe9dd` | `bone`, `bone-2` | **Implemented** (Header/Footer) |
| `--v3-sand` | `#ddd5c5` | `sand` | **Implemented** (avatar) |
| `--v3-ink` / `--v3-ink-2` | `#14130f` / `#3d3931` | `ink`, `ink-2` | **Implemented** |
| `--v3-mute` | `#6b6559` | `mute` | **Implemented** |
| line / line-strong | ink @ 16% / 34% | `line`, `line-strong` | **Implemented** |
| `--v3-tangerine` | `#e2542f` | `tangerine` | **Implemented** (fills, large type only) |
| `--v3-tangerine-deep` | `#b13c1b` | `tangerine-deep` | Defined; for small text on bone |
| `--v3-night` / `--v3-night-2` | `#111d38` / `#1b2a4c` | `night`, `night-2` | Defined |
| `--v3-ember` | `#e8b781` | `ember` | **Implemented** (footer link hover) |
| `--v3-electric`, `--v3-acid` | `#24356e`, `#e8c98b` | — | Defined (legacy in v3 itself) |
| **`--v3-content-max`** | **1400px** | via `.v3-shell` / `max-w-shell px-gutter` | **Implemented — the shared content width** (see "Layout rule" below) |
| `--v3-gutter` | 40px (≤1280px: 28px) | `px-gutter` | **Implemented** |
| `--v3-maxw` | `calc(--v3-content-max + 2 × --v3-gutter)` (derived) | `max-w-shell` | **Implemented**. Outer box of the shell; don't set it directly. |
| `--v3-font-sans` | Pretendard Variable | `font-body` | **Implemented** (Header/Footer) |
| `--v3-font-display` | Space Grotesk | `font-display` | **Implemented** (logo) |
| `--v3-font-mono` | JetBrains Mono | `font-mono` | **Implemented** (Footer labels) |
| `--v3-font-serif` | Instrument Serif | `font-serif` | Defined; font **not loaded** yet |

**Layout rule (approved 2026-11-09): one content width for every section.**
- All text and images sit inside `--v3-content-max` (1400px), centred, with `--v3-gutter` on both sides. Reference = the Home event list.
- In CSS use `.v3-shell`. In Tailwind use `max-w-shell mx-auto px-gutter`. Don't add other `max-w-*` containers to pages.
- Backgrounds may run full-bleed (edge to edge). Whole-width sections (After Dark, Footer) paint their own box with a `.v3-shell` inside. Split sections (Hero banner, Map Promo) extend a column's colour to the viewport edge with `box-shadow: 0 0 0 100vmax <color>; clip-path: inset(…)`. This doesn't create horizontal scroll.
- **Exception — map page (`/map`, approved 2026-11-09):** full viewport width (sidebar 380px + Kakao map), no `.v3-shell`; the map is a full-screen tool.
- Category strip cells keep their full padding (34px 32px 36px) on every side; the strip's box lines sit on the content edges and the hover fill matches the cell box (decision 2026-11-09, replaces "outer cells drop their outer padding").
- Verified on Home at 1440 / 1100 / 390px: every section's content edge equals the event list edge (left 40/28/28px, right 1400/1072/362px), and page overflow is 0.

**Poster rule:** event card thumbnails (Home grid, EventDetail "다음으로 가볼 곳") are a fixed **3:4 box with `object-fit: cover`, `object-position: top center`** (decision 2026-11-09, replaces contain + bone-2 letterbox). Never put text over a poster. **Hero 배너는 예외: cover + 하단 그라디언트 + 캡션** (poster fills the banner with `object-fit: cover`; a bottom gradient over 45% of the banner height, transparent → `night` 70% at 40% of the band → 92%; category/title/meta caption and controls overlaid inside it with `text-shadow: 0 1px 2px rgba(0,0,0,.4)`; the top half of the poster stays uncovered). Card titles clamp at 3 lines; event grids use `repeat(4, minmax(0, 1fr))` (≤1100px: 2 columns) so columns are always equal, and `grid-auto-rows: 1fr` so all cards share one height. Card dates use the design-ref compact format **"11.01 — 11.05"** (`utils/event.ts` `eventCardDate`): one date when start = end ("11.01"); only when the years differ does the end date carry a 2-digit year ("12.20 — 26.01.10"). Applies to every card at every width; at ≤560px the separator shrinks to "–" ("11.01–11.05") so the date and the fee badge share one line (CSS swaps two spans; only one is ever in the accessibility tree). Detail pages keep the full dates. Card date and price stay on one line; the price shrinks first and ends in "…" (full price in the `title` attribute).

Source files: `index.css` (CSS variables, RGB channels) → `index.html` `tailwind.config` (classes with opacity support). Legacy tokens stay in the config until every screen is migrated, then get removed.

**v3 contrast (computed, WCAG formula):** ink on bone 16.65, ink-2 on bone 10.29, mute on bone 5.18, tangerine-deep on bone 5.33, white on tangerine-deep 5.95 ✅ · tangerine on bone **3.39**, white on tangerine **3.79** → large/bold type only (v3's own rule) · footer legal text raised from bone 45% (4.17 ❌) to **55% (5.67 ✅)** by decision (§12).

### 2.0.1 State & accent layer — **Approved (2026-11-09)**

Applied on Home (2026-11-09). Other screens adopt it when they are migrated. Tokens live in `index.css`.

**Rule: no translucent brand colour.** Don't fade tangerine with alpha (e.g. `tangerine / 0.7`) to make a lighter or "hover" shade. Every state colour is its own **opaque** token. `accent-tint` is a solid hex mixed in advance (tangerine 8% on bone), not `tangerine / 0.08`.

#### State tokens

| Token | Value | Use | Contrast (computed) |
|---|---|---|---|
| `--v3-accent` | tangerine `#e2542f` | Accent fill/colour — only the uses listed below | ink on it 4.91 ✅ |
| `--v3-accent-hover` | tangerine 100% `#e2542f` | Hover of accent-bearing controls (primary CTA, category cell) | ink on it 4.91 ✅ |
| `--v3-accent-press` | tangerine-deep `#b13c1b` | Hover/press step on something that is already an accent fill (C5) | — |
| `--v3-accent-tint` | `#f4e5db` (= bone + 8% tangerine, opaque) | Event card hover background; ring around the map highlight pin | ink 15.12 · ink-2 9.34 · mute 4.70 · accent-text 4.84 · tangerine text 3.08 ❌ (don't) |
| `--v3-accent-ink` | **ink** `#14130f` | Text and icons on accent fills, **any size** (C1) | 4.91 ✅ |
| `--v3-accent-text` | tangerine-deep `#b13c1b` | **Small text on bone only** (free price, breadcrumb, detail category) (C3) | on bone 5.33 ✅ |
| focus ring | 2px solid `currentColor`, offset 2px (`.v3-focus`, `.v3-btn`) → ink on light surfaces, bone on dark (hero banner, After Dark, footer) | Keyboard focus on every interactive element | ink on bone 16.65 |
| line-hover | line-strong (ink 34%) | Hover border of neutral controls (Day Pill) | (existing token) |

#### Where tangerine may be used (exhaustive)

| # | Use | Form |
|---|---|---|
| 1 | CTA buttons | primary: ink fill → hover `accent-hover` fill + ink text |
| 2 | Active nav underline | `inset 0 -2px 0 tangerine` |
| 3 | Category cell hover | accent 100% fill + ink text, ↗ shown |
| 4 | Category chip (분류 칩) | accent fill + ink text (Hero category line) |
| 5 | Section title emphasis | `em` in `.v3-section-title` / `.v3-sub-title`, and the Hero serif "*in*" |
| 6 | Favourite active (찜 활성) | heart button / 찜됨 button: accent fill + ink icon/text |
| 7 | Signature block (대표 블록) | Map Promo left panel (ink text) |
| 8 | Brand mark | footer wordmark dot "놀 서울**.**" |
| 9 | Map highlight pin (지도 강조 핀) | accent dot + opaque `accent-tint` ring (replaces the 18% translucent halo) |
| 10 | Fee badge — 무료 (요금 배지) | `accent-text` (tangerine-deep) fill + **white** text (5.95). The only white-on-tangerine-family pair; it uses the deep shade, so it passes 4.5 at 10px. Partial (일부 무료) uses `accent-text` as outline + text only. |

**Nothing else uses tangerine.** `accent-text` (tangerine-deep) is a separate token for small text on bone and isn't counted in this list, except as the 무료 fee badge fill (#10).

**Night on fee badges (2026-11-09):** `--v3-night` (#111d38) is also a fee-badge colour on light surfaces: 유료 = night fill + white text (16.71); 가격 상이 = night outline + night text (14.97 on bone, 13.59 on `accent-tint`).

#### Component states

| Component | Default | Hover | Active / selected | Focus (keyboard) |
|---|---|---|---|---|
| **Button — primary** | ink fill, bone text | `accent-hover` fill, **ink** text | — | focus ring |
| **Button — secondary** | transparent, 1px ink border, ink text | ink fill, bone text | — | focus ring |
| **Button — toggle (찜)** | secondary look, "찜하기" | as secondary | `aria-pressed=true`: accent fill, ink text, "찜됨" | focus ring |
| **Event card** | bone background, line borders | `accent-tint` background | heart active: accent fill, ink icon | 2px ink outline inset (`:focus-within`) |
| **Category cell** | bone background, ink text, ↗ hidden | accent 100% fill, ink text (num, label, desc), ↗ shown | — | same as hover + focus ring |
| **Day Pill** | transparent, 1px line border | line-hover border | `aria-pressed=true`: ink fill, bone text (no tangerine) | focus ring |
| **Category chip (분류 칩)** | accent fill, ink text, mono 11px uppercase, padding 4px 8px, radius 2px, no text-shadow | — (not interactive on its own) | — | parent link has the focus ring |
| **Fee badge** (무료 / 유료 / 일부 무료 / 가격 상이) | mono 10px, 1px border, radius 2px. 무료 = `accent-text` fill + white (5.95); 유료 = night fill + white (16.71); 일부 무료 = transparent, `accent-text` outline + text (5.33 on bone, 4.84 on accent-tint); 가격 상이 = transparent, night outline + text (14.97). On photos (`.v3-fee--on-media`, EventList) the outline badges get an opaque bone backing. 확인 필요 = plain fee text, no badge | — (not interactive) | — | — |
| **Hero category line** | uses the category chip | — | — | — |

#### Decisions (2026-11-09)

- **C1:** text on tangerine is always ink (`accent-ink`, 4.91), whatever the size. Applies to primary button hover, category cell hover, category chip, favourite active.
- **C2:** keep the Hero "*in*", Map Promo panel, footer dot and map highlight pin, and add them to the use list (5, 7, 8, 9). The pin's translucent halo becomes an opaque `accent-tint` ring.
- **C3:** tangerine-deep becomes the separate token `accent-text`, for small text on bone only.
- **C4:** `accent-tint` is a pre-mixed opaque hex (`#f4e5db`); no tangerine text on it.
- **C5:** `accent-hover` equals `accent`. On something that is already an accent fill, use `accent-press` for a hover step.

### 2.1 Where styles come from today

| Item | Current state | Location |
|---|---|---|
| Tailwind | Runtime **CDN** build (`cdn.tailwindcss.com`) with plugins `forms`, `typography`, `container-queries`. No compiled Tailwind, no `tailwind.config.js`, no PostCSS. | `index.html:8` |
| Theme config | Inline `tailwind.config` script (colors + `fontFamily.sans`). `darkMode: 'class'` is set. | `index.html:11-38` |
| Global CSS | Inline `<style>`: Material Symbols settings, `.fill` variant, `.no-scrollbar`, global `* { word-break: keep-all; overflow-wrap: break-word; }`. | `index.html:39-51` |
| `/index.css` | ~~Referenced but missing~~ → **created on `redesign-v3`** as the v3 token file; build warning gone (TECH-01 resolved there). | `index.css` |
| Import map | Leftover `esm.sh` import map for `react`, `react-dom`, `react-router-dom`. Vite bundles these packages, so the import map appears unused at runtime (not browser-verified). | `index.html:52-61` |
| Bundled CSS | v3 CSS files (`index.css`, `styles/v3.css`, `components/*/…-v3.css`) bundled by Vite. Swiper and its CSS were removed 2026-11-10 (TECH-13). | `index.tsx`, page components |
| Map marker colors | Hardcoded hex constants in TS (Tailwind classes cannot be used inside SVG data URLs). | `pages/MapDiscovery.tsx:13-18` |

### 2.2 Theme color tokens (`tailwind.config`)

| Token (class name) | Hex | Usage in UI code | Status | Notes |
|---|---|---|---|---|
| `primary` | `#ff6933` | `text-primary` 81, `bg-primary` 32, `border-primary` 12, plus many `/5`–`/80` opacity variants | **Current** | Main accent, active state, CTA background. See contrast warning §2.4. |
| `primary-dark` | `#e6511a` | `hover:bg-primary-dark` 5 | **Current** | Only used as hover. A second hover pattern, `hover:brightness-110`, is used 5 times. |
| `primary-light` | `#ff8a5c` | 0 | **Unused** | |
| `navy` (DEFAULT) | `#1A2E4A` | `text-navy` 41, `bg-navy` 4, `from-navy/80`, `via-navy/40`, `bg-navy/80`; also `body` text color | **Current** | Text, logo wordmark, inverse surfaces (Home promo card, "상세보기" button, category badge). |
| `navy-900` | `#1A2E4A` | 0 | **Unused** | Same value as `navy` DEFAULT; redundant alias. |
| `navy-50` | `#f0f4f8` | 0 | **Unused** | |
| `background-light` | `#f8f6f5` | `bg-background-light` 2 (`<body>`, MyPage stat-card tab) | **Current** | Page background. |
| `background-dark` | `#101322` | 0 | **Unused** | `darkMode: 'class'` is configured but there are **0 `dark:` classes**. There is no global dark mode. |

### 2.3 Colors used outside the theme (Current, not centralized)

These are real, visible colors that bypass the theme tokens. They must be inventoried before any token migration.

| Family | Approx. count | Where / role |
|---|---|---|
| `gray-*` | ~245 | Everywhere. Main shades: `text-gray-400` 41, `border-gray-100` 35, `text-gray-300` 31, `text-gray-500` 30, `bg-gray-100` 26, `bg-gray-50` 14, `text-gray-600` 12. Night mode surfaces: `bg-gray-800` 12, `bg-gray-900` 8, `border-gray-700` 7. |
| `white` | ~108 | Surfaces, text on dark/brand backgrounds, translucent overlays (`bg-white/80`, `/50`, `/20`). |
| `indigo-*` | ~59 | Map night mode (`야경명소`) state and NightSpot cards: `text-indigo-400` 16, `text-indigo-300` 9, `bg-indigo-600` 6 (active chip / saved), gradients `from-indigo-950`. Home & Search also use indigo for the 야경명소 icon. |
| `violet-*`, `slate-*` | 3 / 2 | NightSpot gradient `from-indigo-950 via-slate-900 to-violet-950`. |
| `blue-*` | 8 | 문화공간 identity on Home quick-nav card and Search results. |
| `red-*` | 3 | Map SDK error icon (`text-red-400`), MyPage logout (`text-red-500`, `hover:bg-red-50`). |
| `black` | 3 | Image scrims (`from-black/80`), slide counter (`bg-black/30`). |
| Hex in TS | 5 | `MARKER_COLORS`: `#ff6933` (duplicate of `primary`), `#10b981`, `#8b5cf6`; `SELECTED_COLOR` `#ef4444`; fallback `#ff6933`. |

### 2.4 Category color conflict (Current — needs decision)

The same content category is shown in different colors depending on the screen:

| Category | Home quick-nav / Search | Map chip (active) | Map marker | NightSpot cards |
|---|---|---|---|---|
| 문화행사 | `primary` | `bg-primary` | `#ff6933` (= primary) | — |
| 문화공간 | **`blue-600` / `blue-500`** | `bg-primary` | **`#10b981` (emerald)** | — |
| 야경명소 | `indigo-600` / `indigo-500` | `bg-indigo-600` | **`#8b5cf6` (violet)** | indigo / violet gradient |
| Selected marker | — | — | **`#ef4444` (red)**, not in any palette | — |

### 2.5 Contrast check of current pairs (computed, not tool-audited)

Computed with the WCAG 2.x relative-luminance formula from hex values. Not yet confirmed with a browser accessibility tool. AA requires 4.5:1 for normal text, 3:1 for large text (≥24px, or ≥18.66px bold) and UI components.

| Pair (foreground on background) | Ratio | AA normal text | Where used |
|---|---|---|---|
| white on `primary` `#ff6933` | **2.87** | ❌ (also fails 3:1 large) | Primary buttons, active chips, badges, pagination current page |
| white on `primary-dark` `#e6511a` | 3.78 | ❌ (passes large only) | Hover state |
| `primary` on white | **2.87** | ❌ | Active nav link, category labels, prices, highlighted info |
| `primary` on `background-light` | 2.66 | ❌ | — |
| `gray-300` `#d1d5db` on white | **1.47** | ❌ | Inactive hearts, empty-state icons, some meta text (`text-gray-300` ×31) |
| `gray-400` `#9ca3af` on white | **2.54** | ❌ | Meta text, labels, breadcrumbs, placeholders (`text-gray-400` ×41) |
| `gray-400` on `gray-100` | 2.31 | ❌ | Header search placeholder |
| `gray-500` `#6b7280` on white | 4.83 | ✅ | Secondary body text |
| white on `gray-500` | 4.83 | ✅ | "유료" badge |
| `navy` on white / white on `navy` | 13.69 | ✅ | Primary text, navy buttons |
| white on `indigo-600` | 6.29 | ✅ | Night-mode active chip |
| `indigo-400` on `gray-900` | 5.95 | ✅ | Night-mode labels |

**Brand values must not be changed silently.** This table is input for a design decision (see §9).

### 2.6 Typography (Current)

| Item | Current state |
|---|---|
| Families | `font-sans` = `Plus Jakarta Sans`, `Noto Sans KR`, `sans-serif` (`index.html:33`). Plus Jakarta Sans has no Hangul glyphs, so Korean text renders in Noto Sans KR; Latin/digits render in Plus Jakarta Sans. |
| Loaded weights | Plus Jakarta Sans **400–800**; Noto Sans KR **300, 400, 500, 700, 900** (`index.html:9`). |
| Used weights | `font-bold` 115, `font-black` (900) **44**, `font-medium` 15, `font-extrabold` 4. `font-black` Latin text has no loaded 900 weight in Plus Jakarta Sans → browser synthesis/fallback (not visually verified). `font-semibold` (600) is loaded but unused. |
| Sizes | Tailwind scale `text-xs` … `text-5xl`, plus arbitrary **`text-[10px]` ×19**, **`text-[11px]` ×7**, `text-[18px]` ×2 (icon size). 10–11px text is used for badges, labels and meta information. |
| Letter-case styling | `uppercase tracking-widest` labels on Korean text (no visual effect on Hangul; affects Latin only). |
| Icons | Material Symbols Outlined (variable font, `wght` 100–700, `FILL` 0–1). `.fill` class toggles FILL=1 for "saved" hearts. Icons are rendered as ligature text (e.g. `favorite`), which screen readers read aloud (§7.2). |
| Line breaking | Global `word-break: keep-all` (Korean words are not broken mid-word). |

**Proposed, not implemented:** define type roles (`display`, `heading-1`, `heading-2`, `body`, `label`, `caption`) after measuring real screens; decide minimum text size.

### 2.7 Radius, elevation, layering (Current)

| Category | Current usage |
|---|---|
| Radius | `rounded-full` 78 (pills, chips, buttons, avatars), `rounded-xl` 24 (cards, panels), `rounded-2xl` 23 (detail images, sidebars, MyPage cards, map panels), `rounded-md` 2 (map badges), `rounded-t-3xl` 1 (bottom sheet). Card radius is **inconsistent** (`xl` vs `2xl` for comparable cards). |
| Shadow | `shadow-2xl` 12, `shadow-lg` 11, `shadow-xl` 10, `shadow-sm` 7, brand-tinted `shadow-primary/30`, `/20`, `/5`, one arbitrary `shadow-[0_-4px_20px_rgba(0,0,0,0.08)]`. |
| Blur | `backdrop-blur-md` on header, overlays, map chips, favorite buttons. |
| z-index | `z-0`, `z-[1]`, `z-10`, `z-20`, `z-30`, `z-40` (EventList FAB), `z-50` (dropdown, map loader/error), `z-[60]` (header), `z-[100]` (search overlay). No documented scale. |

### 2.8 Layout (Current)

| Area | Container / padding |
|---|---|
| Header | `max-w-[1200px]`, `px-6 lg:px-20`; `sticky` on all routes, `fixed` on `/map`. |
| Footer | `max-w-[1200px]`, `px-6 lg:px-40`. |
| Home, EventList, MyPage | `max-w-[1200px] px-6`. |
| EventDetail, SpaceDetail | `max-w-[1200px] px-6 lg:px-10`. |
| SearchOverlay | `max-w-4xl px-6`. |
| MapDiscovery | Full viewport `h-screen`, map behind floating UI; selection panel fixed width `w-[360px]` at `left-6`. |
| Breakpoints | Tailwind defaults; used: `sm:`, `md:`, `lg:`, `xl:` (MyPage grid). |
| Grids | EventList 1→2 cols; Home quick-nav 1→3; detail pages 1→3 (2+1 sidebar); similar items 2→4; MyPage favorites 1→2→3; map list 1→2→3. |

---

## 3. Screen inventory (Current)

All routes are hash routes (`HashRouter`).

| Screen | Route / file | Main sections | Loading | Error | Empty | Placeholders (no real function) |
|---|---|---|---|---|---|---|
| **Site shell** (**v3 applied** on `redesign-v3`) | `App.tsx` | Header: N-glyph logo, nav ×4 (active = tangerine underline + `aria-current`), search pill (`button`, ≥1024px) / search icon (<1024px), bell, heart, avatar link. Footer: giant "놀 서울." wordmark, newsletter, 서비스, 지원, legal row | — | — | — | Bell & heart have no handler; 9 footer links are `href="#"`; newsletter input/button do nothing. (Avatar is now a sand circle, no external image.) |
| **Home** — **v3 applied 2026-11-09** (below is the pre-v3 inventory). v3 sections: Hero (event) → CategoryStrip (event counts + space) → Events grid with 오늘/이번주/이번달/무료 (event) → MapPromo (space types + real space positions) → Curation intro → After Dark (night) → Curators (constants). Has loading/error/empty states. Code: `pages/Home.tsx`, `components/home/*`, `constants/home.ts`. | `/` · `pages/Home.tsx` | Custom fade hero slider (3 slides, 5s autoplay, hover pause, arrows, dots, counter); quick-nav cards ×3 (문화행사, 문화공간, 야경명소); "지금 서울에서 열리는 행사" with 오늘/이번주 segmented control + Swiper event cards; navy promo map card | Spinner (`w-10`) | **None** | **None** (empty Swiper) | Promo map image is `picsum.photos`. (Note: the hero is hand-built, not Swiper; Swiper is used only for the event row.) |
| **EventList** — **v3 applied 2026-11-09** (below is the pre-v3 inventory). v3: head (eyebrow, h1 "서울에서 지금 하고 있는 N가지 일." with N = events running today, period tabs 오늘/이번 주/이번 달/전체 using the Home tab rules, default 전체); sticky sidebar (카테고리 = real CODENAMEs with counts under the other filters, 지역 = districts in the data, 관람료 = 전체/무료/유료 by `utils/fee.ts`; 필터 초기화 disabled with no filter); toolbar ("총 N건의 문화행사", sort 기본순 = API order / 마감임박 = soonest END_DATE, ended excluded); shared v3 `EventCard` in 3 columns (≤1100px 2); Day Pill pagination (12/page); "지도 보기" link; ≤900px the sidebar collapses behind a "필터" toggle. Not rendered: featured banner with curator quote, price-range checkboxes, popularity sort, grid/list toggle. Files: `components/events/` (selectors, `events-v3.css`), `constants/events.ts`. | `/events` · `pages/EventList.tsx` | Title; `DropdownFilter` ×3 (자치구, 장르, 유료/무료) + reset; result count; 1→2 col card grid; pagination (12/page, ellipsis); fixed "지도 보기" FAB | Spinner (`w-12`) + text | Icon + text | `search_off` + text | — |
| **EventDetail** — **v3 applied 2026-11-09** (below is the pre-v3 inventory). v3: breadcrumb + status (D-day/진행 중/종료); hero poster + spec grid (기간/장소/관람료/관람시간/대상/문의); actions (홈페이지 = ORG_LINK, 찜, 서울문화포털 = HMPG_ADDR); 행사 정보 (API fields only); 행사 소개 (PROGRAM/ETC_DESC; an image URL renders as an image; empty state otherwise); Kakao map via the existing `useKakaoLoader` (placeholder when no coords or SDK error); 다음으로 가볼 곳 (same CODENAME/GUNAME, live first, 4). Prototype items with no API source are **not rendered**: EDITOR'S PICK, curator note, like count, share, nearby walk times, reviews, rating. | `/event/:id` · `pages/EventDetail.tsx` | Breadcrumbs; hero image with scrim, badges, title; single "상세정보" tab; 행사 소개; 오시는 길 info box; sticky sidebar (InfoRow list: 일정, 비용, 대상, 장소, 출연진) + "홈페이지 가기" + favorite CTA; 비슷한 테마의 행사 (4) | Spinner + text | Combined error/not-found + back link | — | Single-tab bar (no other tabs). |
| **SpaceDetail** | `/space/:id` · `pages/SpaceDetail.tsx` | Same layout as EventDetail: breadcrumbs, hero (or icon fallback), single tab, 공간 소개, 교통 안내, 오시는 길, sidebar (주소, 전화, 팩스, 휴관일, 입장료, 분류) + CTAs, 비슷한 문화공간 (4) | Spinner + text | Combined error/not-found + back link | — | Single-tab bar. Reachable only from map panel and similar-space links. |
| **MapDiscovery** — **v3 applied 2026-11-09** (below is the pre-v3 inventory). v3: full-width (content-width exception); sidebar (eyebrow, h1 "내 주변, 지금 갈 곳.", 장소·동네 search filtering list + pins by name/address, 종류 chips 전체/문화행사/문화공간/야경명소, 분야 chips for spaces/night spots, list 30 at a time + 더 보기); real Kakao map with v3 pins (행사 ink, 문화공간 bone + 1px ink border, 야경명소 night, selected tangerine #9 + name label; old orange/green/purple removed; size by zoom: 6px at level ≥ 8 (whole of Seoul) → 7 → 8 → 9px at level ≤ 5, selected always 13px; border 1px; clusters while zoomed out, TECH-12; zoom buttons anchor on the selected pin), legend, caption with real counts, zoom ± / current location (v3 squares with hard ink shadow), selected card (API data only; 상세 보기 for events/spaces, 찜, 길찾기 = `map.kakao.com/link/to/…`); 야경명소 darkens map tiles only (`img[src*="mts.kakaocdn.net"]`); ≤900px the sidebar is a bottom sheet (replaces the card carousel), the selected card is compact (no image) and the map pans so the selected pin sits above it. **Night spots (2026-11-10), same language as `/night`:** the night page's sunset/OPERATING_TIME rules (`components/night/selectors`) drive the map — spots "점등 중" get an ember pin with a soft glow (never clustered), others keep the night pin; 야경명소 filter shows "오늘 일몰 HH:MM · 지금 켜진 곳 N곳 (before sunset: 곧 켜져요) · 갈 수 있는 곳 M곳" and the two toggles, as on `/night`; the night card uses the night page artwork (`NightArt`: 한국관광공사 photo or mini light map), the 점등 중/운영 중 badge, operating hours and "야경명소에서 보기" (`/night?spot=N` scrolls to and highlights the card); legend adds "켜진 야경"; tile darkening kept. The sidebar works when the Kakao SDK fails. Files: `components/map/` (selectors, pins, `useKakaoMap`, `MapSelectedCard`, `map-v3.css`). Night-spot `CONTENTS` and space `FAC_DESC` are HTML → shown as text (`utils/text.ts`). | `/map` · `pages/MapDiscovery.tsx` | Kakao map; category chips ×4; zoom/location controls; selection panel (generic or `NightSpotDetailCard`); bottom sheet: collapsed Swiper cards ↔ expanded grid list with sub-category chips; night mode (CSS `invert` filter + indigo overlay) when 야경명소 is selected | Full overlay spinner | **Map SDK error only** (with setup instructions + reload) | — | — |
| **NightPage** — **v3, new 2026-11-10** (approved) | `/night` · `pages/NightPage.tsx` | Concept "밤이 오면 켜진다" (design-ref/src/page-night.jsx). Hero: all 51 night spots as lights at their real positions over a stylised Han River line (`components/night/NightLights.tsx`), headline, phase line, stats (오늘 일몰 / 점등 중 / 운영 중). Time-linked: Seoul sunset by the NOAA equations (`utils/sun.ts`; matches KASI's published Seoul sunsets to the minute on 15 reference dates) → 05:00–sunset "곧 켜져요 · 일몰까지 …" (lights off, dusk band), sunset–23:00 "지금 켜져 있어요" (lights on), 23:00–05:00 "대부분 꺼졌어요 · 갈 수 있는 곳 N곳"; re-evaluated every minute. Status from OPERATING_TIME (`utils/night.ts`, live data 2026-11-10): "● 점등 중 / HH:MM 점등 / 소등" for the 11 sunset-lit spots, "운영 중 / 운영 종료" for 24h (7) and time ranges (15, weekday rules + closures), no badge for seasonal/monthly/unclear (18). **Two separate counts (decision 2026-11-10), same on the night page, the map and the Live Bar:** "켜진 곳" = 점등 중 (sunset-based lighting) only — before sunset it is 0, so the UI says "곧 켜져요"; "갈 수 있는 곳" = 운영 중 (24h or a time range open now). Only 켜진 곳 glow on the light map. Two exclusive toggles: "● 지금 켜진 곳만" / "지금 갈 수 있는 곳만". **Manual rules:** `data/night-manual-rules.json` (MANUAL VALUES, not API data) can replace an unparseable OPERATING_TIME per spot when `enabled: true`; such cards show "수동 규칙 적용". Shipped with one disabled example (남산서울타워, "일몰후~ 23:00", unverified). Feature = first spot lit now (else first sunset-lit), data-derived collections (해 지면 켜지는 불빛 / 24시간 열린 곳 / 무료로 가는 곳 via `FREE_YN` / 지금 갈 수 있는 곳), all-spots grid with 분류 chips + the two toggles; card mini map (B) with the spot's light. Actions: 지도에서 보기 (`/map?cat=야경명소&spot=<index>` deep link), 찜 (spot favorites), 홈페이지 (`URL`). **Photos (2026-11-10):** night photos only, from 한국관광공사 관광사진 정보 (PhotoGalleryService1) via a static mapping `data/night-photos.json` made by `scripts/match-night-photos.mjs` (TOUR_API_KEY used only by the script; the app makes 0 API calls). Accept a photo only if the title or shooting location contains the spot's core name, the location is 서울 or the spot's 구, no other region is named, and the photo is a night shot. **Active: `--relaxed` (decided 2026-11-10)** — night evidence may come from the title, location or tags (야경/야간/밤/달빛), and 반포대교 counts as the core of "반포대교 달빛무지개 분수" → **15 spots** (all 15 photos checked by eye: night or blue hour). The stricter variant (야경/야간 in title/location only) gave 3. Cultural-space daytime photos are not used. Photo and graphic cards share one 4:3 frame, night tone and caption slot; credit "사진: 한국관광공사 · 촬영 {촬영자}" (공공누리, 이용허락범위 제한 없음 — owner-checked); a failed photo falls back to the graphic. Colours: night / night-2 / bone / ember (prototype acid → ember); lights fade in one by one unless `prefers-reduced-motion`. Not rendered (no data): moon phase, rating, editor quote, elevation, crowd, tags, photos. | — | — | — | — | — |
| **Live Bar** — **v3, new 2026-11-10** (approved) | all routes · `components/live/LiveBar.tsx` (on `/map` fixed at the top above the fixed header; the map's height subtracts its 34px) | Ink strip above the header (design-ref `LiveBar`): status "LIVE · 서울 · MM.DD", ticker, KST clock (hidden ≤900px). Ticker items from real data only (`components/live/selectors.ts`): 오늘 서울 일몰 (utils/sun), 지금 진행 중인 행사 N건 (ember), 오늘 시작하는 행사 N건, 이번 주 마감 N건 (END_DATE today…+7), 지금 켜진 야경명소 N곳 (ember; 점등 중 only — before sunset: "야경명소 곧 켜져요 · HH:MM 점등"), 지금 갈 수 있는 야경명소 N곳 (운영 중), 무료 행사 N건. Items whose data is loading, failed or empty are left out. No "잔여 석", 미세먼지, temperature or issue number (no data). Pauses on hover/focus and with a pause button (WCAG 2.2.2); `prefers-reduced-motion` → static, one copy, sideways scroll. Event dates use the Home-tab "today" (§12 UTC note). | — | — | — | — | — |
| **MyPage** | `/mypage` · `pages/MyPage.tsx` | Profile card (avatar, name, level badge, email, 2 buttons) + 3 stat cards that act as tabs; side menu (공지사항, 1:1 문의, 환경설정, 로그아웃) + VIP promo; underline tab bar (same 3 tabs); favorites grid + dashed "add" card | — | — | Per-tab icon + text + CTA | Profile name/email/level hardcoded; avatar is `picsum.photos`; 프로필 수정, 공유하기, camera, menu items, 로그아웃, 멤버십 가입 have no handlers. |
| **SearchOverlay** (v3, 2026-11-11) | modal over any route · `components/SearchOverlay.tsx`, `components/search/` | Desktop: 640px panel under the header (bone, ink border, hard shadow) + scrim; ≤900px full screen. `role="dialog"`, Esc / 취소 / scrim close. Idle: 최근 검색어 (≤8, `nolseoul-recent`, real remove buttons), 바로 가기 chips (names only; night chip = night page lit count, "곧 켜져요" before sunset), search scope line. Results: 문화행사 / 문화공간 / 야경명소, ≤4 each + total + "전체 보기" (just opens /events, /map, /night); name match highlighted (accent-text text + underline); events show FeeBadge + D-day (≤7 days), spots show 점등 중 / 운영 중 | — | — | "‘Q’와 맞는 곳이 서울엔 없어요." + help + 3 chips + scope line | Not included (scope): arrow-key navigation, mobile type tabs, passing the query to other pages, focus trap / focus return (A11Y-04 partly open). |

---

## 4. Component and variant inventory (Current patterns)

Except for `NightSpotSlideCard` and `NightSpotDetailCard`, **none of these are shared components today**; they are repeated JSX patterns. `DropdownFilter` exists as a component but is local to `EventList.tsx`.

### 4.1 Event / place cards

| Variant | Location | Size / image | Badges | Favorite style | Link target | Free logic |
|---|---|---|---|---|---|---|
| A. Home carousel card | `Home.tsx:275-324` | `280px`/`lg:320px` wide, image `h-48` `object-cover`, fallback `picsum` | "무료 입장" (white pill, primary text) if free | Circle overlay top-right (`bg-white/50` → `bg-primary`) | `/event/{index in filtered list}` ⚠️ BUG-01 | `IS_FREE === '무료'` **or** `USE_FEE` includes '무료' |
| B. EventList card | `EventList.tsx:225-330` | Grid cell, image `h-48`, icon fallback when no image, `picsum` on error | 무료 (`bg-primary`) / 유료 (`bg-gray-500`) top-left; category (`bg-navy/80`) bottom-left; target pill in footer | Inline heart next to title (gray-300 → primary) | `/event/{events.indexOf}` (title + "상세보기" navy pill) | `IS_FREE === '무료'` **only** ⚠️ BUG-03 |
| C. Similar item card | `EventDetail.tsx:171-187`, `SpaceDetail.tsx:193-216` | No card box; `aspect-[4/3]` rounded image + text | Category label text | None | `/event/:i` or `/space/:i` | — |
| D. Saved item card | `MyPage.tsx:118-156` | Image `h-52` **`object-contain`** | Category label | Filled heart (remove only) | event → `/event/:id`; space & spot → `/map` ⚠️ BUG-07 | — |
| E. Map slide card | `MapDiscovery.tsx:626-668` | `280×218`, image `h-[144px]` | Category (`bg-navy` / night `bg-indigo-600`, `rounded-md`) | Circle overlay | Click selects on map (not a link) | — |
| F. Night spot slide card | `NightSpotCard.tsx:12-58` | `280×218`, gradient, no image | "야경명소" | Icon only (indigo) | Click selects on map | — |
| G. Map list row | `MapDiscovery.tsx:527-594` | `size-16` thumbnail / icon | — | Icon only | Click selects on map | — |
| H. Search result row | `SearchOverlay.tsx:128-148, 165-197, 223-243` | `size-14` thumbnail / tinted icon | — | — | Events → `/event/<id>`, spaces → `/space/<index>`, spots → `/night?spot=<index>` (BUG-06 resolved 2026-11-11) | — |

### 4.2 Favorite (heart) controls

| Variant | Locations | Unsaved → saved |
|---|---|---|
| Icon-only inline | EventList card, map list row, NightSpot slide card | `text-gray-300` → `text-primary` (night: `text-indigo-*`) + `.fill` |
| Circle overlay on image | Home card, map slide card | `bg-white/50` → `bg-primary` / `bg-primary/80` |
| Full-width CTA | EventDetail ("관심행사 등록"/"등록됨"), SpaceDetail ("관심장소 등록"/"등록됨") | `bg-gray-100 text-navy` → `bg-primary text-white` + shadow |
| Pill button with label | Map selection panel, NightSpotDetailCard ("저장"/"저장됨") | `bg-gray-100` → `bg-primary` (night: `bg-gray-700` → `bg-indigo-600`) |
| Remove-only filled icon | MyPage saved card | Always filled; click removes |

None have an accessible label or `aria-pressed` (§7.2).

### 4.3 Filters, chips and tags

| Variant | Location | States |
|---|---|---|
| `DropdownFilter` (pill trigger + popover list) | `EventList.tsx:7-64` | default (`bg-white border-gray-200`), selected (`bg-primary text-white`), open (chevron flips), option selected (`bg-primary/10 text-primary`). Closes on outside `mousedown` only. |
| Reset chip | `EventList.tsx:188-196` | Shown only when a filter is active. |
| Map category chip (large) | `MapDiscovery.tsx:317-332` | default / night-default / active (`bg-primary`, or `bg-indigo-600` for 야경명소). |
| Map sub-category chip (small) | `MapDiscovery.tsx:497-511` | default / night-default / active. |
| Recent-search tag with remove "x" | `SearchOverlay.tsx:258-267` | `div` + `span` click targets. |
| Popular-genre ranked row | `SearchOverlay.tsx:278-290` | Top 3 numbered in `primary`. |

### 4.4 Tabs and segmented controls

| Variant | Location | Notes |
|---|---|---|
| Segmented control (pill track) | Home 오늘/이번주 (`Home.tsx:246-255`) | Selected = white thumb + shadow. |
| Stat cards acting as tabs | MyPage (`MyPage.tsx:44-56`) | Duplicate of the underline tabs below; both switch the same state. |
| Underline tabs | MyPage (`MyPage.tsx:85-97`) | `border-b-4 border-primary`. |
| Single static tab | EventDetail / SpaceDetail | One "상세정보" button with no behavior. |

### 4.5 Buttons and links (visual patterns)

| Pattern | Example | Classes (abridged) |
|---|---|---|
| Primary pill | Hero "자세히 보기", detail "홈페이지 가기", map "상세보기" | `bg-primary text-white rounded-full font-bold`; hover `bg-primary-dark` **or** `brightness-110` |
| Secondary pill | Detail favorite (unsaved), MyPage "공유하기" | `bg-gray-100 text-navy` hover `bg-gray-200` |
| Inverse pill | EventList "상세보기" | `bg-navy text-white` hover `bg-primary`, fixed `90×36px` |
| Outline pill | Home "전체 행사 보기" | `border-gray-200` hover `bg-navy text-white` |
| Glass pill | Hero "지도 탐색" | `bg-white/20 backdrop-blur-md` |
| Icon button (circle) | Header search/heart/bell, hero arrows, pagination | `p-2 rounded-full hover:bg-gray-100` or `size-10` |
| Map control | Zoom +/−, my location | `size-11`, white / `gray-800` panel |
| FAB | EventList "지도 보기" | `fixed bottom-10 right-10 bg-primary shadow-2xl` |
| Text link | Error-state "목록으로 돌아가기", breadcrumbs | `text-primary hover:underline` / `hover:text-primary` |

### 4.6 Badges

Free/paid, category, "Featured/Hot/New", level ("Lv.4 탐험가"), "야경명소", target audience (`USE_TRGT`). Mostly `text-[10px] font-bold|black rounded-full px-2.5–3 py-1`; map uses `rounded-md`. Colors vary: `bg-primary`, `bg-gray-500`, `bg-navy/80`, `bg-white/90 text-primary`, `bg-white/20`, `bg-indigo-500/20`.

### 4.7 Status views

| Screen | Loading | Error | Empty |
|---|---|---|---|
| Home | Spinner `w-10` | — | — |
| EventList | Spinner `w-12` + text | `error` icon + text | `search_off` icon + text |
| EventDetail / SpaceDetail | Spinner `w-12` + text | `error` icon + text + back link (also used for not-found) | — |
| MapDiscovery | Full overlay spinner + text | SDK error panel + reload | — |
| MyPage | — | — | Icon + 2 lines + CTA |
| SearchOverlay | — | — | `search_off` + 2 lines |

Note: because data hooks do not check HTTP status, API failures usually render as **empty**, not error (BUG-02).

### 4.8 Detail layout (shared by EventDetail and SpaceDetail)

Breadcrumbs → hero image with bottom scrim, badges and `text-4xl md:text-5xl font-black` title → single tab → sections with icon + `text-2xl font-black` heading → tinted info box (`bg-primary/5 border-primary/10`) → sticky sidebar card with **InfoRow** list (`size-12` tinted icon circle + `text-[10px]` label + `text-lg font-extrabold` value, optional primary highlight) → CTA stack → "similar" 2→4 grid. Strong candidate for a shared `DetailLayout` + `InfoRow`.

### 4.9 Map UI

Floating category chips; zoom/location control stack; selection panel (`w-[360px]`, image `h-[280px]` `object-contain` or icon, category badge, title, location/date rows, save + detail buttons); `NightSpotDetailCard` (gradient header, labelled rows: 운영시간, 입장료, 지하철, 버스); bottom sheet (collapsed: title pill + Swiper of cards E/F; expanded: `top-20` sheet with sub-filter chips and list rows G); night mode (`grayscale invert brightness-90` on map + `bg-indigo-950/30` overlay + gray/indigo UI palette). Night mode is **map-only**, triggered by selecting 야경명소.

---

## 5. Proposed semantic token architecture (Proposed — not applied)

Adopt names before changing values. **No value changes without design review**; this table only maps names to what the code uses today.

| Proposed semantic token | Current source in code | Value today | Note |
|---|---|---|---|
| `color.brand.primary` | `primary` | `#ff6933` | Contrast decision needed (§2.5). |
| `color.brand.primary-hover` | `primary-dark` / `brightness-110` | `#e6511a` | Unify the two hover patterns. |
| `color.text.default` | `navy` | `#1A2E4A` | |
| `color.text.secondary` | `gray-500` | `#6b7280` | Passes AA. |
| `color.text.tertiary` | `gray-400` | `#9ca3af` | **Fails AA (2.54)** — decide whether to restrict to non-essential text or darken. |
| `color.text.disabled` / decorative | `gray-300` | `#d1d5db` | Decorative only (1.47). |
| `color.text.on-brand` | `white` | `#ffffff` | Fails on `primary` (2.87). |
| `color.surface.page` | `background-light` | `#f8f6f5` | |
| `color.surface.default` | `white` | `#ffffff` | Cards, header, panels. |
| `color.surface.subtle` | `gray-100` / `gray-50` | `#f3f4f6` / `#f9fafb` | Inputs, secondary buttons, hovers. |
| `color.surface.inverse` | `navy` | `#1A2E4A` | ~~`#101322`~~ (v0.1 mapped this to the Unused `background-dark`; corrected). |
| `color.border.default` | `gray-100` | `#f3f4f6` | `gray-200` used for stronger borders. |
| `color.category.event` | `primary` | `#ff6933` | |
| `color.category.space` | `blue-600` **vs** `#10b981` | TBD | Decision required (§2.4). |
| `color.category.night` | `indigo-600` **vs** `#8b5cf6` | TBD | Decision required (§2.4). |
| `color.map.marker-selected` | `#ef4444` | TBD | Not part of any palette. |
| `color.mode.night.*` | `gray-800/900`, `indigo-*` | — | Map-only mode; scope decision in §9. |
| `color.feedback.error` | `red-400` / `red-500` | TBD | |
| `color.focus.ring` | — (none designed) | TBD | Must pass 3:1 against adjacent colors. |

Unused theme tokens (`primary-light`, `navy-50`, `navy-900`, `background-dark`) should **not** be promoted to semantic tokens until a real use is approved.

- Keep primitives (`orange/500`, `navy/900`, `gray/400`) separate from semantic aliases (`action/primary`, `text/secondary`).
- Planned alignment: **Figma Variables → source token file (e.g. DTCG JSON) → CSS variables + TS constants (needed for map marker SVGs) → Tailwind theme → DESIGN.md**. None of this exists yet.
- Spacing scale, radii (§2.7), shadows, z-index scale, breakpoints and type roles need an approved decision before being declared canonical.

---

## 6. Component specification backlog (Proposed)

| Priority | Candidate component | Existing references (§4) | Variants/states to design |
|---|---|---|---|
| P0 | `Button` / `IconButton` | §4.5 (all screens) | primary / secondary / inverse / outline / glass / icon / map-control / FAB; default / hover / focus-visible / disabled / loading; accessible name for icon-only |
| P0 | `EventCard` (+ `PlaceCard`) | §4.1 variants A–H | carousel / grid / compact-row / saved / map-slide / similar; free / paid; saved / unsaved; image / no-image / broken-image; long title |
| P0 | `FilterChip` / `DropdownFilter` | §4.3 | default / selected / open / disabled; day / night; keyboard (Escape, arrows) and touch |
| P0 | `FavoriteButton` | §4.2 (Home, EventList, EventDetail, SpaceDetail, MapDiscovery, NightSpotCard, MyPage) | icon / overlay / CTA / pill; saved / unsaved; day / night; `aria-pressed` + label |
| P0 | `SearchField` / `SearchOverlay` | App header trigger, SearchOverlay | idle / focus / typing / results / empty / error; dialog semantics |
| P1 | `Badge` | §4.6 | free / paid / category / status / level; size; on-image / on-surface |
| P1 | `Tabs` / `SegmentedControl` | §4.4 (Home, MyPage, detail pages) | selected / unselected / focus; tablist semantics |
| P1 | `StatusView` | §4.7 (all data screens) | loading / error + retry / empty / not-found |
| P1 | `DetailLayout` + `InfoRow` | §4.8 (EventDetail, SpaceDetail) | with/without image; highlighted row; optional rows |
| P1 | `Pagination` | EventList | current / disabled / ellipsis; accessible labels |
| P1 | `DiscoveryCard` (quick-nav) | Home quick-nav | per category color |
| P2 | `ListItem` (result row) | §4.1 G, H | thumbnail / icon; interactive / static |
| P2 | `MapControl`, `BottomSheet`, `MapSelectionPanel` | §4.9 | collapsed / expanded; day / night; mobile width |
| P2 | `HeroSlider` | Home | autoplay / paused; controls visible on touch & keyboard |

For every Figma component, document: purpose, anatomy, variants, behaviors, responsive changes, accessible name, source file and any intentionally different web/native behavior.

---

## 7. Improvement backlog (found during audit — **not fixed**)

Status of every item: **Open**. Fixing any item changes behavior, so each needs its own ticket and review. Do not fix them inside visual/design-system tickets.

BUG-02 is recorded as an expected-to-fail Playwright test (BUG-01, BUG-03 and BUG-06 were fixed and their tests became regular tests) in `e2e/known-issues.spec.ts` (`@known-issue`). The fix PR must remove the matching `test.fail()`. See `e2e/README.md`.

### 7.1 Functional bugs

| ID | Severity | Location | Problem | Proposed direction / notes |
|---|---|---|---|---|
| BUG-01 — **RESOLVED 2026-11-09** (v3 Home uses `events.indexOf`; regression tests in `e2e/home.spec.ts`). Favorites saved by the old Home may still hold wrong IDs; clean them up with BUG-08. | ~~High~~ | `pages/Home.tsx` (pre-v3: lines 272-307) | Home cards use the index **within the filtered `recentEvents` list** for both the link (`/event/${idx}`) and the favorite ID. Clicking the n-th card opens `events[n]` (a different event), and the heart toggles the favorite for a different event (e.g. EventList's first card). | Resolve with the stable-ID migration (BUG-08). Existing `nolseoul-favorites` may already contain wrong IDs from Home — migration must match by stored `title`/`date`, not by ID. |
| BUG-02 | **High** | `hooks/useEvents.ts:4-8`, `useCulturalSpaces.ts:4-8`, `useNightViewSpots.ts:4-8`; `api/seoulapi.ts` | Fetchers never check `res.ok`. When the proxy returns a JSON error (500/400), the hook resolves to `[]`, so screens show **empty** ("조건에 맞는 행사가 없습니다") instead of **error**. `isError` only fires on network/JSON-parse failure. | Throw on non-OK responses so TanStack Query reports errors; then verify each screen's error UI. Validate with both Vite proxy and Vercel function. |
| BUG-03 — **RESOLVED 2026-11-09 (option D)**: one rule in `utils/fee.ts` (`feeKind`) used by EventList (badge + filter), Home (card, hero, 무료 tab) and EventDetail (관람료); regression test `e2e/fee.spec.ts` | Medium | `EventList.tsx:222` vs `Home.tsx:93-95`, `EventDetail.tsx:33` | "Free" is computed differently: EventList checks `IS_FREE === '무료'` only; Home/EventDetail also accept `USE_FEE` containing '무료'. The same event can be labelled 유료 in the list and 무료 elsewhere; the fee filter follows the stricter rule. | Decide one rule, extract to a shared util, keep filter and badge in sync. |
| BUG-04 — **Partially resolved 2026-11-09** | Medium | `components/home/HomeEvents.tsx` | v3 Home events section has loading, error (network failure) and empty states. Still open: API JSON errors show as empty because of BUG-02, and hero/strip/map promo/After Dark only show "—" or loading text. | Finish with a shared `StatusView` after BUG-02. |
| BUG-05 | Medium | `MapDiscovery.tsx:40-45` | Map ignores data-fetch errors from all three hooks; only the Kakao SDK error is shown. Failures result in a map with no markers and no message. | Surface per-dataset error (non-blocking banner). |
| BUG-06 — **RESOLVED 2026-11-11** (v3 search panel: space results link `/space/<index>`, night results `/night?spot=<index>`; regression tests in `e2e/search-overlay.spec.ts`) | ~~Medium~~ | pre-v3 `SearchOverlay.tsx:164-174, 188-198` | 문화공간 and 야경명소 result rows are styled as clickable (`cursor-pointer`, hover) but have no action. `/space/:id` exists and could be linked. | Link spaces to `/space/:id`; decide spot behavior (e.g. open on map), or remove clickable styling. |
| BUG-07 | Low | `MyPage.tsx:120` | Saved **spaces** link to `/map` instead of `/space/:id`; saved spots link to `/map` without selecting the spot. | Link spaces to detail; spots need a map deep-link design. |
| BUG-08 — **RESOLVED for events 2026-11-09** | ~~High~~ | `utils/eventId.ts`, `utils/favoritesMigration.ts`, `hooks/useFavoritesMigration.ts`; spaces/spots still index-based (`SpaceDetail.tsx`, `MapDiscovery.tsx`) | Event routes and favorites now use a **stable ID**: the `cultcode` from `HMPG_ADDR` (19,750/19,750 rows, 0 duplicates, live check 2026-11-09), with an FNV-1a hash of `TITLE`+start date+`PLACE` as fallback (`h…`). Old favorites are migrated once (see "BUG-08 decision" below). Old index links (`/event/12`) show "오래된 링크라 행사를 찾을 수 없습니다." | **Open:** space (`FAC_CODE` candidate) and night-spot IDs — separate ticket. |
| BUG-09 | Low | `MapDiscovery.tsx:483-487` | Expanded bottom-sheet count shows the total dataset size, not the sub-filtered count. | Use `filteredItems.length`. |
| BUG-10 | Low | `EventDetail.tsx:150` vs `EventList.tsx:279`, `Home.tsx:303` | Favorites store `date` inconsistently (`dateRange` vs raw `DATE`); map stores space `category` as '문화공간' while SpaceDetail stores `SUBJCODE`. MyPage shows whichever was saved last. | Normalize in the favorite-migration ticket. |
| BUG-11 | Low (needs browser check) | `MapDiscovery.tsx:376`, `NightSpotCard.tsx:71` | Selection panel is fixed `w-[360px]` at `left-6` (384px total). On viewports narrower than ~384px (e.g. 375px phones) it may overflow. | Verify at 375/390px; make it responsive. |
| BUG-12 — **RESOLVED 2026-11-09** | ~~Low~~ | `components/NightSpotCard.tsx`, `types.ts` | Night-spot description read `CONTENT`; the API field is `CONTENTS`. Now reads `CONTENTS` (type updated; the proxy whitelist keeps it). | — |
| BUG-13 — **RESOLVED 2026-11-09** | ~~Low~~ | `pages/SpaceDetail.tsx`, `components/home/MapPromo.tsx`, `pages/MapDiscovery.tsx`, `utils/space.ts`, `types.ts` | Fields the live API doesn't send were mapped to real ones: `IMG_URL` → `MAIN_IMG` (dropped, MAIN_IMG was already first); `DTLCONT` → `FAC_DESC` (HTML; shown as plain-text paragraphs via `spaceDescription`, never as HTML — before, FAC_DESC was printed with its tags visible); `TICKET_YN` → `ENTRFREE` ("무료"/"유료", 1,099/1,099 filled; the 입장료 row used to say 무료 for every space); `TRAFFIC_INFO` → `SUBWAY` + `BUSSTOP` (24 / 19 of 1,099 filled; bare numbers such as "12" are hidden; the 교통 안내 section only shows when one exists); `FAC_CODE` → `NUM` (unique, React key in MapPromo). `CulturalSpace` type now lists the live fields. The proxy whitelist adds `ENTRFREE`, `SUBWAY`, `BUSSTOP`. | — |

#### BUG-08 decision — stable event IDs, implemented 2026-11-09

- **ID:** option A, `cultcode` from `HMPG_ADDR` (e.g. `…view.do?cultcode=158770` → `/event/158770`); fallback option B, `"h" + FNV-1a(TITLE | STRTDATE[0..10] | PLACE)`. Computed in the client (`eventId()`); the API contract is unchanged. Cultcodes are ≥6 digits, so they never collide with old indexes (`isLegacyIndexId` = 1–5 digits).
- **EventDetail:** looks the event up by ID; the "EVENT №" label shows the cultcode.
- **Favorites migration** (`nolseoul-favorites-version` = `"2"` when done; the original is kept in `nolseoul-favorites-v1-backup`): runs once on any route after event data loads, never while it is empty or failed. Old index IDs are not trusted (BUG-01). Each event favorite is re-matched by poster URL → title + start date → title + location, taking a rule only when it has exactly one candidate. Duplicates (two old entries → one event) keep the newest. Unmatched → kept as an **orphan** (`orphan: true`, `id: "legacy-<old>"`): MyPage shows title/location/date, a note, no link, and a remove button. The note is **"종료된 행사"** when the stored date is a range whose end is before today (KST); otherwise (single date, no date, or not ended) **"정보를 불러올 수 없는 행사"**. Space/spot favorites are untouched.
- **Sync:** `useFavorites` instances now re-read storage on a change event (and on cross-tab `storage` events), and writes start from current storage, so a component holding stale state can't overwrite migrated data.

#### BUG-03 decision — option D, implemented 2026-11-09

`utils/fee.ts` → `feeKind(event)`. Live data (1,000 rows, 2026-11-09): **무료 681 / 유료 282 / 일부 무료 18 / 가격 상이 10 / 확인 필요 9**.

| Kind | Rule (in order) | Shown as |
|---|---|---|
| 일부 무료 (`partial`) | text says "일부", or says 무료 *and* paid (a positive amount, "유료", or "상이") | badge: `accent-text` outline + text |
| 확인 필요 (`check`) | contradiction: `IS_FREE=무료` + a price in the text, or `IS_FREE=유료` + text only saying 무료 | **no badge**, raw fee text |
| 무료 (`free`) | `IS_FREE=무료` otherwise | badge: `accent-text` fill + white |
| 가격 상이 (`varies`) | `IS_FREE=유료`, "상이" and no amount | badge: night outline + text |
| 유료 (`paid`) | `IS_FREE=유료` otherwise | badge: night fill + white |

Deposits ("예약금", "보증금", "노쇼", on either side of the amount) are ignored. Amounts: "10,000원", "1만원", "3천원"; "0원" is not a price.
Filters: EventList **무료 = `free` only; 유료 = every other kind** (so every event stays reachable). Home **무료 tab = not ended + `free`**.
Badge colours follow §2.0.1 (tangerine use #10 and the night note). Component: `components/v3/FeeBadge.tsx`, styles `.v3-fee*` in `styles/v3.css`.

#### BUG-03 options (live data, 1,000 events, 2026-11-09) — analysis kept for reference

`IS_FREE`: 무료 700 / 유료 300. `USE_FEE`: empty in 520 rows (all `IS_FREE=무료`). Prices come as "10,000원" or as Korean units ("1만원", "전석3만원"). Ambiguous texts include "티켓별 상이", "프로그램별 상이", "무료(일부 프로그램 유료)", "참가비: 30,000원 / 관람 1-2일차: 무료". There are 9 rows with `IS_FREE=무료` but a plain price ("전석 50,000원"), and deposits are mentioned in fee text ("예약금 10,000원 … 환불").

| Rule | 무료 / 유료 / 기타 | Notes |
|---|---|---|
| A. `IS_FREE` only (EventList today) | 700 / 300 | Simple, matches the source flag; trusts 9 contradictory rows as free. |
| B. `IS_FREE` or "무료" in `USE_FEE` (Home/Detail today) | 706 / 294 | Turns 6 mixed paid events into "free" — misleading. |
| C. Owner default, literal: mixed → "일부 무료"; positive amount → 유료; else `IS_FREE` | 677 / 291 / 일부 무료 32 | Fixes contradictions, but misreads deposits as paid/mixed and treats "티켓별 상이" (all paid) as partly free. |
| D. Owner default, refined: `IS_FREE` first; "일부 무료" only when the text says free *and* paid (or "일부"); deposits ignored; `IS_FREE=무료` + plain price → "확인 필요" (show the fee text, no badge) | 678 / 282 / 일부 무료 31 / 확인 필요 9 | Most accurate. Needs a tested parser and a 3–4-state badge/filter design. "상이" alone should read "가격 상이", not "일부 무료". |

### 7.2 Accessibility issues

Baseline: **0** `aria-*`/`role` attributes in UI code; designed focus style exists only on the footer email input.

| ID | Severity | Location | Problem | Proposed direction |
|---|---|---|---|---|
| A11Y-01 | **High** | All screens | Low contrast: white on `primary` and `primary` on white are **2.87:1**; `text-gray-400` (2.54:1, ×41) and `text-gray-300` (1.47:1, ×31) carry meaningful text (§2.5). | Design decision on brand/text tokens; do not change silently. |
| A11Y-02 | **High** | Header buttons (`App.tsx:70-90`), hero arrows/dots, hearts, pagination prev/next, map zoom/location/close | Icon-only controls have no accessible name; their name falls back to the Material Symbols ligature text read in English ("favorite", "chevron_left"). Hearts don't expose saved state. | `aria-label` (Korean), `aria-hidden` on icon spans, `aria-pressed` for favorites. |
| A11Y-03 | **High** | `App.tsx:77-83` (desktop search trigger), `SearchOverlay.tsx:259-266, 279-283`, `MapDiscovery.tsx:527, 626`, `NightSpotCard.tsx:13` | Clickable `div`/`span` elements are not focusable or keyboard-operable. The desktop header search can't be opened by keyboard. | Use `button`/`a`; nested favorite buttons must not be nested inside another interactive element. |
| A11Y-04 | High | `SearchOverlay.tsx:89` | Overlay has no dialog semantics (`role="dialog"`, `aria-modal`, label), no Escape to close, no focus trap/return, page behind remains scrollable/focusable. Input uses `focus:ring-0 border-none` (no visible focus). | Dialog pattern; Escape; return focus to trigger. |
| A11Y-05 | Medium | `EventList.tsx:7-64` | `DropdownFilter` lacks `aria-expanded`/`aria-haspopup`, listbox/option semantics, Escape and arrow-key support; selected option not announced. | Listbox or menu-button pattern. |
| A11Y-06 | Medium | `Home.tsx:246-255`, `MyPage.tsx:44-56, 85-97` | Tabs/segmented controls lack `tablist`/`tab`/`aria-selected`; MyPage has two control sets for one state. | Tabs pattern; decide whether stat cards stay interactive. |
| A11Y-07 | Medium | `Home.tsx:84-89, 159-184` | Hero auto-advances every 5s with pause on mouse hover only (no pause for keyboard/touch). Arrows are `opacity-0` (invisible on touch, but still focusable); `group-hover:` has no `group` parent. Dots have no labels/current state. | Pause/play control, visible controls, labelled dots, respect `prefers-reduced-motion`. |
| A11Y-08 | Medium | All screens | No designed `focus-visible` style; browser defaults vary and are hard to see on brand/glass backgrounds. | `color.focus.ring` token + consistent focus style. |
| A11Y-09 | Low | All screens | Text sizes of 10–11px (×26) for labels/badges/meta. | Minimum size decision in type roles. |
| A11Y-10 | Low | `App.tsx:58` (logo `h1` on every page), page `h2`s, footer `h5` | Heading hierarchy skips levels; each page lacks its own `h1`. | Page-level `h1`; logo not a heading. |
| A11Y-11 | Low | Footer, MyPage, Header | 9 `href="#"` links and multiple handler-less buttons are announced as working controls. | Implement, label as "준비 중", or remove (product decision). |

### 7.3 Technical / configuration risks

| ID | Location | Issue | Note |
|---|---|---|---|
| TECH-01 | `index.html` | ~~`/index.css` referenced but missing~~ | **Resolved on `redesign-v3`**: file created as the v3 token source; build no longer warns. |
| TECH-02 | `index.html:52-61` | Leftover `esm.sh` import map (likely from a prototyping template). | Verify unused in production, then remove in a dedicated ticket. |
| TECH-03 | `vite.config.ts:30-33` | `define` injects `GEMINI_API_KEY` into `process.env.API_KEY` / `process.env.GEMINI_API_KEY`. Unreferenced today, but any future reference would **embed the key in the client bundle**. | Remove `define` in a dedicated ticket. |
| TECH-04 | `package.json` | `gsap` is a dependency but imported nowhere. | Keep or remove by decision; don't list as "used". |
| TECH-05 | `index.html:8` | Tailwind runs from the CDN in production (Tailwind does not recommend this); `forms` plugin restyles inputs globally. Styles are generated at runtime, which matters for screenshot tests. | Compiled Tailwind migration = separate ticket with visual regression. |
| TECH-06 | `hooks/useFavorites.ts:31` | Each `useFavorites()` call holds its own `useState`; instances don't sync with each other or across tabs (`storage` event). No visible bug today because screens use one instance. | Shared store/context when components are extracted. |
| TECH-07 | `SpaceDetail.tsx:95` | `dangerouslySetInnerHTML` with regex tag-stripping of API HTML. | Prefer plain-text rendering or a sanitizer. |
| TECH-08 | 15 places | `picsum.photos` random images used as fallbacks and for the avatar/promo image — random unrelated photos can appear as event images. | Design a proper missing-image state. |
| TECH-10 — **RESOLVED 2026-11-09 (final)** | `api/_lib/seoulApi.ts` (shared), `api/seoulapi.ts`, `vite.config.ts` (dev/preview middleware) | **Decision: fetch everything + 24-hour CDN cache; event screens show running + starting within 3 months.** All three APIs are paged the same way (page 1 → `list_total_count` → remaining 1,000-row pages, max 5 in parallel). Events: deduped (cultcode), kept when running today in KST (however long ago they started) or starting within 3 months; ended events and later starts dropped. Spaces/night spots: all rows. **Only the fields the UI reads are returned** (`FIELDS` in `api/_lib/seoulApi.ts`; real data 2026-11-09, UTF-8 bytes: spaces 2,157 KB → 1,869 KB (−13%, gzip 528 → 501 KB), night spots 116 → 106 KB (−8%), events ≈ 347 → 324 KB (−6%); 65% of the space payload is `FAC_DESC`, which only SpaceDetail uses — moving it to a per-space request is an open option). The client also drops events ended before today (KST) in `useEvents` (`dropEndedEvents`), so a stale cache never shows ended events on Home, EventList, related events, search or the map. Cache `public, max-age=0, s-maxage=86400, stale-while-revalidate=86400` (≈ one Seoul API refresh per day per edge region); a failed later page → `partial: true`, `s-maxage=60`; a failed first page → error, `no-store`; the key is scrubbed from error bodies. **Why:** long-running events sit anywhere in the API's start-date order (7 running events were beyond row 4,000), and the 24 h cache keeps calls minimal. Real data 2026-11-09 (KST): events 331 of 19,750 (진행 중 201 / 3개월 내 시작 130; the 7 long-running ones included), spaces 1,099 / 1,099 (was 1,000), night spots 51 / 51; uncached event response ≈ 1.0–1.2 s through the dev server, 274 KB. The Seoul API's DATE parameter is a text match on the DATE field, not a "running on" filter, so it isn't used. | Open: daily call quota for the key not confirmed; Vercel deploy (ESM import, CDN cache) not verified from here. With the 24 h cache (+24 h stale), an event that ended can stay listed for up to ~2 days until the next refresh. |
| TECH-11 | `types.ts` | Live rows include fields not in the `Event` type: `INQUIRY` (문의), `PRO_TIME` (운영시간), `TICKET`, `RGSTDATE` (typed loosely through the index signature). LAT = latitude (37.x), LOT = longitude (126–127.x), not swapped. | Add them to `Event` when types are next touched. |
| TECH-09 | `dist/` | Local `dist/` is stale vs `index.html` (gitignored; no deploy impact). | Informational. |
| TECH-12 — **RESOLVED 2026-11-10** | `components/map/useKakaoMap.ts`, `components/map/pins.ts` | Pins are clustered while zoomed out: Kakao `MarkerClusterer` at level ≥ 6 (`minLevel`), grid 60px, ink circle + bone JetBrains Mono count, 24 / 32 / 40px for <10 / 10–49 / ≥50 pins; clicking a cluster zooms in; below level 6 every pin shows. The selected pin is taken out of the clusterer. Real map 2026-11-10 (1440): level 8 → 69 clusters (24px 22 / 32px 43 / 40px 4), level 6 → 57 clusters + 17 pins, level 4 → no clusters. | — |
| TECH-13 — **RESOLVED 2026-11-10** | `components/NightSpotCard.tsx`, `package.json` | Removed the unused `NightSpotCard.tsx` and the `swiper` dependency (+ lockfile). Bundle unchanged by the removal itself (JS 357.14 kB / gzip 110.12 kB, CSS 44.25 kB) because nothing imported them since the v3 map; vs. the last build that still used Swiper (`1599caa`): JS 457.13 → 357.14 kB (gzip 138.73 → 110.12 kB) together with the map rewrite. `node_modules/swiper` (3.8 MB) gone. | — |
| TECH-14 — **RESOLVED 2026-11-10** | Kakao Developers console (app "놀2서울") | The Kakao Maps SDK answered `403 NotAuthorizedError — App(놀2서울) disabled OPEN_MAP_AND_LOCAL service`. The owner enabled 카카오맵 for the app; the SDK now loads on `http://localhost:3000` (registered). Real-map check 2026-11-10: 1,477 pins (ink 327 / bone 1,099 / night 51), tiles from `mts.kakaocdn.net`; pin anchor within 0.5 px of the target; 야경명소 darkens tiles only. Deployed domain not re-checked here. | — |

---

## 8. Figma file plan (Proposed — to be created)

Suggested pages:

1. `00 · Reference / Current UI` — imported existing screens, labeled **reference only**, not finalized components.
2. `01 · Foundations` — colors (incl. category + night mode), typography, spacing, radius, elevation, icons and variable modes.
3. `02 · Components` — Auto Layout, nested components and variants (§6).
4. `03 · Patterns` — event list, filters, search, detail layout and map overlays.
5. `04 · Screens / Web` — responsive web flows (all 7 screens in §3).
6. `05 · Screens / App (future)` — mobile-first flows distinct from web layouts.
7. `99 · Archive` — deprecated explorations.

Importing existing HTML into Figma produces a **starting point**; manually fix Auto Layout, layers, semantic naming and component architecture before calling it a design system.

## 9. Figma-to-code handoff contract

When using Figma MCP with an AI coding agent:

1. Provide **specific Figma file/frame link** and the intended change.
2. Inspect current React components and design tokens before generating code.
3. Reuse existing routes, API hooks, map logic and state, unless an explicit change request requires otherwise.
4. Map Figma Variables to code tokens; flag missing or inconsistent values rather than guessing.
5. Implement loading/error/empty/saved/unsaved/focus and mobile variants, not only screenshots.
6. Compare screenshots at fixed viewport sizes; separately test interactions and data-driven states.
7. Record differences and changes, including any manually approved design deviations.

**No automatic bidirectional sync is assumed.** A Figma edit does not update the existing React app by itself. The agent proposes code changes; humans review and verify them. As of this revision, **no Figma MCP is configured** for this project.

## 10. UI quality gates (Planned; not currently installed)

- **Visual:** compare screenshots using reproducible viewport sizes (proposed: 375px, 390px, 768px, 1440px); confirm typography, alignment, cards, spacing and imagery. Tailwind CDN generates CSS at runtime — wait for styles before capture.
- **Interaction:** keyboard navigation, search overlay closing, filters, pagination, favorites, map pan/zoom and detail links.
- **States:** success, loading, failed API (non-OK JSON response, see BUG-02), zero results, empty favorites, missing image, lengthy text.
- **Accessibility:** button names, logical headings, focus visibility, non-color state indicators, contrast (§2.5 baseline).
- **Responsive:** mobile tapping and horizontal overflow; no desktop-hover-only critical action (see A11Y-07).
- **Regression:** preserve routes, API response handling and localStorage behavior pending any approved migration.
- **Data:** use fixed API fixtures (intercept `/api/seoulapi`) so tests do not depend on API keys, live data or ordering.

Do not mark checks as passed unless actually executed; document **not run** when tooling/keys are unavailable.

### Verification log for this document (v0.2)

| Check | Result |
|---|---|
| `npx tsc --noEmit` at `6279fb6` | Passed, 0 errors |
| `vite build` at `6279fb6` (output to a temp dir) | Succeeded; warning: `/index.css doesn't exist at build time` |
| Browser / mobile / visual verification | **Not run** |
| Live Seoul API / Kakao map | **Not run** |
| Automated tests | v0.2: none existed. Since 2026-11-04, Stage 0.5 Playwright smoke tests exist (`e2e/`); they cover behavior, not visuals. |
| Contrast ratios (§2.5) | Computed from hex with the WCAG formula; not tool-audited |

## 11. App extension (future, not implemented)

Target option: React Native + Expo **after** shared design semantics and domain/data logic are extracted. Web React components, browser localStorage and Kakao web SDK cannot be assumed to work unchanged on native. Design navigation and map implementation for native separately; reuse portable TypeScript models, validators, formatting (e.g. the free/paid rule, BUG-03) and API contracts where practical.

## 12. Decisions / open questions

- [x] ~~Brand color source of truth~~ → **Decided 2026-11-09: Redesign v3 `tangerine #e2542f` (+ `tangerine-deep #b13c1b` for small text)** replaces `#ff6933` / `#FF6B35`. (§2.0)
- [x] ~~Contrast of white on `primary`~~ → resolved by v3 rule: tangerine for fills/large type, tangerine-deep for small text.
- [x] ~~Footer legal text contrast~~ → **Decided 2026-11-09: raised from bone @45% (4.17:1) to @55% (5.67:1, AA).** Intentional deviation from the v3 reference.
- [x] ~~Footer 소셜 column~~ → **Decided 2026-11-09: do not add.**
- [x] ~~Header vs page alignment~~ → **Decided 2026-11-09: fix per page during migration** (migrated pages use `.v3-shell` = `--v3-maxw` + `--v3-gutter`). Done: Home. Pending: EventList, EventDetail, SpaceDetail, Map, MyPage.
- [x] ~~BUG-01 during Home rewrite~~ → **Decided 2026-11-09: fix it** (done; see §7).
- [ ] **Home (v3):** curator cards are **placeholder people and quotes** copied from the prototype (`constants/home.ts`, `CURATORS_ARE_PLACEHOLDERS`). Replace them with real, consented content, or hide the section, before production.
- [ ] **Home (v3):** "03 — CURATION · 에디터가 고른 서울" implies editorial selection, but After Dark shows the **first 4 spots from the API**. Define a real selection rule (or curated IDs in constants), or change the copy.
- [ ] **Home (v3):** tab definitions to confirm. 이번달 = starts by month end and not ended. 무료 = not ended + fee kind `free` (BUG-03 option D).
- [ ] **Home (v3):** dates use UTC like the pre-v3 Home, so between 00:00 and 09:00 KST "오늘" means the previous day. Kept intentionally; switch to KST?
- [ ] **Home (v3):** two `h1`s on Home (header logo + hero title). The v3 reference doesn't treat the logo as a heading; decide together with A11Y-10.
- [ ] **Home (v3):** the curator quote font (Instrument Serif) has no Hangul, and `Noto Serif KR` is not loaded, so Korean quotes fall back to the OS serif font (differs by OS). Load Noto Serif KR or change the token?
- [ ] **Home (v3):** primary button hover (white on tangerine) is 3.79:1 at 14px semibold, below AA. This is v3's own hover style; keep it, or hover to `tangerine-deep` (5.95)?
- [ ] **Home (v3):** Home now requests all three datasets (event, space, night; up to 1,000 rows each) on first load, where it previously requested only events. Acceptable, or add server-side counts later?
- [ ] **Category colors:** 문화공간 blue vs emerald; 야경명소 indigo vs violet; selected-marker red — re-decide within the v3 palette (v3 has night/ember/electric/acid). (§2.4)
- [x] **Free/paid rule:** option D (`utils/fee.ts`), decided and implemented 2026-11-09. (BUG-03)
- [ ] Determine semantic neutral palette and whether `gray-400` may carry essential text.
- [ ] Decide spacing, radius (`xl` vs `2xl` cards), elevation, z-index and type scales after screen audit; decide minimum text size.
- [ ] Decide what to do with Unused tokens (`primary-light`, `navy-50`, `navy-900`, `background-dark`).
- [ ] Agree on first representative flow: recommended `EventList` filters + event card + detail.
- [ ] Confirm Figma file, MCP access and tokens-to-code strategy.
- [x] Stable event IDs + favorites migration decided and implemented 2026-11-09 (BUG-08). Space/spot IDs still open.
- [ ] Determine whether dark/night mode is limited to the map (current) or becomes a global product mode.
- [ ] Decide fate of placeholder controls (footer links, header heart/bell, MyPage profile/menu/membership). (A11Y-11)

---
**Maintenance:** Update this file when a design decision is approved. Keep the `Current` / `Unused` / `Proposed` / `Implemented` labels accurate and update usage counts when code changes. Link PRs, Figma frames and visual QA evidence when available. Close backlog items (§7) only with a linked PR.

**Changelog**
- v2.3 (2026-11-10, branch `redesign-v3`): "켜진 곳" (점등 중) and "갈 수 있는 곳" (운영 중) split everywhere (night page, map, Live Bar), "곧 켜져요" before sunset; manual night rules file (MANUAL VALUES, disabled example).
- v2.2 (2026-11-10, branch `redesign-v3`): Live Bar also on `/map` (fixed; map shrinks). Map night spots use the night page language (ember lit pins, toggle, sunset line, night card with photo/graphic, link to `/night?spot=`).
- v2.1 (2026-11-10, branch `redesign-v3`): Night photos wired in (static 한국관광공사 mapping, relaxed criteria = 15 photos), shared photo/graphic card frame with credit.
- v2.0 (2026-11-10, branch `redesign-v3`): Live Bar with a real-data ticker (approved), hidden on `/map`.
- v1.9 (2026-11-10, branch `redesign-v3`): New v3 night page `/night` (approved): NOAA sunset (KASI-checked), OPERATING_TIME status, light-map graphics, data-derived collections; header nav + footer + Home After Dark link to it; map deep link `?cat=&spot=`; proxy keeps `FREE_YN` for night spots.
- v1.8 (2026-11-10, branch `redesign-v3`): TECH-13 — removed unused NightSpotCard.tsx and Swiper.
- v1.7 (2026-11-10, branch `redesign-v3`): Map pins resized (6–9px by zoom, selected 13px, 1px border) and clustered while zoomed out (TECH-12); zoom buttons keep the selected pin in place.
- v1.6 (2026-11-10, branch `redesign-v3`): Map page migrated to v3 (decisions: full width, pin palette + legend, sidebar search, Kakao directions link, mobile bottom sheet). Kakao SDK test double for e2e (`e2e/fixtures/kakao-stub.js`). Verified on the real Kakao map at localhost:3000 after the map service was enabled (TECH-14).
- v1.5 (2026-11-09, branch `redesign-v3`): BUG-12 and BUG-13 fixed (night `CONTENTS`; space fields mapped to the live API: MAIN_IMG, FAC_DESC as text, ENTRFREE, SUBWAY/BUSSTOP, NUM).
- v1.4 (2026-11-09, branch `redesign-v3`): Client-side ended-event guard (`dropEndedEvents` in `useEvents`); proxy returns only the fields the UI reads (spaces −13%; `FAC_DESC` is 65% of the space payload). New open bugs BUG-12 (night `CONTENT` vs `CONTENTS`) and BUG-13 (space fields the API doesn't send).
- v1.3 (2026-11-09, branch `redesign-v3`): EventList migrated to v3 (decisions: period tabs default 전체, title number = running today, sort 기본순/마감임박). Day Pill moved to shared `styles/v3.css`. Card foot: fee badges never shrink; at ≤560px the date separator becomes "–" and badge padding tightens — real data 2026-11-09: 3 of 331 cards (cross-year date + 4-character badge) still wrap the badge to the next line instead of cutting it. "지도 보기" sits in the toolbar next to the sort on desktop and is fixed at the bottom only at ≤900px.
- v1.2 (2026-11-09, branch `redesign-v3`): TECH-10 final: all pages for all three APIs, 24 h CDN cache + stale-while-revalidate; events limited to running today + starting within 3 months (KST). Spaces now 1,099 (was cut at 1,000).
- v1.1 (2026-11-09, branch `redesign-v3`): TECH-10 resolved with option B (shared proxy module, 4 pages merged, ended events dropped, 1h CDN cache). EventDetail: a cultcode not in the data shows "종료된 행사입니다." + list link.
- v1.0 (2026-11-09, branch `redesign-v3`): BUG-08 resolved for events (cultcode IDs with hash fallback, one-time favorites migration with backup and orphans, favorites sync between hook instances).
- v0.9 (2026-11-09, branch `redesign-v3`): Fee badge colours: 무료 accent-text fill + white, 유료 night fill + white, 일부 무료 accent-text outline, 가격 상이 night outline; tangerine use #10 "요금 배지(무료)" and night-on-badge recorded.
- v0.8 (2026-11-09, branch `redesign-v3`): BUG-03 resolved with option D (`utils/fee.ts`, `FeeBadge`, four badges + 확인 필요 without badge) across EventList, Home and EventDetail. EventDetail about section: eyebrow "ABOUT", title "행사 소개."; its small tangerine-deep text uses `--v3-accent-text`.
- v0.7 (2026-11-09, branch `redesign-v3`): Card thumbnails 3:4 cover (top); equal grid columns (`minmax(0,1fr)`, 2 columns ≤1100px); card date + price on one line with price ellipsis; compact card dates ("11.01 — 11.05"); category strip cells keep full padding, hover fill = cell box. Added §2.0.1 State & accent layer, **approved** with decisions C1–C5 and applied on Home: opaque state tokens (no translucent brand colour), 9 allowed tangerine uses, component state table, text on tangerine always ink. Poster rule: Hero banner exception (cover + bottom gradient + caption).
- v0.6 (2026-11-09, branch `redesign-v3`): Added the `--v3-content-max` (1400px) token and the layout rule (one content width, full-bleed backgrounds). Home Header, Hero, category strip and Map Promo now align to it. Hero banner shows the poster uncropped with the caption beside/below it (no text over the image). Event cards use contain posters in a fixed 3:4 box with equal heights.
- v0.5 (2026-11-09, branch `redesign-v3`): EventDetail migrated to v3 (event API only; no fake reviews/ratings/curator notes; Kakao map through the existing loader). Shared `components/v3/EventCard.tsx` and `utils/event.ts`. BUG-03 options documented with live-data counts. TECH-10 (1,000-row cap) and TECH-11 (untyped live fields) added.
- v0.4 (2026-11-09, branch `redesign-v3`): Home migrated to v3 with the approved data mapping (event / space / night; curators from constants). BUG-01 fixed by decision; BUG-04 partially resolved. Footer legal contrast raised to 55%. Shared v3 primitives in `styles/v3.css`, Home styles in `components/home/home-v3.css`. Instrument Serif now loaded. New Home open questions in §12.
- v0.3 (2026-11-09, branch `redesign-v3`): Redesign v3 approved as the visual source of truth (§2.0). v3 tokens added (`index.css` + Tailwind config); Header/Footer migrated to v3. In the header, icon buttons now have Korean accessible names, the search trigger is a real `button`, and controls have a `focus-visible` outline (partially addresses A11Y-02/03/08 for the header only). TECH-01 resolved. Brand-color decision closed; new v3 open questions added (§12).
- v0.2 (2026-11-03): Corrected against code at `6279fb6`. Split tokens into Current/Unused; added non-theme color inventory, category color conflict, contrast table, typography weights/sizes, radius/shadow/z-index, layout; added screen inventory incl. EventDetail, SpaceDetail, Search and shell; added component variant inventory; fixed `surface.inverse` mapping; added improvement backlog (bugs, accessibility, technical risks).
- v0.1 (2026-11-03): Initial draft from read-only review.
