/**
 * Shortcut chips (search panel, no-result screen, empty MyPage). Decision 2026-11-10: names only, no
 * counts — except "지금 켜진 야경 N", which is the night page's own number (점등 중 only; before sunset
 * "곧 켜져요"). Chips just open the page (no filter is passed).
 */
export type QuickLink = { id: string; label: string; to: string; night?: boolean };

export const QUICK_LINKS: Record<string, QuickLink> = {
  freeWeek: { id: 'freeWeek', label: '이번 주 무료 행사', to: '/events' },
  endingSoon: { id: 'endingSoon', label: '곧 마감', to: '/events' },
  nightOn: { id: 'nightOn', label: '지금 켜진 야경', to: '/night', night: true },
  museums: { id: 'museums', label: '박물관·미술관', to: '/map' },
  exhibitWeek: { id: 'exhibitWeek', label: '이번 주 전시', to: '/events' },
};

/** Label for the night chip: "지금 켜진 야경 N" after sunset, "지금 켜진 야경 · 곧 켜져요" before. */
export function nightChipText(night: { lit: number; phase: 'before' | 'lit' | 'late' } | null): string {
  if (!night) return QUICK_LINKS.nightOn.label;
  if (night.lit === 0 && night.phase === 'before') return '지금 켜진 야경 · 곧 켜져요';
  return `지금 켜진 야경 ${night.lit}`;
}
