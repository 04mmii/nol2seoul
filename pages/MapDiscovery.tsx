import React, { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useKakaoLoader, useEvents, useCulturalSpaces, useNightViewSpots, useFavorites } from '../hooks';
import {
  ALL,
  LIST_PAGE,
  MAP_CATEGORIES,
  buildMapItems,
  filterMapItems,
  subCategories,
  type MapCategory,
} from '../components/map/selectors';
import { PIN_STYLES, pinDataUri } from '../components/map/pins';
import { useKakaoMap, useMapMarkers } from '../components/map/useKakaoMap';
import MapSelectedCard from '../components/map/MapSelectedCard';
import '../components/map/map-v3.css';

/**
 * v3 map page (design-ref/src/page-map.jsx) on the real Kakao map.
 * Kept: Kakao map, one marker per place with coordinates, marker click → select + pan, zoom ±, current
 * location, category filter (전체/문화행사/문화공간/야경명소) + sub-categories (spaces, night spots),
 * favorites, night-mode tint for 야경명소, links to event/space details.
 * New (approved 2026-11-09): full-width layout (content-width exception), sidebar list (30 at a time)
 * with a name/address search, v3 pins + legend, selected card with Kakao directions link; ≤900px the
 * sidebar is a bottom sheet (replaces the horizontal card carousel). The sidebar works even if the
 * Kakao SDK fails to load; only the map area shows the error.
 */
