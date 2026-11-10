
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import EventList from './pages/EventList';
import EventDetail from './pages/EventDetail';
import SpaceDetail from './pages/SpaceDetail';
import MapDiscovery from './pages/MapDiscovery';
import MyPage from './pages/MyPage';
import NightPage from './pages/NightPage';
import SearchOverlay from './components/SearchOverlay';
import { useEvents } from './hooks';
import LiveBar from './components/live/LiveBar';
import { useFavoritesMigration } from './hooks/useFavoritesMigration';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

/** BUG-08: one-time favorites migration to stable event IDs, on every route (shares the cached event query). */
const FavoritesMigration = () => {
  const { events } = useEvents();
  useFavoritesMigration(events);
  return null;
};

/** Live Bar on every route except the map (full-screen map with a fixed header). */
const LiveBarOutsideMap = () => (useLocation().pathname === '/map' ? null : <LiveBar />);

const App: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <Router>
      <ScrollToTop />
      <FavoritesMigration />
      <div className="flex flex-col min-h-screen relative">
        <LiveBarOutsideMap />
        <Header onSearchClick={() => setIsSearchOpen(true)} />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/space/:id" element={<SpaceDetail />} />
            <Route path="/map" element={<MapDiscovery />} />
            <Route path="/night" element={<NightPage />} />
            <Route path="/mypage" element={<MyPage />} />
          </Routes>
        </main>

        <Footer />
        
        {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} />}
      </div>
    </Router>
  );
};

// ---------------------------------------------------------------------------
// Site chrome — Redesign v3 (design-ref/src/chrome-v2.jsx, styles-v3.css).
// v3 nav. 야경명소 and the Live Bar approved 2026-11-10; 스토리 remains out of scope.
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { to: '/', label: '홈' },
  { to: '/events', label: '문화행사' },
  { to: '/map', label: '지도탐색' },
  { to: '/night', label: '야경명소' },
  { to: '/mypage', label: '마이페이지' },
] as const;

const FOCUS_RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';
const ICON_BUTTON = `size-[34px] shrink-0 grid place-items-center rounded-[3px] border border-line bg-transparent text-ink-2 transition-colors hover:bg-ink hover:text-bone hover:border-ink ${FOCUS_RING}`;

const SearchIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3-3" />
  </svg>
);

const BellIcon: React.FC = () => (
  <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </svg>
);

