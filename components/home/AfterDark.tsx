import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { NightViewSpot } from '../../types';
import type { NightSpotView } from './selectors';

interface Props {
  spots: NightSpotView[];
  loading: boolean;
}

/** v3 "Tonight / After Dark" section, fed by the viewNightSpot API. */
const AfterDark: React.FC<Props> = ({ spots, loading }) => {
  const [feature, ...rest] = spots;
  return (
    <section className="v3-tonight" aria-labelledby="home-night-title">
      <div className="v3-tonight__stars" aria-hidden="true" />
      <div className="v3-shell">
        <div className="v3-section-header">
          <div>
            <div className="v3-eyebrow"><span className="v3-eyebrow__dash" />AFTER DARK · 야경명소</div>
            <h2 id="home-night-title" className="v3-sub-title">
              공연이 끝난 뒤, <em>가장 빛나는</em> 서울.
            </h2>
          </div>
          <Link to="/night" className="v3-btn v3-btn--ghost-light">야경명소 전체 보기 →</Link>
        </div>

        {loading ? (
          <p className="v3-tonight__status" role="status">야경명소를 불러오는 중...</p>
        ) : !feature ? (
          <p className="v3-tonight__status">표시할 야경명소가 없습니다.</p>
        ) : (
          <div className="v3-tonight__grid">
            <NightCard view={feature} n={1} feature />
            {rest.map((v, i) => <NightCard key={`${v.spot.NUM}-${i}`} view={v} n={i + 2} />)}
          </div>
        )}
      </div>
    </section>
  );
};

const NightCard: React.FC<{ view: NightSpotView; n: number; feature?: boolean }> = ({ view, n, feature }) => {
  const { spot, district } = view;
  const [broken, setBroken] = useState(false);
  return (
    <article className={`v3-night-card ${feature ? 'is-feature' : ''}`}>
      <div className="v3-night-card__index">
        <span>SPOT № {String(n).padStart(2, '0')}</span>
        <span>{feature ? 'FEATURED' : spot.SUBJECT_CD}</span>
      </div>
      <div className="v3-night-card__frame">
        {spot.MAIN_IMG && !broken && <img src={spot.MAIN_IMG} alt="" loading="lazy" onError={() => setBroken(true)} />}
      </div>
      <div className="v3-night-card__info">
        <h3 className="v3-night-card__name">{spot.TITLE}</h3>
        <div className="v3-night-card__sub">{district || shortAddress(spot)}</div>
        <div className="v3-night-card__meta">
          {spot.ENTR_FEE && <span>{spot.ENTR_FEE}</span>}
          {spot.OPERATING_TIME && <span className="hl">{spot.OPERATING_TIME}</span>}
        </div>
      </div>
    </article>
  );
};

const shortAddress = (spot: NightViewSpot) => spot.ADDR?.split(' ').slice(0, 3).join(' ') ?? '';

export default AfterDark;
