// 지도탐색 페이지 — 큰 지도 + 사이드 패널
const { useState: useStateMap } = React;

function MapPage() {
  const [selected, setSelected] = useStateMap(2);
  const [filter, setFilter] = useStateMap("all");

  const pins = [
    { id: 1, name: "남산서울타워", cat: "전망대", x: 48, y: 42, hot: true, time: "오늘 19:30" },
    { id: 2, name: "서울도서관", cat: "도서관", x: 32, y: 30 },
    { id: 3, name: "DDP", cat: "전시공간", x: 62, y: 22 },
    { id: 4, name: "한강 반포대교", cat: "야경", x: 26, y: 58, hot: true, time: "20:00 분수쇼" },
    { id: 5, name: "한성백제박물관", cat: "박물관", x: 58, y: 70 },
    { id: 6, name: "올림픽공원", cat: "공원", x: 78, y: 44 },
    { id: 7, name: "홍대 거리", cat: "거리", x: 18, y: 38 },
    { id: 8, name: "낙산공원", cat: "야경", x: 56, y: 28, hot: true },
    { id: 9, name: "응봉산", cat: "야경", x: 50, y: 52 },
    { id: 10, name: "노을공원", cat: "야경", x: 14, y: 45, hot: true, time: "18:50 일몰" },
    { id: 11, name: "예술의 전당", cat: "공연장", x: 38, y: 78 },
    { id: 12, name: "국립중앙박물관", cat: "박물관", x: 42, y: 56 },
    { id: 13, name: "성수동", cat: "거리", x: 60, y: 50 },
    { id: 14, name: "문화비축기지", cat: "공연장", x: 22, y: 32 },
    { id: 15, name: "은평한옥마을", cat: "한옥", x: 30, y: 12 },
  ];
  const sel = pins.find(p => p.id === selected);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", height: "calc(100vh - 100px)", borderBottom: "1px solid var(--ink)" }}>
      {/* Sidebar */}
      <aside style={{ borderRight: "1px solid var(--ink)", display: "flex", flexDirection: "column", background: "var(--bone)" }}>
        <div style={{ padding: "32px 24px 16px", borderBottom: "1px solid var(--ink)" }}>
          <div className="eyebrow"><span className="dash"></span>02 — SPACES · 지도탐색</div>
          <h1 style={{ fontFamily: "var(--display)", fontSize: 48, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 0.95, margin: "12px 0 16px" }}>
            <span className="ko">내 주변,</span><br />
            <span className="serif" style={{ color: "var(--tangerine)" }}>지금 갈 곳.</span>
          </h1>
          <div className="search-pill" style={{ width: "100%" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>
            <span>장소·동네 검색</span>
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--ink)", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["전체", "야경", "박물관", "공연장", "전시공간", "공원", "한옥"].map(f => (
            <button key={f} className={`day-pill ${filter === f.toLowerCase() ? "active" : ""}`}
                    onClick={() => setFilter(f.toLowerCase())}
                    style={{ padding: "6px 12px", fontSize: 11 }}>{f}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {pins.map(p => (
            <div key={p.id} onClick={() => setSelected(p.id)}
                 style={{ padding: "16px 24px", borderBottom: "1px solid var(--ink)", cursor: "pointer", background: selected === p.id ? "var(--ink)" : "transparent", color: selected === p.id ? "var(--bone)" : "var(--ink)", transition: "all 0.15s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: selected === p.id ? "var(--tangerine)" : "var(--mute)" }}>{p.cat}</div>
                  <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 2 }}>
                    <span className="ko">{p.name}</span>
                  </div>
                  {p.time && <div className="mono" style={{ fontSize: 10, color: "var(--tangerine)", marginTop: 4, letterSpacing: "0.06em" }}>● {p.time}</div>}
                </div>
                {p.hot && <span className="tag solid" style={{ fontSize: 9 }}>HOT</span>}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Map */}
      <div style={{ position: "relative", background: "var(--bone-2)", overflow: "hidden" }}>
        {/* Grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(var(--ink) 1px, transparent 1px), linear-gradient(90deg, var(--ink) 1px, transparent 1px)", backgroundSize: "80px 80px", opacity: 0.06 }}></div>

        {/* Han river */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 0 55 Q 20 50, 35 55 T 65 60 Q 80 62, 100 58" stroke="#a3c4e8" strokeWidth="3" fill="none" opacity="0.6" />
          <path d="M 0 58 Q 20 53, 35 58 T 65 63 Q 80 65, 100 61" stroke="#a3c4e8" strokeWidth="6" fill="none" opacity="0.4" />
        </svg>

        {/* District lines */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="none">
          {[10, 25, 45, 65, 85].map(x => <line key={x} x1={x} y1="0" x2={x + 5} y2="100" stroke="var(--ink)" strokeWidth="0.1" strokeDasharray="0.3 0.3" opacity="0.3" />)}
        </svg>

        {/* Pins */}
        {pins.map(p => (
          <button key={p.id} onClick={() => setSelected(p.id)}
                  style={{
                    position: "absolute", top: `${p.y}%`, left: `${p.x}%`,
                    transform: "translate(-50%, -100%)",
                    background: "none", border: "none", padding: 0, cursor: "pointer",
                    zIndex: selected === p.id ? 10 : p.hot ? 5 : 1,
                  }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              {selected === p.id && (
                <div style={{ background: "var(--ink)", color: "var(--bone)", padding: "6px 10px", borderRadius: 4, whiteSpace: "nowrap", fontFamily: "var(--display)", fontSize: 13, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 4 }}>
                  <span className="ko">{p.name}</span>
                  <span style={{ color: "var(--tangerine)", marginLeft: 6, fontSize: 11 }}>● 선택</span>
                </div>
              )}
              <div style={{
                width: selected === p.id ? 26 : p.hot ? 20 : 14,
                height: selected === p.id ? 26 : p.hot ? 20 : 14,
                background: selected === p.id ? "var(--ink)" : p.hot ? "var(--tangerine)" : "var(--bone)",
                borderRadius: "50%",
                border: "2px solid var(--ink)",
                boxShadow: "0 4px 0 var(--ink)",
                position: "relative",
              }}>
                {selected === p.id && <div style={{ position: "absolute", inset: 5, background: "var(--tangerine)", borderRadius: "50%" }}></div>}
              </div>
            </div>
          </button>
        ))}

        {/* Map labels */}
        <span style={{ position: "absolute", top: 24, left: 32, fontFamily: "var(--display)", fontSize: 64, fontWeight: 700, letterSpacing: "-0.06em", color: "rgba(14,14,12,0.08)", lineHeight: 1 }}>SEOUL</span>
        <span style={{ position: "absolute", bottom: 32, right: 32, fontFamily: "var(--mono)", fontSize: 11, color: "var(--mute)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right" }}>
          NOLSEOUL MAP · 2026.05.13<br />
          N37.55 E126.98 · 320 SPACES · 47 NIGHT
        </span>

        {/* Compass */}
        <div style={{ position: "absolute", top: 32, right: 32, width: 60, height: 60, border: "1.5px solid var(--ink)", borderRadius: "50%", background: "var(--bone)", display: "grid", placeItems: "center", boxShadow: "3px 3px 0 var(--ink)" }}>
          <div style={{ fontFamily: "var(--display)", fontSize: 14, fontWeight: 700, position: "relative" }}>N
            <div style={{ position: "absolute", left: "50%", top: -16, width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: "10px solid var(--tangerine)", transform: "translateX(-50%)" }}></div>
          </div>
        </div>

        {/* Zoom controls */}
        <div style={{ position: "absolute", bottom: 32, left: 32, display: "flex", flexDirection: "column", gap: 4 }}>
          <button style={{ width: 36, height: 36, background: "var(--bone)", border: "1px solid var(--ink)", fontSize: 18, cursor: "pointer", boxShadow: "2px 2px 0 var(--ink)" }}>+</button>
          <button style={{ width: 36, height: 36, background: "var(--bone)", border: "1px solid var(--ink)", fontSize: 18, cursor: "pointer", boxShadow: "2px 2px 0 var(--ink)" }}>−</button>
          <button style={{ width: 36, height: 36, background: "var(--ink)", color: "var(--bone)", border: "1px solid var(--ink)", fontSize: 14, cursor: "pointer", boxShadow: "2px 2px 0 var(--ink)" }}>⌖</button>
        </div>

        {/* Selected detail card */}
        {sel && (
          <div style={{ position: "absolute", bottom: 32, right: 32, width: 320, background: "var(--bone)", border: "1px solid var(--ink)", padding: 20, boxShadow: "6px 6px 0 var(--ink)" }}>
            <div style={{ aspectRatio: "16/9", background: "linear-gradient(135deg, var(--tangerine), var(--electric))", marginBottom: 12, position: "relative" }}>
              <span style={{ position: "absolute", bottom: 8, left: 8, color: "rgba(255,255,255,0.8)", fontFamily: "var(--mono)", fontSize: 10 }}>/place · {sel.name}</span>
            </div>
            <div className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--tangerine)" }}>{sel.cat}</div>
            <h3 style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: "4px 0 8px" }}>
              <span className="ko">{sel.name}</span>
            </h3>
            <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "0 0 12px", lineHeight: 1.4 }}>
              {sel.time ? `${sel.time} · 지금 가장 활발한 시간` : "방문 추천 시간: 오후 ~ 저녁"}
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 12 }}>상세 보기 →</button>
              <button className="btn" style={{ padding: "8px 14px", fontSize: 12 }}>♡ 찜</button>
              <button className="btn" style={{ padding: "8px 14px", fontSize: 12 }}>↗ 길찾기</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { MapPage });
