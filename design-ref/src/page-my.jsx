// 마이페이지 — 찜/방문/캘린더
const { useState: useStateMy } = React;

function MyPage() {
  const [tab, setTab] = useStateMy("saved");
  const events = window.NOLSEOUL_DATA.EVENTS.slice(0, 4);

  return (
    <div>
      {/* Profile header */}
      <section style={{ padding: "48px 28px", borderBottom: "1px solid var(--ink)", background: "var(--bone)", display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 32, alignItems: "center" }}>
        <div style={{ width: 120, height: 120, borderRadius: "50%", background: "linear-gradient(135deg, var(--tangerine), var(--electric))", border: "2px solid var(--ink)", position: "relative" }}>
          <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: "var(--display)", fontSize: 48, fontWeight: 700, color: "var(--bone)", letterSpacing: "-0.04em" }}>김</span>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--mute)" }}>MEMBER № SUB-8842 · 구독자</div>
          <h1 style={{ fontFamily: "var(--display)", fontSize: 56, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 0.95, margin: "8px 0 12px" }}>
            <span className="ko">안녕하세요,</span> <span className="serif" style={{ color: "var(--tangerine)" }}>김서연</span><span className="ko">님.</span>
          </h1>
          <p style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--ink-2)", margin: 0 }}>
            이번 달 서울에서 <b style={{ color: "var(--tangerine)", fontWeight: 600 }}>4곳</b>을 방문하셨고, <b style={{ color: "var(--tangerine)", fontWeight: 600 }}>12개</b>의 행사를 찜해 두셨어요.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="btn">⚙ 설정</button>
          <button className="btn">📤 공유하기</button>
        </div>
      </section>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "1px solid var(--ink)" }}>
        {[
          { num: "12", label: "찜한 행사", sub: "이번 달", color: "var(--tangerine)" },
          { num: "04", label: "방문 완료", sub: "이번 달", color: "var(--ink)" },
          { num: "27", label: "스토리 읽음", sub: "누적", color: "var(--electric)" },
          { num: "₩52K", label: "절약한 관람료", sub: "무료 행사로", color: "var(--ink)" },
        ].map((s, i) => (
          <div key={i} style={{ padding: 32, borderRight: i < 3 ? "1px solid var(--ink)" : "none", background: i === 0 ? "var(--bone-2)" : "var(--bone)" }}>
            <div className="mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mute)" }}>{s.label} · {s.sub}</div>
            <div style={{ fontFamily: "var(--display)", fontSize: 64, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1, marginTop: 8, color: s.color }}>{s.num}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <nav style={{ padding: "0 28px", borderBottom: "1px solid var(--ink)", display: "flex", gap: 0, background: "var(--bone)" }}>
        {[
          { id: "saved", label: "찜한 행사", count: 12 },
          { id: "visited", label: "방문 기록", count: 4 },
          { id: "calendar", label: "캘린더", count: null },
          { id: "subs", label: "구독", count: 3 },
          { id: "settings", label: "설정", count: null },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ padding: "20px 24px", background: "transparent", border: "none", borderBottom: tab === t.id ? "2px solid var(--ink)" : "2px solid transparent", marginBottom: -1, cursor: "pointer", fontFamily: "var(--sans)", fontWeight: tab === t.id ? 700 : 500, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
            {t.label}
            {t.count != null && <span className="mono" style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: tab === t.id ? "var(--ink)" : "var(--bone-2)", color: tab === t.id ? "var(--bone)" : "var(--ink-2)" }}>{t.count}</span>}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      {tab === "saved" && (
        <section style={{ padding: "48px 28px", borderBottom: "1px solid var(--ink)" }}>
          <div className="section-header">
            <div>
              <div className="eyebrow"><span className="dash"></span>나의 찜 목록 · 12건</div>
              <h2 className="section-title">
                <span className="ko">가고 싶은 곳들.</span>
              </h2>
            </div>
            <div className="day-tabs">
              <button className="day-pill active">전체</button>
              <button className="day-pill">진행중</button>
              <button className="day-pill">마감임박</button>
              <button className="day-pill">종료</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, borderTop: "1px solid var(--ink)", borderLeft: "1px solid var(--ink)" }}>
            {[...events, ...events, ...events].slice(0, 12).map((ev, i) => (
              <EventCard key={i} ev={{...ev, id: ev.id + i * 100}} />
            ))}
          </div>
        </section>
      )}

      {tab === "visited" && (
        <section style={{ padding: "48px 28px", borderBottom: "1px solid var(--ink)" }}>
          <div className="eyebrow"><span className="dash"></span>방문 기록 · 2026</div>
          <h2 className="section-title" style={{ marginBottom: 32 }}>
            <em>방문한</em> <span className="ko">서울의 자리들.</span>
          </h2>
          {[
            { date: "2026.05.10 SUN", venue: "남산서울타워", cat: "전망대 · 야경", rating: 5, note: "케이블카에서 본 노을이 압권. 다음엔 평일에 가야겠다." },
            { date: "2026.05.06 WED", venue: "DDP — Modern Korea 1960s", cat: "전시", rating: 4, note: "60년대 광고와 디자인이 인상적. 한 시간 반 소요." },
            { date: "2026.04.28 MON", venue: "한강 반포대교", cat: "야경 · 분수쇼", rating: 5, note: "21시 피날레는 꼭 봐야 함." },
            { date: "2026.04.21 MON", venue: "성수동 갤러리 투어", cat: "전시 · 산책", rating: 4, note: "이번엔 3곳 돌았고, 카페까지 포함하면 4시간." },
          ].map((v, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr 200px 100px", gap: 24, padding: "24px 0", borderBottom: "1px solid var(--ink)", alignItems: "flex-start" }}>
              <div>
                <div className="mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mute)" }}>VISIT № {String(i + 1).padStart(3, "0")}</div>
                <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 4 }}>{v.date}</div>
              </div>
              <div>
                <div className="mono" style={{ fontSize: 11, color: "var(--tangerine)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{v.cat}</div>
                <h3 style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: "4px 0 8px" }}>
                  <span className="ko">{v.venue}</span>
                </h3>
                <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--ink-2)", margin: 0, lineHeight: 1.4 }}>"{v.note}"</p>
              </div>
              <div style={{ fontFamily: "var(--display)", fontSize: 24, color: "var(--tangerine)" }}>{"★".repeat(v.rating)}<span style={{ opacity: 0.2 }}>{"★".repeat(5 - v.rating)}</span></div>
              <button className="btn" style={{ padding: "8px 14px", fontSize: 12 }}>다시 방문 →</button>
            </div>
          ))}
        </section>
      )}

      {tab === "calendar" && (
        <section style={{ padding: "48px 28px", borderBottom: "1px solid var(--ink)" }}>
          <div className="section-header">
            <div>
              <div className="eyebrow"><span className="dash"></span>나의 캘린더 · 2026.05</div>
              <h2 className="section-title">
                <span className="ko">예약된</span> <em>다섯 가지</em> <span className="ko">약속.</span>
              </h2>
            </div>
            <div className="day-tabs">
              <button className="day-pill">◂</button>
              <button className="day-pill active">2026.05</button>
              <button className="day-pill">▸</button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0, border: "1px solid var(--ink)" }}>
            {["월", "화", "수", "목", "금", "토", "일"].map(d => (
              <div key={d} style={{ padding: 12, borderRight: "1px solid var(--ink)", borderBottom: "1px solid var(--ink)", background: "var(--ink)", color: "var(--bone)", fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>{d}</div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 3; // start offset
              const events = {
                4: { c: "var(--tangerine)", t: "신비한 유물 도감" },
                10: { c: "var(--electric)", t: "남산타워 방문 예정" },
                13: { c: "var(--tangerine)", t: "TODAY ●" },
                17: { c: "var(--acid)", t: "한강 야시장 OPEN" },
                23: { c: "var(--electric)", t: "마포 재즈" },
                28: { c: "var(--tangerine)", t: "Modern Korea 폐막" },
              };
              const ev = events[day];
              return (
                <div key={i} style={{ minHeight: 96, padding: 8, borderRight: (i + 1) % 7 === 0 ? "none" : "1px solid var(--ink)", borderBottom: i < 28 ? "1px solid var(--ink)" : "none", background: day === 13 ? "var(--bone-2)" : "var(--bone)", position: "relative" }}>
                  <div className="mono" style={{ fontSize: 12, fontWeight: day === 13 ? 700 : 400, color: day < 1 || day > 31 ? "var(--mute)" : day === 13 ? "var(--tangerine)" : "var(--ink)" }}>{day > 0 && day <= 31 ? day : ""}</div>
                  {ev && (
                    <div style={{ fontFamily: "var(--mono)", fontSize: 9, padding: "3px 6px", background: ev.c, color: ev.c === "var(--acid)" ? "var(--ink)" : "var(--bone)", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.2 }}>{ev.t}</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === "subs" && (
        <section style={{ padding: "48px 28px", borderBottom: "1px solid var(--ink)" }}>
          <div className="eyebrow"><span className="dash"></span>구독 중인 큐레이터 · 3명</div>
          <h2 className="section-title" style={{ marginBottom: 32 }}>
            <em>내가</em> <span className="ko">팔로잉하는 사람들.</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
            {window.NOLSEOUL_DATA.CURATORS.map((c, i) => (
              <div key={i} className="curator-card">
                <div className="avatar-big"></div>
                <div className="name">{c.name}</div>
                <div className="role">{c.role}</div>
                <p className="quote">"{c.quote}"</p>
                <div className="picks">{c.picks}</div>
                <div style={{ marginTop: 16, display: "flex", gap: 6 }}>
                  <button className="btn" style={{ padding: "6px 12px", fontSize: 12 }}>알림 ON</button>
                  <button className="btn" style={{ padding: "6px 12px", fontSize: 12 }}>구독 해지</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "settings" && (
        <section style={{ padding: "48px 28px", borderBottom: "1px solid var(--ink)", maxWidth: 720 }}>
          <div className="eyebrow"><span className="dash"></span>계정 설정</div>
          <h2 className="section-title" style={{ marginBottom: 32 }}>
            <span className="ko">계정·알림 설정.</span>
          </h2>
          {[
            { l: "이메일 알림", d: "주간 뉴스레터, 찜한 행사 시작 알림", on: true },
            { l: "푸시 알림", d: "내 주변 행사가 시작될 때", on: true },
            { l: "지역 추천", d: "위치 기반 큐레이션", on: false },
            { l: "공개 프로필", d: "다른 사용자가 내 방문 기록을 볼 수 있음", on: false },
            { l: "다크 모드", d: "야경 페이지에서 자동 적용", on: true },
          ].map((s, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 60px", gap: 24, padding: "20px 0", borderBottom: "1px solid var(--ink)", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em" }}>
                  <span className="ko">{s.l}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--mute)", marginTop: 4 }}>{s.d}</div>
              </div>
              <div style={{ width: 48, height: 26, borderRadius: 999, background: s.on ? "var(--ink)" : "var(--bone-2)", border: "1px solid var(--ink)", position: "relative", cursor: "pointer", transition: "background 0.2s" }}>
                <div style={{ position: "absolute", top: 2, left: s.on ? 24 : 2, width: 20, height: 20, borderRadius: "50%", background: s.on ? "var(--tangerine)" : "var(--ink)", transition: "left 0.2s" }}></div>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

Object.assign(window, { MyPage });
