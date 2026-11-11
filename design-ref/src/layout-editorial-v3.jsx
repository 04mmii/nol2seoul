// Editorial landing (v3) — culture events first; night spots moved into curation
const { useState: useStateEd, useEffect: useEffectEd } = React;

const NIGHT_THUMBS = ["b", "d", "g", "h"];

function HeroEditorial({ onDetail, onNav }) {
  const banners = window.NOLSEOUL_DATA.EVENTS.slice(0, 3);
  const [idx, setIdx] = useStateEd(0);
  const [paused, setPaused] = useStateEd(false);
  useEffectEd(() => {
    if (paused) return;
    const id = setTimeout(() => setIdx(i => (i + 1) % banners.length), 6000);
    return () => clearTimeout(id);
  }, [idx, paused]);
  const cur = banners[idx];
  const go = d => setIdx(i => (i + d + banners.length) % banners.length);
  return (
    <section className="hero-edit">
      <div className="left">
        <div>
          <div className="masthead">
            <span><b>NOLSEOUL</b> № 21</span>
            <span>2026.05.13 TUE</span>
            <span>이번 주 문화행사</span>
          </div>
          <h1>
            THIS WEEK<br />
            <span className="it">in</span> <span className="ko">서울</span><br />
            PLAYS.
          </h1>
          <p className="sub">
            전시, 공연, 축제, 체험까지. 이번 주 서울 곳곳에서 열리는 문화행사를 날짜와 동네, 취향으로 골라보세요.
          </p>
          <div className="cta-row">
            <button className="btn btn-primary" onClick={() => onNav && onNav("events")}>이번 주 행사 보기 →</button>
            <button className="btn" onClick={() => onNav && onNav("map")}>지도에서 탐색</button>
          </div>
        </div>
        <div className="stats">
          <div><div className="k">진행 중 행사</div><div className="v">1,284</div></div>
          <div><div className="k">문화공간</div><div className="v">320</div></div>
          <div><div className="k">이번 주 시작</div><div className="v">86</div></div>
        </div>
      </div>
      <div className="right" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        {banners.map((b, i) => (
          <div key={b.id} className={`hero-slide ${i === idx ? "active" : ""}`}>
            <span className="ph-note light hero-ph">/banner image 0{i + 1} · 원본 교체 예정</span>
          </div>
        ))}
        <div className="hero-cover-cap" onClick={onDetail}>
          <div className="cover-cat">FEATURED · {cur.cat}</div>
          <div className="cover-title">{cur.title}</div>
          <div className="cover-meta">
            <span>{cur.venue}</span>
            <span>{cur.date}</span>
            <span>{cur.price}</span>
          </div>
        </div>
        <div className="hero-controls">
          <div className="bars">
            {banners.map((b, i) => (
              <button key={b.id} className={`bar ${i === idx ? "active" : ""}`} onClick={() => setIdx(i)} aria-label={`배너 ${i + 1}`}></button>
            ))}
          </div>
          <span className="count">0{idx + 1} / 0{banners.length}</span>
          <button className="ctrl" onClick={() => go(-1)} aria-label="이전">←</button>
          <button className="ctrl" onClick={() => go(1)} aria-label="다음">→</button>
        </div>
      </div>
    </section>
  );
}

function CategoryStrip({ onNav }) {
  const cats = [
    { num: "01 — EVENTS", ko: "문화행사", desc: "전시 · 공연 · 축제 · 교육체험", count: "1,284건 진행 중", id: "events" },
    { num: "02 — SPACES", ko: "문화공간", desc: "박물관 · 미술관 · 공연장 · 책방", count: "320곳", id: "map" },
    { num: "03 — MAP", ko: "지도탐색", desc: "내 위치 기준으로 가까운 행사와 공간", count: "지금 내 주변 12곳", id: "map" },
  ];
  return (
    <div className="cat-strip three">
      {cats.map((c, i) => (
        <div key={i} className="cell" onClick={() => onNav && onNav(c.id)}>
          <div className="num">{c.num}</div>
          <div className="label">{c.ko}</div>
          <div className="desc">{c.desc}</div>
          <div className="count">{c.count}</div>
          <div className="arrow">↗</div>
        </div>
      ))}
    </div>
  );
}

