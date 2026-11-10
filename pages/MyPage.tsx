import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useCulturalSpaces, useNightViewSpots, useFavorites } from '../hooks';
import type { FavoriteItem } from '../hooks';
import EventCard from '../components/v3/EventCard';
import NightArt from '../components/night/NightArt';
import { buildNight, type NightSpotView } from '../components/night/selectors';
import { districtFromAddress } from '../components/home/selectors';
import { eventDday } from '../utils/event';
import { QUICK_LINKS, nightChipText } from '../components/search/quickLinks';
import { resolveFavorites, sortEntries, myStats, goneLabel, type MyEntry, type MyTab } from '../components/mypage/selectors';
import '../components/mypage/mypage-v3.css';

/**
 * MyPage — Redesign v3 (design-ref "Search and My v3" M1–M3, decisions 2026-11-10).
 * Favorites saved in this browser only (no login): title count, 4 stats, type tabs, one shared card
 * grid in a fixed 마감 임박순, ended/unavailable favorites dimmed with a delete button (never removed
 * automatically), and an empty state that links onward.
 * Removed (no data / placeholders): fake profile, account menu and logout, membership promo, sort control,
 * "이번 주 마감" banner (its number stays in the stats).
 */
const TABS: Array<{ id: MyTab; label: string; short: string }> = [
  { id: 'all', label: '전체', short: '전체' },
  { id: 'event', label: '문화행사', short: '행사' },
  { id: 'space', label: '문화공간', short: '공간' },
  { id: 'spot', label: '야경명소', short: '야경' },
];

const LocalNote: React.FC = () => (
  <p className="v3-my__local"><b>이 브라우저에 저장돼요</b><br />로그인 없이 사용 · 다른 기기와 공유되지 않음</p>
);

const Heart: React.FC<{ title: string; onRemove: () => void }> = ({ title, onRemove }) => (
  <button type="button" className="v3-event-card__heart v3-focus" aria-pressed="true" aria-label={`${title} 찜 해제`} onClick={onRemove}>
    <span aria-hidden="true">♥</span>
  </button>
);

const SpaceCard: React.FC<{ entry: Extract<MyEntry, { kind: 'space' }>; onRemove: () => void }> = ({ entry, onRemove }) => {
  const { space, id } = entry;
  const [broken, setBroken] = useState(false);
  return (
    <article className="v3-event-card">
      <div className="v3-event-card__thumb">
        {space.MAIN_IMG && !broken ? (
          <img src={space.MAIN_IMG} alt="" loading="lazy" onError={() => setBroken(true)} />
        ) : (
          <span className="v3-event-card__ph v3-my__ph-space" aria-hidden="true"><span className="v3-event-card__ph-cap">문화공간</span></span>
        )}
        <Heart title={space.FAC_NAME} onRemove={onRemove} />
      </div>
      <div className="v3-event-card__body">
        <div className="v3-event-card__cat">문화공간{space.SUBJCODE ? ` · ${space.SUBJCODE}` : ''}</div>
        <h3 className="v3-event-card__title"><Link to={`/space/${id}`} className="v3-event-card__link">{space.FAC_NAME}</Link></h3>
        <div className="v3-event-card__foot">
          <span className="v3-my__foot-text">{districtFromAddress(space.ADDR) || space.ADDR}</span>
          {space.CLOSEDAY && <span className="v3-my__foot-text v3-my__foot-right">{space.CLOSEDAY.length > 14 ? `${space.CLOSEDAY.slice(0, 14)}…` : space.CLOSEDAY} 휴관</span>}
        </div>
      </div>
    </article>
  );
};

const SpotCard: React.FC<{ view: NightSpotView; views: NightSpotView[]; onRemove: () => void }> = ({ view, views, onRemove }) => {
  const st = view.state;
  return (
    <article className="v3-event-card">
      <div className="v3-event-card__thumb v3-my__night-thumb">
        <NightArt view={view} views={views} />
        <Heart title={view.spot.TITLE} onRemove={onRemove} />
      </div>
      <div className="v3-event-card__body">
        <div className="v3-event-card__cat">야경명소{view.spot.SUBJECT_CD ? ` · ${view.spot.SUBJECT_CD}` : ''}</div>
        <h3 className="v3-event-card__title"><Link to={`/night?spot=${view.index}`} className="v3-event-card__link">{view.spot.TITLE}</Link></h3>
        <div className="v3-event-card__foot">
          <span className="v3-my__foot-text">{view.district}</span>
          {st.label && <span className={`v3-my__state is-${st.badge}`}>{st.label}</span>}
        </div>
      </div>
    </article>
  );
};

/**
 * Favorite that isn't in current data: `ended` (dimmed poster + label), `lost` (dashed note instead of
 * the poster), or `pending` (data still loading or failed — stored fields only, no verdict).
 */
const StoredCard: React.FC<{ fav: FavoriteItem; state: 'ended' | 'lost' | 'pending'; label?: string; onRemove: () => void }> = ({ fav, state, label, onRemove }) => (
  <article className={`v3-event-card v3-my__stored is-${state}`}>
    <div className="v3-event-card__thumb">
      {state !== 'lost' && fav.image ? (
        <img src={fav.image} alt="" loading="lazy" />
      ) : (
        <span className="v3-my__lost" aria-hidden="true">{state === 'lost' ? '서울시 데이터에서 찾을 수 없어요' : state === 'pending' ? '불러오는 중' : ''}</span>
      )}
    </div>
    {label && <p className="v3-my__flag" role="note"><span>{label}</span></p>}
    <div className="v3-event-card__body">
      <div className="v3-event-card__cat">{fav.category}</div>
      <h3 className="v3-event-card__title">{fav.title}</h3>
      <div className="v3-event-card__venue">{fav.location}</div>
      <div className="v3-event-card__foot">
        <span className="v3-my__foot-text">{fav.date}</span>
        <button type="button" className="v3-my__del v3-focus" onClick={onRemove} aria-label={`${fav.title} 찜 삭제`}>찜 삭제</button>
      </div>
    </div>
  </article>
);

