// 행사 상세 페이지 — editorial product page
function DetailPage({ onBack }) {
  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--ink)", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        <div>
          <span style={{ color: "var(--mute)", cursor: "pointer" }} onClick={onBack}>← 홈</span>
          <span style={{ margin: "0 8px", color: "var(--mute)" }}>/</span>
          <span style={{ color: "var(--mute)" }}>문화행사</span>
          <span style={{ margin: "0 8px", color: "var(--mute)" }}>/</span>
          <span>전시·미술</span>
          <span style={{ margin: "0 8px", color: "var(--mute)" }}>/</span>
          <span style={{ color: "var(--tangerine)" }}>2026 은평역사한옥박물관 기획전</span>
        </div>
        <div>EVENT № EX-001 · D-127</div>
      </div>

      {/* Hero */}
      <section style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", borderBottom: "1px solid var(--ink)", minHeight: 600 }}>
        <div style={{ background: "repeating-linear-gradient(45deg, #ff5a3c, #ff5a3c 16px, #ffb27a 16px, #ffb27a 32px)", position: "relative", overflow: "hidden", borderRight: "1px solid var(--ink)" }}>
          <span className="sticker electric" style={{ top: 32, left: 32 }}>★ EDITOR'S PICK · 이주의 추천</span>
          <span style={{ position: "absolute", bottom: 20, left: 24, color: "rgba(0,0,0,0.5)", fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>/poster · 기획전 키비주얼 plate</span>
          <div style={{ position: "absolute", bottom: 32, right: 32, fontFamily: "var(--display)", fontSize: 240, fontWeight: 700, letterSpacing: "-0.06em", lineHeight: 0.8, color: "rgba(14, 14, 12, 0.15)" }}>01</div>
        </div>
        <div style={{ padding: "64px 48px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="mono" style={{ fontSize: 11, color: "var(--tangerine)", letterSpacing: "0.12em", textTransform: "uppercase" }}>전시·미술 · EXHIBITION</div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(40px, 4.5vw, 64px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, margin: "16px 0 24px" }}>
              <span className="ko">2026 은평역사<br />한옥박물관<br />기획전</span>
            </h1>
            <p style={{ fontFamily: "var(--serif)", fontSize: 22, lineHeight: 1.4, color: "var(--ink-2)", margin: 0 }}>
              "100년 전 은평의 풍경과 한옥의 변천사를 영상과 유물로 만나보세요."
            </p>
          </div>
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, paddingTop: 32, borderTop: "1px solid var(--ink)" }}>
              {[
                { l: "기간", v: "05.13 — 09.06" },
                { l: "장소", v: "은평한옥박물관 3F" },
                { l: "관람료", v: "무료", hl: true },
                { l: "관람시간", v: "10:00 — 18:00" },
                { l: "휴관일", v: "매주 월요일" },
                { l: "문의", v: "02-351-8765" },
              ].map(s => (
                <div key={s.l}>
                  <div className="mono" style={{ fontSize: 10, color: "var(--mute)", letterSpacing: "0.08em" }}>{s.l.toUpperCase()}</div>
                  <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 4, color: s.hl ? "var(--tangerine)" : "var(--ink)" }}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 32 }}>
              <button className="btn btn-primary" style={{ padding: "14px 28px", fontSize: 15 }}>예약하기 →</button>
              <button className="btn" style={{ padding: "14px 20px" }}>♡ 찜 (412)</button>
              <button className="btn" style={{ padding: "14px 20px" }}>↗ 공유</button>
            </div>
          </div>
        </div>
      </section>

      {/* Article body */}
      <section style={{ padding: "80px 28px", borderBottom: "1px solid var(--ink)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 48, maxWidth: 1280, margin: "0 auto" }}>
          {/* Side meta */}
          <aside style={{ paddingTop: 8 }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--mute)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>전시 정보</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {[
                ["기획", "은평구청 문화과"],
                ["큐레이터", "박미경 학예사"],
                ["전시 작품", "유물 142점"],
                ["관람 소요", "약 60분"],
                ["주차", "박물관 지하 무료"],
                ["접근성", "휠체어·유아차 OK"],
                ["가까운 역", "구파발 1번 출구"],
              ].map(([k, v]) => (
                <li key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed var(--ink)" }}>
                  <span style={{ color: "var(--mute)" }}>{k}</span>
                  <span style={{ color: "var(--ink)", fontWeight: 600 }}>{v}</span>
                </li>
              ))}
            </ul>
          </aside>

          {/* Body */}
          <div>
            <div className="eyebrow"><span className="dash"></span>큐레이터 노트</div>
            <h2 style={{ fontFamily: "var(--display)", fontSize: 40, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.05, margin: "12px 0 24px" }}>
              <em className="serif" style={{ color: "var(--tangerine)" }}>"은평,</em><br />
              <span className="ko">한양으로 가는 길목에서 시작된 마을."</span>
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--ink-2)", margin: "0 0 20px" }}>
              은평구는 조선 시대 한양으로 들어가는 관문이었습니다. 의주로(義州路)의 끝, 무악재를 넘기 전 마지막으로 머물 수 있는 동네였죠. 그 길 위에 세워진 한옥들과 그 안에서 살아온 사람들의 100년 — 이번 기획전은 그 기록입니다.
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--ink-2)", margin: "0 0 20px" }}>
              총 142점의 유물과 4편의 영상으로 구성된 이번 전시는 19세기 후반의 사진과 지도부터, 1960년대 도시 개발 시기 한옥의 변화, 그리고 2010년대 이후 한옥마을 조성기까지 시간 순으로 따라갑니다.
            </p>
            <blockquote style={{ borderLeft: "3px solid var(--tangerine)", margin: "32px 0", padding: "16px 24px", fontFamily: "var(--serif)", fontSize: 22, lineHeight: 1.4, fontStyle: "italic", color: "var(--ink)" }}>
              "전시장 가장 안쪽 방에는, 1925년 은평 한옥 한 채를 1/1 스케일로 재현해 두었습니다. 마루에 잠시 앉아 보세요."
              <footer style={{ fontFamily: "var(--mono)", fontSize: 11, fontStyle: "normal", marginTop: 16, color: "var(--mute)", letterSpacing: "0.08em" }}>— 박미경, 큐레이터</footer>
            </blockquote>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--ink-2)", margin: "0 0 20px" }}>
              주말에는 30분씩 큐레이터 도슨트가 운영되며(11시·14시·16시), 5–8월 사이엔 한옥 체험 워크숍도 별도로 진행됩니다. 자세한 일정은 박물관 홈페이지에서 확인하세요.
            </p>

            {/* Image inline */}
            <div style={{ aspectRatio: "16/9", background: "linear-gradient(135deg, #c4543a, #e8d9b8 60%, #2a4d3a)", margin: "32px 0 12px", position: "relative", border: "1px solid var(--ink)" }}>
              <span style={{ position: "absolute", bottom: 12, left: 16, color: "rgba(255,255,255,0.8)", fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>/photo · 1925년 은평 한옥 재현 전시실 plate</span>
            </div>
            <div className="mono" style={{ fontSize: 11, color: "var(--mute)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 32 }}>↑ FIG. 01 · 전시실 3 · 재현된 1925년 한옥 본채</div>
          </div>

          {/* Right - map / nearby */}
          <aside>
            <div className="mono" style={{ fontSize: 10, color: "var(--mute)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>위치 · MAP</div>
            <div style={{ aspectRatio: "1", background: "var(--bone-2)", border: "1px solid var(--ink)", position: "relative", overflow: "hidden", marginBottom: 16 }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(var(--ink) 1px, transparent 1px), linear-gradient(90deg, var(--ink) 1px, transparent 1px)", backgroundSize: "30px 30px", opacity: 0.1 }}></div>
              <div style={{ position: "absolute", top: "45%", left: "50%", transform: "translate(-50%, -100%)" }}>
                <div style={{ background: "var(--ink)", color: "var(--bone)", padding: "4px 8px", fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>은평한옥박물관</div>
                <div style={{ width: 16, height: 16, background: "var(--tangerine)", borderRadius: "50%", border: "2px solid var(--ink)", margin: "0 auto", boxShadow: "0 3px 0 var(--ink)" }}></div>
              </div>
            </div>
            <div className="mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--mute)" }}>
              서울 은평구 진관2로 32-23<br />
              구파발역 1번 출구 도보 12분<br />
              버스 7211 · 7723
            </div>

            <div className="mono" style={{ fontSize: 10, color: "var(--mute)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "32px 0 12px" }}>주변 · NEARBY (도보 15분 이내)</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[
                ["은평한옥마을", "도보 5분 · 1.2km 산책로"],
                ["진관사", "도보 12분 · 사찰"],
                ["북한산 둘레길", "차로 8분 · 자연"],
              ].map(([n, d]) => (
                <li key={n} style={{ padding: "10px 0", borderBottom: "1px dashed var(--ink)", cursor: "pointer" }}>
                  <div style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em" }}>
                    <span className="ko">{n}</span>
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--mute)", letterSpacing: "0.06em", marginTop: 2 }}>{d}</div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* Reviews */}
      <section style={{ padding: "64px 28px", borderBottom: "1px solid var(--ink)", background: "var(--bone-2)" }}>
        <div className="section-header">
          <div>
            <div className="eyebrow"><span className="dash"></span>방문자 후기 · 28건</div>
            <h2 className="section-title">
              <span className="ko">먼저 다녀온 사람들.</span>
            </h2>
          </div>
          <div style={{ fontFamily: "var(--display)", fontSize: 48, fontWeight: 700, letterSpacing: "-0.04em" }}>
            <span style={{ color: "var(--tangerine)" }}>4.7</span>
            <span style={{ fontSize: 16, color: "var(--mute)", marginLeft: 8 }}>/ 5.0</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, borderTop: "1px solid var(--ink)", borderLeft: "1px solid var(--ink)" }}>
          {[
            { name: "@yuna.kim", date: "5일 전", r: 5, body: "한옥 재현 전시실이 압권. 마루 냄새까지 났어요. 어른 데려가도 좋을 듯." },
            { name: "@walker.s", date: "1주 전", r: 5, body: "도슨트 운영 시간 맞춰 가는 거 강추. 박미경 학예사님 설명이 너무 흥미로움." },
            { name: "@hanok.lover", date: "2주 전", r: 4, body: "조용하고 사람도 적어서 천천히 보기 좋아요. 다만 주차장이 좀 멀어요." },
            { name: "@junseo", date: "2주 전", r: 5, body: "무료라는 게 믿기지 않을 정도의 큐레이션. 사진 찍기도 좋고." },
            { name: "@minji", date: "3주 전", r: 4, body: "1925년 한옥 안방에서 한참 앉아 있었어요. 마음이 차분해지는 공간." },
            { name: "@editor.lee", date: "3주 전", r: 5, body: "한옥 변천사가 단순한 건축 이야기가 아니라 도시사라는 점에서 인상적." },
          ].map((rv, i) => (
            <div key={i} style={{ padding: 24, borderRight: "1px solid var(--ink)", borderBottom: "1px solid var(--ink)", background: "var(--bone)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{rv.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--mute)" }}>{rv.date}</div>
                </div>
                <div style={{ color: "var(--tangerine)", fontSize: 14 }}>{"★".repeat(rv.r)}<span style={{ opacity: 0.2 }}>{"★".repeat(5 - rv.r)}</span></div>
              </div>
              <p style={{ fontFamily: "var(--serif)", fontSize: 16, lineHeight: 1.5, margin: 0 }}>"{rv.body}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related */}
      <section style={{ padding: "64px 28px", borderBottom: "1px solid var(--ink)" }}>
        <div className="eyebrow"><span className="dash"></span>이 행사를 본 사람들이 본 다른 것들</div>
        <h2 className="section-title" style={{ marginBottom: 32 }}>
          <em>다음으로</em> <span className="ko">가볼 곳.</span>
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, borderTop: "1px solid var(--ink)", borderLeft: "1px solid var(--ink)" }}>
          {window.NOLSEOUL_DATA.EVENTS.slice(0, 4).map(ev => <EventCard key={ev.id} ev={ev} />)}
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { DetailPage });