function EventsSection({ onDetail, onNav }) {
  const events = window.NOLSEOUL_DATA.EVENTS;
  const [tab, setTab] = useStateEd("today");
  return (
    <section className="events">
      <div className="shell">
        <div className="section-header">
          <div>
            <div className="eyebrow"><span className="dash"></span>01 — EVENTS · 지금 서울</div>
            <h2 className="section-title">지금 서울에서<br />열리는 <em>행사.</em></h2>
          </div>
          <div className="day-tabs">
            {[["today", "오늘"], ["week", "이번주"], ["month", "이번달"], ["free", "무료"]].map(([id, label]) => (
              <button key={id} className={`day-pill ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>
        </div>
        <div className="event-grid">
          {events.map(ev => <EventCard key={ev.id} ev={ev} onDetail={onDetail} />)}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28 }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--mute)", textTransform: "uppercase", letterSpacing: "0.07em" }}>8건 표시 · 1,284건 중</span>
          <button className="btn" onClick={() => onNav && onNav("events")}>전체 문화행사 보기 →</button>
        </div>
      </div>
    </section>
  );
}

function EventCard({ ev, onDetail }) {
  const [liked, setLiked] = useStateEd(ev.id === 3);
  const light = NIGHT_THUMBS.includes(ev.thumb);
  return (
    <div className="event-card" onClick={onDetail}>
      <div className="thumb">
        <div className={`thumb-bg ${ev.thumb}`}></div>
        <button className={`heart ${liked ? "active" : ""}`} onClick={e => { e.stopPropagation(); setLiked(!liked); }}>
          {liked ? "♥" : "♡"}
        </button>
        <span className={`placeholder-cap ${light ? "light" : ""}`}>/poster · {ev.placeholder}</span>
      </div>
      <div className="body">
        <div className="cat">{ev.cat}</div>
        <h4 className="title">{ev.title}</h4>
        <div className="meta-line">{ev.venue}</div>
        <div className="footer-meta">
          <span>{ev.date}</span>
          <span className={`price ${ev.price === "무료" ? "free" : ""}`}>{ev.price}</span>
        </div>
      </div>
    </div>
  );
}

function MapPromo({ onNav }) {
  const pins = [
    { t: "42%", l: "48%", big: true, label: "남산 N TOWER" },
    { t: "30%", l: "32%", label: "서울도서관" },
    { t: "58%", l: "26%", label: "한강 반포" },
    { t: "22%", l: "62%", label: "DDP" },
    { t: "70%", l: "58%", label: "한성백제박물관" },
    { t: "44%", l: "78%", label: "올림픽공원" },
    { t: "38%", l: "18%", label: "홍대" },
    { t: "52%", l: "68%", label: "성수동" },
  ];
  const types = [["박물관", 84], ["미술관", 71], ["공연장", 63], ["책방", 58], ["영화관", 44]];
  return (
    <section className="map-promo">
      <div className="left">
        <div>
          <div className="eyebrow"><span className="dash"></span>02 — SPACES & MAP</div>
          <h2 className="bigtype">내 주변<br />문화공간을<br />찾아보세요.</h2>
          <p className="desc">현재 위치를 기준으로 가장 가까운 공간과, 그 공간에서 지금 열리는 행사를 지도 위에서 함께 확인할 수 있습니다.</p>
          <ul className="space-types">
            {types.map(([k, n]) => <li key={k}><span>{k}</span><span className="mono">{n}</span></li>)}
          </ul>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 40 }}>
          <button className="btn" onClick={() => onNav && onNav("map")}>지도에서 보기 →</button>
          <span className="mono" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink)" }}>지금 내 주변 12곳</span>
        </div>
      </div>
      <div className="right">
        <div className="map-grid"></div>
        {pins.map((p, i) => (
          <div key={i} className={`map-pin ${p.big ? "big" : ""}`} style={{ top: p.t, left: p.l }}>
            <span className="label">{p.label}</span>
          </div>
        ))}
        <span className="mono" style={{ position: "absolute", bottom: 24, right: 28, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--mute)" }}>SEOUL · 320 SPACES</span>
      </div>
    </section>
  );
}

function CurationIntro() {
  return (
    <div className="curation-intro">
      <div className="shell">
        <div className="eyebrow"><span className="dash"></span>03 — CURATION · 에디터의 선택</div>
        <h2 className="section-title">행사 다음에 갈 곳,<br />에디터가 고른 <em>서울.</em></h2>
      </div>
    </div>
  );
}

function TonightSection({ onNav }) {
  const spots = window.NOLSEOUL_DATA.TONIGHT_SPOTS;
  const [feature, ...rest] = spots;
  return (
    <section className="section tonight compact">
      <div className="stars"></div>
      <div className="shell">
        <div className="section-header">
          <div>
            <div className="eyebrow"><span className="dash"></span>AFTER DARK · 야경명소</div>
            <h3 className="sub-title">공연이 끝난 뒤, <em>가장 빛나는</em> 서울.</h3>
          </div>
          <button className="btn btn-ghost-light" onClick={() => onNav && onNav("night")}>야경명소 전체 보기 →</button>
        </div>
        <div className="tonight-grid">
          <NightCard spot={feature} idx={1} feature />
          {rest.slice(0, 3).map((s, i) => <NightCard key={s.id} spot={s} idx={i + 2} />)}
        </div>
      </div>
    </section>
  );
}

function NightCard({ spot, idx, feature }) {
  return (
    <div className={`night-card ${feature ? "feature" : ""}`}>
      <div className="index">
        <span>SPOT № 0{idx}</span>
        <span>{feature ? "EDITOR'S PICK" : spot.crowd}</span>
      </div>
      <div className="img-frame">
        <span className="place-label">/photo · {spot.en}</span>
      </div>
      <div className="info">
        <h3 className="place-name">{spot.name}</h3>
        <div className="en">{spot.en}</div>
        <div className="meta">
          <span>{spot.district}</span>
          <span className="hl">{spot.time}</span>
        </div>
      </div>
    </div>
  );
}

function CuratorsSection({ onNav }) {
  return (
    <section className="curators">
      <div className="shell">
        <div className="section-header">
          <div>
            <div className="eyebrow"><span className="dash"></span>STORIES · 큐레이터의 노트</div>
            <h3 className="sub-title">그들이 고른 <em>서울.</em></h3>
          </div>
          <button className="btn" onClick={() => onNav && onNav("stories")}>전체 스토리 →</button>
        </div>
        <div className="curator-grid">
          {window.NOLSEOUL_DATA.CURATORS.map((c, i) => (
            <div key={i} className="curator-card">
              <div className="avatar-big"></div>
              <div className="name">{c.name}</div>
              <div className="role">{c.role}</div>
              <p className="quote">“{c.quote}”</p>
              <div className="picks">{c.picks}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EditorialLayout({ onDetail, onNav }) {
  return (
    <>
      <HeroEditorial onDetail={onDetail} onNav={onNav} />
      <CategoryStrip onNav={onNav} />
      <EventsSection onDetail={onDetail} onNav={onNav} />
      <MapPromo onNav={onNav} />
      <CurationIntro />
      <TonightSection onNav={onNav} />
      <CuratorsSection onNav={onNav} />
    </>
  );
}

Object.assign(window, { EditorialLayout, EventCard });