const HeartIcon: React.FC = () => (
  <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const Header: React.FC<{ onSearchClick: () => void }> = ({ onSearchClick }) => {
  const location = useLocation();
  const isMapPage = location.pathname === '/map';

  return (
    <header
      className={`${isMapPage ? 'fixed' : 'sticky'} top-0 z-[60] w-full bg-bone border-b border-line font-body text-ink`}
    >
      {/* Background is full-width; content sits on the shared content width (--v3-content-max). */}
      <div className="max-w-shell mx-auto h-[60px] lg:h-[68px] px-gutter flex items-center gap-4 md:gap-6 xl:gap-9">
      <Link to="/" className={`flex items-center gap-[9px] shrink-0 text-ink ${FOCUS_RING}`}>
        <span aria-hidden="true" className="size-[22px] grid place-items-center bg-ink text-bone font-display text-[14px] font-bold">
          N
        </span>
        <h1 className="font-display text-[19px] font-bold leading-none tracking-[-0.045em]">NOLSEOUL</h1>
      </Link>

      <nav aria-label="주요 메뉴" className="hidden md:flex flex-1 items-center gap-0.5">
        {NAV_ITEMS.map(({ to, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={`px-[9px] xl:px-3 py-2 text-[13px] xl:text-sm whitespace-nowrap transition-colors ${FOCUS_RING} ${
                active
                  ? 'font-bold text-ink shadow-[inset_0_-2px_0_rgb(var(--v3-tangerine))]'
                  : 'font-medium text-ink-2 rounded hover:text-ink hover:bg-bone-2'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Desktop (≥1024px): search pill */}
      <button
        type="button"
        onClick={onSearchClick}
        className={`hidden lg:flex items-center gap-2 w-[190px] xl:w-[260px] px-3 py-2 rounded-[3px] bg-bone-2 border border-line text-[13px] text-mute text-left transition-colors hover:border-line-strong ${FOCUS_RING}`}
      >
        <SearchIcon />
        <span className="truncate">행사 · 장소 · 동네 검색</span>
      </button>

      {/* Mobile/tablet (<1024px): icon-only search, kept so search stays reachable */}
      <button
        type="button"
        onClick={onSearchClick}
        aria-label="검색"
        className={`lg:hidden ml-auto md:ml-0 ${ICON_BUTTON}`}
      >
        <SearchIcon size={15} />
      </button>

      {/* Placeholders: no behavior yet (same as before the redesign). */}
      <button type="button" aria-label="알림" title="알림" className={ICON_BUTTON}>
        <BellIcon />
      </button>
      <button type="button" aria-label="찜" title="찜" className={ICON_BUTTON}>
        <HeartIcon />
      </button>

      <Link
        to="/mypage"
        aria-label="마이페이지"
        className={`size-[34px] shrink-0 rounded-full bg-sand border border-line ${FOCUS_RING}`}
      />
      </div>
    </header>
  );
};

const FOOTER_HEADING = 'font-mono text-[10px] font-normal uppercase tracking-[0.1em] text-bone/[0.55] mb-[18px]';
const FOOTER_LINK = `transition-colors hover:text-ember ${FOCUS_RING.replace('outline-ink', 'outline-bone')}`;

// Links marked href="#" are placeholders (no page exists yet), unchanged from before the redesign.
const Footer: React.FC = () => {
  return (
    <footer className="bg-ink text-bone font-body pt-[88px] pb-6 overflow-hidden">
      <div className="max-w-shell mx-auto px-gutter">
        <h2 className="font-body font-extrabold text-[clamp(64px,11vw,168px)] leading-[0.9] tracking-[-0.055em] text-bone mb-14">
          놀 서울<span className="text-tangerine">.</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr] gap-10 pt-9 border-t border-bone/[0.18]">
          <div className="sm:col-span-2 md:col-span-1">
            <h3 className={FOOTER_HEADING}>WEEKLY DROP — 매주 화요일</h3>
            <p className="text-sm text-bone/[0.72] leading-relaxed max-w-[320px] mb-[18px]">
              이번 주 가장 흥미로운 서울의 문화·야경·이벤트를 큐레이션해 보내드립니다.
            </p>
            {/* Placeholder: newsletter has no backend yet (same as before the redesign). */}
            <input
              type="email"
              aria-label="뉴스레터 이메일 주소"
              placeholder="email@seoul.kr"
              className="block w-full max-w-[320px] bg-transparent border-0 border-b border-bone/40 rounded-none px-0 py-2 text-sm text-bone placeholder:text-bone/40 focus:ring-0 focus:border-bone focus:outline-none"
            />
            <button
              type="button"
              className={`mt-[18px] px-[18px] py-2.5 rounded-[3px] border border-bone/40 bg-transparent text-bone text-[13px] font-semibold transition-colors hover:bg-bone hover:text-ink ${FOCUS_RING.replace('outline-ink', 'outline-bone')}`}
            >
              구독하기 →
            </button>
          </div>

          <div>
            <h3 className={FOOTER_HEADING}>서비스</h3>
            <ul className="text-sm">
              <li className="py-[5px]"><Link to="/events" className={FOOTER_LINK}>문화행사 탐색</Link></li>
              <li className="py-[5px]"><Link to="/map" className={FOOTER_LINK}>지도 탐색</Link></li>
              <li className="py-[5px]"><Link to="/night" className={FOOTER_LINK}>야경명소</Link></li>
              <li className="py-[5px]"><a href="#" className={FOOTER_LINK}>야경 가이드</a></li>
              <li className="py-[5px]"><a href="#" className={FOOTER_LINK}>커뮤니티</a></li>
            </ul>
          </div>

          <div>
            <h3 className={FOOTER_HEADING}>지원</h3>
            <ul className="text-sm">
              <li className="py-[5px]"><a href="#" className={FOOTER_LINK}>공지사항</a></li>
              <li className="py-[5px]"><a href="#" className={FOOTER_LINK}>자주 묻는 질문</a></li>
              <li className="py-[5px]"><a href="#" className={FOOTER_LINK}>1:1 문의</a></li>
              <li className="py-[5px]"><a href="#" className={FOOTER_LINK}>이용약관</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-[72px] pt-[22px] border-t border-bone/[0.18] flex flex-col md:flex-row md:justify-between gap-3 md:gap-6 font-mono text-[10px] uppercase tracking-[0.08em] text-bone/[0.55]">
          <span>© 2026 NOLSEOUL TEAM · ALL RIGHTS RESERVED</span>
          <span className="flex flex-wrap gap-x-2">
            <a href="#" className={FOOTER_LINK}>개인정보처리방침</a>
            <span aria-hidden="true">·</span>
            <a href="#" className={FOOTER_LINK}>이메일무단수집거부</a>
            <span aria-hidden="true">·</span>
            <a href="#" className={FOOTER_LINK}>관리자 문의</a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default App;
