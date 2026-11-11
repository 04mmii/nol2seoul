import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { spaceDescription, spaceTransit } from '../utils/space';
import { useCulturalSpaces, useEvents, useFavorites } from '../hooks';
import { findSpace, isLegacyPlaceId, spaceId } from '../utils/placeId';
import { eventId } from '../utils/eventId';
import { eventVenue } from '../utils/event';
import { districtFromAddress, spaceLatLng } from '../components/home/selectors';
import { distanceLabel, eventsAtSpace, nearbySpaces, spaceInfoRows } from '../components/space/selectors';
import EventLocationMap from '../components/detail/EventLocationMap';
import HeroImage from '../components/detail/HeroImage';
import EventCard from '../components/v3/EventCard';
import SpaceCard from '../components/v3/SpaceCard';
import '../components/detail/detail-v3.css';
import '../components/space/space-v3.css';

/**
 * Cultural space detail — Redesign v3 (2026-11-11). No design-ref page exists; it follows the event
 * detail v3 structure: breadcrumb → hero (MAIN_IMG or hatched placeholder; name, category, address,
 * key facts, actions) → info / about / transit / map → events at this space → nearby spaces.
 * Only culturalSpaceInfo fields are shown (BUG-13 field mapping kept). Route: /space/s<NUM>.
 */
