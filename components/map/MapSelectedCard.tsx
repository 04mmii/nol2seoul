import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import FeeBadge from '../v3/FeeBadge';
import { eventDateRange } from '../../utils/event';
import { htmlToParagraphs } from '../../utils/text';
import { KIND_LABEL, directionsUrl, type MapItem } from './selectors';
import NightArt from '../night/NightArt';
import type { NightSpotView } from '../night/selectors';

/**
 * Selected place card (design-ref "Selected detail card"). Only API data: no "방문 추천 시간" copy.
 * Buttons: 상세 보기 (events, spaces), 찜 (existing favorites), 길찾기 (Kakao Map directions link).
 */
const MapSelectedCard: React.FC<{
  item: MapItem;
  saved: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
  /** All night-spot views (for the mini light map of a night spot without a photo). */
  nightViews?: NightSpotView[];
}> = ({ item, saved, onToggleFavorite, onClose, nightViews = [] }) => {
  const [broken, setBroken] = useState(false);
  const route = directionsUrl(item);
  // CONTENTS arrives as HTML → plain text (never rendered as HTML).
  const nightDesc = item.night ? htmlToParagraphs(item.night.CONTENTS).join(' ') : '';
  const rows: Array<[string, React.ReactNode]> = [];
  if (item.event) {
    const e = item.event;
    rows.push(['기간', eventDateRange(e)], ['장소', item.address], ['관람료', <FeeBadge key="fee" event={e} />]);
  } else if (item.space) {
    const s = item.space;
    rows.push(['주소', s.ADDR]);
    if (s.CLOSEDAY) rows.push(['휴관일', s.CLOSEDAY]);
    if (s.ENTRFREE) rows.push(['입장료', s.ENTRFREE]);
  } else if (item.night) {
    const n = item.night;
    rows.push(['주소', n.ADDR]);
    if (n.OPERATING_TIME) rows.push(['운영시간', n.OPERATING_TIME]);
    if (n.ENTR_FEE) rows.push(['입장료', n.ENTR_FEE]);
  }

  return (
    <section className="v3-map-card" aria-label={`선택한 장소: ${item.title}`}>
      <button type="button" className="v3-map-card__close v3-focus" onClick={onClose} aria-label="선택 해제">×</button>
      <div className={`v3-map-card__media ${item.nightView ? 'is-night' : ''}`}>
        {item.nightView ? (
          // Night spot: same artwork as the night page — 한국관광공사 night photo or the mini light map.
          <NightArt view={item.nightView} views={nightViews} />
        ) : item.image && !broken ? (
          <img src={item.image} alt="" onError={() => setBroken(true)} />
        ) : (
          <span className="v3-map-card__ph" aria-hidden="true" />
        )}
      </div>
      <div className="v3-map-card__kind">
        {KIND_LABEL[item.kind]}{item.sub ? ` · ${item.sub}` : ''}
        {item.nightView && item.nightView.state.badge !== 'none' && (
          <span className={`v3-map-card__state is-${item.nightView.state.badge}`}>{item.nightView.state.badge === 'lit' ? '● ' : ''}{item.nightView.state.label}</span>
        )}
      </div>
      <h3 className="v3-map-card__title">{item.title}</h3>
      <dl className="v3-map-card__rows">
        {rows.map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>
      {nightDesc && <p className="v3-map-card__desc">{nightDesc}</p>}
      <div className="v3-map-card__actions">
        {item.detailTo && <Link to={item.detailTo} className="v3-btn v3-btn--primary">상세 보기 →</Link>}
        {item.nightView && <Link to={`/night?spot=${item.nightView.id}`} className="v3-btn v3-btn--primary">야경명소에서 보기 →</Link>}
        <button type="button" className="v3-btn" aria-pressed={saved} onClick={onToggleFavorite}>{saved ? '♥ 찜됨' : '♡ 찜'}</button>
        {route && <a href={route} target="_blank" rel="noopener noreferrer" className="v3-btn">↗ 길찾기</a>}
      </div>
    </section>
  );
};

export default MapSelectedCard;
