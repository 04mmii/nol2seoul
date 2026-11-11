// AI 코스추천 리모컨 — square FAB + bubble → input slides left → panel rises up
// Picks ONLY from the page's own data (events · spots · rest stops); unknown ids are dropped.
const { useState: useStateCr, useEffect: useEffectCr, useRef: useRefCr } = React;

const CR_REST = [
  { id: "r1", name: "익선동 골목", area: "종로구", kind: "식사·카페", note: "한옥 골목 카페와 노포" },
  { id: "r2", name: "광장시장", area: "종로구", kind: "식사", note: "빈대떡·육회, 늦게까지 북적" },
  { id: "r3", name: "성수동 카페거리", area: "성동구", kind: "카페", note: "공장 개조 카페, 응봉산과 가까움" },
  { id: "r4", name: "망원시장", area: "마포구", kind: "식사", note: "간단한 시장 먹거리, 한강 도보권" },
  { id: "r5", name: "서촌 골목", area: "종로구", kind: "식사·카페", note: "조용한 골목 식당과 책방" },
  { id: "r6", name: "여의도 더현대 푸드홀", area: "영등포구", kind: "식사", note: "한강공원 바로 옆" },
];

function crCatalog() {
  const D = window.NOLSEOUL_DATA;
  const ev = D.EVENTS.map(e => ({ id: "e" + e.id, type: "EVENT", name: e.title, sub: `${e.cat} · ${e.venue}`, meta: `${e.date} · ${e.price}` }));
  const sp = D.TONIGHT_SPOTS.map(s => ({ id: "s" + s.id, type: "NIGHT", name: s.name, sub: `${s.district} · ${s.en}`, meta: s.time }));
  const rs = CR_REST.map(r => ({ id: r.id, type: "REST", name: r.name, sub: `${r.area} · ${r.kind}`, meta: r.note }));
  return { all: [...ev, ...rs, ...sp], byId: Object.fromEntries([...ev, ...rs, ...sp].map(x => [x.id, x])) };
}

const CR_TYPE_LABEL = { EVENT: "문화행사", REST: "식사·쉬어가기", NIGHT: "야경 마무리" };

function crContextPrefill(activeNav) {
  if (activeNav === "detail") return "2026 은평역사한옥박물관 기획전 보고 나서 ";
  if (activeNav === "night") return "야경으로 마무리하는 ";
  if (activeNav === "map") return "지금 내 주변에서 ";
  return "";
}

function crFallback(query, cat) {
  // deterministic course when AI is unavailable — still only real catalog items
  const q = query;
  const pick = (type, pref) => cat.all.filter(x => x.type === type).find(x => pref.some(p => (x.name + x.sub).includes(p))) || cat.all.find(x => x.type === type);
  const free = /무료/.test(q);
  const ev = q.includes("은평") ? cat.byId.e1 : /재즈|공연|음악/.test(q) ? cat.byId.e8 : free ? cat.byId.e5 : pick("EVENT", ["한강", "전시"]);
  const rest = /성수|응봉/.test(q) ? cat.byId.r3 : /마포|망원|재즈/.test(q) ? cat.byId.r4 : /여의도|한강/.test(q) || ev.id === "e5" ? cat.byId.r6 : cat.byId.r1;
  const night = /성수|응봉/.test(q) ? cat.byId.s5 : /마포|노을/.test(q) || ev.id === "e8" ? cat.byId.s4 : /한강|반포|여의도/.test(q) || ev.id === "e5" ? cat.byId.s2 : cat.byId.s3;
  return {
    title: "오늘의 3스톱 코스",
    stops: [
      { id: ev.id, time: "18:00", why: "조건에 가장 가까운 진행 중 행사로 시작해요." },
      { id: rest.id, time: "19:40", why: "행사 장소에서 이동하기 쉬운 곳에서 쉬어가요." },
      { id: night.id, time: "21:00", why: "일몰 이후 가장 가까운 야경 명소로 마무리해요." },
    ],
    source: "fallback",
  };
}

