import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Event } from '../../types';
import type { FavoriteItem, FavoriteType } from '../../hooks';
import { EVENT_TABS, HOME_EVENT_LIMIT } from '../../constants/home';
import EventCard from '../v3/EventCard';
import { eventId } from '../../utils/eventId';
import { eventVenue, filterEventsByTab, formatCount, type EventTab } from './selectors';

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
          // Stable ID (BUG-08), same scheme everywhere.
          const id = eventId(ev);
          return (
            <EventCard
              key={id}
              event={ev}
              id={id}
              saved={isFavorite(id, 'event')}
              onToggleFavorite={() =>
                toggleFavorite({
                  id,
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

export default HomeEvents;
