/**
 * Data shaping for the v3 night page (design-ref/src/page-night.jsx, concept "밤이 오면 켜진다").
 * Only viewNightSpot fields: no photos, elevation, crowd level, tags or curator copy.
 */
import type { NightViewSpot } from '../../types';
import type { FavoriteItem } from '../../hooks/useFavorites';
import { kstDateParts, seoulSunsetMinutes } from '../../utils/sun';
import { nightState, parseOperatingTime, type NightRule, type NightState } from '../../utils/night';
import { htmlToParagraphs } from '../../utils/text';
import { districtFromAddress, projectToSeoulBox } from '../home/selectors';

export type Phase = 'before' | 'lit' | 'late';

export type NightSpotView = {
  index: number; // array index — night-spot IDs are still indexes (BUG-08 open for spots)
  spot: NightViewSpot;
  district: string;
  rule: NightRule;
  state: NightState;
  /** Glowing on the graphics right now: lit (sunset-based) or open after sunset. */
  glowing: boolean;
  pos: { top: number; left: number } | null;
  free: boolean;
  desc: string;
  fav: Omit<FavoriteItem, 'savedAt'>;
};

/** 05:00 → sunset: "곧 켜져요"; sunset → 23:00: "지금 켜져 있어요"; 23:00 → 05:00: "대부분 꺼졌어요". */
export function phaseAt(minutes: number, sunset: number): Phase {
  if (minutes >= 5 * 60 && minutes < sunset) return 'before';
  if (minutes >= sunset && minutes < 23 * 60) return 'lit';
  return 'late';
}

export function buildNight(spots: NightViewSpot[], now: Date) {
  const p = kstDateParts(now);
  const sunset = seoulSunsetMinutes(p.y, p.m, p.d);
  const phase = phaseAt(p.minutes, sunset);
  const views: NightSpotView[] = spots.map((spot, index) => {
    const rule = parseOperatingTime(spot.OPERATING_TIME, p.m);
    const state = nightState(rule, p.minutes, p.weekday, sunset);
    const lat = parseFloat(spot.LA), lng = parseFloat(spot.LO);
    return {
      index,
      spot,
      district: districtFromAddress(spot.ADDR) || '',
      rule,
      state,
      glowing: state.badge === 'lit' || (phase !== 'before' && state.badge === 'open'),
      pos: Number.isFinite(lat) && Number.isFinite(lng) ? projectToSeoulBox(lat, lng) : null,
      free: spot.FREE_YN === '무료',
      desc: htmlToParagraphs(spot.CONTENTS).join(' '),
      fav: { id: String(index), type: 'spot', title: spot.TITLE, location: spot.ADDR, category: '야경명소', date: spot.OPERATING_TIME },
    };
  });
  const lit = views.filter((v) => v.state.badge === 'lit').length;
  const open = views.filter((v) => v.state.badge === 'open').length;
  return { views, sunset, phase, minutes: p.minutes, lit, open };
}

/** Feature: first spot lit now; otherwise the first sunset-lit spot (it lights up soonest), else the first spot. */
export const pickFeature = (views: NightSpotView[]) =>
  views.find((v) => v.state.badge === 'lit') ?? views.find((v) => v.rule.kind === 'sunset') ?? views[0];

export type CollectionId = 'bridges' | 'always' | 'free' | 'open';
export const COLLECTIONS: Array<{ id: CollectionId; ko: string; en: string; test: (v: NightSpotView) => boolean }> = [
  { id: 'bridges', ko: '해 지면 켜지는 불빛', en: 'LIGHTS AT DUSK', test: (v) => v.rule.kind === 'sunset' },
  { id: 'always', ko: '24시간 열린 곳', en: 'ALWAYS OPEN', test: (v) => v.rule.kind === 'always' },
  { id: 'free', ko: '무료로 가는 곳', en: 'FREE ENTRY', test: (v) => v.free },
  { id: 'open', ko: '지금 켜진 곳', en: 'ON RIGHT NOW', test: (v) => v.state.badge === 'lit' || v.state.badge === 'open' },
];

/**
 * Stylised Han River centre line (decorative, approximate) in lat/lng, projected like the spots.
 */
const HAN_RIVER: Array<[number, number]> = [
  [37.598, 126.8], [37.58, 126.84], [37.565, 126.87], [37.553, 126.895], [37.54, 126.915], [37.528, 126.935],
  [37.522, 126.955], [37.517, 126.975], [37.512, 126.995], [37.515, 127.015], [37.525, 127.035], [37.532, 127.055],
  [37.535, 127.075], [37.54, 127.095], [37.548, 127.11], [37.56, 127.13], [37.575, 127.16],
];
export const riverPoints = () =>
  HAN_RIVER.map(([lat, lng]) => projectToSeoulBox(lat, lng)).filter((p): p is { top: number; left: number } => !!p);
