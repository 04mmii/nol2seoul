// Shared chrome (v2): one live strip, header, footer
const { useState, useEffect } = React;

function LiveBar({ showStream = true }) {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = t.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
  const items = window.NOLSEOUL_DATA.TICKER_ITEMS;
  const doubled = [...items, ...items, ...items];
  return (
    <div className="live-bar">
      <div className="status"><span className="dot"></span>LIVE · ISSUE №21 · 서울 21°C</div>
      {showStream && (
        <div className="stream">
          <div className="ticker-track">
            {doubled.map((it, i) => (
              <div key={i} className={`ticker-item ${it.type === "hot" ? "hot" : ""}`}>
                <span>{it.text}</span>
                <span className="sep"></span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="clock">{time} KST</div>
    </div>
  );
}

function UtilityBar() { return null; }
function Ticker() { return null; }

function Header({ activeNav, setActiveNav }) {
  const items = [
    { id: "home", label: "홈" },
    { id: "events", label: "문화행사" },
    { id: "map", label: "지도탐색" },
    { id: "night", label: "야경명소" },
    { id: "stories", label: "스토리" },
    { id: "my", label: "마이페이지" },
  ];
  return (
    <header className="site-header">
      <div className="brand-mark">
        <span className="glyph"></span>
        <span>NOLSEOUL</span>
      </div>
      <nav className="nav">
        {items.map(it => (
          <a key={it.id} className={activeNav === it.id ? "active" : ""} onClick={() => setActiveNav(it.id)}>{it.label}</a>
        ))}
      </nav>
      <div className="search-pill">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>
        <span>행사 · 장소 · 동네 검색</span>
      </div>
      <button className="icon-btn" title="알림">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>
      </button>
      <button className="icon-btn" title="찜">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </button>
      <div className="avatar"></div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell">
        <h2 className="footer-giant">놀 서울<span className="dot">.</span></h2>
        <div className="footer-cols">
          <div className="footer-newsletter">
            <h4>WEEKLY DROP — 매주 화요일</h4>
            <p style={{ fontSize: 14, opacity: 0.72, margin: "0 0 18px", maxWidth: 320, lineHeight: 1.6 }}>
              이번 주 가장 흥미로운 서울의 문화·야경·이벤트를 큐레이션해 보내드립니다.
            </p>
            <input placeholder="email@seoul.kr" />
            <button>구독하기 →</button>
          </div>
          <div>
            <h4>서비스</h4>
            <ul>
              <li><a>문화행사 탐색</a></li>
              <li><a>지도 탐색</a></li>
              <li><a>야경 가이드</a></li>
              <li><a>커뮤니티</a></li>
            </ul>
          </div>
          <div>
            <h4>지원</h4>
            <ul>
              <li><a>공지사항</a></li>
              <li><a>자주 묻는 질문</a></li>
              <li><a>1:1 문의</a></li>
              <li><a>이용약관</a></li>
            </ul>
          </div>
          <div>
            <h4>소셜</h4>
            <ul>
              <li><a>Instagram @nol.seoul</a></li>
              <li><a>YouTube</a></li>
              <li><a>X (Twitter)</a></li>
              <li><a>RSS</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-legal">
          <span>© 2026 NOLSEOUL TEAM · ALL RIGHTS RESERVED</span>
          <span>개인정보처리방침 · 이메일무단수집거부 · 관리자 문의</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { LiveBar, UtilityBar, Header, Ticker, Footer });
