
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import EventList from './pages/EventList';
import EventDetail from './pages/EventDetail';
import SpaceDetail from './pages/SpaceDetail';
import MapDiscovery from './pages/MapDiscovery';
import MyPage from './pages/MyPage';
import SearchOverlay from './components/SearchOverlay';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen relative">
        <Header onSearchClick={() => setIsSearchOpen(true)} />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/space/:id" element={<SpaceDetail />} />
            <Route path="/map" element={<MapDiscovery />} />
            <Route path="/mypage" element={<MyPage />} />
          </Routes>
        </main>

        <Footer />
        
        {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} />}
      </div>
    </Router>
  );
};

const Header: React.FC<{ onSearchClick: () => void }> = ({ onSearchClick }) => {
  const location = useLocation();
  const isMapPage = location.pathname === '/map';

  return (
    <header className={`${isMapPage ? 'fixed' : 'sticky'} top-0 z-[60] w-full bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 lg:px-20 py-3 transition-all`}>
      <div className="max-w-[1200px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-3xl font-bold">festival</span>
            <h1 className="text-navy text-xl font-extrabold tracking-tighter">NOLSEOUL</h1>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className={`text-sm font-bold ${location.pathname === '/' ? 'text-primary' : 'text-navy hover:text-primary transition-colors'}`}>홈</Link>
            <Link to="/events" className={`text-sm font-bold ${location.pathname === '/events' ? 'text-primary' : 'text-navy hover:text-primary transition-colors'}`}>문화행사</Link>
            <Link to="/map" className={`text-sm font-bold ${location.pathname === '/map' ? 'text-primary' : 'text-navy hover:text-primary transition-colors'}`}>지도탐색</Link>
            <Link to="/mypage" className={`text-sm font-bold ${location.pathname === '/mypage' ? 'text-primary' : 'text-navy hover:text-primary transition-colors'}`}>마이페이지</Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <div 
            onClick={onSearchClick}
            className="hidden sm:flex items-center bg-gray-100 rounded-full px-4 py-2 gap-3 cursor-pointer hover:bg-gray-200 transition-colors"
          >
            <span className="material-symbols-outlined text-gray-400 text-xl">search</span>
            <span className="text-gray-400 text-sm w-32 lg:w-48">행사나 장소를 검색하세요</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-gray-100 text-navy transition-colors">
              <span className="material-symbols-outlined">favorite</span>
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 text-navy transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <Link to="/mypage" className="size-10 rounded-full border-2 border-primary/20 overflow-hidden cursor-pointer shadow-sm">
              <img className="w-full h-full object-cover" src="https://picsum.photos/seed/user123/100/100" alt="Profile" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-12 px-6 lg:px-40">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 text-primary mb-6">
            <span className="material-symbols-outlined text-2xl font-bold">festival</span>
            <h2 className="text-navy text-lg font-bold tracking-tighter">NOLSEOUL</h2>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            서울의 모든 문화와 예술을 하나의 플랫폼에서 경험하세요. 당신의 일상이 축제가 됩니다.
          </p>
        </div>
        <div>
          <h5 className="font-bold mb-4">서비스</h5>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><Link to="/events" className="hover:text-primary transition-colors">문화행사 탐색</Link></li>
            <li><Link to="/map" className="hover:text-primary transition-colors">지도 탐색</Link></li>
            <li><a href="#" className="hover:text-primary transition-colors">야경 가이드</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">커뮤니티</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold mb-4">고객센터</h5>
          <ul className="space-y-2 text-sm text-gray-500">
            <li><a href="#" className="hover:text-primary transition-colors">공지사항</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">자주 묻는 질문</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">1:1 문의</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">이용약관</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold mb-4">뉴스레터 구독</h5>
          <p className="text-sm text-gray-500 mb-4">매주 서울의 인기 행사를 메일로 보내드립니다.</p>
          <div className="flex gap-2">
            <input className="bg-gray-100 border-none rounded-full py-2 px-4 text-sm w-full focus:ring-1 focus:ring-primary" placeholder="이메일 주소" />
            <button className="bg-primary text-white p-2 rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
        <p>© 2024 NOLSEOUL Team. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-primary transition-colors">개인정보처리방침</a>
          <a href="#" className="hover:text-primary transition-colors">이메일무단수집거부</a>
          <a href="#" className="hover:text-primary transition-colors">관리자 문의</a>
        </div>
      </div>
    </footer>
  );
};

export default App;
