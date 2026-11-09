/**
 * v3 map pins (decision 2026-11-09): 행사 = ink fill, 문화공간 = bone fill + 1.5px ink border,
 * 야경명소 = night fill, selected = tangerine (tangerine use #9 "지도 강조 핀"). The old orange/green/purple
 * marker colours are gone. Pins are SVG data URIs (Kakao MarkerImage needs an image URL), so token values
 * are written as hex here — keep them in sync with index.css: ink #14130f, bone #f6f2ea, night #111d38,
 * tangerine #e2542f. Ink/night pins get a thin bone ring so they stay visible on dark map areas.
 */
import type { MapKind } from './selectors';

export const PIN_HEX = { ink: '#14130f', bone: '#f6f2ea', night: '#111d38', tangerine: '#e2542f' } as const;

export type PinStyle = { fill: string; stroke: string; size: number };

export const PIN_STYLES: Record<MapKind | 'selected', PinStyle> = {
  event: { fill: PIN_HEX.ink, stroke: PIN_HEX.bone, size: 16 },
  space: { fill: PIN_HEX.bone, stroke: PIN_HEX.ink, size: 16 },
  night: { fill: PIN_HEX.night, stroke: PIN_HEX.bone, size: 16 },
  selected: { fill: PIN_HEX.tangerine, stroke: PIN_HEX.ink, size: 26 },
};

/** Circle with a 1.5px border and the v3 hard ink shadow (offset 3px down). */
export function pinSvg({ fill, stroke, size }: PinStyle): { svg: string; width: number; height: number } {
  const r = size / 2 - 0.75;
  const width = size + 2;
  const height = size + 5;
  const c = width / 2;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<circle cx="${c}" cy="${size / 2 + 3}" r="${r}" fill="${PIN_HEX.ink}" opacity="0.85"/>` +
    `<circle cx="${c}" cy="${size / 2}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>` +
    `</svg>`;
  return { svg, width, height };
}

export const pinDataUri = (style: PinStyle) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(pinSvg(style).svg)}`;
