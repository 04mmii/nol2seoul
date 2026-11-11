import React from 'react';
import { Link } from 'react-router-dom';
import NightArt from './NightArt';
import type { NightSpotView } from './selectors';

/**
 * Night spot card shared by the night page (/night) and Home "After Dark" (2026-11-11):
 * state badge (점등 중 / HH:MM 점등 / 소등 / 운영 중 / 운영 종료), photo or mini light map, district ·
 * category, operating time, optional description, and the actions (지도에서 보기 · 찜 · 홈페이지).
 * Styles: components/night/night-v3.css (`.v3-night__card*`), loaded by NightArt.
 */
export const StateBadge: React.FC<{ view: NightSpotView }> = ({ view }) =>
  view.state.badge === 'none' ? null : (
    <span className={`v3-night__badge is-${view.state.badge}`}>{view.state.badge === 'lit' ? '● ' : ''}{view.state.label}</span>
  );

export const SpotActions: React.FC<{ view: NightSpotView; saved: boolean; onToggle: () => void; compact?: boolean }> = ({ view, saved, onToggle, compact }) => (
  <div className={`v3-night__actions ${compact ? 'is-compact' : ''}`}>
    <Link to={`/map?cat=${encodeURIComponent('야경명소')}&spot=${view.id}`} className="v3-btn v3-night__btn-accent">지도에서 보기 →</Link>
    <button type="button" className="v3-btn v3-btn--ghost-light" aria-pressed={saved} onClick={onToggle} aria-label={`${view.spot.TITLE} ${saved ? '찜 해제' : '찜하기'}`}>{saved ? '♥ 찜됨' : '♡ 찜'}</button>
    {view.spot.URL && <a href={view.spot.URL} target="_blank" rel="noopener noreferrer" className="v3-btn v3-btn--ghost-light">홈페이지 ↗</a>}
  </div>
);

const NightSpotCard: React.FC<{
  view: NightSpotView;
  views: NightSpotView[];
  saved: boolean;
  onToggle: () => void;
  /** Night page deep-link target (/night?spot=<id>). */
  isTarget?: boolean;
  /** DOM id for deep links (night page only). */
  domId?: string;
  showDesc?: boolean;
  headingLevel?: 'h3' | 'h4';
}> = ({ view, views, saved, onToggle, isTarget, domId, showDesc = true, headingLevel = 'h3' }) => {
  const Heading = headingLevel;
  return (
    <article id={domId} tabIndex={domId ? -1 : undefined} className={`v3-night__card ${isTarget ? 'is-target' : ''}`}>
      <div className="v3-night__card-top">
        <span className="v3-night__kicker">SPOT № {String(view.index + 1).padStart(2, '0')}</span>
        <StateBadge view={view} />
      </div>
      <div className="v3-night__card-art"><NightArt view={view} views={views} /></div>
      <Heading className="v3-night__card-title">{view.spot.TITLE}</Heading>
      <p className="v3-night__card-meta">{[view.district, view.spot.SUBJECT_CD].filter(Boolean).join(' · ')}</p>
      <p className="v3-night__card-time">
        {view.spot.OPERATING_TIME}
        {view.manual && <span className="v3-night__manual" title="data/night-manual-rules.json — API 값이 아닌 수동 규칙"> · 수동 규칙 적용</span>}
      </p>
      {showDesc && view.desc && <p className="v3-night__card-desc">{view.desc}</p>}
      <SpotActions view={view} saved={saved} onToggle={onToggle} compact />
    </article>
  );
};

export default NightSpotCard;