async function crAskClaude(query, cat) {
  const list = cat.all.map(x => `${x.id} | ${x.type} | ${x.name} | ${x.sub} | ${x.meta}`).join("\n");
  const prompt = `너는 서울 문화 큐레이션 서비스 '놀서울'의 코스 추천 기능이다.
사용자 상황: "${query}"

아래 목록에 있는 항목만 사용해서 3개 정류장 코스를 짠다. 목록에 없는 장소는 절대 만들지 않는다.
순서: EVENT 1개 → REST 1개 → NIGHT 1개.

목록 (id | type | 이름 | 정보 | 일정/메모):
${list}

JSON만 출력:
{"title":"코스 제목(12자 이내)","stops":[{"id":"목록의 id","time":"HH:MM","why":"이 정류장을 고른 이유 한 문장(40자 이내, 사용자 상황과 연결)"}]}`;
  let text = null;
  if (window.claude && typeof window.claude.complete === "function") {
    const r = await window.claude.complete(prompt);
    text = typeof r === "string" ? r : (r && r.text) || "";
  } else if (window.claude && typeof window.claude.use === "function") {
    const sample = await window.claude.use("sample");
    if (!sample) return null;
    const r = await sample(prompt, { modelTier: "quick" });
    text = r.text;
  } else return null;
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  const data = JSON.parse(m[0]);
  const stops = (data.stops || []).filter(s => cat.byId[s.id]);   // drop anything not in the catalog
  if (stops.length < 2) return null;
  return { title: data.title || "추천 코스", stops, source: "ai" };
}

const CR_CHIPS = ["오늘 밤 데이트", "친구랑 성수 3시간", "무료로만", "비 와도 OK"];

function CourseRemote({ activeNav, onNav }) {
  const [stage, setStage] = useStateCr("idle"); // idle | input | loading | result
  const [query, setQuery] = useStateCr("");
  const [course, setCourse] = useStateCr(null);
  const [shown, setShown] = useStateCr(0);
  const [err, setErr] = useStateCr("");
  const inputRef = useRefCr(null);
  const cat = React.useMemo(crCatalog, []);

  useEffectCr(() => { if (stage === "input") setTimeout(() => inputRef.current && inputRef.current.focus(), 260); }, [stage]);
  useEffectCr(() => {
    if (stage !== "result" || !course) return;
    if (shown >= course.stops.length) return;
    const id = setTimeout(() => setShown(s => s + 1), 420);
    return () => clearTimeout(id);
  }, [stage, shown, course]);

  const open = () => {
    if (course) { setStage("result"); setShown(course.stops.length); return; }
    setQuery(crContextPrefill(activeNav)); setStage("input");
  };
  const close = () => setStage("idle");

  const submit = async (q) => {
    const text = (q ?? query).trim();
    if (!text) return;
    setQuery(text); setErr(""); setStage("loading"); setShown(0);
    let c = null;
    try { c = await crAskClaude(text, cat); } catch (e) { c = null; }
    if (!c) { c = crFallback(text, cat); setErr("AI 응답을 받지 못해 기본 규칙으로 짠 코스예요."); }
    setCourse(c); setStage("result");
  };

  const swap = (i) => {
    const cur = course.stops[i]; const type = cat.byId[cur.id].type;
    const used = new Set(course.stops.map(s => s.id));
    const pool = cat.all.filter(x => x.type === type && !used.has(x.id));
    if (!pool.length) return;
    const next = pool[Math.floor(Math.random() * pool.length)];
    const stops = course.stops.slice(); stops[i] = { ...cur, id: next.id, why: "직접 바꾼 정류장이에요." };
    setCourse({ ...course, stops });
  };

  const isOpen = stage !== "idle";
  const panelUp = stage === "loading" || stage === "result";

  return (
    <div className={`cr-root ${isOpen ? "open" : ""}`} data-noncommentable="">
      <style>{CR_CSS}</style>

      {/* Panel rises up */}
      <section className={`cr-panel ${panelUp ? "up" : ""}`} aria-hidden={!panelUp}>
        <header className="cr-ph">
          <div>
            <div className="cr-eyebrow"><span className="cr-dash"></span>AI COURSE · 놀서울 큐레이션</div>
            <div className="cr-title">{stage === "loading" ? "코스를 짜는 중…" : (course && course.title)}</div>
            <div className="cr-q">“{query}”</div>
          </div>
          <button className="cr-x" onClick={close} aria-label="닫기">✕</button>
        </header>

        <ol className="cr-stops">
          {[0, 1, 2].map(i => {
            const st = course && stage === "result" && i < shown ? course.stops[i] : null;
            const item = st && cat.byId[st.id];
            return (
              <li key={i} className={`cr-stop ${item ? "filled" : "skeleton"}`}>
                <div className="cr-rail"><span className="cr-num">0{i + 1}</span>{i < 2 && <span className="cr-line"></span>}</div>
                {item ? (
                  <div className="cr-body">
                    <div className="cr-meta"><span>{st.time}</span><span>{CR_TYPE_LABEL[item.type]}</span></div>
                    <div className="cr-name">{item.name}</div>
                    <div className="cr-sub">{item.sub}</div>
                    <div className="cr-why">{st.why}</div>
                    <button className="cr-swap" onClick={() => swap(i)}>↻ 다른 곳으로</button>
                  </div>
                ) : (
                  <div className="cr-body"><div className="cr-sk w40"></div><div className="cr-sk w80"></div><div className="cr-sk w60"></div></div>
                )}
              </li>
            );
          })}
        </ol>

        {stage === "result" && (
          <footer className="cr-pf">
            {err && <div className="cr-note">{err}</div>}
            <div className="cr-actions">
              <button className="cr-btn ghost" onClick={() => { setCourse(null); setStage("input"); }}>다시 짜기</button>
              <button className="cr-btn solid" onClick={() => { onNav && onNav("map"); close(); }}>지도에서 동선 보기 →</button>
            </div>
          </footer>
        )}
      </section>

      {/* Input slides out to the left */}
      <div className={`cr-inputwrap ${stage === "input" ? "out" : ""}`}>
        <form className="cr-input" onSubmit={e => { e.preventDefault(); submit(); }}>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                 placeholder="예) 토요일 저녁, 친구랑 성수 근처, 3시간" />
          <button type="submit" className="cr-send" aria-label="추천 받기">→</button>
        </form>
        <div className="cr-chips">
          <span className="cr-hint">상황을 설명해주면 코스를 추천해드려요</span>
          {CR_CHIPS.map(c => <button key={c} className="cr-chip" onClick={() => submit((crContextPrefill(activeNav) + c).trim())}>{c}</button>)}
        </div>
      </div>

      {/* Bubble + square button */}
      <div className={`cr-bubble ${isOpen ? "hide" : ""}`}>코스추천</div>
      <button className={`cr-fab ${isOpen ? "active" : ""}`} onClick={isOpen ? close : open} aria-label="AI 코스추천">
        {isOpen ? <span className="cr-fab-x">✕</span> : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="6" cy="18" r="2.2" /><circle cx="18" cy="6" r="2.2" />
            <path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8" />
          </svg>
        )}
      </button>
    </div>
  );
}

