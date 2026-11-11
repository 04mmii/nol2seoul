import React from 'react';
import { Link } from 'react-router-dom';
import NightSpotCard from '../night/NightSpotCard';
import type { NightSpotView } from '../night/selectors';
import type { FavoriteItem, FavoriteType } from '../../hooks/useFavorites';

interface Props {
  /** Spots to show (components/home/selectors.ts `pickAfterDark`). */
  picks: NightSpotView[];
  /** All views — the mini light map draws every spot. */
  views: NightSpotView[];
  loading: boolean;
  isFavorite: (id: string, type: FavoriteType) => boolean;
  toggleFavorite: (item: Omit<FavoriteItem, 'savedAt'>) => void;
}

/**
 * Home "After Dark" (2026-11-11): the night page's card (components/night/NightSpotCard) — state badge,
 * 한국관광공사 photo (15 spots) or mini light map, operating time, actions. Four equal cards.
 */
const AfterDark: React.FC<Props> = ({ picks, views, loading, isFavorite, toggleFavorite }) => (
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
      ) : picks.length === 0 ? (
        <p className="v3-tonight__status">표시할 야경명소가 없습니다.</p>
      ) : (
        <div className="v3-night__grid v3-tonight__grid">
          {picks.map((v) => (
            <NightSpotCard key={v.id} view={v} views={views} saved={isFavorite(v.fav.id, 'spot')} onToggle={() => toggleFavorite(v.fav)} showDesc={false} />
          ))}
        </div>
      )}
    </div>
  </section>
);

export default AfterDark;
