import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CulturalSpace } from '../../types';
import { districtFromAddress, formatCount, projectToSeoulBox, spaceLatLng, topCounts } from './selectors';
import { riverPoints } from '../night/selectors';
import { findSpace } from '../../utils/placeId';
import promo from '../../data/map-promo-spaces.json' with { type: 'json' };

/**
 * Map promo (decision 2026-11-11): the right half is a dot map of every cultural space at its real
 * position (same projection as the night hero's light map; ink dots on bone, no labels), with 2–3
 * featured spaces from data/map-promo-spaces.json shown as numbered markers and photo cards below.
 */
const PROMO_IDS: string[] = (promo as { ids: string[] }).ids;

interface Props {
  spaces: CulturalSpace[];
  loading: boolean;
}

const SpaceCard: React.FC<{ n: number; space: CulturalSpace; id: string }> = ({ n, space, id }) => {
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  return (
    <li className="v3-map-promo__card">
      <Link to={`/space/${id}`} className="v3-map-promo__card-link v3-focus">
        <span className="v3-map-promo__card-img"><img src={space.MAIN_IMG} alt="" loading="lazy" onError={() => setBroken(true)} /></span>
        <span className="v3-map-promo__card-body">
          <span className="v3-map-promo__card-num" aria-hidden="true">{n}</span>
          <span className="v3-map-promo__card-type">{(space.SUBJCODE || '문화공간').split('/')[0]} · {districtFromAddress(space.ADDR)}</span>
          <span className="v3-map-promo__card-name">{space.FAC_NAME}</span>
        </span>
      </Link>
    </li>
  );
};

const MapPromo: React.FC<Props> = ({ spaces, loading }) => {
  const types = useMemo(() => topCounts(spaces, (s) => s.SUBJCODE, 5), [spaces]);
  const dots = useMemo(() => spaces.flatMap((s) => {
    const ll = spaceLatLng(s);
    const pos = ll && projectToSeoulBox(ll.lat, ll.lng);
    return pos ? [pos] : [];
  }), [spaces]);
  const featured = useMemo(() => PROMO_IDS.flatMap((id) => {
    const hit = findSpace(spaces, id);
    if (!hit || !hit.space.MAIN_IMG) return [];
    const ll = spaceLatLng(hit.space);
    return [{ ...hit, pos: ll && projectToSeoulBox(ll.lat, ll.lng) }];
  }), [spaces]);
  // Numbered badges: nearby spaces (e.g. two in 종로) would overlap, so a colliding badge moves to the first
  // free offset and a thin leader line points back to the real location.
  const markers = useMemo(() => {
    const placed: Array<{ x: number; y: number }> = [];
    const OFFSETS = [[0, 0], [7, -7], [-7, -7], [7, 7], [-7, 7], [9, 0], [-9, 0], [0, -9], [0, 9]];
    return featured.flatMap((f, i) => {
      if (!f.pos) return [];
      const at = { x: f.pos.left, y: f.pos.top };
      const [dx, dy] = OFFSETS.find(([ox, oy]) => placed.every((p) => Math.hypot(p.x - (at.x + ox), p.y - (at.y + oy)) >= 6)) ?? [0, 0];
      const badge = { x: at.x + dx, y: at.y + dy };
      placed.push(badge);
      return [{ id: f.id, n: i + 1, at, badge, moved: dx !== 0 || dy !== 0 }];
    });
  }, [featured]);
  const river = useMemo(() => riverPoints().map((p, i) => `${i ? 'L' : 'M'}${p.left.toFixed(2)} ${p.top.toFixed(2)}`).join(' '), []);

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
      <div className="v3-map-promo__right">
        <div className="v3-map-promo__map">
          <svg className="v3-map-promo__dots" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" role="img"
            aria-label={loading ? '문화공간 위치 불러오는 중' : `서울 문화공간 ${formatCount(dots.length)}곳의 위치`}>
            <path d={river} className="v3-map-promo__river" />
            {dots.map((p, i) => <circle key={i} cx={p.left} cy={p.top} r={0.55} className="v3-map-promo__dot" />)}
            {markers.map((m) => (
              <g key={m.id} className="v3-map-promo__marker">
                {m.moved && <><line x1={m.at.x} y1={m.at.y} x2={m.badge.x} y2={m.badge.y} className="v3-map-promo__leader" /><circle cx={m.at.x} cy={m.at.y} r={0.9} className="v3-map-promo__anchor" /></>}
                <g transform={`translate(${m.badge.x} ${m.badge.y})`}>
                  <circle r={2.6} />
                  <text dy="0.95">{m.n}</text>
                </g>
              </g>
            ))}
          </svg>
          <span className="v3-map-promo__caption" aria-hidden="true">SEOUL · {formatCount(dots.length)} SPACES</span>
        </div>
        {featured.length > 0 && (
          <ol className="v3-map-promo__cards" aria-label="대표 문화공간">
            {featured.map((f, i) => <SpaceCard key={f.id} n={i + 1} space={f.space} id={f.id} />)}
          </ol>
        )}
      </div>
      </div>
    </section>
  );
};

export default MapPromo;