const MapDiscovery: React.FC = () => {
  const mapEl = useRef<HTMLDivElement>(null);
  const { isLoaded, error: mapError } = useKakaoLoader();
  const { events, loading: eventsLoading } = useEvents();
  const { spaces, loading: spacesLoading } = useCulturalSpaces();
  const { spots, loading: spotsLoading } = useNightViewSpots();
  const { toggleFavorite, isFavorite } = useFavorites();
  const loading = eventsLoading || spacesLoading || spotsLoading;

  // Deep link from the night page: /map?cat=야경명소&spot=<index> opens filtered with that spot selected.
  const [params] = useSearchParams();
  const initialCat = params.get('cat');
  const initialSpot = params.get('spot');
  const [category, setCategory] = useState<MapCategory>(() => (MAP_CATEGORIES.includes(initialCat as MapCategory) ? (initialCat as MapCategory) : ALL));
  const [sub, setSub] = useState(ALL);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(LIST_PAGE);
  const [selectedKey, setSelectedKey] = useState<string | null>(() => (initialCat === '야경명소' && initialSpot && /^\d+$/.test(initialSpot) ? `night:${initialSpot}` : null));
  const [sheetOpen, setSheetOpen] = useState(false); // mobile bottom sheet
  const [locateError, setLocateError] = useState(false);

  const built = useMemo(() => buildMapItems(events, spaces, spots), [events, spaces, spots]);
  const items = useMemo(() => filterMapItems(built, category, sub, query), [built, category, sub, query]);
  const subs = useMemo(() => subCategories(built.all, category), [built, category]);
  const selected = useMemo(() => (selectedKey ? built.all.find((i) => i.key === selectedKey) ?? null : null), [built, selectedKey]);

  const { map, zoomIn, zoomOut, locate } = useKakaoMap(mapEl, isLoaded);
  useMapMarkers(map, items, selectedKey, (key) => { setSelectedKey(key); setSheetOpen(false); }, mapEl);

  const pick = (key: string) => { setSelectedKey(key); setSheetOpen(false); };
  const changeCategory = (c: MapCategory) => { setCategory(c); setSub(ALL); setLimit(LIST_PAGE); setSelectedKey(null); };
  const isNight = category === '야경명소';
  const selectedAnchor = selected && selected.lat !== null && selected.lng !== null ? { lat: selected.lat, lng: selected.lng } : null;
  const counts = { event: built.byKind.event.filter((i) => i.lat !== null).length, space: built.byKind.space.filter((i) => i.lat !== null).length, night: built.byKind.night.filter((i) => i.lat !== null).length };
  const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '.');

  return (
    <div className={`v3-map ${sheetOpen ? 'is-sheet-open' : ''}`}>
      <aside className="v3-map__side" aria-label="장소 목록">
        <div className="v3-map__head">
          <div className="v3-eyebrow"><span className="v3-eyebrow__dash" />02 — SPACES · 지도탐색</div>
          <h1 className="v3-map__title">
            <span className="v3-ko">내 주변,</span>
            <br />
            <span className="v3-map__em">지금 갈 곳.</span>
          </h1>
          <label className="v3-map__search">
            <span className="v3-visually-hidden">장소·동네 검색</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
            <input
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setLimit(LIST_PAGE); }}
              placeholder="장소·동네 검색"
            />
          </label>
        </div>

        {/* Mobile: sheet handle */}
        <button type="button" className="v3-map__sheet-toggle" aria-expanded={sheetOpen} aria-controls="map-list" onClick={() => setSheetOpen((o) => !o)}>
          목록 · {items.length.toLocaleString('ko-KR')}곳 <span aria-hidden="true">{sheetOpen ? '▾' : '▴'}</span>
        </button>

        <div className="v3-map__filters">
          <div className="v3-map__chips" role="group" aria-label="종류">
            {MAP_CATEGORIES.map((c) => (
              <button key={c} type="button" className="v3-day-pill v3-map__chip v3-focus" aria-pressed={category === c} onClick={() => changeCategory(c)}>{c}</button>
            ))}
          </div>
          {subs.length > 0 && (
            <div className="v3-map__chips" role="group" aria-label="분야">
              {subs.map((s) => (
                <button key={s} type="button" className="v3-day-pill v3-map__chip v3-focus" aria-pressed={sub === s} onClick={() => { setSub(s); setLimit(LIST_PAGE); setSelectedKey(null); }}>{s}</button>
              ))}
            </div>
          )}
        </div>

        <div id="map-list" className="v3-map__list" role="region" aria-label="장소 목록 결과">
          <p className="v3-map__count">{loading ? '불러오는 중…' : `${items.length.toLocaleString('ko-KR')}곳`}</p>
          {!loading && items.length === 0 && <p className="v3-map__empty">조건에 맞는 장소가 없습니다.</p>}
          <ul>
            {items.slice(0, limit).map((it) => (
              <li key={it.key}>
                <button type="button" className="v3-map__item v3-focus" aria-pressed={selectedKey === it.key} onClick={() => pick(it.key)}>
                  <span className={`v3-map__dot v3-map__dot--${it.kind}`} aria-hidden="true" />
                  <span className="v3-map__item-body">
                    <span className="v3-map__item-kind">{it.sub || ''}</span>
                    <span className="v3-map__item-title">{it.title}</span>
                    <span className="v3-map__item-line">{it.line}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {items.length > limit && (
            <button type="button" className="v3-btn v3-map__more" onClick={() => setLimit((l) => l + LIST_PAGE)}>
              더 보기 ({Math.min(LIST_PAGE, items.length - limit)})
            </button>
          )}
        </div>
      </aside>

      <div className={`v3-map__stage ${isNight ? 'is-night' : ''}`}>
        <div ref={mapEl} className="v3-map__canvas" aria-label="지도" role="application" />
        {mapError && (
          <div className="v3-map__error" role="alert">
            <p className="v3-map__error-title">지도를 불러올 수 없습니다</p>
            <p>{mapError}</p>
            <p className="v3-map__error-hint">카카오 개발자 콘솔 › 내 애플리케이션 › 플랫폼 › Web에 사이트 도메인이 등록되어 있는지, JavaScript 키가 맞는지 확인하세요. 목록과 장소 정보는 계속 쓸 수 있어요.</p>
            <button type="button" className="v3-btn" onClick={() => window.location.reload()}>다시 시도</button>
          </div>
        )}
        {!mapError && !map && <div className="v3-map__loading" role="status">지도를 불러오는 중...</div>}

        <div className="v3-map__legend" aria-label="범례">
          {(['event', 'space', 'night', 'selected'] as const).map((k) => (
            <span key={k}><img src={pinDataUri(PIN_STYLES[k])} alt="" width={12} height={12} />{k === 'event' ? '문화행사' : k === 'space' ? '문화공간' : k === 'night' ? '야경명소' : '선택'}</span>
          ))}
        </div>

        <p className="v3-map__caption">
          NOLSEOUL MAP · {today}
          <br />
          {counts.event.toLocaleString('ko-KR')} EVENTS · {counts.space.toLocaleString('ko-KR')} SPACES · {counts.night} NIGHT
        </p>

        <div className="v3-map__controls">
          <button type="button" className="v3-map__ctrl v3-focus" onClick={() => zoomIn(selectedAnchor)} aria-label="확대" disabled={!map}>+</button>
          <button type="button" className="v3-map__ctrl v3-focus" onClick={() => zoomOut(selectedAnchor)} aria-label="축소" disabled={!map}>−</button>
          <button type="button" className="v3-map__ctrl v3-map__ctrl--ink v3-focus" onClick={() => { setLocateError(false); locate(() => setLocateError(true)); }} aria-label="현재 위치" disabled={!map}>⌖</button>
        </div>
        {locateError && <p className="v3-map__toast" role="status">현재 위치를 가져올 수 없습니다.</p>}

        {selected && (
          <MapSelectedCard
            item={selected}
            saved={isFavorite(selected.fav.id, selected.fav.type)}
            onToggleFavorite={() => toggleFavorite(selected.fav)}
            onClose={() => setSelectedKey(null)}
          />
        )}
      </div>
    </div>
  );
};

export default MapDiscovery;
