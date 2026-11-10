/**
 * utils/sun.ts (NOAA equations) vs. KASI (한국천문연구원) published Seoul sunsets.
 * Reference: astro.kasi.re.kr "월별 해/달 출몰시각", 서울 (37°34′N, 126°59′E), fetched 2026-11-10.
 * KASI rounds to the minute; we allow ±1 minute.
 */
import { test, expect } from '@playwright/test';
import { seoulSunsetMinutes, formatHm, kstDateParts } from '../utils/sun';

const KASI_SEOUL_SUNSET: Array<[string, string]> = [
  ['2026-03-01', '18:25'], ['2026-03-10', '18:34'], ['2026-03-21', '18:44'],
  ['2026-06-01', '19:47'], ['2026-06-10', '19:53'], ['2026-06-21', '19:57'],
  ['2026-09-01', '19:02'], ['2026-09-10', '18:48'], ['2026-09-21', '18:31'],
  ['2026-11-01', '17:34'], ['2026-11-10', '17:25'], ['2026-11-21', '17:18'],
  ['2026-12-01', '17:14'], ['2026-12-10', '17:14'], ['2026-12-21', '17:17'],
];

test.describe('Seoul sunset (NOAA) vs KASI', () => {
  for (const [date, kasi] of KASI_SEOUL_SUNSET) {
    test(`${date}: KASI ${kasi}`, () => {
      const [y, m, d] = date.split('-').map(Number);
      const calc = seoulSunsetMinutes(y, m, d);
      const [h, mm] = kasi.split(':').map(Number);
      expect(Math.abs(calc - (h * 60 + mm)), `calc ${formatHm(calc)}`).toBeLessThanOrEqual(1);
    });
  }

  test('KST date parts', () => {
    expect(kstDateParts(new Date('2026-11-10T14:59:00Z'))).toMatchObject({ y: 2026, m: 11, d: 10, weekday: 2, minutes: 23 * 60 + 59 });
    expect(kstDateParts(new Date('2026-11-10T15:00:00Z'))).toMatchObject({ d: 11, weekday: 3, minutes: 0 });
  });
});