const CR_CSS = `
.cr-root{position:fixed;right:28px;bottom:28px;z-index:60;font-family:var(--sans)}
.cr-fab{position:relative;width:56px;height:56px;border-radius:3px;border:1px solid var(--ink);background:var(--tangerine);color:#fff;display:grid;place-items:center;cursor:pointer;box-shadow:0 3px 0 var(--ink);transition:transform .15s,box-shadow .15s,background .15s}
.cr-fab:hover{transform:translate(0,-2px);box-shadow:0 5px 0 var(--ink)}
.cr-fab.active{background:var(--ink);color:var(--bone);box-shadow:none;transform:none}
.cr-fab-x{font-size:16px}
.cr-bubble{position:absolute;right:0;bottom:70px;background:var(--ink);color:var(--bone);font-family:var(--mono);font-size:11px;letter-spacing:.08em;padding:7px 11px;border-radius:2px;white-space:nowrap;transition:opacity .2s,transform .2s;pointer-events:none}
.cr-bubble::after{content:"";position:absolute;right:20px;bottom:-5px;width:10px;height:10px;background:var(--ink);transform:rotate(45deg)}
.cr-bubble.hide{opacity:0;transform:translateY(6px)}
.cr-inputwrap{position:absolute;right:66px;bottom:0;width:420px;opacity:0;transform:translateX(24px);pointer-events:none;transition:opacity .25s ease,transform .3s cubic-bezier(.2,.8,.2,1)}
.cr-inputwrap.out{opacity:1;transform:none;pointer-events:auto}
.cr-input{display:flex;height:56px;background:var(--bone);border:1px solid var(--ink);border-radius:3px;box-shadow:0 3px 0 var(--ink)}
.cr-input input{flex:1;border:none;background:transparent;padding:0 16px;font-family:var(--sans);font-size:15px;color:var(--ink);outline:none;min-width:0}
.cr-input input::placeholder{color:var(--mute)}
.cr-send{width:56px;border:none;border-left:1px solid var(--ink);background:var(--ink);color:var(--bone);font-size:18px;cursor:pointer}
.cr-send:hover{background:var(--tangerine)}
.cr-chips{position:absolute;bottom:68px;right:0;left:0;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px}
.cr-hint{width:100%;text-align:right;font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-2);margin-bottom:2px}
.cr-chip{padding:7px 11px;border:1px solid var(--ink);background:var(--bone);border-radius:3px;font-family:var(--mono);font-size:11px;letter-spacing:.04em;color:var(--ink);cursor:pointer}
.cr-chip:hover{background:var(--ink);color:var(--bone)}
.cr-panel{position:absolute;right:0;bottom:70px;width:420px;max-height:min(640px,calc(100vh - 140px));overflow:auto;background:var(--bone);border:1px solid var(--ink);border-radius:3px;box-shadow:0 4px 0 var(--ink);opacity:0;transform:translateY(24px);pointer-events:none;transition:opacity .25s ease,transform .35s cubic-bezier(.2,.8,.2,1)}
.cr-panel.up{opacity:1;transform:none;pointer-events:auto}
.cr-ph{display:flex;justify-content:space-between;gap:12px;padding:20px 20px 16px;border-bottom:1px solid var(--line)}
.cr-eyebrow{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mute);display:flex;align-items:center;gap:8px}
.cr-dash{width:16px;height:1px;background:currentColor}
.cr-title{font-weight:800;font-size:22px;letter-spacing:-.035em;margin-top:8px;line-height:1.2}
.cr-q{font-family:var(--mono);font-size:11px;color:var(--ink-2);margin-top:6px}
.cr-x{width:28px;height:28px;border:1px solid var(--line);background:transparent;border-radius:3px;cursor:pointer;color:var(--ink-2);flex-shrink:0}
.cr-stops{list-style:none;margin:0;padding:8px 20px 4px}
.cr-stop{display:grid;grid-template-columns:28px 1fr;gap:12px;padding:12px 0}
.cr-rail{display:flex;flex-direction:column;align-items:center}
.cr-num{width:28px;height:28px;display:grid;place-items:center;font-family:var(--mono);font-size:11px;border:1px solid var(--ink);border-radius:2px;background:var(--bone)}
.cr-stop.filled .cr-num{background:var(--ink);color:var(--bone)}
.cr-line{flex:1;width:1px;background:var(--ink);opacity:.25;margin-top:6px;min-height:20px}
.cr-body{min-width:0}
.cr-stop.filled .cr-body{animation:crIn .35s cubic-bezier(.2,.8,.2,1)}
@keyframes crIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.cr-meta{display:flex;gap:10px;font-family:var(--mono);font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--tangerine-deep)}
.cr-name{font-weight:800;font-size:17px;letter-spacing:-.03em;margin-top:5px}
.cr-sub{font-family:var(--mono);font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-2);margin-top:4px}
.cr-why{font-size:13px;color:var(--ink);margin-top:8px;padding:8px 10px;background:var(--bone-2);border-left:2px solid var(--tangerine);line-height:1.5}
.cr-swap{margin-top:8px;border:none;background:none;padding:0;font-family:var(--mono);font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--mute);cursor:pointer}
.cr-swap:hover{color:var(--ink)}
.cr-sk{height:10px;background:var(--bone-2);border-radius:2px;margin:6px 0;animation:crPulse 1.2s ease-in-out infinite}
.cr-sk.w40{width:40%}.cr-sk.w80{width:80%;height:16px}.cr-sk.w60{width:60%}
@keyframes crPulse{50%{opacity:.45}}
.cr-pf{padding:12px 20px 20px;border-top:1px solid var(--line)}
.cr-note{font-family:var(--mono);font-size:10px;color:var(--mute);margin-bottom:10px;letter-spacing:.04em}
.cr-actions{display:flex;gap:8px}
.cr-btn{flex:1;padding:11px 14px;border-radius:3px;font-weight:700;font-size:13px;cursor:pointer;border:1px solid var(--ink);font-family:var(--sans)}
.cr-btn.ghost{background:transparent;color:var(--ink)}
.cr-btn.solid{background:var(--ink);color:var(--bone)}
.cr-btn.solid:hover{background:var(--tangerine);border-color:var(--tangerine)}
@media (max-width:640px){.cr-root{right:16px;bottom:16px}.cr-inputwrap,.cr-panel{width:calc(100vw - 32px)}.cr-inputwrap{right:0;bottom:68px;transform:translateY(16px)}.cr-inputwrap .cr-chips{bottom:68px}.cr-panel{bottom:70px}}
`;

Object.assign(window, { CourseRemote });
