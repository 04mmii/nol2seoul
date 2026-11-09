import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEvents, useFavorites } from '../hooks';
import FeeBadge from '../components/v3/FeeBadge';
import EventCard from '../components/v3/EventCard';
import EventLocationMap from '../components/detail/EventLocationMap';
import {
  bodyBlocks,
  externalLinks,
  heroSpecs,
  infoRows,
  pickRelatedEvents,
} from '../components/detail/selectors';
import { eventDateRange, eventLatLng, eventStatus, eventStatusLabel, eventVenue } from '../utils/event';
import '../components/detail/detail-v3.css';

/**
 * Event detail — Redesign v3 (design-ref/src/page-detail.jsx), data from the event API.
 * Route contract unchanged: /event/:id where id is the index in the events array (DESIGN.md BUG-08).
 * Not rendered because the API has no source for them: EDITOR'S PICK sticker, curator note,
 * like count, share, nearby walk times, visitor reviews and rating.
 */
const EventDetail: React.FC = () => {
  const { id } = useParams();
  const { events, loading, isError } = useEvents();
  const { toggleFavorite, isFavorite } = useFavorites();
  const now = useMemo(() => new Date(), []);

  const eventIndex = Number(id);
  const event = events[eventIndex];
  const related = useMemo(() => pickRelatedEvents(events, eventIndex, now), [events, eventIndex, now]);

  if (loading) {
    return (
      <div className="v3-detail">
        <div className="v3-shell v3-detail-status" role="status">
          <p>행사 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="v3-detail">
        <div className="v3-shell v3-detail-status" role="alert">
          <p>행사 정보를 찾을 수 없습니다.</p>
          <Link to="/events" className="v3-btn">목록으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const favId = String(eventIndex);
  const saved = isFavorite(favId, 'event');
  const dateRange = eventDateRange(event);
  const status = eventStatusLabel(eventStatus(event, now));
  const links = externalLinks(event);
  const blocks = bodyBlocks(event);
  const info = infoRows(event);

  const onToggleFavorite = () =>
    toggleFavorite({
      id: favId,
      type: 'event',
      title: event.TITLE,
      location: eventVenue(event),
      image: event.MAIN_IMG,
      category: event.CODENAME,
      // Same stored shape as before the redesign (DESIGN.md BUG-10).
      date: dateRange,
    });

  return (
    <div className="v3-detail">
      {/* Breadcrumb */}
      <div className="v3-detail-crumbs">
        <div className="v3-shell v3-detail-crumbs__inner">
          <nav aria-label="현재 위치">
            <ol>
              <li><Link to="/">← 홈</Link></li>
              <li><Link to="/events">문화행사</Link></li>
              {event.CODENAME && <li>{event.CODENAME}</li>}
              <li aria-current="page">{event.TITLE}</li>
            </ol>
          </nav>
          <div className="v3-detail-crumbs__status">
            EVENT № {String(eventIndex + 1).padStart(3, '0')}{status && ` · ${status}`}
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="v3-detail-hero" aria-labelledby="event-title">
        <div className="v3-shell v3-detail-hero__grid">
          <div className="v3-detail-hero__media">
            <HeroImage key={event.MAIN_IMG ?? eventIndex} src={event.MAIN_IMG} />
          </div>
          <div className="v3-detail-hero__body">
            <div>
              <div className="v3-detail-hero__cat">
                {[event.CODENAME, event.THEMECODE].filter(Boolean).join(' · ')}
              </div>
              <h1 id="event-title" className="v3-detail-hero__title">
                <span className="v3-ko">{event.TITLE}</span>
              </h1>
              {event.ORG_NAME && <div className="v3-detail-hero__org">주최 · {event.ORG_NAME}</div>}
            </div>
            <div>
              <dl className="v3-detail-specs">
                {heroSpecs(event).map((s) => (
                  <div key={s.label}>
                    <dt>{s.label}</dt>
                    <dd className={s.highlight ? 'is-hl' : undefined}>
                      {s.fee && <FeeBadge event={event} hideCheck className="v3-detail-specs__fee" />}
                      {s.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="v3-detail-actions">
                {links.primary && (
                  <a href={links.primary} target="_blank" rel="noopener noreferrer" className="v3-btn v3-btn--primary">
                    홈페이지 가기 →
                  </a>
                )}
                <button type="button" className="v3-btn" aria-pressed={saved} onClick={onToggleFavorite}>
                  <span aria-hidden="true">{saved ? '♥' : '♡'}</span> {saved ? '찜됨' : '찜하기'}
                </button>
                {links.portal && (
                  <a href={links.portal} target="_blank" rel="noopener noreferrer" className="v3-btn">
                    서울문화포털 ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Article */}
      <section className="v3-detail-article" aria-labelledby="event-about">
        <div className="v3-shell v3-detail-article__grid">
          <aside aria-label="행사 정보">
            <h2 className="v3-detail-label">행사 정보</h2>
            <ul className="v3-detail-info">
              {info.map(([k, v]) => (
                <li key={k}><span>{k}</span><span>{v}</span></li>
              ))}
            </ul>
          </aside>

          <div className="v3-detail-body">
            <div className="v3-eyebrow"><span className="v3-eyebrow__dash" />ABOUT</div>
            <h2 id="event-about" className="v3-detail-body__title">
              <span className="v3-ko">행사 소개.</span>
            </h2>
            {blocks.length === 0 ? (
              <p className="v3-detail-empty">
                제공된 상세 소개가 없습니다.
                {links.primary && (
                  <> 자세한 내용은{' '}
                    <a href={links.primary} target="_blank" rel="noopener noreferrer">주최 측 페이지</a>
                    에서 확인하세요.
                  </>
                )}
              </p>
            ) : (
              blocks.map((b, i) =>
                b.kind === 'text' ? (
                  <p key={i}>{b.text}</p>
                ) : b.kind === 'image' ? (
                  <figure key={i}><img src={b.src} alt={`${event.TITLE} 안내 이미지`} loading="lazy" /></figure>
                ) : (
                  <p key={i}>
                    <a className="v3-detail-body__link" href={b.href} target="_blank" rel="noopener noreferrer">{b.href}</a>
                  </p>
                ),
              )
            )}
          </div>

          <aside className="v3-detail-article__map" aria-label="위치">
            <h2 className="v3-detail-label">위치 · MAP</h2>
            <EventLocationMap coords={eventLatLng(event)} label={eventVenue(event)} />
            <div className="v3-detail-place">
              {event.PLACE && <>{event.PLACE}<br /></>}
              {event.GUNAME && <>서울 {event.GUNAME}<br /></>}
              <Link to="/map">지도탐색에서 보기 →</Link>
            </div>
          </aside>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="v3-detail-related" aria-labelledby="event-related">
          <div className="v3-shell">
            <div className="v3-eyebrow"><span className="v3-eyebrow__dash" />같은 장르 · 같은 동네</div>
            <h2 id="event-related" className="v3-section-title">
              <em>다음으로</em> <span className="v3-ko">가볼 곳.</span>
            </h2>
            <div className="v3-event-grid">
              {related.map(({ event: e, id: rid }) => (
                <EventCard
                  key={rid}
                  event={e}
                  id={rid}
                  saved={isFavorite(String(rid), 'event')}
                  onToggleFavorite={() =>
                    toggleFavorite({
                      id: String(rid),
                      type: 'event',
                      title: e.TITLE,
                      location: eventVenue(e),
                      image: e.MAIN_IMG,
                      category: e.CODENAME,
                      date: e.DATE,
                    })
                  }
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const HeroImage: React.FC<{ src?: string }> = ({ src }) => {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <span className="v3-detail-hero__ph" aria-hidden="true">
        <span className="v3-detail-hero__ph-cap">NO IMAGE</span>
      </span>
    );
  }
  return <img key={src} src={src} alt="" onError={() => setBroken(true)} />;
};

export default EventDetail;
