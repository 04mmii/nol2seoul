import React from 'react';
import type { Event } from '../../types';
import { feeKind, feeLabel } from '../../utils/fee';

/**
 * Fee badge (BUG-03 option D): 무료 / 유료 / 일부 무료 / 가격 상이.
 * Kind "확인 필요" (check) has no badge: the raw fee text is rendered as plain text,
 * or nothing at all when `hideCheck` is set (e.g. EventList, which shows the fee text elsewhere).
 * Colours follow DESIGN.md §2.0.1 — no tangerine fill; free uses accent-text. Styles: styles/v3.css.
 */
const FeeBadge: React.FC<{ event: Event; className?: string; hideCheck?: boolean }> = ({ event, className = '', hideCheck }) => {
  const kind = feeKind(event);
  if (kind === 'check' && hideCheck) return null;
  const label = feeLabel(event);
  return (
    <span className={`v3-fee v3-fee--${kind} ${className}`.trim()} title={label}>
      {label}
    </span>
  );
};

export default FeeBadge;
