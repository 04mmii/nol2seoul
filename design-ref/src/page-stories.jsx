// 스토리 페이지 — magazine archive
function StoriesPage() {
  const stories = [
    { id: 1, cat: "ESSAY", title: "골목 끝, 1962년의 다방에서", author: "이도연", read: "8분", date: "2026.05.10", gr: "linear-gradient(135deg, #c4543a, #e8d9b8)", quote: "쇠락한 종로 골목에 아직도 30년째 같은 자리에서 커피를 내리는 노인이 있다." },
    { id: 2, cat: "PHOTO ESSAY", title: "한강 다리 5선 — 야경 비교", author: "Han Soo Min", read: "사진 24장", date: "2026.05.08", gr: "linear-gradient(180deg, #0b1530, #2746ff 60%, #ff6a3a)", quote: "각 다리마다 빛의 결이 다릅니다. 반포는 부드럽고, 동작은 차갑고…" },
    { id: 3, cat: "INTERVIEW", title: "5월의 서울은 도시 전체가 무대", author: "박재희 — 페스티벌 프로그래머", read: "12분", date: "2026.05.06", gr: "linear-gradient(135deg, #e6ff3a, #ff5a3c)", quote: "서울의 5월엔 매주 새로운 페스티벌이 열려요. 너무 많아서 따라가기 벅찰 정도." },
    { id: 4, cat: "GUIDE", title: "외국인 친구가 왔을 때 — 24시간 코스", author: "Editorial Desk", read: "10분", date: "2026.05.04", gr: "linear-gradient(135deg, #ff5a3c, #f8a8ce)", quote: "광장시장에서 시작해 남산에서 끝나는, 가장 서울다운 하루." },
    { id: 5, cat: "LIST", title: "비 오는 날에도 가기 좋은 12곳", author: "Editorial Desk", read: "6분", date: "2026.05.02", gr: "linear-gradient(180deg, #2746ff, #5577ff, #a3c4e8)", quote: "오히려 비가 와서 더 좋은 곳들. 우산 들고 가도 후회 없는 공간들." },
    { id: 6, cat: "ESSAY", title: "성수동, 5년 사이 가장 많이 변한 동네", author: "김서연", read: "9분", date: "2026.04.30", gr: "linear-gradient(135deg, #2a4d3a, #c4543a)", quote: "벽돌공장이 카페가 되고, 카페가 갤러리가 되었다. 다음은 무엇이 될까." },
  ];

  return (
    <div>
      {/* Hero - magazine cover style */}
      <section style={{ padding: "64px 28px", borderBottom: "1px solid var(--ink)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
        <div>
          <div className="eyebrow"><span className="dash"></span>04 — STORIES · 스토리</div>
          <h1 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "clamp(64px, 9vw, 140px)", lineHeight: 0.85, letterSpacing: "-0.055em", margin: "16px 0 24px" }}>
            <span className="ko">서울이라는</span><br />
            <span className="serif" style={{ color: "var(--tangerine)" }}>오래된</span><br />
            <span className="ko">잡지.</span>
          </h1>
          <p style={{ fontSize: 18, color: "var(--ink-2)", maxWidth: 480, lineHeight: 1.5, fontFamily: "var(--serif)" }}>
            도시 안의 사람들, 사라지는 것들, 다시 발견되는 골목들에 관한 글과 사진. 매주 화요일 발행.
          </p>
          <div style={{ display: "flex", gap: 16, marginTop: 32, fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mute)" }}>
            <span>ISSUE № 21</span>
            <span>·</span>
            <span>2026 MAY</span>
            <span>·</span>
            <span>전체 14편</span>
          </div>
        </div>
        {/* Featured story */}
        <div style={{ position: "relative" }}>
          <div style={{ aspectRatio: "4/5", background: stories[0].gr, position: "relative", overflow: "hidden", border: "1px solid var(--ink)" }}>
            <span style={{ position: "absolute", top: 24, left: 24, color: "rgba(255,255,255,0.8)", fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>COVER STORY · {stories[0].cat}</span>
            <span style={{ position: "absolute", bottom: 24, left: 24, right: 24 }}>
              <div style={{ fontFamily: "var(--display)", fontSize: 40, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, color: "var(--bone)" }}>
                <span className="ko">{stories[0].title}</span>
              </div>
              <div className="mono" style={{ fontSize: 12, color: "var(--bone)", marginTop: 12, opacity: 0.9 }}>BY {stories[0].author.toUpperCase()} · {stories[0].read} READ</div>
            </span>
          </div>
          <span className="sticker" style={{ top: -12, right: -12 }}>이주의 추천 →</span>
        </div>
      </section>

      {/* Story grid */}
      <section style={{ padding: "80px 28px", borderBottom: "1px solid var(--ink)" }}>
        <div className="section-header">
          <div>
            <div className="eyebrow"><span className="dash"></span>최신 발행</div>
            <h2 className="section-title">
              <em>지금</em> <span className="ko">읽기 좋은 글.</span>
            </h2>
          </div>
          <div className="day-tabs">
            {["전체", "에세이", "인터뷰", "가이드", "포토"].map((t, i) => (
              <button key={t} className={`day-pill ${i === 0 ? "active" : ""}`}>{t}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, borderTop: "1px solid var(--ink)", borderLeft: "1px solid var(--ink)" }}>
          {stories.slice(1).map((s, i) => (
            <article key={s.id} style={{ borderRight: "1px solid var(--ink)", borderBottom: "1px solid var(--ink)", padding: 32, cursor: "pointer", background: "var(--bone)", transition: "background 0.15s", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
                     onMouseEnter={e => e.currentTarget.style.background = "var(--bone-2)"}
                     onMouseLeave={e => e.currentTarget.style.background = "var(--bone)"}>
              <div>
                <div className="mono" style={{ fontSize: 10, color: "var(--tangerine)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.cat} · № {String(i + 2).padStart(3, "0")}</div>
                <h3 style={{ fontFamily: "var(--display)", fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "12px 0 16px" }}>
                  <span className="ko">{s.title}</span>
                </h3>
                <p style={{ fontFamily: "var(--serif)", fontSize: 17, lineHeight: 1.5, color: "var(--ink-2)", margin: "0 0 16px" }}>
                  "{s.quote}"
                </p>
                <div className="mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--mute)" }}>
                  BY {s.author.toUpperCase()}<br />
                  {s.date} · {s.read} READ
                </div>
              </div>
              <div style={{ background: s.gr, position: "relative", overflow: "hidden", border: "1px solid var(--ink)" }}>
                <span style={{ position: "absolute", bottom: 8, left: 8, color: "rgba(255,255,255,0.7)", fontFamily: "var(--mono)", fontSize: 9 }}>/story · keyvisual</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Newsletter pitch */}
      <section style={{ padding: "80px 28px", background: "var(--tangerine)", borderBottom: "1px solid var(--ink)", color: "var(--ink)", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <div className="eyebrow" style={{ color: "var(--ink)", justifyContent: "center" }}><span className="dash"></span>WEEKLY DROP · 매주 화요일</div>
          <h2 style={{ fontFamily: "var(--display)", fontSize: "clamp(48px, 7vw, 96px)", fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 0.95, margin: "16px 0 24px" }}>
            <span className="ko">한 주의 서울,</span><br />
            <span className="serif">한 통의 편지로.</span>
          </h2>
          <p style={{ fontSize: 17, maxWidth: 520, margin: "0 auto 32px", lineHeight: 1.5 }}>
            도시의 사라지는 것들, 새로 생기는 것들. 다음 주 가장 가볼 만한 한 곳. 매주 화요일 아침 6시.
          </p>
          <form style={{ display: "flex", gap: 8, maxWidth: 480, margin: "0 auto" }}>
            <input placeholder="email@example.com" style={{ flex: 1, padding: "14px 20px", border: "1px solid var(--ink)", background: "var(--bone)", fontFamily: "var(--sans)", fontSize: 15, borderRadius: 999 }} />
            <button type="button" className="btn" style={{ background: "var(--ink)", color: "var(--bone)" }}>구독하기 →</button>
          </form>
          <div className="mono" style={{ fontSize: 11, marginTop: 24, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7 }}>
            이미 4,287명이 구독 중 · 광고 없음 · 언제든 해지
          </div>
        </div>
        <div style={{ position: "absolute", top: -40, left: -40, fontFamily: "var(--display)", fontSize: 240, fontWeight: 700, color: "rgba(14,14,12,0.08)", lineHeight: 1, letterSpacing: "-0.06em" }}>21</div>
      </section>
    </div>
  );
}

Object.assign(window, { StoriesPage });
