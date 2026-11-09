// 야경명소 페이지 — dark mode magazine
const { useState: useStateNi } = React;

function NightPage() {
  const spots = window.NOLSEOUL_DATA.TONIGHT_SPOTS;
  const extra = [
    { id: 6, name: "하늘공원", en: "Haneul Park", district: "마포구", elev: "98m", tags: ["억새", "일몰"], crowd: "보통", time: "19:30 SUNSET", sub: "월드컵공원 정상의 억새밭" },
    { id: 7, name: "북악스카이웨이", en: "Bukak Skyway", district: "종로구", elev: "342m", tags: ["드라이브", "전망대"], crowd: "여유", time: "22:00까지", sub: "서울 도심을 한눈에" },
    { id: 8, name: "올림픽공원 몽촌토성", en: "Mongchontoseong", district: "송파구", elev: "44m", tags: ["산책", "성벽"], crowd: "여유", time: "지속 OPEN", sub: "잔디 위에 누워 보는 별빛" },
    { id: 9, name: "63빌딩 전망대", en: "63 Square", district: "영등포구", elev: "264m", tags: ["전망대", "한강"], crowd: "혼잡", time: "22:00까지", sub: "여의도 한강 360° 파노라마" },
    { id: 10, name: "안산자락길", en: "Ansan Trail", district: "서대문구", elev: "295m", tags: ["산책로", "야경"], crowd: "여유", time: "지속 OPEN", sub: "휠체어로도 갈 수 있는 야경 명소" },
    { id: 11, name: "청계천 광교", en: "Cheonggyecheon", district: "중구", elev: "수면 위", tags: ["산책", "도심"], crowd: "보통", time: "지속 OPEN", sub: "도심 한복판의 물길 야경" },
  ];
  const all = [...spots, ...extra];

  return (
    <div style={{ background: "var(--night)", color: "var(--bone)", minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Stars */}
      <div style={{ position: "absolute", inset: 0, background: `
        radial-gradient(1px 1px at 8% 12%, rgba(255,255,255,0.9), transparent),
        radial-gradient(1.5px 1.5px at 22% 28%, rgba(255,255,255,0.7), transparent),
        radial-gradient(1px 1px at 42% 8%, rgba(255,255,255,0.8), transparent),
        radial-gradient(1px 1px at 60% 22%, rgba(255,255,255,0.6), transparent),
        radial-gradient(1.5px 1.5px at 78% 14%, rgba(255,255,255,0.8), transparent),
        radial-gradient(1px 1px at 92% 32%, rgba(255,255,255,0.7), transparent),
        radial-gradient(1px 1px at 15% 45%, rgba(255,255,255,0.5), transparent),
        radial-gradient(1.5px 1.5px at 88% 52%, rgba(255,255,255,0.6), transparent)`,
        pointerEvents: "none", opacity: 0.7 }}></div>

      {/* Hero */}
      <section style={{ padding: "80px 28px 64px", position: "relative", borderBottom: "1px solid rgba(245,241,232,0.2)" }}>
        <div className="eyebrow" style={{ color: "var(--acid)" }}><span className="dash"></span>03 — AFTER DARK · 야경명소</div>
        <h1 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "clamp(72px, 11vw, 180px)", lineHeight: 0.85, letterSpacing: "-0.055em", margin: "20px 0 0", color: "var(--bone)" }}>
          <span className="ko">밤이</span> <span className="serif" style={{ color: "var(--acid)" }}>오면</span><br />
          <span className="ko">서울이</span> <span className="serif" style={{ color: "var(--acid)" }}>켜진다.</span>
        </h1>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 40, gap: 32 }}>
          <p style={{ maxWidth: 480, fontSize: 16, color: "rgba(245,241,232,0.7)", margin: 0, lineHeight: 1.5 }}>
            해가 진 후 가장 빛나는 47곳. 전망대 · 한강 다리 · 산책길 · 도심 야경 — 오늘 밤 어디로 갈까요.
          </p>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-end" }}>
            <div>
              <div className="mono" style={{ fontSize: 11, color: "var(--acid)", letterSpacing: "0.08em" }}>오늘 일몰</div>
              <div style={{ fontFamily: "var(--display)", fontSize: 36, fontWeight: 700, letterSpacing: "-0.04em" }}>19:14</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 11, color: "var(--acid)", letterSpacing: "0.08em" }}>달 위상</div>
              <div style={{ fontFamily: "var(--display)", fontSize: 36, fontWeight: 700, letterSpacing: "-0.04em" }}>🌖 82%</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 11, color: "var(--acid)", letterSpacing: "0.08em" }}>야경 등급</div>
              <div style={{ fontFamily: "var(--display)", fontSize: 36, fontWeight: 700, letterSpacing: "-0.04em", color: "var(--tangerine)" }}>★ 4.8</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature spot */}
      <section style={{ padding: "64px 28px", borderBottom: "1px solid rgba(245,241,232,0.2)", position: "relative" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 48, alignItems: "center" }}>
          <div style={{ aspectRatio: "4/3", background: "linear-gradient(180deg, #0b1530 0%, #2a3a7a 30%, #ff6a3a 75%, #ffb27a 100%)", position: "relative", borderRadius: 4, overflow: "hidden", border: "1px solid rgba(245,241,232,0.3)" }}>
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 30% 70%, rgba(255, 200, 100, 0.6), transparent 50%), radial-gradient(circle at 60% 60%, rgba(255, 150, 80, 0.4), transparent 40%)` }}></div>
            {/* City light dots */}
            {[[20, 75], [25, 80], [30, 82], [35, 78], [40, 80], [45, 83], [50, 79], [55, 81], [60, 84], [65, 80], [70, 82], [75, 78], [38, 88], [52, 90], [62, 87]].map(([x, y], i) => (
              <div key={i} style={{ position: "absolute", top: `${y}%`, left: `${x}%`, width: 3, height: 3, background: "rgba(255, 220, 100, 0.9)", borderRadius: "50%", boxShadow: "0 0 6px rgba(255, 220, 100, 0.6)" }}></div>
            ))}
            <span style={{ position: "absolute", bottom: 16, left: 16, color: "rgba(255,255,255,0.7)", fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>/cover photo · N tower view at 19:30</span>
            <span className="sticker" style={{ top: 20, right: 20, transform: "rotate(8deg)", background: "var(--acid)" }}>TONIGHT'S COVER</span>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 11, color: "var(--acid)", letterSpacing: "0.1em", textTransform: "uppercase" }}>SPOT № 01 · EDITOR'S CHOICE</div>
            <h2 style={{ fontFamily: "var(--display)", fontSize: 72, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 0.95, margin: "12px 0 16px" }}>
              <span className="ko">남산</span><br />
              <span className="ko">서울타워.</span>
            </h2>
            <p style={{ fontFamily: "var(--serif)", fontSize: 22, lineHeight: 1.4, opacity: 0.9, margin: "0 0 24px" }}>
              "오늘처럼 미세먼지가 좋은 날엔, 도심 한복판에서 가장 멀리까지 보이는 야경. 케이블카로 9분, 전망대에선 서울 전체가 발 아래 펼쳐집니다."
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, paddingTop: 24, borderTop: "1px solid rgba(245,241,232,0.2)" }}>
              {[
                { l: "고도", v: "243m" },
                { l: "지역", v: "용산구" },
                { l: "추천 시간", v: "19:30" },
                { l: "혼잡도", v: "보통" },
              ].map(s => (
                <div key={s.l}>
                  <div className="mono" style={{ fontSize: 10, color: "var(--acid)", letterSpacing: "0.08em" }}>{s.l}</div>
                  <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 2 }}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
              <button className="btn" style={{ background: "var(--acid)", color: "var(--ink)", borderColor: "var(--acid)" }}>지도에서 보기 →</button>
              <button className="btn" style={{ background: "transparent", color: "var(--bone)", borderColor: "var(--bone)" }}>♡ 찜하기</button>
            </div>
          </div>
        </div>
      </section>

      {/* Curated lists */}
      <section style={{ padding: "64px 28px", borderBottom: "1px solid rgba(245,241,232,0.2)" }}>
        <div className="eyebrow" style={{ color: "var(--acid)" }}><span className="dash"></span>큐레이션 컬렉션</div>
        <h2 style={{ fontFamily: "var(--display)", fontSize: 56, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 0.95, margin: "12px 0 32px" }}>
          <span className="serif" style={{ color: "var(--acid)" }}>주제별로</span> <span className="ko">골라본 서울 밤.</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { ko: "데이트", en: "DATE NIGHT", count: 12, gr: "linear-gradient(135deg, #ff5a3c, #f8a8ce)" },
            { ko: "혼자 사색", en: "ALONE TIME", count: 9, gr: "linear-gradient(135deg, #2746ff, #0b1530)" },
            { ko: "사진 찍기 좋은", en: "FOR PHOTOS", count: 15, gr: "linear-gradient(135deg, #e6ff3a, #ff5a3c)" },
            { ko: "차 없이 가는", en: "NO CAR", count: 18, gr: "linear-gradient(135deg, #5ce1e6, #2746ff)" },
          ].map((c, i) => (
            <div key={i} style={{ aspectRatio: "1", background: c.gr, padding: 24, position: "relative", borderRadius: 4, cursor: "pointer", overflow: "hidden", border: "1px solid rgba(245,241,232,0.2)" }}>
              <div className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", letterSpacing: "0.1em" }}>COLLECTION 0{i+1}</div>
              <div style={{ fontFamily: "var(--display)", fontSize: 32, fontWeight: 700, letterSpacing: "-0.04em", color: "var(--bone)", marginTop: 12 }}>
                <span className="ko">{c.ko}</span>
              </div>
              <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 18, color: "rgba(255,255,255,0.7)" }}>{c.en}</div>
              <div style={{ position: "absolute", bottom: 24, left: 24, fontFamily: "var(--display)", fontSize: 48, fontWeight: 700, color: "var(--bone)", letterSpacing: "-0.05em", lineHeight: 1 }}>{c.count}</div>
              <div style={{ position: "absolute", bottom: 24, right: 24, fontFamily: "var(--mono)", fontSize: 10, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em" }}>곳 →</div>
            </div>
          ))}
        </div>
      </section>

      {/* All spots grid */}
      <section style={{ padding: "64px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
          <div>
            <div className="eyebrow" style={{ color: "var(--acid)" }}><span className="dash"></span>전체 야경 명소 47곳</div>
            <h2 style={{ fontFamily: "var(--display)", fontSize: 48, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 0.95, margin: "12px 0 0" }}>
              <span className="ko">서울의 모든 빛.</span>
            </h2>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["전체", "한강뷰", "전망대", "산책길", "도심"].map((t, i) => (
              <button key={t} className={`day-pill ${i === 0 ? "active" : ""}`} style={{ background: i === 0 ? "var(--acid)" : "transparent", color: i === 0 ? "var(--ink)" : "var(--bone)", borderColor: i === 0 ? "var(--acid)" : "var(--bone)" }}>{t}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, border: "1px solid rgba(245,241,232,0.2)" }}>
          {all.map((s, i) => (
            <div key={s.id} style={{ borderRight: (i + 1) % 3 === 0 ? "none" : "1px solid rgba(245,241,232,0.2)", borderBottom: "1px solid rgba(245,241,232,0.2)", padding: 24, cursor: "pointer", transition: "background 0.15s" }}
                 onMouseEnter={e => e.currentTarget.style.background = "rgba(245,241,232,0.05)"}
                 onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--acid)", letterSpacing: "0.08em" }}>SPOT № {String(i + 1).padStart(2, "0")}</span>
                <span className="mono" style={{ fontSize: 11, opacity: 0.6 }}>{s.crowd}</span>
              </div>
              <div style={{ aspectRatio: "4/3", background: i % 4 === 0 ? "linear-gradient(180deg, #0b1530, #ff6a3a)" : i % 4 === 1 ? "linear-gradient(135deg, #1a2a5c, #4a6abc)" : i % 4 === 2 ? "linear-gradient(180deg, #2a3a7a, #5a7acc)" : "linear-gradient(135deg, #0b1530, #2a3a7a)", marginBottom: 16, position: "relative", overflow: "hidden" }}>
                {Array.from({ length: 8 }, (_, j) => (
                  <div key={j} style={{ position: "absolute", top: `${60 + (j % 3) * 8}%`, left: `${15 + j * 9}%`, width: 2, height: 2, background: "rgba(255, 220, 100, 0.8)", borderRadius: "50%" }}></div>
                ))}
                <span style={{ position: "absolute", bottom: 8, left: 8, color: "rgba(255,255,255,0.6)", fontFamily: "var(--mono)", fontSize: 9 }}>/photo · {s.en}</span>
              </div>
              <h3 style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", margin: 0 }}>
                <span className="ko">{s.name}</span>
              </h3>
              <div className="mono" style={{ fontSize: 11, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 6 }}>
                {s.district} · {s.elev} · {s.time}
              </div>
              <p style={{ fontFamily: "var(--serif)", fontSize: 15, opacity: 0.85, margin: "10px 0 12px", lineHeight: 1.4 }}>"{s.sub}"</p>
              <div style={{ display: "flex", gap: 6 }}>
                {s.tags.map(t => (
                  <span key={t} className="tag" style={{ borderColor: "rgba(245,241,232,0.4)", color: "rgba(245,241,232,0.7)" }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { NightPage });
