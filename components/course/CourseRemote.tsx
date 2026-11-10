import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEvents, useCulturalSpaces, useNightViewSpots } from '../../hooks';
import { buildNight } from '../night/selectors';
import { findEventById } from '../../utils/eventId';
import { formatHm } from '../../utils/sun';
import { ruleCourse, swapStop, type Candidate, type CourseRequest, type CourseResult } from '../../api/_lib/course';
import { buildCandidates, mapLink, stopLink } from './candidates';
import './course-remote.css';

/**
 * AI 코스추천 리모컨 (design-ref/src/course-remote.jsx, approved 2026-11-11), v3 tokens.
 * Square button + "코스추천" bubble → input slides out to the left → result panel rises.
 * Course = 문화행사 → 문화공간 → 야경명소, chosen only from our data (server drops unknown ids).
 * The model runs on the server (api/course.ts); with no key / an error, a rule-based course is shown
 * and labelled. "다른 곳으로" swaps one stop locally (no model call); "다시 짜기" asks again without the
 * current stops. Page context: event detail → starts with that event; night page → ends with a night spot.
 */
const CHIPS = ['오늘 저녁 데이트', '무료로만', '친구랑 가볍게', '전시 위주로'];
const KIND_LABEL = { event: '문화행사', space: '문화공간', night: '야경 마무리' } as const;
const MIN_GAP_MS = 3_000;

type Stage = 'idle' | 'input' | 'loading' | 'result';

