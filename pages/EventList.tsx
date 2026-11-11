import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useFavorites } from '../hooks';
import EventCard from '../components/v3/EventCard';
import { eventId } from '../utils/eventId';
import {
  ALL,
  DEFAULT_FILTERS,
  activeFilterCount,
  applyFilters,
  categoryOptions,
  ongoingCount,
  pageNumbers,
  regionOptions,
  sortEvents,
  type EventFilters,
  type SortKey,
} from '../components/events/selectors';
import { EVENTS_COPY, EVENTS_PER_PAGE, FEE_FILTERS, PERIOD_TABS, SORT_OPTIONS } from '../constants/events';
import '../components/events/events-v3.css';

/**
 * v3 EventList (design-ref/src/page-events.jsx), fed by the event API.
 * Kept from the pre-v3 page: single-select genre / district / fee filters (fee = BUG-03 option D),
 * 12 per page, pagination reset on filter change, favorites, "지도 보기" link, loading/error/empty states.
 * New (approved 2026-11-09): period tabs (Home tab rules, default 전체), sort 기본순 / 마감임박.
 * Not rendered (no data / out of scope): featured banner with curator quote, price-range checkboxes,
 * popularity sort, grid/list view toggle.
 */
const EventList: React.FC = () => {
  const { events, loading, isError } = useEvents();
  const { toggleFavorite, isFavorite } = useFavorites();
  const now = useMemo(() => new Date(), []);

  const [filters, setFilters] = useState<EventFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>('default');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false); // mobile disclosure

  const update = (patch: Partial<EventFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const categories = useMemo(() => categoryOptions(events, filters, now), [events, filters, now]);
  const regions = useMemo(() => regionOptions(events), [events]);
  const filtered = useMemo(() => sortEvents(applyFilters(events, filters, now), sort, now), [events, filters, sort, now]);
  const ongoing = useMemo(() => ongoingCount(events, now), [events, now]);

  const totalPages = Math.ceil(filtered.length / EVENTS_PER_PAGE);
  const paged = filtered.slice((page - 1) * EVENTS_PER_PAGE, page * EVENTS_PER_PAGE);
  const active = activeFilterCount(filters);

  if (loading) {
    return (
      <div className="v3-evlist">
        <div className="v3-shell v3-evlist__state" role="status">문화행사를 불러오는 중...</div>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="v3-evlist">
        <div className="v3-shell v3-evlist__state" role="alert">문화행사를 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="v3-evlist">
      {/* Page head */}
      <section className="v3-evlist__head">
        <div className="v3-shell">
          <div className="v3-eyebrow"><span className="v3-eyebrow__dash" />{EVENTS_COPY.eyebrow}</div>
          <h1 className="v3-evlist__title">
            <span className="v3-ko">서울에서</span> <span className="v3-evlist__em">지금</span>
            <br />
            <span className="v3-ko">하고 있는</span> <span className="v3-evlist__em">{ongoing.toLocaleString('ko-KR')}</span>
            <br />
            <span className="v3-ko">가지 일.</span>
          </h1>
          <div className="v3-evlist__head-row">
            <p className="v3-evlist__sub">{EVENTS_COPY.sub}</p>
            <div className="v3-evlist__periods" role="group" aria-label="기간">
              {PERIOD_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="v3-day-pill v3-focus"
                  aria-pressed={filters.period === t.id}
                  onClick={() => update({ period: t.id })}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="v3-evlist__body">
        <div className="v3-shell v3-evlist__grid">
          {/* Mobile: filters collapse behind a toggle */}
          <button
            type="button"
            className="v3-btn v3-evlist__filter-toggle"
            aria-expanded={filtersOpen}
            aria-controls="evlist-filters"
            onClick={() => setFiltersOpen((o) => !o)}
          >
            필터{active > 0 ? ` · ${active}` : ''} <span aria-hidden="true">{filtersOpen ? '▴' : '▾'}</span>
          </button>

          <aside id="evlist-filters" className={`v3-evlist__side ${filtersOpen ? 'is-open' : ''}`} aria-label="필터">
            <div className="v3-evlist__side-inner">
            <div className="v3-evlist__fgroup" role="group" aria-label="카테고리">
              <div className="v3-evlist__fnum">FILTER № 01</div>
              <h2 className="v3-evlist__ftitle">카테고리</h2>
              <ul className="v3-evlist__cats">
                {categories.map((c) => (
                  <li key={c.name}>
                    <button
                      type="button"
                      className="v3-evlist__cat v3-focus"
                      aria-pressed={filters.category === c.name}
                      onClick={() => update({ category: c.name })}
                    >
                      <span>{c.name}</span>
                      <span className="v3-evlist__cat-n">{c.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="v3-evlist__fgroup" role="group" aria-label="지역">
              <div className="v3-evlist__fnum">FILTER № 02</div>
              <h2 className="v3-evlist__ftitle">지역</h2>
              <div className="v3-evlist__chips">
                {regions.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className="v3-day-pill v3-evlist__chip v3-focus"
                    aria-pressed={filters.region === r}
                    onClick={() => update({ region: r })}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="v3-evlist__fgroup" role="group" aria-label="관람료">
              <div className="v3-evlist__fnum">FILTER № 03</div>
              <h2 className="v3-evlist__ftitle">관람료</h2>
              <div className="v3-evlist__chips">
                {FEE_FILTERS.map((fee) => (
                  <button
                    key={fee}
                    type="button"
                    className="v3-day-pill v3-evlist__chip v3-focus"
                    aria-pressed={filters.fee === fee}
                    onClick={() => update({ fee })}
                  >
                    {fee}
                  </button>
                ))}
              </div>
            </div>

            <div className="v3-evlist__reset">
              <button
                type="button"
                className="v3-btn"
                disabled={active === 0}
                onClick={() => update({ category: ALL, region: ALL, fee: ALL })}
              >
                필터 초기화
              </button>
            </div>
            </div>
          </aside>

          <div className="v3-evlist__content">
            <div className="v3-evlist__toolbar">
              <h2 className="v3-evlist__count">
                총 <b>{filtered.length.toLocaleString('ko-KR')}</b>건의 문화행사
              </h2>
              <div className="v3-evlist__tools">
              <label className="v3-evlist__sort">
                <span>SORT</span>
                <select value={sort} onChange={(e) => { setSort(e.target.value as SortKey); setPage(1); }} className="v3-focus">
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </label>
              {/* Desktop: in the toolbar next to the sort. ≤900px: fixed at the bottom of the screen (CSS). */}
              <Link to="/map" className="v3-btn v3-btn--primary v3-evlist__map">지도 보기 →</Link>
              </div>
            </div>

            <div role="region" aria-label="문화행사 목록">
              {paged.length === 0 ? (
                <p className="v3-evlist__empty">조건에 맞는 행사가 없습니다.</p>
              ) : (
                <div className="v3-event-grid v3-event-grid--3">
                  {paged.map((ev) => {
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
                            location: ev.PLACE || ev.GUNAME,
                            image: ev.MAIN_IMG,
                            category: ev.CODENAME,
                            date: ev.DATE,
                          })
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <nav className="v3-evlist__pages" aria-label="페이지">
                <button type="button" className="v3-day-pill v3-focus" aria-label="이전 페이지" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>←</button>
                {pageNumbers(page, totalPages).map((p, i) =>
                  p === '…' ? (
                    <span key={`dots-${i}`} className="v3-evlist__dots">…</span>
                  ) : (
                    <button key={p} type="button" className="v3-day-pill v3-focus" aria-pressed={page === p} aria-current={page === p ? 'page' : undefined} onClick={() => setPage(p)}>
                      {p}
                    </button>
                  ),
                )}
                <button type="button" className="v3-day-pill v3-focus" aria-label="다음 페이지" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>→</button>
              </nav>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default EventList;
