/**
 * Night-spot status from OPERATING_TIME (decision 2026-11-10).
 *  - "sunset": lights switch on relative to sunset ("일몰 30분후 점등 ~ 23:00 소등") → badge "● 점등 중"
 *  - "always": 24시간 / 상시 / 운영 제한 없음 → "운영 중"
 *  - "hours":  plain time ranges, optionally per weekday ("화~금 10:00~21:00, 주말 10:00~22:00",
 *              "월요일 휴관") → "운영 중" / "운영 종료"
 *  - "none":   seasonal / monthly / unclear → no badge, the raw text only.
 * Public holidays are not modelled (shown as their weekday).
 */

export type NightRule =
  | { kind: 'sunset'; offset: number; off: number; closed: number[] } // minutes relative to sunset; off = minutes after midnight
  | { kind: 'always' }
  | { kind: 'hours'; days: Array<{ days: number[]; open: number; close: number } | { days: number[]; unknown: true }>; closed: number[] }
  | { kind: 'none' };

export type NightState =
  | { badge: 'lit'; label: '점등 중' }
  | { badge: 'soon'; label: string } // "17:55 점등"
  | { badge: 'off'; label: '소등' }
  | { badge: 'open'; label: '운영 중' }
  | { badge: 'closed'; label: '운영 종료' }
  | { badge: 'none'; label: '' };

const ALL = [0, 1, 2, 3, 4, 5, 6];
const DAY: Record<string, number> = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };

const toMin = (h: string, m?: string) => Number(h) * 60 + (m ? Number(m) : 0);
const range = (a: number, b: number) => { const out: number[] = []; for (let d = a; ; d = (d + 1) % 7) { out.push(d); if (d === b) break; } return out; };

/** Closed weekdays: "월요일 휴관/휴무", "매주 월요일", "매주월요일 정기휴관". */
function closedDays(t: string): number[] {
  const out: number[] = [];
  for (const m of t.matchAll(/(?:매주\s*)?([월화수목금토일])요일\s*(?:정기\s*)?(?:휴관|휴무)|매주\s*([월화수목금토일])요일/g)) out.push(DAY[(m[1] || m[2])]);
  return [...new Set(out)];
}

/** Day spec at the start of a segment → weekdays, or null when the segment applies to every day. */
function daySpec(seg: string): number[] | null {
  if (/평일/.test(seg)) return [1, 2, 3, 4, 5];
  if (/주말/.test(seg)) return [0, 6];
  const r = /([월화수목금토일])\s*~\s*([월화수목금토일])/.exec(seg);
  if (r) return range(DAY[r[1]], DAY[r[2]]);
  const list = /^\s*([월화수목금토일](?:\s*,\s*[월화수목금토일])+)/.exec(seg);
  if (list) return list[1].split(',').map((s) => DAY[s.trim()]);
  return null;
}

const TIME_RANGE = /(\d{1,2})(?::(\d{2}))?\s*시?\s*[~-]\s*(\d{1,2})(?::(\d{2}))?\s*시?/;
const SEASONAL = /성수기|비수기|하절기|동절기|월별|계절별|\d{1,2}\s*월\s*[~-]|\d{1,2}\s*~\s*\d{1,2}\s*월/;

export function parseOperatingTime(raw: string | undefined, month: number): NightRule {
  const t = (raw || '').replace(/\s+/g, ' ').trim();
  if (!t) return { kind: 'none' };

  if (/일몰/.test(t)) {
    // Month-specific variants ("11~ 4월 : … 23:00 / 5 ~ 10월 : … 24:00"): use the one for this month.
    let seg = t;
    const parts = t.split('/');
    const monthed = parts.map((p) => ({ p, m: /(\d{1,2})\s*~\s*(\d{1,2})\s*월/.exec(p) })).filter((x) => x.m);
    if (monthed.length) {
      const hit = monthed.find(({ m }) => { const a = Number(m![1]), b = Number(m![2]); return a <= b ? month >= a && month <= b : month >= a || month <= b; });
      if (!hit) return { kind: 'none' };
      seg = hit.p;
    }
    const after = /일몰\s*(\d+)\s*분\s*후|일몰후|일몰\s*후/.exec(seg);
    const before = /일몰\s*전\s*(\d+)\s*분|일몰\s*(\d+)\s*분\s*전/.exec(seg);
    const offset = before ? -Number(before[1] || before[2]) : after && after[1] ? Number(after[1]) : 0;
    const offM = /~\s*(\d{1,2}):(\d{2})/.exec(seg.slice(seg.indexOf('일몰')));
    if (!offM) return { kind: 'none' };
    const closed = closedDays(t);
    if (/화\s*~\s*일/.test(t) && !closed.includes(1)) closed.push(1);
    return { kind: 'sunset', offset, off: toMin(offM[1], offM[2]), closed };
  }
  if (/24시간|상시|운영 제한 없음/.test(t)) return { kind: 'always' };
  if (SEASONAL.test(t)) return { kind: 'none' };

  const closed = closedDays(t);
  const segs = t.split(/\s*\/\s*|,\s*(?=주말|평일|[월화수목금토일]\s*~)/);
  const days: Extract<NightRule, { kind: 'hours' }>['days'] = [];
  for (const seg of segs) {
    if (/휴관|휴무/.test(seg) && !TIME_RANGE.test(seg)) continue;
    const m = TIME_RANGE.exec(seg);
    // Day spec only counts before the time ("09시 ~ 18시 * 주말 경기 시 상이" is a note, not a rule).
    const spec = daySpec(m ? seg.slice(0, m.index) : seg);
    if (m) days.push({ days: spec ?? ALL, open: toMin(m[1], m[2]), close: toMin(m[3], m[4]) });
    else if (spec) days.push({ days: spec, unknown: true });
  }
  if (!days.some((d) => 'open' in d)) return { kind: 'none' };
  // "화~일 …" without an explicit closure line still means Monday is closed.
  return { kind: 'hours', days, closed };
}

/**
 * Status at `minutes` after KST midnight on weekday `weekday` (0 = Sunday), with today's sunset.
 */
export function nightState(rule: NightRule, minutes: number, weekday: number, sunset: number): NightState {
  switch (rule.kind) {
    case 'sunset': {
      if (rule.closed.includes(weekday)) return { badge: 'off', label: '소등' };
      const on = sunset + rule.offset;
      const off = rule.off <= on ? rule.off + 1440 : rule.off;
      if (minutes >= on && minutes < off) return { badge: 'lit', label: '점등 중' };
      if (minutes < on) return { badge: 'soon', label: `${String(Math.floor(on / 60)).padStart(2, '0')}:${String(on % 60).padStart(2, '0')} 점등` };
      return { badge: 'off', label: '소등' };
    }
    case 'always':
      return { badge: 'open', label: '운영 중' };
    case 'hours': {
      if (rule.closed.includes(weekday)) return { badge: 'closed', label: '운영 종료' };
      const today = rule.days.find((d) => d.days.includes(weekday));
      if (!today || !('open' in today)) return { badge: 'none', label: '' };
      const close = today.close <= today.open ? today.close + 1440 : today.close;
      return minutes >= today.open && minutes < close ? { badge: 'open', label: '운영 중' } : { badge: 'closed', label: '운영 종료' };
    }
    default:
      return { badge: 'none', label: '' };
  }
}
