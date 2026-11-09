import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Event } from '../../types';
import { eventCardDate, eventVenue } from '../../utils/event';
import FeeBadge from './FeeBadge';

/**
 * v3 event card (design-ref EventCard). Used by Home and EventDetail ("다음으로 가볼 곳").
 * Styles: styles/v3.css (.v3-event-grid / .v3-event-card).
 * The whole card is clickable through the title link (stretched link); the heart is a separate button.
 */
const EventCard: React.FC<{
  event: Event;
  /** Route ID (index in the full events array — DESIGN.md BUG-08). */
  id: number;
  saved: boolean;
  onToggleFavorite: () => void;
  headingLevel?: 'h3' | 'h4';
}> = ({ event, id, saved, onToggleFavorite, headingLevel = 'h3' }) => {
  const [broken, setBroken] = useState(false);
  const showImage = !!event.MAIN_IMG && !broken;
  const Heading = headingLevel;

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
        <Heading className="v3-event-card__title">
          <Link to={`/event/${id}`} className="v3-event-card__link">{event.TITLE}</Link>
        </Heading>
        <div className="v3-event-card__venue">{eventVenue(event)}</div>
        <div className="v3-event-card__foot">
          <span className="v3-event-card__date">{eventCardDate(event)}</span>
          <FeeBadge event={event} className="v3-event-card__price" />
        </div>
      </div>
    </article>
  );
};

export default EventCard;
