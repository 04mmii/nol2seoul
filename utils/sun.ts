/**
 * Sunset time in Seoul, computed with the NOAA solar calculator equations (no API, no key).
 * Accuracy: within ~1–2 minutes; checked against KASI (한국천문연구원) published Seoul sunsets in
 * e2e/sun.spec.ts. Zenith 90.833° (refraction + solar radius), like NOAA and KASI.
 */

/** Seoul as used by KASI's monthly tables (37°34′N, 126°59′E). */
export const SEOUL = { lat: 37 + 34 / 60, lng: 126 + 59 / 60 } as const;
const KST_OFFSET_MIN = 9 * 60;

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

function julianDay(y: number, m: number, d: number): number {
  if (m <= 2) { y -= 1; m += 12; }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
}

function sunParams(jd: number) {
  const t = (jd - 2451545.0) / 36525.0;
  const l0 = (280.46646 + t * (36000.76983 + 0.0003032 * t)) % 360;
  const m = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const c = Math.sin(rad(m)) * (1.914602 - t * (0.004817 + 0.000014 * t)) + Math.sin(rad(2 * m)) * (0.019993 - 0.000101 * t) + Math.sin(rad(3 * m)) * 0.000289;
  const omega = 125.04 - 1934.136 * t;
  const appLong = l0 + c - 0.00569 - 0.00478 * Math.sin(rad(omega));
  const meanObliq = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const obliq = meanObliq + 0.00256 * Math.cos(rad(omega));
  const decl = deg(Math.asin(Math.sin(rad(obliq)) * Math.sin(rad(appLong))));
  const y = Math.tan(rad(obliq / 2)) ** 2;
  const eqTime = 4 * deg(
    y * Math.sin(2 * rad(l0)) - 2 * e * Math.sin(rad(m)) + 4 * e * y * Math.sin(rad(m)) * Math.cos(2 * rad(l0))
    - 0.5 * y * y * Math.sin(4 * rad(l0)) - 1.25 * e * e * Math.sin(2 * rad(m)),
  ); // minutes
  return { decl, eqTime };
}

/** Sunset in minutes after midnight UTC for `jd` (0h UT of the date). `lng` is east-positive. */
function sunsetUtcMinutes(jd: number, lat: number, lng: number): number {
  const calc = (jdAt: number) => {
    const { decl, eqTime } = sunParams(jdAt);
    const haArg = Math.cos(rad(90.833)) / (Math.cos(rad(lat)) * Math.cos(rad(decl))) - Math.tan(rad(lat)) * Math.tan(rad(decl));
    const ha = deg(Math.acos(Math.max(-1, Math.min(1, haArg))));
    return 720 - 4 * (lng - ha) - eqTime;
  };
  const first = calc(jd + 0.5);
  return calc(jd + first / 1440); // refine at the event time
}

/** Today's date parts in Korea. */
export function kstDateParts(now: Date = new Date()) {
  const k = new Date(now.getTime() + KST_OFFSET_MIN * 60_000);
  return { y: k.getUTCFullYear(), m: k.getUTCMonth() + 1, d: k.getUTCDate(), weekday: k.getUTCDay(), minutes: k.getUTCHours() * 60 + k.getUTCMinutes() };
}

/** Sunset in Seoul for a KST calendar date, as minutes after KST midnight (rounded to the minute). */
export function seoulSunsetMinutes(y: number, m: number, d: number, place: { lat: number; lng: number } = SEOUL): number {
  return Math.round(sunsetUtcMinutes(julianDay(y, m, d), place.lat, place.lng) + KST_OFFSET_MIN);
}

export const formatHm = (minutes: number) => {
  const mm = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(mm / 60)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`;
};
