/**
 * utils/night.ts — OPERATING_TIME → status, using strings from the live viewNightSpot API (2026-11-10).
 * Tuesday 2026-11-10, sunset 17:25 (1045 min).
 */
import { test, expect } from '@playwright/test';
import { parseOperatingTime, nightState } from '../utils/night';
import { buildNight } from '../components/night/selectors';

const SUNSET = 17 * 60 + 25;
const TUE = 2, MON = 1, SAT = 6;
const at = (raw: string, hhmm: string, weekday = TUE, month = 11) => {
  const [h, m] = hhmm.split(':').map(Number);
  return nightState(parseOperatingTime(raw, month), h * 60 + m, weekday, SUNSET).label;
};

test.describe('Night spot status from OPERATING_TIME', () => {
  test('sunset-lit bridges: "일몰 30분후 점등 ~ 23:00 소등"', () => {
    const t = '일몰 30분후 점등 ~ 23:00 소등';
    expect(parseOperatingTime(t, 11).kind).toBe('sunset');
    expect(at(t, '15:00')).toBe('17:55 점등');
    expect(at(t, '19:30')).toBe('점등 중');
    expect(at(t, '23:30')).toBe('소등');
  });

  test('"일몰후~ 23:00" and "화~일요일, 일몰전 30분~22:00 ※ 월요일 휴무"', () => {
    expect(at('일몰후~ 23:00', '17:25')).toBe('점등 중');
    const t = '화~일요일, 일몰전 30분~22:00 ※ 월요일 휴무 ';
    expect(at(t, '17:00')).toBe('점등 중');
    expect(at(t, '17:00', MON)).toBe('소등');
  });

  test('month-specific sunset rule (올림픽대교) picks this month', () => {
    const t = '11~ 4월 : 일몰 30분 후 점등 ~ 23:00 소등 / 5 ~ 10월 : 일몰 30분 후 점등 ~ 24:00 소등';
    expect(at(t, '23:30', TUE, 11)).toBe('소등');
    expect(at(t, '23:30', TUE, 7)).toBe('점등 중');
  });

  test('always open: 24시간 / 상시 / 운영 제한 없음', () => {
    for (const t of ['24시간 연중무휴(강우예보 및 우천시 출입통졔)', '상시개방', '운영 제한 없음', '상시']) {
      expect(parseOperatingTime(t, 11).kind).toBe('always');
      expect(at(t, '03:00')).toBe('운영 중');
    }
  });

  test('time ranges with weekday rules and closures', () => {
    expect(at('18:00 -23:00', '19:00')).toBe('운영 중');
    expect(at('18:00 -23:00', '23:10')).toBe('운영 종료');
    expect(at('06:00 - 24:00', '23:59')).toBe('운영 중');
    expect(at('09:00~21:00 (입장마감 20:00)  * 월요일 휴무', '12:00', MON)).toBe('운영 종료');
    expect(at('화~금 10:00~21:00, 주말, 공휴일 10:00~22:00', '21:30', SAT)).toBe('운영 중');
    expect(at('화~금 10:00~21:00, 주말, 공휴일 10:00~22:00', '21:30', TUE)).toBe('운영 종료');
    expect(at('월요일 휴관 / 화~금 9:00~18:00 / 토~일 9:00~20:00', '19:00', SAT)).toBe('운영 중');
    expect(at('09시 ~ 18시 * 주말 경기/행사 시 상이', '13:00', TUE)).toBe('운영 중'); // "주말" is a note
    expect(at('평일 : 9:00 ~18:00 / 주말 : 경기 또는 행사시 운영시간에 따라 상이', '13:00', SAT)).toBe(''); // unknown on weekends
  });

  test('seasonal / monthly / unclear → no badge', () => {
    for (const t of [
      '1월~2월, 11월~12월 09:00~17:00, 3월~5월, 9월~10월 09:00~18:00',
      '화~일 09:00~21:00 * 매주 월요일 정기휴관, 계절별 운영시간 상이',
      '월별 운영시간 상이 (하단 공원소개 내용 참조)',
      '연중무휴 * 타워내 개별시설 운영시간 상이',
      '연중무휴',
    ]) {
      expect(parseOperatingTime(t, 11).kind).toBe('none');
      expect(at(t, '19:30')).toBe('');
    }
  });
});

test.describe('Manual rules (data/night-manual-rules.json)', () => {
  const spot = { NUM: '1', SUBJECT_CD: '문화/체육', TITLE: '남산서울타워', ADDR: '서울특별시 용산구 남산공원길 105', LA: '37.55', LO: '126.99', URL: '', OPERATING_TIME: '연중무휴 * 타워내 개별시설 운영시간 상이', ENTR_FEE: '', SUBWAY: '', BUS: '' } as never;
  const at1930 = new Date('2026-11-10T19:30:00+09:00');

  test('without a manual rule the unparseable time has no status', () => {
    const v = buildNight([spot], at1930, {}).views[0];
    expect(v.state.badge).toBe('none');
    expect(v.manual).toBe(false);
  });

  test('an enabled manual rule replaces OPERATING_TIME and is flagged', () => {
    const v = buildNight([spot], at1930, { 남산서울타워: { enabled: true, operatingTime: '일몰후~ 23:00', source: 'test' } }).views[0];
    expect(v.state.label).toBe('점등 중');
    expect(v.manual).toBe(true);
  });

  test('a disabled manual rule is ignored (the shipped 남산서울타워 example is disabled)', () => {
    const v = buildNight([spot], at1930, { 남산서울타워: { enabled: false, operatingTime: '일몰후~ 23:00' } }).views[0];
    expect(v.state.badge).toBe('none');
    expect(buildNight([spot], at1930).views[0].manual).toBe(false); // real data file
  });
});
