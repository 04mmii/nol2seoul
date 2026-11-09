/**
 * Fee classification for Seoul culturalEventInfo rows — DESIGN.md BUG-03, option D (approved 2026-11-09).
 * One rule for EventList, Home and EventDetail.
 *
 * 1. `IS_FREE` decides first.
 * 2. "일부 무료" only when the fee text says free *and* paid (a positive amount, "유료" or "상이"), or says "일부".
 * 3. Deposits ("예약금", "보증금", "노쇼") are ignored when looking for amounts.
 * 4. "상이" with no amount → "가격 상이" (it doesn't mean partly free).
 * 5. Contradictions → "확인 필요" (no badge, the fee text is shown as is): `IS_FREE=무료` but the text
 *    names a price, or `IS_FREE=유료` but the text only says 무료 (0 live rows on 2026-11-09).
 */
import type { Event } from '../types';

export type FeeKind = 'free' | 'paid' | 'partial' | 'varies' | 'check';

/** Badge labels. `check` has no badge (the fee text is shown instead). */
export const FEE_BADGE_LABEL: Record<Exclude<FeeKind, 'check'>, string> = {
  free: '무료',
  paid: '유료',
  partial: '일부 무료',
  varies: '가격 상이',
};

// Deposit clauses, whichever side the amount is on: "예약금 10,000원 …" / "1인 10,000원의 예약금".
const DEPOSIT = /(예약금|보증금|노쇼)[^,/\n)]*/g;
const DEPOSIT_AFTER = /\d[\d,]*\s*원\s*(?:의\s*)?(?:예약금|보증금|노쇼)/g;
const AMOUNT_WON = /(\d[\d,]*)\s*원/g;
const AMOUNT_KO_UNIT = /\d+(?:\.\d+)?\s*[만천]\s*원/;

/** True when the text names a price above 0 (deposits excluded). */
export function hasPositiveAmount(text: string): boolean {
  const t = text.replace(DEPOSIT_AFTER, ' ').replace(DEPOSIT, ' ');
  if (AMOUNT_KO_UNIT.test(t)) return true;
  for (const m of t.matchAll(AMOUNT_WON)) {
    // "50,000원" — the regex starts at the first digit, so "0원" inside "50,000원" never matches alone.
    const prev = m.index ? t[m.index - 1] : '';
    if (/[\d,]/.test(prev)) continue;
    if (Number(m[1].replace(/,/g, '')) > 0) return true;
  }
  return false;
}

export function feeKind(e: Pick<Event, 'IS_FREE' | 'USE_FEE'>): FeeKind {
  const text = (e.USE_FEE || '').trim();
  const saysFree = text.includes('무료');
  const saysPaid = text.includes('유료');
  const saysPartly = text.includes('일부');
  const amount = hasPositiveAmount(text);
  const varies = text.includes('상이');

  if (e.IS_FREE === '무료') {
    if (saysPartly || (saysFree && (amount || saysPaid))) return 'partial';
    if (amount) return 'check';
    return 'free';
  }
  if (saysPartly || (saysFree && (amount || saysPaid || varies))) return 'partial';
  if (saysFree) return 'check';
  if (varies && !amount) return 'varies';
  return 'paid';
}

export const isFree = (e: Pick<Event, 'IS_FREE' | 'USE_FEE'>) => feeKind(e) === 'free';

/** Text for a fee slot: the badge label, or the raw fee text when the kind is `check`. */
export function feeLabel(e: Pick<Event, 'IS_FREE' | 'USE_FEE'>): string {
  const kind = feeKind(e);
  return kind === 'check' ? (e.USE_FEE || '').trim() : FEE_BADGE_LABEL[kind];
}
