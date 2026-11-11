/**
 * AI course recommendation ("코스추천" remote) — shared, dependency-free logic (approved 2026-11-11).
 * Used by the Vercel function (api/course.ts), the Vite dev middleware and the browser.
 *
 * Rules:
 *  - Candidates come only from our data (events · cultural spaces · night spots), built in the browser
 *    from the API responses it already has. The server caps their number and length.
 *  - A course is always 3 stops in this order: 문화행사 → 문화공간 → 야경명소.
 *  - Any id the model returns that isn't in the candidate list (or is in the wrong slot) is dropped,
 *    and that slot is filled by the rule-based picker; the result says so.
 *  - Without a model (no key, error, timeout) the whole course is rule-based, marked as such.
 */

export type CourseKind = 'event' | 'space' | 'night';
export const COURSE_ORDER: readonly CourseKind[] = ['event', 'space', 'night'];

export type Candidate = {
  id: string; // event: eventId, space: "s<NUM>", night: "n<NUM>"
  kind: CourseKind;
  name: string;
  area: string; // 자치구
  sub: string; // category / venue
  meta: string; // dates · fee / operating time
  lat: number | null;
  lng: number | null;
  free?: boolean;
  /** Night: "17:55" when the lights come on today (sunset rule), "" if not sunset-based. */
  lightsAt?: string;
  /** Night: lit right now (점등 중). */
  litNow?: boolean;
  /** Night: open right now (운영 중). */
  openNow?: boolean;
};

export type CourseRequest = {
  query: string;
  candidates: Candidate[];
  /** Page context: start with this event (event detail) / end with this night spot (night page). */
  startId?: string;
  endId?: string;
  /** "다시 짜기": ids to avoid this time. */
  exclude?: string[];
  /** Today's sunset "HH:MM" (KST), for the prompt. */
  sunset?: string;
};

export type CourseStop = { id: string; kind: CourseKind; reason: string };
export type CourseSource = 'ai' | 'rules';
export type CourseResult = { title: string; stops: CourseStop[]; source: CourseSource; note?: string };

const LIMITS = { query: 200, perKind: 40, text: 80, exclude: 30 } as const;
const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Validates and trims an untrusted request body. Returns null when it can't make a course. */
export function sanitizeRequest(body: unknown): CourseRequest | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const query = clip(b.query, LIMITS.query);
  const counts: Record<CourseKind, number> = { event: 0, space: 0, night: 0 };
  const seen = new Set<string>();
  const candidates: Candidate[] = [];
  for (const raw of Array.isArray(b.candidates) ? b.candidates : []) {
    if (!raw || typeof raw !== 'object') continue;
    const c = raw as Record<string, unknown>;
    const kind = c.kind as CourseKind;
    const id = clip(c.id, 40);
    if (!COURSE_ORDER.includes(kind) || !id || seen.has(id) || counts[kind] >= LIMITS.perKind) continue;
    seen.add(id);
    counts[kind]++;
    candidates.push({
      id, kind,
      name: clip(c.name, LIMITS.text), area: clip(c.area, 20), sub: clip(c.sub, LIMITS.text), meta: clip(c.meta, LIMITS.text),
      lat: num(c.lat), lng: num(c.lng), free: c.free === true,
      lightsAt: clip(c.lightsAt, 5), litNow: c.litNow === true, openNow: c.openNow === true,
    });
  }
  if (COURSE_ORDER.some((k) => counts[k] === 0)) return null;
  const exclude = (Array.isArray(b.exclude) ? b.exclude : []).map((x) => clip(x, 40)).filter(Boolean).slice(0, LIMITS.exclude);
  return { query, candidates, startId: clip(b.startId, 40) || undefined, endId: clip(b.endId, 40) || undefined, exclude, sunset: clip(b.sunset, 5) || undefined };
}

/** Cache key: the same input gives the same course (no extra model call). */
export function cacheKey(r: CourseRequest): string {
  const cand = r.candidates.map((c) => `${c.id}:${c.litNow ? 1 : 0}${c.openNow ? 1 : 0}${c.lightsAt}`).join(',');
  return JSON.stringify([r.query.replace(/\s+/g, ' ').toLowerCase(), r.startId ?? '', r.endId ?? '', [...(r.exclude ?? [])].sort(), cand]);
}

// ---------------------------------------------------------------------------------------------
// Rule-based course (fallback, and the filler for dropped AI stops)
// ---------------------------------------------------------------------------------------------

export function distanceKm(a: Candidate, b: Candidate): number | null {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Situation words (who / when / mood) aren't place or genre keywords; matching them against titles picks
// random events ("친구" → "[우리소리 친구들]"), so they are ignored for matching.
const STOP_WORDS = new Set(['코스', '추천', '오늘', '같이', '보고', '나서', '하는', '근처', '정도', '싶어', '가고', '으로', '에서', '마무리',
  '친구', '친구랑', '데이트', '저녁', '오후', '아침', '주말', '토요일', '일요일', '가볍게', '위주', '혼자', '연인', '가족', '아이', '시간', '3시간', '2시간', '야경']);
export function queryTokens(q: string): string[] {
  return q.split(/[\s,.·/]+/).map((t) => t.replace(/(으로|에서|이랑|랑|하고|까지|부터|의|를|을|은|는|이|가|와|과|도)$/, '')).filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
}

const wantsFree = (q: string) => /무료/.test(q);

function keywordScore(c: Candidate, tokens: string[]): number {
  const hay = `${c.name} ${c.sub} ${c.area}`;
  return tokens.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0);
}