const MyPage: React.FC = () => {
  const { favorites, removeFavorite } = useFavorites();
  const { events } = useEvents();
  const { spaces } = useCulturalSpaces();
  const { spots } = useNightViewSpots();
  const [tab, setTab] = useState<MyTab>('all');

  const now = useMemo(() => new Date(), [events, spaces, spots]); // eslint-disable-line react-hooks/exhaustive-deps
  const night = useMemo(() => (spots.length ? buildNight(spots, now) : null), [spots, now]);
  const entries = useMemo(
    () => sortEntries(resolveFavorites(favorites, { events, spaces, spots, nightViews: night?.views ?? [] }, now)),
    [favorites, events, spaces, spots, night, now],
  );
  const stats = myStats(entries, night, now);
  const shown = tab === 'all' ? entries : entries.filter((e) => e.fav.type === tab);
  const count = (t: MyTab) => (t === 'all' ? stats.total : t === 'event' ? stats.events : t === 'space' ? stats.spaces : stats.spots);

  if (favorites.length === 0) {
    return (
      <div className="v3-my v3-shell">
        <header className="v3-my__head">
          <div>
            <p className="v3-eyebrow"><span className="v3-eyebrow__dash" aria-hidden="true" />MY · 나의 놀서울</p>
            <h1 className="v3-my__title">아직 찜한<br />서울이 없어요.</h1>
          </div>
          <LocalNote />
        </header>
        <div className="v3-my__empty">
          <div className="v3-my__empty-l">
            <p className="v3-my__empty-big">마음에 드는 곳에서<br /><em>♥&#xFE0E;</em>를 눌러 두세요.</p>
            <p>행사·문화공간·야경명소를 찜하면 여기에 모이고, 마감이 가까운 순서로 보여 드려요.</p>
            <Link to="/events" className="v3-btn v3-btn--primary">이번 주 행사 보기 →</Link>
          </div>
          <nav className="v3-my__empty-r" aria-label="바로 가기">
            {[QUICK_LINKS.freeWeek, QUICK_LINKS.endingSoon, QUICK_LINKS.nightOn].map((l) => (
              <Link key={l.id} to={l.to} className="v3-my__go v3-focus">
                <b>{l.night ? nightChipText(night) : l.label}</b><span aria-hidden="true">→</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div className="v3-my v3-shell">
      <header className="v3-my__head">
        <div>
          <p className="v3-eyebrow"><span className="v3-eyebrow__dash" aria-hidden="true" />MY · 나의 놀서울</p>
          <h1 className="v3-my__title">찜해 둔 서울,<br /><em>{stats.total}</em>곳.</h1>
        </div>
        <LocalNote />
      </header>

      <dl className="v3-my__stats">
        <div><dt>찜한 행사</dt><dd>{stats.events} {stats.events > 0 && <small>진행 중 {stats.ongoing}</small>}</dd></div>
        <div><dt>이번 주 마감</dt><dd>{stats.endingThisWeek} {stats.endingThisWeek > 0 && <small>놓치기 전에</small>}</dd></div>
        <div><dt>찜한 문화공간</dt><dd>{stats.spaces}</dd></div>
        <div>
          <dt>지금 켜진 찜 야경</dt>
          <dd>
            {stats.beforeSunset && stats.litSpots === 0 ? (
              <span className="v3-my__soon">곧 켜져요</span>
            ) : (
              <>{stats.litSpots > 0 && <span className="v3-my__lit" aria-hidden="true" />}{stats.litSpots}</>
            )}
            <small>/ 전체 {stats.spots}곳</small>
          </dd>
        </div>
      </dl>

      <div className="v3-my__bar">
        <div className="v3-my__tabs" role="group" aria-label="종류">
          {TABS.map((t) => (
            <button key={t.id} type="button" className="v3-day-pill v3-focus" aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
              <span className="v3-my__tab-long">{t.label}</span><span className="v3-my__tab-short">{t.short}</span> {count(t.id)}
            </button>
          ))}
        </div>
        <p className="v3-my__order">마감 임박순</p>
      </div>

      {shown.length === 0 ? (
        <p className="v3-my__none">이 종류로 찜한 곳이 없어요.</p>
      ) : (
        <div className="v3-event-grid v3-my__grid">
          {shown.map((e) => {
            const remove = () => removeFavorite(e.fav.id, e.fav.type);
            const key = `${e.fav.type}-${e.fav.id}`;
            switch (e.kind) {
              case 'event':
                return <EventCard key={key} event={e.event} id={e.fav.id} saved onToggleFavorite={remove} dday={eventDday(e.event, now)} />;
              case 'space':
                return <SpaceCard key={key} entry={e} onRemove={remove} />;
              case 'spot':
                return <SpotCard key={key} view={e.view} views={night?.views ?? []} onRemove={remove} />;
              case 'gone':
                return <StoredCard key={key} fav={e.fav} state={e.reason} label={goneLabel(e)} onRemove={remove} />;
              default:
                return <StoredCard key={key} fav={e.fav} state="pending" onRemove={remove} />;
            }
          })}
        </div>
      )}
    </div>
  );
};

export default MyPage;
