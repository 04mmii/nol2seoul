/**
 * Synthetic fixtures for `/api/seoulapi?type=event|space|night`.
 *
 * These are NOT real Seoul Open API records. They imitate the response shape the app reads
 * (`data.culturalEventInfo.row`, `data.culturalSpaceInfo.row`, `data.viewNightSpot.row`) and are
 * designed around a fixed "today" so date-dependent UI (Home 오늘/이번주) is deterministic.
 *
 * IDs (BUG-08, utils/eventId.ts): each event's route/favorite ID is the `cultcode` in HMPG_ADDR.
 * Synthetic cultcodes are 9000xx so they can't be mistaken for real ones. `thisWeekPlay` has no
 * HMPG_ADDR on purpose → it exercises the hash fallback. `index` is the array position, kept for
 * BUG-08 migration tests (old favorites stored indexes).
 */

/** Fixed clock for every test: 2026-11-03 12:00 KST (03:00 UTC). Home compares UTC ISO dates. */
export const FIXED_NOW = new Date('2026-11-03T03:00:00.000Z');

/** Image URLs on this host are fulfilled with a 1×1 PNG by the network guard. */
export const FIXTURE_IMAGE_HOST = 'fixtures.nolseoul.test';
const img = (n: number) => `https://${FIXTURE_IMAGE_HOST}/event-${n}.png`;
const cultcode = (n: number) => String(900000 + n);
const portal = (n: number) => `https://culture.example.test/cultureEvent/view.do?cultcode=${cultcode(n)}&menuNo=200008`;

type EventRow = Record<string, string>;

const baseEvent = (overrides: EventRow): EventRow => ({
  CODENAME: '',
  GUNAME: '',
  TITLE: '',
  DATE: '',
  PLACE: '',
  ORG_NAME: '[픽스처] 주최기관',
  USE_TRGT: '누구나',
  USE_FEE: '',
  PLAYER: '',
  PROGRAM: '',
  ETC_DESC: '',
  ORG_LINK: '',
  MAIN_IMG: '',
  STRTDATE: '',
  END_DATE: '',
  THEMECODE: '',
  LOT: '',
  LAT: '',
  IS_FREE: '유료',
  HMPG_ADDR: '',
  ...overrides,
});

/** Named events with known indexes. */
export const EV = {
  /** index 0 — future (December), paid, 종로구. Not shown on Home 오늘/이번주. */
  futureExhibition: {
    index: 0,
    id: '900000',
    title: '[픽스처] 12월 미래 전시',
  },
  /** index 1 — ongoing today, IS_FREE=무료, 강남구. */
  todayFreeClassic: {
    index: 1,
    id: '900001',
    title: '[픽스처] 오늘 무료 클래식',
  },
  /** index 2 — ongoing today, IS_FREE=유료 but USE_FEE says 무료 (BUG-03 case → fee kind "확인 필요"), 마포구. */
  todayFestivalFeeText: {
    index: 2,
    id: '900002',
    title: '[픽스처] 오늘 축제 무료입장',
  },
  /** index 3 — starts in 3 days (this week only), paid, 강남구. */
  thisWeekPlay: {
    index: 3,
    /** No cultcode → hash fallback: eventId() of TITLE | STRTDATE | PLACE. Every test that opens this event checks it. */
    id: 'hxrizkd',
    title: '[픽스처] 이번주 연극',
  },
} as const;