const fmtKm = (d: number | null) => (d == null ? '' : d < 1 ? `약 ${Math.max(100, Math.round(d * 10) * 100)}m` : `약 ${d.toFixed(1)}km`);

function pickFor(kind: CourseKind, r: CourseRequest, prev: Candidate | null, used: Set<string>): Candidate | null {
  const tokens = queryTokens(r.query);
  const free = wantsFree(r.query);
  const ex = new Set([...(r.exclude ?? []), ...used]);
  const forced = kind === 'event' ? r.startId : kind === 'night' ? r.endId : undefined;
  if (forced) {
    const f = r.candidates.find((c) => c.id === forced && c.kind === kind);
    if (f) return f;
  }
  const pool = r.candidates.filter((c) => c.kind === kind && !ex.has(c.id) && (!free || kind !== 'event' || c.free));
  const list = pool.length ? pool : r.candidates.filter((c) => c.kind === kind && !used.has(c.id));
  // Place words ("성수") often match a space or night spot but no event: start near those places.
  const anchors = !prev ? r.candidates.filter((c) => c.kind !== kind && keywordScore(c, tokens) > 0) : [];
  let best: Candidate | null = null;
  let bestScore = -Infinity;
  list.forEach((c, i) => {
    let s = keywordScore(c, tokens) * 10 - i * 0.01; // candidate order = client ranking (ongoing, ending soon)
    if (anchors.length) {
      const d = anchors.reduce((m, a) => { const x = distanceKm(a, c); return x == null ? m : Math.min(m, x); }, Infinity);
      if (Number.isFinite(d)) s -= d * 0.5;
    }
    if (free && c.free) s += 3;
    if (prev) {
      const d = distanceKm(prev, c);
      if (d != null) s -= d; // closer is better
      if (c.area && c.area === prev.area) s += 1;
    }
    if (kind === 'night') s += (c.litNow ? 2 : 0) + (c.lightsAt ? 1.5 : 0) + (c.openNow ? 0.5 : 0);
    if (s > bestScore) { bestScore = s; best = c; }
  });
  return best;
}

export function ruleReason(c: Candidate, prev: Candidate | null, r: CourseRequest): string {
  const tokens = queryTokens(r.query).filter((t) => `${c.name} ${c.sub} ${c.area}`.includes(t));
  const d = prev ? fmtKm(distanceKm(prev, c)) : '';
  if (c.kind === 'event') {
    if (r.startId === c.id) return '보고 있던 행사로 코스를 시작해요.';
    if (tokens.length) return `‘${tokens.slice(0, 2).join(', ')}’와 맞는 행사로 시작해요.`;
    const near = queryTokens(r.query).find((t) => r.candidates.some((x) => x.kind !== 'event' && `${x.name} ${x.area}`.includes(t)));
    if (near) return `‘${near}’ 쪽으로 이어가기 좋은 행사로 시작해요.`;
    return wantsFree(r.query) && c.free ? '무료로 볼 수 있는 행사로 시작해요.' : '지금 볼 수 있는 행사 중 조건에 가까운 곳으로 시작해요.';
  }
  if (c.kind === 'space') {
    return `${d ? `행사 장소에서 ${d}, ` : ''}${c.area ? `${c.area}에 있는 ` : ''}${c.sub || '문화공간'}이에요.`;
  }
  if (r.endId === c.id) return '보고 있던 야경명소로 마무리해요.';
  const light = c.litNow ? '지금 불이 켜져 있어요' : c.lightsAt ? `오늘 ${c.lightsAt}에 불이 켜져요` : c.openNow ? '지금 갈 수 있어요' : '';
  return [light, d ? `앞 정류장에서 ${d}` : ''].filter(Boolean).join(' · ') + '.';
}

export function ruleCourse(r: CourseRequest, note?: string): CourseResult {
  const used = new Set<string>();
  const stops: CourseStop[] = [];
  let prev: Candidate | null = null;
  for (const kind of COURSE_ORDER) {
    const c = pickFor(kind, r, prev, used);
    if (!c) continue;
    used.add(c.id);
    stops.push({ id: c.id, kind, reason: ruleReason(c, prev, r) });
    prev = c;
  }
  return { title: '오늘의 3스톱 코스', stops, source: 'rules', note };
}

