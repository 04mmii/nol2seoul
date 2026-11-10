import React, { useEffect, useMemo, useState } from 'react';
import { useEvents, useNightViewSpots } from '../../hooks';
import { buildTickerItems } from './selectors';
import './live-bar.css';

/**
 * v3 Live Bar (design-ref chrome-v2.jsx `LiveBar`), real data only. Status "LIVE · 서울 · date",
 * scrolling ticker, KST clock. The ticker pauses on hover/focus and with the pause button
 * (WCAG 2.2.2); with prefers-reduced-motion it doesn't move and shows one static copy.
 * Hidden on the map route (App.tsx), where the header is fixed over a full-screen map.
 */
const LiveBar: React.FC = () => {
  const { events, loading: evLoading, isError: evError } = useEvents();
  const { spots, loading: spLoading, isError: spError } = useNightViewSpots();
  const [now, setNow] = useState(() => new Date());
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const minuteKey = Math.floor(now.getTime() / 60_000);
  const items = useMemo(
    // An empty list is treated as unavailable too: "0건" everywhere after a failed/empty upstream call would mislead.
    () => buildTickerItems({
      now,
      events: evLoading || evError || events.length === 0 ? null : events,
      spots: spLoading || spError || spots.length === 0 ? null : spots,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [minuteKey, events, spots, evLoading, evError, spLoading, spError],
  );

  const kst = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit' }).format(now).replace('-', '.');

  const list = (copy: number) => (
    <ul className="v3-live__list" aria-hidden={copy > 0 ? true : undefined}>
      {items.map((it) => (
        <li key={`${copy}-${it.id}`} className={`v3-live__item ${it.hot ? 'is-hot' : ''}`} data-ticker={copy === 0 ? it.id : undefined}>
          <span>{it.text}</span>
          <span className="v3-live__sep" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="v3-live" role="region" aria-label="실시간 정보">
      <div className="v3-live__status"><span className="v3-live__dot" aria-hidden="true" />LIVE · 서울 · {date}</div>
      <div className={`v3-live__stream ${paused ? 'is-paused' : ''}`}>
        <div className="v3-live__track">
          {list(0)}
          {list(1)}
        </div>
      </div>
      <button type="button" className="v3-live__pause" onClick={() => setPaused((p) => !p)} aria-pressed={paused} aria-label={paused ? '실시간 정보 다시 흐르기' : '실시간 정보 멈추기'}>
        {paused ? '▶' : '❚❚'}
      </button>
      <div className="v3-live__clock">{kst} KST</div>
    </div>
  );
};

export default LiveBar;
