import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useCulturalSpaces, useNightViewSpots } from '../hooks';
import FeeBadge from './v3/FeeBadge';
import { eventId } from '../utils/eventId';
import { eventCardDate, eventDday, eventVenue } from '../utils/event';
import { searchAll, highlightParts } from './search/selectors';
import { QUICK_LINKS, nightChipText, type QuickLink } from './search/quickLinks';
import { buildNight } from './night/selectors';
import { districtFromAddress } from './home/selectors';
import { spaceId, spotId } from '../utils/placeId';
import './search/search-v3.css';

/**
 * v3 search panel (design-ref "Search and My v3", scoped for the portfolio, 2026-11-10).
 * Desktop: a panel under the header with a scrim; ≤900px: full screen.
 * Kept from before: same search fields, recent searches in localStorage `nolseoul-recent` (Enter saves,
 * de-duplicated, max 8, remove one, clear all), result click saves the query and closes, 취소 closes.
 * New: Esc closes, shortcut chips (names; the night chip shows the night page's lit count), up to 4 per
 * group + total + "전체 보기" (just opens the page), matched text highlighted (accent-text), no-result
 * screen; space results open /space/<id>, night results /night?spot=<id> (BUG-06 fixed; stable IDs, utils/placeId.ts).
 * Focus (A11Y-04, 2026-11-11): Tab stays inside the panel; closing returns focus to the opener.
 * Not included (scope): arrow-key navigation, mobile type tabs, passing the query to other pages.
 */
const RECENT_KEY = 'nolseoul-recent';
const RECENT_MAX = 8;

const Mark: React.FC<{ text: string; query: string }> = ({ text, query }) => (
  <>
    {highlightParts(text, query).map((p, i) => (p.hit ? <mark key={i} className="v3-search__hit">{p.text}</mark> : <React.Fragment key={i}>{p.text}</React.Fragment>))}
  </>
);

const SearchOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
  });
  const { events } = useEvents();
  const { spaces } = useCulturalSpaces();
  const { spots } = useNightViewSpots();
  const inputRef = useRef<HTMLInputElement>(null);
  const [top, setTop] = useState(0);

  // Panel sits right under the header (whatever is above it: Live Bar, scroll position).
  useEffect(() => {
    const header = document.querySelector('header');
    setTop(header ? Math.max(0, header.getBoundingClientRect().bottom) : 0);
    inputRef.current?.focus();
  }, []);
  // A11Y-04: Esc closes; Tab / Shift+Tab stay inside the panel; on close, focus returns to what opened it
  // (the header search button).
  const panelRef = useRef<HTMLDivElement>(null);
  // Read during the first render, before the input takes focus.
  const [opener] = useState(() => document.activeElement as HTMLElement | null);
  useEffect(() => () => { if (opener && opener !== document.body && document.contains(opener)) opener.focus(); }, [opener]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'))
        .filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0], last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panelRef.current.contains(active))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (active === last || !panelRef.current.contains(active))) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const saveRecent = (term: string) => {
    const t = term.trim();
    if (!t) return;
    const updated = [t, ...recent.filter((s) => s !== t)].slice(0, RECENT_MAX);
    setRecent(updated);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };
  const removeRecent = (term: string) => {
    const updated = recent.filter((s) => s !== term);
    setRecent(updated);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };
  const clearRecent = () => { setRecent([]); localStorage.removeItem(RECENT_KEY); };

  const groups = useMemo(() => searchAll(query, events, spaces, spots), [query, events, spaces, spots]);
  const night = useMemo(() => (spots.length ? buildNight(spots, new Date()) : null), [spots]);
  const q = query.trim();
  const open = (term?: string) => { saveRecent(term ?? q); onClose(); };

  const Chip: React.FC<{ link: QuickLink }> = ({ link }) => (
    <Link to={link.to} className="v3-search__chip v3-focus" onClick={onClose}>
      {link.night && <span className={`v3-search__lit ${night && night.lit > 0 ? 'is-on' : ''}`} aria-hidden="true" />}
      {link.night ? nightChipText(night) : link.label}
    </Link>
  );

  return (
    <div className="v3-search" role="dialog" aria-modal="true" aria-label="검색">
      <div className="v3-search__scrim" style={{ top }} onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} className="v3-search__panel" style={{ ['--search-top' as string]: `${top}px` }}>
        <div className="v3-search__field">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && q) saveRecent(q); }}
            placeholder="행사, 장소, 키워드를 검색해보세요"
            aria-label="검색어"
          />
          {query && <button type="button" className="v3-search__clear v3-focus" onClick={() => { setQuery(''); inputRef.current?.focus(); }} aria-label="검색어 지우기">✕</button>}
          <button type="button" className="v3-search__cancel v3-focus" onClick={onClose}>취소</button>
        </div>

        <div className="v3-search__body">
          {!q ? (
            <>
              {recent.length > 0 && (
                <section className="v3-search__sec" aria-labelledby="search-recent">
                  <div className="v3-search__sec-h">
                    <h2 id="search-recent">최근 검색어</h2>
                    <button type="button" className="v3-search__link v3-focus" onClick={clearRecent}>전체 삭제</button>
                  </div>
                  <div className="v3-search__chips">
                    {recent.map((term) => (
                      <span key={term} className="v3-search__chip is-recent">
                        <button type="button" className="v3-search__chip-term v3-focus" onClick={() => setQuery(term)}>{term}</button>
                        <button type="button" className="v3-search__chip-x v3-focus" onClick={() => removeRecent(term)} aria-label={`최근 검색어 ${term} 삭제`}>✕</button>
                      </span>
                    ))}
                  </div>
                </section>
              )}
              <section className="v3-search__sec" aria-labelledby="search-quick">
                <div className="v3-search__sec-h"><h2 id="search-quick">바로 가기</h2></div>
                <div className="v3-search__chips">
                  {[QUICK_LINKS.freeWeek, QUICK_LINKS.endingSoon, QUICK_LINKS.nightOn, QUICK_LINKS.museums].map((l) => <Chip key={l.id} link={l} />)}
                </div>
              </section>
              <p className="v3-search__scope">찾을 수 있는 것 — 행사 이름 · 장소 · 자치구 · 분류 / 문화공간 이름 · 주소 / 야경명소 이름 · 주소</p>
            </>
          ) : groups.total === 0 ? (
            <div className="v3-search__empty" role="status">
              <p className="v3-search__empty-big">‘{q}’와 맞는 곳이<br />서울엔 <em>없어요.</em></p>
              <p>행사 이름 대신 장소나 동네(예: 종로, 성수)로 찾거나, 띄어쓰기를 바꿔 다시 검색해 보세요.</p>
              <div className="v3-search__chips">
                {[QUICK_LINKS.museums, QUICK_LINKS.exhibitWeek, QUICK_LINKS.freeWeek].map((l) => <Chip key={l.id} link={l} />)}
              </div>
              <p className="v3-search__scope">찾는 범위: 진행 중·3개월 내 행사 · 문화공간 · 야경명소</p>
            </div>
          ) : (
            <>
              {groups.events.total > 0 && (
                <section className="v3-search__sec" aria-labelledby="search-events">
                  <div className="v3-search__sec-h">
                    <h2 id="search-events">문화행사 <span>· {groups.events.total}건</span></h2>
                    <Link to="/events" className="v3-search__link v3-focus" onClick={() => open()}>문화행사에서 전체 보기 →</Link>
                  </div>
                  <ul className="v3-search__list">
                    {groups.events.items.map((e) => {
                      const dday = eventDday(e);
                      return (
                        <li key={eventId(e)}>
                          <Link to={`/event/${eventId(e)}`} className="v3-search__res v3-focus" onClick={() => open()}>
                            <span className="v3-search__thumb">{e.MAIN_IMG && <img src={e.MAIN_IMG} alt="" loading="lazy" />}</span>
                            <span className="v3-search__main">
                              <span className="v3-search__name"><Mark text={e.TITLE} query={q} /></span>
                              <span className="v3-search__sub"><span>{e.CODENAME}</span><span>{eventVenue(e)}</span><span>{eventCardDate(e)}</span></span>
                            </span>
                            <span className="v3-search__right"><FeeBadge event={e} hideCheck />{dday && <span className="v3-search__dday">{dday}</span>}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
              {groups.spaces.total > 0 && (
                <section className="v3-search__sec" aria-labelledby="search-spaces">
                  <div className="v3-search__sec-h">
                    <h2 id="search-spaces">문화공간 <span>· {groups.spaces.total}곳</span></h2>
                    <Link to="/map" className="v3-search__link v3-focus" onClick={() => open()}>지도에서 전체 보기 →</Link>
                  </div>
                  <ul className="v3-search__list">
                    {groups.spaces.items.map(({ space, index }) => (
                      <li key={index}>
                        <Link to={`/space/${spaceId(space)}`} className="v3-search__res v3-focus" onClick={() => open()}>
                          <span className="v3-search__icon">{(space.SUBJCODE || '공간').split('/')[0]}</span>
                          <span className="v3-search__main">
                            <span className="v3-search__name"><Mark text={space.FAC_NAME} query={q} /></span>
                            <span className="v3-search__sub"><span>{space.ADDR}</span></span>
                          </span>
                          <span className="v3-search__right" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {groups.spots.total > 0 && (
                <section className="v3-search__sec" aria-labelledby="search-spots">
                  <div className="v3-search__sec-h">
                    <h2 id="search-spots">야경명소 <span>· {groups.spots.total}곳</span></h2>
                    <Link to="/night" className="v3-search__link v3-focus" onClick={() => open()}>야경명소에서 전체 보기 →</Link>
                  </div>
                  <ul className="v3-search__list">
                    {groups.spots.items.map(({ spot, index }) => {
                      const st = night?.views[index]?.state;
                      return (
                        <li key={index}>
                          <Link to={`/night?spot=${spotId(spot)}`} className="v3-search__res v3-focus" onClick={() => open()}>
                            <span className={`v3-search__icon is-night ${st?.badge === 'lit' ? 'is-on' : ''}`}><span className="v3-search__glow" aria-hidden="true" /></span>
                            <span className="v3-search__main">
                              <span className="v3-search__name"><Mark text={spot.TITLE} query={q} /></span>
                              <span className="v3-search__sub"><span>{districtFromAddress(spot.ADDR)}</span><span>{spot.OPERATING_TIME}</span></span>
                            </span>
                            <span className="v3-search__right">
                              {st && (st.badge === 'lit' || st.badge === 'open') && <span className={`v3-search__state is-${st.badge}`}>{st.badge === 'lit' ? '● ' : ''}{st.label}</span>}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        <div className="v3-search__foot">
          <span>{q && groups.total > 0 ? `‘${q}’ 결과 ${groups.total}건 · 이름·장소·주소에서 찾음` : ' '}</span>
          <span><kbd>ESC</kbd> 닫기</span>
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