/** "다른 곳으로": the best rule-based alternative for one slot, not already in the course. */
export function swapStop(r: CourseRequest, course: CourseResult, index: number): CourseResult | null {
  const kind = COURSE_ORDER[index];
  const byId = new Map(r.candidates.map((c) => [c.id, c]));
  const used = new Set(course.stops.map((s) => s.id));
  const prev = index > 0 ? byId.get(course.stops[index - 1]?.id) ?? null : null;
  const c = pickFor(kind, { ...r, startId: undefined, endId: undefined, exclude: [...(r.exclude ?? []), ...used] }, prev, used);
  if (!c || used.has(c.id)) return null;
  const stops = course.stops.slice();
  stops[index] = { id: c.id, kind, reason: ruleReason(c, prev, r) };
  return { ...course, stops };
}

// ---------------------------------------------------------------------------------------------
// Model prompt + validation
// ---------------------------------------------------------------------------------------------

export const COURSE_SYSTEM = `너는 서울 문화 큐레이션 서비스 '놀서울'의 코스 추천 기능이다.
사용자가 준 후보 목록에 있는 장소만 써서 3개 정류장 코스를 짠다. 목록에 없는 장소, 가격, 평점, 후기는 만들지 않는다.
순서는 반드시 문화행사(event) 1곳 → 문화공간(space) 1곳 → 야경명소(night) 1곳이다.
이동이 짧도록 가까운 곳(좌표·자치구)을 고르고, 야경명소는 점등 시각(lightsAt)이나 지금 켜짐(litNow) 정보가 있으면 이유에 반영한다.
이유(reason)는 사용자의 상황과 연결한 한국어 한 문장(45자 이내)으로 쓴다.`;

export const COURSE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: '코스 제목, 14자 이내' },
    stops: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '후보 목록의 id 그대로' },
          reason: { type: 'string' },
        },
        required: ['id', 'reason'],
        additionalProperties: false,
      },
    },
  },
  required: ['title', 'stops'],
  additionalProperties: false,
} as const;

export function coursePrompt(r: CourseRequest): string {
  const line = (c: Candidate) => [c.id, c.kind, c.name, c.area, c.sub, c.meta,
    c.lat != null && c.lng != null ? `${c.lat.toFixed(3)},${c.lng.toFixed(3)}` : '-',
    c.kind === 'night' ? `lightsAt=${c.lightsAt || '-'} litNow=${c.litNow ? 'yes' : 'no'} openNow=${c.openNow ? 'yes' : 'no'}` : c.free ? '무료' : '',
  ].join(' | ');
  return [
    `사용자 상황: "${r.query || '(입력 없음 — 오늘 저녁 무난한 코스)'}"`,
    r.sunset ? `오늘 서울 일몰: ${r.sunset}` : '',
    r.startId ? `첫 정류장은 반드시 ${r.startId}.` : '',
    r.endId ? `마지막 정류장은 반드시 ${r.endId}.` : '',
    r.exclude?.length ? `이번에는 쓰지 말 것: ${r.exclude.join(', ')}` : '',
    '후보 목록 (id | kind | 이름 | 자치구 | 분류 | 일정·요금/운영시간 | 좌표 | 기타):',
    ...r.candidates.map(line),
  ].filter(Boolean).join('\n');
}

/**
 * Turns the model's JSON into a course. Unknown / wrong-slot / excluded ids are dropped and their slot
 * is filled by the rule-based picker (so the app always gets 3 valid stops).
 */
export function validateAiCourse(raw: unknown, r: CourseRequest): CourseResult {
  const byId = new Map(r.candidates.map((c) => [c.id, c]));
  const data = (raw && typeof raw === 'object' ? raw : {}) as { title?: unknown; stops?: unknown };
  const given = Array.isArray(data.stops) ? data.stops : [];
  const ex = new Set(r.exclude ?? []);
  const used = new Set<string>();
  const stops: CourseStop[] = [];
  let dropped = 0;
  let prev: Candidate | null = null;
  COURSE_ORDER.forEach((kind) => {
    const s = given.find((g) => {
      const c = g && typeof g === 'object' ? byId.get(String((g as { id?: unknown }).id)) : undefined;
      return c && c.kind === kind && !used.has(c.id) && !ex.has(c.id);
    }) as { id: string; reason?: unknown } | undefined;
    let c = s ? byId.get(String(s.id))! : null;
    let reason = s ? clip(s.reason, 90) : '';
    if (!c) {
      dropped++;
      c = pickFor(kind, r, prev, used);
      if (!c) return;
      reason = ruleReason(c, prev, r);
    }
    if (!reason) reason = ruleReason(c, prev, r);
    used.add(c.id);
    stops.push({ id: c.id, kind, reason });
    prev = c;
  });
  const ignored = given.length - (stops.length - dropped);
  return {
    title: clip(data.title, 20) || '오늘의 3스톱 코스',
    stops,
    source: 'ai',
    note: dropped > 0
      ? `AI 추천 중 목록에 없거나 순서가 맞지 않는 ${dropped}곳은 기본 규칙으로 채웠어요.`
      : ignored > 0 ? '목록에 없는 추천은 뺐어요.' : undefined,
  };
}
