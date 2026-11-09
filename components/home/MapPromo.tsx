import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { CulturalSpace } from '../../types';
import { formatCount, projectToSeoulBox, spaceLatLng, topCounts } from './selectors';

const MAX_PINS = 60;

interface Props {
  spaces: CulturalSpace[];
  loading: boolean;
}

const MapPromo: React.FC<Props> = ({ spaces, loading }) => {
  const types = useMemo(() => topCounts(spaces, (s) => s.SUBJCODE, 5), [spaces]);

  // Real cultural-space positions projected into the panel (decorative preview, not a map).
  const pins = useMemo(() => {
    const out: Array<{ key: string; top: number; left: number; label: string }> = [];
    for (const s of spaces) {
      const ll = spaceLatLng(s);
      const pos = ll && projectToSeoulBox(ll.lat, ll.lng);
      if (pos) out.push({ key: `${s.FAC_CODE}-${out.length}`, ...pos, label: s.FAC_NAME });
      if (out.length >= MAX_PINS) break;
    }
    return out;
  }, [spaces]);

  return (
    <section className="v3-map-promo" aria-labelledby="home-map-title">
      <div className="v3-shell v3-map-promo__grid">
      <div className="v3-map-promo__left">
        <div>
          <div className="v3-eyebrow"><span className="v3-eyebrow__dash" />02 — SPACES &amp; MAP</div>
          <h2 id="home-map-title" className="v3-map-promo__title">
            내 주변<br />문화공간을<br />찾아보세요.
          </h2>
          <p className="v3-map-promo__desc">
            현재 위치를 기준으로 가장 가까운 공간과, 그 공간에서 지금 열리는 행사를 지도 위에서 함께 확인할 수 있습니다.
          </p>
          <ul className="v3-space-types" aria-label="공간 종류별 개수">
            {loading
              ? <li><span>불러오는 중</span><span className="v3-mono">—</span></li>
              : types.map(([name, n]) => (
                <li key={name}><span>{name}</span><span className="v3-mono">{formatCount(n)}</span></li>
              ))}
          </ul>
        </div>
        <div className="v3-map-promo__cta">
          <Link to="/map" className="v3-btn">지도에서 보기 →</Link>
          <span className="v3-map-promo__note">{loading ? '—' : `문화공간 ${formatCount(spaces.length)}곳`}</span>
        </div>
      </div>
      <div className="v3-map-promo__right" aria-hidden="true">
        <div className="v3-map-grid" />
        {pins.map((p, i) => (
          <div key={p.key} className={`v3-map-pin ${i === 0 ? 'is-big' : ''}`} style={{ top: `${p.top}%`, left: `${p.left}%` }}>
            <span className="v3-map-pin__label">{p.label}</span>
          </div>
        ))}
        <span className="v3-map-promo__caption">SEOUL · {formatCount(spaces.length)} SPACES</span>
      </div>
      </div>
    </section>
  );
};

export default MapPromo;
