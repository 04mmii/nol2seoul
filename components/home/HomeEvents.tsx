import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Event } from '../../types';
import type { FavoriteItem, FavoriteType } from '../../hooks';
import { EVENT_TABS, HOME_EVENT_LIMIT } from '../../constants/home';
import { eventPrice, eventVenue, filterEventsByTab, formatCount, isFreeEvent, type EventTab } from './selectors';

interface Props {
  events: Event[];
  loading: boolean;
  isError: boolean;
  now: Date;
  isFavorite: (id: string, type: FavoriteType) => boolean;
  toggleFavorite: (item: Omit<FavoriteItem, 'savedAt'>) => void;
}

const HomeEvents: React.FC<Props> = ({ events, loading, isError, now, isFavorite, toggleFavorite }) => {
  const [tab, setTab] = useState<EventTab>('today');
  const list = useMemo(() => filterEventsByTab(events, tab, now), [events, tab, now]);
  const shown = list.slice(0, HOME_EVENT_LIMIT);

  let body: React.ReactNode;
  if (loading) {
    body = <p className="v3-events__status" role="status">행사를 불러오는 중...</p>;
  } else if (isError) {
    body = <p className="v3-events__status" role="alert">행사 정보를 불러올 수 없습니다.</p>;
  } else if (shown.length === 0) {
    body = <p className="v3-events__status">해당 기간에 열리는 행사가 없습니다.</p>;
  } else {
    body = (
      <div className="v3-event-grid">
        {shown.map((ev) => {
          // BUG-01 fix: use the index in the full events array (same ID scheme as EventList/detail).
          const id = events.indexOf(ev);
          return (
            <EventCard
              key={id}
              event={ev}
              id={id}
              saved={isFavorite(String(id), 'event')}
              onToggleFavorite={() =>
                toggleFavorite({
                  id: String(id),
                  type: 'event',
                  title: ev.TITLE,
                  location: eventVenue(ev),
                  image: ev.MAIN_IMG,
                  category: ev.CODENAME,
                  date: ev.DATE,
                })
              }
            />
          );
        })}
      </div>
    );
  }

  return (
    <section className="v3-events" aria-labelledby="home-events-title">
      <div className="v3-shell">
        <div className="v3-section-header">
          <div>
            <div className="v3-eyebrow"><span className="v3-eyebrow__dash" />01 — EVENTS · 지금 서울</div>
            <h2 id="home-events-title" className="v3-section-title">
              지금 서울에서<br />열리는 <em>행사.</em>
            </h2>
          </div>
          <div className="v3-day-tabs" role="group" aria-label="기간 선택">
            {EVENT_TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className="v3-day-pill v3-focus"
                aria-pressed={tab === id}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {body}

        <div className="v3-events__footer">
          <span className="v3-events__count">
            {loading ? '—' : `${shown.length}건 표시 · ${formatCount(list.length)}건 중`}
          </span>
          <Link to="/events" className="v3-btn">전체 문화행사 보기 →</Link>
        </div>
      </div>
    </section>
  );
};

const EventCard: React.FC<{
  event: Event;
  id: number;
  saved: boolean;
  onToggleFavorite: () => void;
}> = ({ event, id, saved, onToggleFavorite }) => {
  const [broken, setBroken] = useState(false);
  const showImage = !!event.MAIN_IMG && !broken;
  const free = isFreeEvent(event);
  const price = eventPrice(event);

  return (
    <article className="v3-event-card">
      <div className="v3-event-card__thumb">
        {showImage ? (
          <img src={event.MAIN_IMG} alt="" loading="lazy" onError={() => setBroken(true)} />
        ) : (
          <span className="v3-event-card__ph" aria-hidden="true">
            <span className="v3-event-card__ph-cap">NO IMAGE</span>
          </span>
        )}
        <button
          type="button"
          className="v3-event-card__heart v3-focus"
          aria-pressed={saved}
          aria-label={`${event.TITLE} ${saved ? '찜 해제' : '찜하기'}`}
          onClick={onToggleFavorite}
        >
          <span aria-hidden="true">{saved ? '♥' : '♡'}</span>
        </button>
      </div>
      <div className="v3-event-card__body">
        <div className="v3-event-card__cat">{event.CODENAME}</div>
        <h3 className="v3-event-card__title">
          <Link to={`/event/${id}`} className="v3-event-card__link">{event.TITLE}</Link>
        </h3>
        <div className="v3-event-card__venue">{eventVenue(event)}</div>
        <div className="v3-event-card__foot">
          <span>{event.DATE}</span>
          <span className={`v3-event-card__price ${free ? 'is-free' : ''}`} title={price}>{price}</span>
        </div>
      </div>
    </article>
  );
};

export default HomeEvents;
