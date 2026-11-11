import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Event } from '../../types';
import { HERO_COPY } from '../../constants/home';
import { eventStatus } from '../../utils/event';
import { eventPrice, eventVenue, formatCount, formatMastheadDate } from './selectors';

export type HeroBanner = { event: Event; id: string };
export type HeroStats = { ongoing: number; spaces: number; weekStarts: number };

const AUTOPLAY_MS = 6000;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

interface Props {
  banners: HeroBanner[];
  /** null while data is loading */
  stats: HeroStats | null;
  now: Date;
}

const HeroEditorial: React.FC<Props> = ({ banners, stats, now }) => {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = banners.length;
  const current = banners[Math.min(idx, Math.max(count - 1, 0))];

  useEffect(() => {
    if (paused || count < 2 || prefersReducedMotion()) return;
    const id = window.setTimeout(() => setIdx((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [idx, paused, count]);

  const go = (delta: number) => setIdx((i) => (i + delta + count) % count);
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section className="v3-hero" aria-label="이번 주 문화행사">
      <div className="v3-shell v3-hero__grid">
      <div className="v3-hero__left">
        <div>
          <div className="v3-hero__masthead">
            <span><b>{HERO_COPY.mastheadBrand}</b></span>
            <span>{formatMastheadDate(now)}</span>
            <span>{HERO_COPY.mastheadLabel}</span>
          </div>
          <h1 className="v3-hero__title">
            THIS WEEK
            <br />
            <span className="it">in</span> <span className="v3-ko">서울</span>
            <br />
            PLAYS.
          </h1>
          <p className="v3-hero__sub">{HERO_COPY.sub}</p>
          <div className="v3-hero__cta">
            <Link to="/events" className="v3-btn v3-btn--primary">{HERO_COPY.ctaEvents}</Link>
            <Link to="/map" className="v3-btn">{HERO_COPY.ctaMap}</Link>
          </div>
        </div>
        <dl className="v3-hero__stats">
          <div><dt>진행 중 행사</dt><dd>{stats ? formatCount(stats.ongoing) : '—'}</dd></div>
          <div><dt>문화공간</dt><dd>{stats ? formatCount(stats.spaces) : '—'}</dd></div>
          <div><dt>이번 주 시작</dt><dd>{stats ? formatCount(stats.weekStarts) : '—'}</dd></div>
        </dl>
      </div>

      <div
        className="v3-hero__right"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {/* Poster fills the whole banner (object-fit: cover), as in the design-ref. */}
        {count === 0 ? (
          <div className="v3-hero__slide is-active" />
        ) : (
          banners.map((b, i) => (
            <div key={b.id} className={`v3-hero__slide ${i === idx ? 'is-active' : ''}`} aria-hidden={i !== idx}>
              {b.event.MAIN_IMG && (
                <img
                  src={b.event.MAIN_IMG}
                  alt=""
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
            </div>
          ))
        )}

        {/* Caption overlaid at the bottom, on top of the readability gradient. */}
        {current && (
          <Link to={`/event/${current.id}`} className="v3-hero__cap v3-focus" aria-live="polite">
            <span className="v3-hero__cover-cat">FEATURED · {current.event.CODENAME}</span>
            {(() => { const st = eventStatus(current.event, now); return st.kind === 'upcoming' ? <span className="v3-hero__cover-dday">D-{st.daysToStart} 개막</span> : null; })()}
            <span className="v3-hero__cover-title">{current.event.TITLE}</span>
            <span className="v3-hero__cover-meta">
              <span>{eventVenue(current.event)}</span>
              <span>{current.event.DATE}</span>
              <span>{eventPrice(current.event)}</span>
            </span>
          </Link>
        )}

        {count > 1 && (
          <div className="v3-hero__controls">
            <div className="v3-hero__bars">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  className={`v3-hero__bar v3-focus ${i === idx ? 'is-active' : ''}`}
                  onClick={() => setIdx(i)}
                  aria-label={`배너 ${i + 1}`}
                  aria-current={i === idx ? 'true' : undefined}
                />
              ))}
            </div>
            <span className="v3-hero__count">{pad(idx + 1)} / {pad(count)}</span>
            <button type="button" className="v3-hero__ctrl v3-focus" onClick={() => go(-1)} aria-label="이전 배너">←</button>
            <button type="button" className="v3-hero__ctrl v3-focus" onClick={() => go(1)} aria-label="다음 배너">→</button>
          </div>
        )}
      </div>
      </div>
    </section>
  );
};

export default HeroEditorial;