const SpaceDetail: React.FC = () => {
  const { id } = useParams();
  const { spaces, loading, isError } = useCulturalSpaces();
  const { events } = useEvents();
  const { toggleFavorite, isFavorite } = useFavorites();
  const now = useMemo(() => new Date(), []);

  // Stable ID "s<NUM>" (utils/placeId.ts). Old index links (plain digits) get an "outdated link" message.
  const space = useMemo(() => findSpace(spaces, id)?.space, [spaces, id]);
  const legacyLink = isLegacyPlaceId(id);
  const here = useMemo(() => (space ? eventsAtSpace(events, space, now) : []), [events, space, now]);
  const nearby = useMemo(() => (space ? nearbySpaces(spaces, space) : []), [spaces, space]);

  if (loading) {
    return (
      <div className="v3-detail">
        <div className="v3-shell v3-detail-status" role="status"><p>문화공간 정보를 불러오는 중...</p></div>
      </div>
    );
  }

  if (isError || !space) {
    return (
      <div className="v3-detail">
        <div className="v3-shell v3-detail-status" role="alert">
          <p>{legacyLink && !isError ? '오래된 링크라 문화공간을 찾을 수 없습니다.' : '문화공간 정보를 찾을 수 없습니다.'}</p>
          <Link to="/map" className="v3-btn">지도로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const favId = spaceId(space);
  const saved = isFavorite(favId, 'space');
  const description = spaceDescription(space.FAC_DESC);
  const transit = spaceTransit(space);
  const info = spaceInfoRows(space);
  const homepage = info.find((r) => r.label === '홈페이지')?.href;
  const entry = (space.ENTRFREE || '').trim();
  const district = districtFromAddress(space.ADDR);
  const specs = [
    { label: '분류', value: space.SUBJCODE || '' },
    { label: '입장료', value: entry, hl: entry === '무료' },
    // Long 휴관일 sentences (e.g. "공휴일을 제외한 매주 월요일, …") stay in the info rows only.
    { label: '휴관일', value: (space.CLOSEDAY || '').trim().length <= 20 ? (space.CLOSEDAY || '').trim() : '' },
    { label: '지역', value: district ? `서울 ${district}` : '' },
  ].filter((s) => s.value);

  const toggleSpace = (s = space) =>
    toggleFavorite({
      id: spaceId(s),
      type: 'space',
      title: s.FAC_NAME,
      location: s.ADDR,
      image: s.MAIN_IMG,
      category: s.SUBJCODE || '문화공간',
    });

  return (
    <div className="v3-detail">
      {/* Breadcrumb */}
      <div className="v3-detail-crumbs">
        <div className="v3-shell v3-detail-crumbs__inner">
          <nav aria-label="현재 위치">
            <ol>
              <li><Link to="/">← 홈</Link></li>
              <li><Link to="/map">지도탐색</Link></li>
              {space.SUBJCODE && <li>{space.SUBJCODE}</li>}
              <li aria-current="page">{space.FAC_NAME}</li>
            </ol>
          </nav>
          <div className="v3-detail-crumbs__status">SPACE № {space.NUM}</div>
        </div>
      </div>

      {/* Hero */}
      <section className="v3-detail-hero" aria-labelledby="space-title">
        <div className="v3-shell v3-detail-hero__grid">
          <div className="v3-detail-hero__media">
            <HeroImage key={space.MAIN_IMG ?? favId} src={space.MAIN_IMG} alt={`${space.FAC_NAME} 사진`} />
          </div>
          <div className="v3-detail-hero__body">
            <div>
              <div className="v3-detail-hero__cat">문화공간{space.SUBJCODE ? ` · ${space.SUBJCODE}` : ''}</div>
              <h1 id="space-title" className="v3-detail-hero__title"><span className="v3-ko">{space.FAC_NAME}</span></h1>
              <div className="v3-detail-hero__org">{space.ADDR}</div>
            </div>
            <div>
              <dl className="v3-detail-specs">
                {specs.map((s) => (
                  <div key={s.label}><dt>{s.label}</dt><dd className={s.hl ? 'is-hl' : undefined}>{s.value}</dd></div>
                ))}
              </dl>
              <div className="v3-detail-actions">
                {homepage && <a href={homepage} target="_blank" rel="noopener noreferrer" className="v3-btn v3-btn--primary">홈페이지 가기 →</a>}
                <button type="button" className="v3-btn" aria-pressed={saved} onClick={() => toggleSpace()}>
                  <span aria-hidden="true">{saved ? '♥' : '♡'}</span> {saved ? '찜됨' : '찜하기'}
                </button>
                <Link to={`/map?sel=${encodeURIComponent(`space:${favId}`)}`} className="v3-btn">지도에서 보기</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Article: info · about + transit · map */}
      <section className="v3-detail-article" aria-labelledby="space-about">
        <div className="v3-shell v3-detail-article__grid">
          <aside aria-label="공간 정보">
            <h2 className="v3-detail-label">공간 정보</h2>
            <ul className="v3-detail-info">
              {info.map((r) => (
                <li key={r.label}>
                  <span>{r.label}</span>
                  <span>{r.href ? <a href={r.href} target="_blank" rel="noopener noreferrer">{r.value}</a> : r.value}</span>
                </li>
              ))}
            </ul>
          </aside>

          <div className="v3-detail-body">
            <div className="v3-eyebrow"><span className="v3-eyebrow__dash" />ABOUT</div>
            <h2 id="space-about" className="v3-detail-body__title"><span className="v3-ko">공간 소개.</span></h2>
            {description.length === 0
              ? <p className="v3-detail-empty">제공된 소개가 없습니다.{homepage && <> 자세한 내용은 <a href={homepage} target="_blank" rel="noopener noreferrer">홈페이지</a>에서 확인하세요.</>}</p>
              : description.map((para, i) => <p key={i}>{para}</p>)}

            {transit.length > 0 && (
              <div className="v3-space-transit">
                <h2 className="v3-detail-label">교통 안내</h2>
                <dl>
                  {transit.map((t) => <div key={t.label}><dt>{t.label}</dt><dd>{t.value}</dd></div>)}
                </dl>
              </div>
            )}
          </div>

          <aside className="v3-detail-article__map" aria-label="위치">
            <h2 className="v3-detail-label">위치 · MAP</h2>
            <EventLocationMap coords={spaceLatLng(space)} label={space.FAC_NAME} />
            <div className="v3-detail-place">
              {space.ADDR}<br />
              <Link to={`/map?sel=${encodeURIComponent(`space:${favId}`)}`}>지도탐색에서 보기 →</Link>
            </div>
          </aside>
        </div>
      </section>

      {/* Events at this space (hidden when none) */}
      {here.length > 0 && (
        <section className="v3-detail-related" aria-labelledby="space-events">
          <div className="v3-shell">
            <div className="v3-eyebrow"><span className="v3-eyebrow__dash" />진행 중 · 예정</div>
            <h2 id="space-events" className="v3-section-title"><span className="v3-ko">이 공간에서 열리는</span> <em>행사.</em></h2>
            <div className="v3-event-grid">
              {here.map((e) => {
                const eid = eventId(e);
                return (
                  <EventCard key={eid} event={e} id={eid} saved={isFavorite(eid, 'event')}
                    onToggleFavorite={() => toggleFavorite({ id: eid, type: 'event', title: e.TITLE, location: eventVenue(e), image: e.MAIN_IMG, category: e.CODENAME, date: e.DATE })} />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Nearby spaces (straight-line distance) */}
      {nearby.length > 0 && (
        <section className="v3-detail-related" aria-labelledby="space-nearby">
          <div className="v3-shell">
            <div className="v3-eyebrow"><span className="v3-eyebrow__dash" />직선거리 기준</div>
            <h2 id="space-nearby" className="v3-section-title"><em>가까운</em> <span className="v3-ko">공간.</span></h2>
            <div className="v3-event-grid">
              {nearby.map(({ space: s, km }) => (
                <SpaceCard key={spaceId(s)} space={s} saved={isFavorite(spaceId(s), 'space')} onToggleFavorite={() => toggleSpace(s)} foot={distanceLabel(km)} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default SpaceDetail;
