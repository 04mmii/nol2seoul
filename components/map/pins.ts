/**
 * v3 map pins (decision 2026-11-09, sizes 2026-11-10): 행사 = ink fill, 문화공간 = bone fill + ink border,
 * 야경명소 = night fill, selected = tangerine (tangerine use #9 "지도 강조 핀"). Border 1px.
 * Size: normal pins 6px when the whole of Seoul is in view → up to 9px close in (design-ref value);
 * the selected pin is always 13px (+ name label). Pins are SVG data URIs (Kakao MarkerImage needs an
 * image URL), so token values are hex here — keep in sync with index.css: ink #14130f, bone #f6f2ea,
 * night #111d38, tangerine #e2542f. Ink/night pins get a bone ring so they stay visible on dark areas.
 */
import type { MapKind } from './selectors';

export const PIN_HEX = { ink: '#14130f', bone: '#f6f2ea', night: '#111d38', tangerine: '#e2542f', ember: '#e8b781' } as const;

/** nightLit = a night spot lit right now (sunset-based "점등 중"), shown as an ember light with a soft glow. */
export type PinKind = MapKind | 'nightLit' | 'selected';
export type PinStyle = { fill: string; stroke: string; size: number; glow?: boolean };

export const PIN_COLORS: Record<PinKind, { fill: string; stroke: string }> = {
  event: { fill: PIN_HEX.ink, stroke: PIN_HEX.bone },
  space: { fill: PIN_HEX.bone, stroke: PIN_HEX.ink },
  night: { fill: PIN_HEX.night, stroke: PIN_HEX.bone },
  nightLit: { fill: PIN_HEX.ember, stroke: '#fff3df' },
  selected: { fill: PIN_HEX.tangerine, stroke: PIN_HEX.ink },
};

export const PIN_MIN = 6;
export const PIN_MAX = 9;
export const PIN_SELECTED = 13;

/**
 * Normal pin size for a Kakao zoom level (higher level = farther away). Level 8 shows the whole of Seoul
 * (the page opens there): ≥8 → 6px, 7 → 7px, 6 → 8px, ≤5 → 9px.
 */
export const pinSizeForLevel = (level: number) => Math.max(PIN_MIN, Math.min(PIN_MAX, PIN_MAX - (level - 5)));

export const pinStyle = (kind: PinKind, size: number): PinStyle => ({ ...PIN_COLORS[kind], size: kind === 'selected' ? PIN_SELECTED : size, glow: kind === 'nightLit' });

/** Legend / list icons use the close-in size so the colours read clearly. */
export const PIN_STYLES: Record<PinKind, PinStyle> = {
  event: pinStyle('event', PIN_MAX),
  space: pinStyle('space', PIN_MAX),
  night: pinStyle('night', PIN_MAX),
  nightLit: pinStyle('nightLit', PIN_MAX),
  selected: pinStyle('selected', PIN_SELECTED),
};

/** Glow padding around a lit night pin (soft ember halo, like the lights on the night page). */
const glowPad = (style: PinStyle) => (style.glow ? Math.round(style.size * 1.6) : 0);

/** Circle with a 1px border and the v3 hard ink shadow below; lit night pins get an ember halo instead. */
export function pinSvg(style: PinStyle): { svg: string; width: number; height: number; shadow: number } {
  const { fill, stroke, size, glow } = style;
  const pad = glowPad(style);
  const shadow = glow ? 0 : size >= 12 ? 2 : 1.5;
  const r = size / 2 - 0.5;
  const width = size + 2 + pad * 2;
  const height = size + 2 + shadow + pad * 2;
  const c = width / 2;
  const cy = pad + size / 2 + 1;
  const halo = glow
    ? `<defs><radialGradient id="g"><stop offset="0%" stop-color="${PIN_HEX.ember}" stop-opacity="0.65"/><stop offset="100%" stop-color="${PIN_HEX.ember}" stop-opacity="0"/></radialGradient></defs>` +
      `<circle cx="${c}" cy="${cy}" r="${r + pad}" fill="url(#g)"/>`
    : `<circle cx="${c}" cy="${cy + shadow}" r="${r}" fill="${PIN_HEX.ink}" opacity="0.85"/>`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    halo +
    `<circle cx="${c}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>` +
    `</svg>`;
  return { svg, width, height, shadow };
}

/** Pixel offset of the circle centre inside the image (the Kakao anchor point). */
export const pinAnchor = (style: PinStyle) => {
  const { width } = pinSvg(style);
  return { x: width / 2, y: glowPad(style) + style.size / 2 + 1 };
};

export const pinDataUri = (style: PinStyle) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(pinSvg(style).svg)}`;

/** Cluster circles (TECH-12): ink fill, bone Mono count, 24 / 32 / 40px for <10 / 10–49 / ≥50 pins. */
export const CLUSTER_CALCULATOR = [10, 50];
export const CLUSTER_SIZES = [24, 32, 40];
export const clusterStyles = () =>
  CLUSTER_SIZES.map((s, i) => ({
    width: `${s}px`,
    height: `${s}px`,
    lineHeight: `${s - 2}px`, // border-box: 1px border on each side
    boxSizing: 'border-box',
    borderRadius: '50%',
    background: PIN_HEX.ink,
    color: PIN_HEX.bone,
    border: `1px solid ${PIN_HEX.bone}`,
    boxShadow: `0 2px 0 rgba(20,19,15,0.35)`,
    textAlign: 'center',
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
    fontSize: `${[10, 11, 12][i]}px`,
    fontWeight: '600',
  }));
/** Clustering only while zoomed out: at this level and above (≥ 6). Closer than that, every pin shows. */
export const CLUSTER_MIN_LEVEL = 6;