const CourseRemote: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { events } = useEvents();
  const { spaces } = useCulturalSpaces();
  const { spots } = useNightViewSpots();
  const [stage, setStage] = useState<Stage>('idle');
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState<CourseResult | null>(null);
  const [request, setRequest] = useState<CourseRequest | null>(null);
  const [shown, setShown] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const lastAt = useRef(0);
  const cache = useRef(new Map<string, CourseResult>());

  // Page context.
  const ctx = useMemo(() => {
    const m = /^\/event\/([^/]+)$/.exec(location.pathname);
    const ev = m ? findEventById(events, decodeURIComponent(m[1])) : undefined;
    if (ev) return { startId: m![1], endId: undefined as string | undefined, prefill: `${ev.TITLE.slice(0, 30)} 보고 나서 ` };
    if (location.pathname === '/night') {
      const spot = new URLSearchParams(location.search).get('spot');
      return { startId: undefined, endId: spot && /^n\d+$/.test(spot) ? spot : undefined, prefill: '야경으로 마무리하는 ' };
    }
    return { startId: undefined, endId: undefined, prefill: '' };
  }, [location.pathname, location.search, events]);

  const ready = events.length > 0 && spaces.length > 0 && spots.length > 0;
  const byId = useMemo(() => new Map((request?.candidates ?? []).map((c) => [c.id, c])), [request]);

  useEffect(() => { if (stage === 'input') { const t = setTimeout(() => inputRef.current?.focus(), 220); return () => clearTimeout(t); } }, [stage]);
  useEffect(() => {
    if (stage !== 'result' || !course || shown >= course.stops.length) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => setShown((s) => s + 1), reduce ? 0 : 380);
    return () => clearTimeout(t);
  }, [stage, shown, course]);
  useEffect(() => {
    if (stage === 'idle') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setStage('idle'); fabRef.current?.focus(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage]);
  // A new page context starts a new course.
  useEffect(() => { setCourse(null); setRequest(null); setQuery(''); setStage('idle'); }, [ctx.startId, ctx.endId, ctx.prefill]);

  const open = () => {
    if (course) { setStage('result'); setShown(course.stops.length); return; }
    setQuery((q) => q || ctx.prefill);
    setStage('input');
  };
  const close = () => setStage('idle');

  const run = async (text: string, exclude: string[] = []) => {
    if (!ready) { setError('데이터를 불러오는 중이에요. 잠시 후 다시 시도해 주세요.'); return; }
    const now = new Date();
    const night = buildNight(spots, now);
    const candidates: Candidate[] = buildCandidates({ query: text, events, spaces, nightViews: night.views, sunset: night.sunset, now, startId: ctx.startId, endId: ctx.endId });
    const req: CourseRequest = { query: text, candidates, startId: ctx.startId, endId: ctx.endId, exclude, sunset: formatHm(night.sunset) };
    setRequest(req); setError(''); setStage('loading'); setShown(0);
    const key = JSON.stringify([text, ctx.startId, ctx.endId, exclude]);
    const cached = cache.current.get(key);
    if (cached) { setCourse(cached); setStage('result'); return; }
    const wait = MIN_GAP_MS - (Date.now() - lastAt.current);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait)); // client-side spacing (the server also limits)
    lastAt.current = Date.now();
    let result: CourseResult;
    try {
      const res = await fetch('/api/course', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req) });
      const body = await res.json().catch(() => null);
      if (res.status === 429) result = ruleCourse(req, '요청이 잦아 이번엔 기본 규칙으로 짠 코스예요. 잠시 후 다시 시도해 주세요.');
      else if (!res.ok || !body || !Array.isArray(body.stops)) result = ruleCourse(req, '서버에 연결하지 못해 기본 규칙으로 짠 코스예요.');
      else result = body as CourseResult;
    } catch {
      result = ruleCourse(req, '서버에 연결하지 못해 기본 규칙으로 짠 코스예요.');
    }
    // Defence in depth: keep only stops whose ids are in this request's candidates.
    result = { ...result, stops: result.stops.filter((s) => req.candidates.some((c) => c.id === s.id && c.kind === s.kind)) };
    if (result.stops.length < 3) result = ruleCourse(req, result.note ?? '추천을 확인하지 못해 기본 규칙으로 짠 코스예요.');
    cache.current.set(key, result);
    setCourse(result); setStage('result');
  };

  const submit = (q?: string) => {
    const text = (q ?? query).trim();
    setQuery(text);
    void run(text);
  };
  const retry = () => {
    if (!course || !request) return;
    const keep = new Set([ctx.startId, ctx.endId]);
    void run(request.query, course.stops.map((s) => s.id).filter((id) => !keep.has(id)));
  };
  const swap = (i: number) => {
    if (!course || !request) return;
    const next = swapStop(request, course, i);
    if (next) setCourse(next);
  };

  const isOpen = stage !== 'idle';
  const panelUp = stage === 'loading' || stage === 'result';
  const first = course?.stops[0] ? byId.get(course.stops[0].id) : undefined;

  return (
    <div className={`v3-course ${isOpen ? 'is-open' : ''} ${location.pathname === '/map' ? 'on-map' : ''}`}>
      <section className={`v3-course__panel ${panelUp ? 'is-up' : ''}`} role="dialog" aria-label="AI 코스추천 결과" aria-hidden={!panelUp} inert={!panelUp}>
        <div className="v3-course__ph">
          <div>
            <p className="v3-course__eyebrow"><span aria-hidden="true" />AI COURSE · 놀서울 큐레이션</p>
            <p className="v3-course__title" aria-live="polite">{stage === 'loading' ? '코스를 짜는 중…' : course?.title}</p>
            {request?.query && <p className="v3-course__q">“{request.query}”</p>}
          </div>
          <button type="button" className="v3-course__x v3-focus" onClick={close} aria-label="코스추천 닫기">✕</button>
        </div>
        <ol className="v3-course__stops">
          {[0, 1, 2].map((i) => {
            const st = course && stage === 'result' && i < shown ? course.stops[i] : null;
            const c = st ? byId.get(st.id) : undefined;
            return (
              <li key={i} className={`v3-course__stop ${c ? 'is-filled' : 'is-skeleton'}`}>
                <div className="v3-course__rail" aria-hidden="true"><span className="v3-course__num">0{i + 1}</span>{i < 2 && <span className="v3-course__line" />}</div>
                {c && st ? (
                  <div className="v3-course__body">
                    <p className="v3-course__meta"><span>{KIND_LABEL[c.kind]}</span>{c.kind === 'night' && c.litNow && <span className="v3-course__lit">● 점등 중</span>}</p>
                    <Link to={stopLink(c)} className="v3-course__name v3-focus" onClick={close}>{c.name}</Link>
                    <p className="v3-course__sub">{[c.area, c.sub].filter(Boolean).join(' · ')}</p>
                    {c.meta && <p className="v3-course__sub">{c.meta}</p>}
                    <p className="v3-course__why">{st.reason}</p>
                    <button type="button" className="v3-course__swap v3-focus" onClick={() => swap(i)}>↻ 다른 곳으로</button>
                  </div>
                ) : (
                  <div className="v3-course__body" aria-hidden="true"><div className="v3-course__sk w40" /><div className="v3-course__sk w80" /><div className="v3-course__sk w60" /></div>
                )}
              </li>
            );
          })}
        </ol>
        {stage === 'result' && course && (
          <div className="v3-course__pf">
            <p className={`v3-course__src is-${course.source}`}>{course.source === 'ai' ? 'AI 추천 · 목록에 있는 곳만' : '기본 규칙 코스'}{course.note ? ` — ${course.note}` : ''}</p>
            <div className="v3-course__actions">
              <button type="button" className="v3-btn v3-course__btn" onClick={retry}>다시 짜기</button>
              <button type="button" className="v3-btn v3-btn--primary v3-course__btn" disabled={!first} onClick={() => { if (first) { navigate(mapLink(first)); close(); } }}>지도에서 보기 →</button>
            </div>
          </div>
        )}
      </section>

      <div className={`v3-course__inputwrap ${stage === 'input' ? 'is-out' : ''}`} inert={stage !== 'input'}>
        <form className="v3-course__input" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="예) 토요일 저녁, 친구랑 성수 근처, 3시간" aria-label="코스 조건" maxLength={200} />
          <button type="submit" className="v3-course__send" aria-label="코스 추천 받기">→</button>
        </form>
        <div className="v3-course__chips">
          <p className="v3-course__hint">{error || '상황을 적으면 행사 → 문화공간 → 야경으로 코스를 짜 드려요'}</p>
          {CHIPS.map((c) => <button key={c} type="button" className="v3-course__chip v3-focus" onClick={() => submit(`${ctx.prefill}${c}`.trim())}>{c}</button>)}
        </div>
      </div>

      <p className={`v3-course__bubble ${isOpen ? 'is-hidden' : ''}`} aria-hidden="true">코스추천</p>
      <button ref={fabRef} type="button" className="v3-course__fab v3-focus" aria-expanded={isOpen} aria-label={isOpen ? '코스추천 닫기' : 'AI 코스추천 열기'} onClick={isOpen ? close : open}>
        {isOpen ? <span aria-hidden="true">✕</span> : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="6" cy="18" r="2.2" /><circle cx="18" cy="6" r="2.2" /><path d="M8.2 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.8" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default CourseRemote;