const namedEvents: EventRow[] = [
  baseEvent({
    TITLE: EV.futureExhibition.title,
    CODENAME: '전시/미술',
    GUNAME: '종로구',
    PLACE: '[픽스처] 종로 갤러리',
    DATE: '2026-12-01~2026-12-31',
    STRTDATE: '2026-12-01 00:00:00.0',
    END_DATE: '2026-12-31 00:00:00.0',
    USE_FEE: '10,000원',
    IS_FREE: '유료',
    MAIN_IMG: img(0),
    PROGRAM: '[픽스처] 미래 전시 프로그램 소개',
    // Fields seen in live data (2026-11-09) that the v3 detail page uses:
    ETC_DESC: `https://${FIXTURE_IMAGE_HOST}/etc-desc-0.jpg`, // live ETC_DESC is sometimes just an image URL
    ORG_LINK: 'https://tickets.example.test/goods/0',
    HMPG_ADDR: portal(0),
    PRO_TIME: '10:00~18:00',
    INQUIRY: '02-000-0000',
    PLAYER: '[픽스처] 작가 미상',
    THEMECODE: '기타',
    RGSTDATE: '2026-10-01',
    LAT: '37.5759',
    LOT: '126.9768',
  }),
  baseEvent({
    TITLE: EV.todayFreeClassic.title,
    CODENAME: '클래식',
    GUNAME: '강남구',
    PLACE: '[픽스처] 강남 콘서트홀',
    DATE: '2026-11-01~2026-11-05',
    STRTDATE: '2026-11-01 00:00:00.0',
    END_DATE: '2026-11-05 00:00:00.0',
    USE_FEE: '',
    IS_FREE: '무료',
    MAIN_IMG: img(1),
    HMPG_ADDR: portal(1),
  }),
  baseEvent({
    TITLE: EV.todayFestivalFeeText.title,
    CODENAME: '축제-문화/예술',
    GUNAME: '마포구',
    PLACE: '[픽스처] 마포 광장',
    DATE: '2026-11-02~2026-11-04',
    STRTDATE: '2026-11-02 00:00:00.0',
    END_DATE: '2026-11-04 00:00:00.0',
    USE_FEE: '무료(사전예약)',
    IS_FREE: '유료',
    MAIN_IMG: img(2),
    HMPG_ADDR: portal(2),
  }),
  baseEvent({
    TITLE: EV.thisWeekPlay.title,
    CODENAME: '연극',
    GUNAME: '강남구',
    PLACE: '[픽스처] 강남 소극장',
    DATE: '2026-11-06~2026-11-08',
    STRTDATE: '2026-11-06 00:00:00.0',
    END_DATE: '2026-11-08 00:00:00.0',
    USE_FEE: '30,000원',
    IS_FREE: '유료',
    MAIN_IMG: img(3),
  }),
];

/**
 * indexes 4–15 — 12 future filler events (IS_FREE=유료, 서초구) to exercise pagination.
 * Fee text varies to cover every fee kind (utils/fee.ts): filler 01 = 가격 상이, 02 = 일부 무료, rest = 유료.
 */
const fillerEvents: EventRow[] = Array.from({ length: 12 }, (_, i) => {
  const n = String(i + 1).padStart(2, '0');
  return baseEvent({
    TITLE: `[픽스처] 기타 행사 ${n}`,
    CODENAME: i % 2 === 0 ? '교육/체험' : '국악',
    GUNAME: '서초구',
    PLACE: `[픽스처] 서초 문화센터 ${n}`,
    DATE: '2027-01-10~2027-01-20',
    STRTDATE: '2027-01-10 00:00:00.0',
    END_DATE: '2027-01-20 00:00:00.0',
    USE_FEE: i === 0 ? '티켓별 상이' : i === 1 ? '무료(일부 프로그램 유료)' : '5,000원',
    IS_FREE: '유료',
    MAIN_IMG: img(4 + i),
    HMPG_ADDR: portal(4 + i),
  });
});

export const EVENTS: EventRow[] = [...namedEvents, ...fillerEvents];

/** Stable ID of filler n (1-based, "기타 행사 0n"). */
export const fillerId = (n: number) => cultcode(3 + n);

/** Expected counts derived from the fixture (keep in sync with the data above). */
export const EXPECT = {
  total: EVENTS.length, // 16
  perPage: 12,
  gangnam: 2, // todayFreeClassic + thisWeekPlay
  freeByIsFree: 1, // only todayFreeClassic is fee kind "free" (BUG-03 option D)
} as const;

export const SPACES = [
  {
    NUM: '1',
    SUBJCODE: '미술관',
    FAC_CODE: '9001',
    FAC_NAME: '[픽스처] 서울 미술관',
    ADDR: '서울특별시 종로구 픽스처로 1',
    X_COORD: 37.57,
    Y_COORD: 126.98,
    PHNE: '02-000-0000',
    FAX: '',
    HOMEPAGE: '',
    CLOSEDAY: '월요일',
    MAIN_IMG: '',
    DTLCONT: '[픽스처] 문화공간 설명',
    TICKET_YN: 'N',
  },
];

export const SPOTS = [
  {
    NUM: '1',
    SUBJECT_CD: '공원',
    TITLE: '[픽스처] 남산 야경',
    ADDR: '서울특별시 중구 픽스처길 2',
    LA: '37.55',
    LO: '126.99',
    TEL_NO: '',
    URL: '',
    OPERATING_TIME: '18:00~24:00',
    ENTR_FEE: '무료',
    CONTENTS: '',
    CONTENT: '[픽스처] 야경 설명',
    SUBWAY: '',
    BUS: '',
  },
];

const wrap = (key: string, row: unknown[]) => ({
  [key]: { list_total_count: row.length, RESULT: { CODE: 'INFO-000', MESSAGE: '정상 처리되었습니다' }, row },
});

export const API_RESPONSES: Record<string, unknown> = {
  event: wrap('culturalEventInfo', EVENTS),
  space: wrap('culturalSpaceInfo', SPACES),
  night: wrap('viewNightSpot', SPOTS),
};

/** 1×1 transparent PNG. */
export const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);
