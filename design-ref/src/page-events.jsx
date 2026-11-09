// 문화행사 페이지 — 필터 사이드바 + 큰 그리드
const { useState: useStateEv } = React;

function EventsPage() {
  const events = window.NOLSEOUL_DATA.EVENTS;
  const [cat, setCat] = useStateEv("all");
  const [view, setView] = useStateEv("grid"); // grid | list
  const [sort, setSort] = useStateEv("recent");

  const categories = [
    { id: "all", label: "전체", count: 1284 },
    { id: "ex", label: "전시·미술", count: 312 },
    { id: "pf", label: "공연·뮤지컬", count: 287 },
    { id: "fe", label: "축제·이벤트", count: 198 },
    { id: "ed", label: "교육·체험", count: 156 },
    { id: "cl", label: "클래스·강좌", count: 134 },
    { id: "ki", label: "어린이·가족", count: 92 },
    { id: "fm", label: "영화·영상", count: 105 },
  ];
  const regions = ["전체", "종로구", "중구", "용산구", "성동구", "마포구", "서초구", "강남구", "송파구", "은평구"];
  const prices = ["전체", "무료", "1만원 이하", "3만원 이하", "5만원 이하"];

  return (
    <div>
      {/* Page head */}
      <section style={{ padding: "64px 28px 32px", borderBottom: "1px solid var(--ink)" }}>
        <div className="eyebrow"><span className="dash"></span>01 — HAPPENINGS · 문화행사 탐색</div>
        <h1 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "clamp(60px, 8vw, 120px)", lineHeight: 0.9, letterSpacing: "-0.05em", margin: "16px 0 0" }}>
          <span className="ko">서울에서</span> <span className="serif" style={{ color: "var(--tangerine)" }}>지금</span><br />
          <span className="ko">하고 있는</span> <span className="serif" style={{ color: "var(--tangerine)" }}>1,284</span><br />
          <span className="ko">가지 일.</span>
        </h1>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 32 }}>
          <p style={{ maxWidth: 520, fontSize: 16, color: "var(--ink-2)", margin: 0 }}>
            전시 · 공연 · 축제 · 클래스 — 지역과 카테고리로 필터해 오늘 갈 곳을 찾아보세요.
          </p>
          <div className="day-tabs">
            <button className="day-pill active">오늘</button>
            <button className="day-pill">이번 주</button>
            <button className="day-pill">이번 달</button>
            <button className="day-pill">전체</button>
          </div>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", borderBottom: "1px solid var(--ink)", minHeight: "100vh" }}>
        {/* Sidebar */}
        <aside style={{ borderRight: "1px solid var(--ink)", padding: "32px 24px", position: "sticky", top: 64, height: "100vh", overflowY: "auto", background: "var(--bone-2)" }}>
          <div className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--mute)", marginBottom: 12 }}>FILTER № 01</div>
          <h3 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.02em" }}>카테고리</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px" }}>
            {categories.map(c => (
              <li key={c.id} onClick={() => setCat(c.id)}
                  style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", cursor: "pointer", borderRadius: 6, background: cat === c.id ? "var(--ink)" : "transparent", color: cat === c.id ? "var(--bone)" : "var(--ink)", fontSize: 14, transition: "all 0.15s" }}>
                <span>{c.label}</span>
                <span className="mono" style={{ fontSize: 11, opacity: 0.6 }}>{c.count}</span>
              </li>
            ))}
          </ul>

          <div className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--mute)", marginBottom: 12 }}>FILTER № 02</div>
          <h3 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.02em" }}>지역</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 32 }}>
            {regions.map(r => (
              <button key={r} className="day-pill" style={{ padding: "6px 10px", fontSize: 11 }}>{r}</button>
            ))}
          </div>

          <div className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--mute)", marginBottom: 12 }}>FILTER № 03</div>
          <h3 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.02em" }}>관람료</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {prices.map(p => (
              <label key={p} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" defaultChecked={p === "무료"} />
                {p}
              </label>
            ))}
          </div>

          <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px dashed var(--ink)" }}>
            <button className="btn" style={{ width: "100%", justifyContent: "center" }}>필터 초기화</button>
          </div>
        </aside>

        {/* Content */}
        <div style={{ padding: "32px 28px" }}>
          {/* Toolbar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--ink)" }}>
            <div className="mono" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <b style={{ color: "var(--tangerine)" }}>{events.length}</b> / 1,284건 표시 · 정렬 {sort}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--mute)" }}>SORT</span>
              <select value={sort} onChange={e => setSort(e.target.value)} style={{ fontFamily: "var(--mono)", fontSize: 12, padding: "6px 10px", border: "1px solid var(--ink)", background: "var(--bone)", borderRadius: 4 }}>
                <option value="recent">최신순</option>
                <option value="popular">인기순</option>
                <option value="ending">마감임박</option>
                <option value="free">무료우선</option>
              </select>
              <div style={{ width: 1, height: 24, background: "var(--ink)", margin: "0 4px" }}></div>
              <button onClick={() => setView("grid")} style={{ width: 32, height: 32, border: "1px solid var(--ink)", background: view === "grid" ? "var(--ink)" : "var(--bone)", color: view === "grid" ? "var(--bone)" : "var(--ink)", borderRadius: 4, cursor: "pointer" }}>▦</button>
              <button onClick={() => setView("list")} style={{ width: 32, height: 32, border: "1px solid var(--ink)", background: view === "list" ? "var(--ink)" : "var(--bone)", color: view === "list" ? "var(--bone)" : "var(--ink)", borderRadius: 4, cursor: "pointer" }}>≡</button>
            </div>
          </div>

          {/* Featured event banner */}
          <div style={{ border: "1px solid var(--ink)", background: "var(--ink)", color: "var(--bone)", padding: 32, marginBottom: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, position: "relative", overflow: "hidden" }}>
            <div>
              <div className="mono" style={{ fontSize: 10, color: "var(--tangerine)", letterSpacing: "0.12em", marginBottom: 8 }}>★ FEATURED · 이주의 추천</div>
              <h2 style={{ fontFamily: "var(--display)", fontSize: 40, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, margin: "0 0 16px" }}>
                <span style={{ fontFamily: "var(--sans)", fontWeight: 800 }}>한강 달빛 야시장</span>
              </h2>
              <p style={{ fontFamily: "var(--serif)", fontSize: 20, lineHeight: 1.4, opacity: 0.9, margin: "0 0 16px" }}>
                "여의도 한강에서 별빛 아래 펼쳐지는 야간 마켓 — 240개 부스, 라이브 공연, 푸드트럭."
              </p>
              <div className="mono" style={{ fontSize: 11, color: "var(--mute)", letterSpacing: "0.06em" }}>
                여의도 한강공원 · 05.17 — 09.30 토·일 18:00 ~ 23:00 · 무료입장
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button className="btn btn-accent">상세 보기 →</button>
                <button className="btn" style={{ background: "transparent", color: "var(--bone)", borderColor: "var(--bone)" }}>♡ 찜하기</button>
              </div>
            </div>
            <div style={{ background: "linear-gradient(135deg, #ff5a3c, #ffb27a 50%, #2746ff)", position: "relative", borderRadius: 4 }}>
              <span style={{ position: "absolute", bottom: 12, left: 12, color: "rgba(255,255,255,0.8)", fontFamily: "var(--mono)", fontSize: 10 }}>/feature poster · 달빛 야시장 키비주얼</span>
            </div>
            <span className="sticker electric" style={{ top: 20, right: 20 }}>FREE · 무료</span>
          </div>

          {/* Grid */}
          {view === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, borderTop: "1px solid var(--ink)", borderLeft: "1px solid var(--ink)" }}>
              {events.map(ev => <EventCard key={ev.id} ev={ev} />)}
              {events.map(ev => <EventCard key={"d" + ev.id} ev={{...ev, id: ev.id + 100}} />)}
            </div>
          ) : (
            <ol style={{ listStyle: "none", padding: 0, margin: 0, borderTop: "1px solid var(--ink)" }}>
              {[...events, ...events].map((ev, i) => (
                <li key={i} style={{ display: "grid", gridTemplateColumns: "60px 100px 1fr 160px 120px 100px", gap: 20, padding: "20px 8px", borderBottom: "1px solid var(--ink)", alignItems: "center", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bone-2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{String(i + 1).padStart(3, "0")}</span>
                  <div style={{ width: 80, height: 56, background: `linear-gradient(135deg, var(--tangerine), var(--sand))`, border: "1px solid var(--ink)" }}></div>
                  <div>
                    <div className="mono" style={{ fontSize: 10, textTransform: "uppercase", color: "var(--tangerine)", letterSpacing: "0.08em" }}>{ev.cat}</div>
                    <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", marginTop: 2 }}>
                      <span className="ko">{ev.title}</span>
                    </div>
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: "var(--mute)", textTransform: "uppercase", letterSpacing: "0.06em" }}>📍 {ev.venue}</span>
                  <span className="mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{ev.date}</span>
                  <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: ev.price === "무료" ? "var(--tangerine)" : "var(--ink)" }}>{ev.price}</span>
                </li>
              ))}
            </ol>
          )}

          {/* Pagination */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, padding: "48px 0" }}>
            <button className="day-pill">←</button>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} className={`day-pill ${n === 1 ? "active" : ""}`} style={{ padding: "8px 14px" }}>{n}</button>
            ))}
            <span className="mono" style={{ fontSize: 11, color: "var(--mute)", padding: "0 8px" }}>… 161</span>
            <button className="day-pill">→</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EventsPage });
