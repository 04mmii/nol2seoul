import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFavorites, useNightViewSpots } from '../hooks';
import NightLights from '../components/night/NightLights';
import NightArt from '../components/night/NightArt';
import NightSpotCard, { SpotActions, StateBadge } from '../components/night/NightSpotCard';
import { COLLECTIONS, buildNight, matchesNightFilter, pickFeature, type CollectionId, type NightFilter, type NightSpotView } from '../components/night/selectors';
import { formatHm } from '../utils/sun';
import '../components/night/night-v3.css';

/**
 * v3 야경명소 page (design-ref/src/page-night.jsx), approved 2026-11-10. Concept: "밤이 오면 켜진다".
 * Time-linked: today's Seoul sunset (NOAA calculation, utils/sun.ts) switches the page between
 * "곧 켜져요" (before sunset), "지금 켜져 있어요" (sunset → 23:00) and "대부분 꺼졌어요" (after 23:00, only places still open glow).
 * Status badges from OPERATING_TIME (utils/night.ts): "● 점등 중" for sunset-lit spots, "운영 중 / 운영 종료"
 * for 24h / time ranges; seasonal or unclear times show the raw text only.
 * Not rendered (no data): moon phase, rating, editor's quote, elevation, crowd level, tags, photos.
 */
const ALL = '전체';

const NightPage: React.FC = () => {
  const { spots, loading, isError } = useNightViewSpots();
  const { toggleFavorite, isFavorite } = useFavorites();

  // Re-evaluate every minute so the page switches at sunset / 23:00 while open.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const night = useMemo(() => buildNight(spots, now), [spots, now]);
  const feature = useMemo(() => (night.views.length ? pickFeature(night.views) : null), [night]);
  const subjects = useMemo(() => [ALL, ...new Set(spots.map((s) => s.SUBJECT_CD).filter(Boolean))], [spots]);

  const [subject, setSubject] = useState(ALL);
  const [collection, setCollection] = useState<CollectionId | null>(null);
  const [nowFilter, setNowFilter] = useState<NightFilter>(null);

  // Deep link from the map ("야경명소에서 보기"): /night?spot=<id> ("n<NUM>") scrolls to that card and highlights it.
  const [params] = useSearchParams();
  const target = params.get('spot');
  useEffect(() => {
    if (loading || target === null) return;
    const el = document.getElementById(`night-spot-${target}`);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    el.focus({ preventScroll: true });
  }, [loading, target]);

  const shown = night.views.filter((v) =>
    (subject === ALL || v.spot.SUBJECT_CD === subject)
    && (!collection || COLLECTIONS.find((c) => c.id === collection)!.test(v))
    && matchesNightFilter(v.state.badge, nowFilter),
  );

  const toSunset = night.sunset - night.minutes;
  const phaseLine =
    night.phase === 'before'
      ? `곧 켜져요 · 일몰까지 ${Math.floor(toSunset / 60) ? `${Math.floor(toSunset / 60)}시간 ` : ''}${toSunset % 60}분`
      : night.phase === 'lit'
        ? '지금 켜져 있어요'
        : `대부분 꺼졌어요 · 갈 수 있는 곳 ${night.open}곳`;

  return (
    <div className={`v3-night is-${night.phase}`}>
      <div className="v3-night__stars" aria-hidden="true" />

      {/* Hero: every spot as a light at its real position */}
      <section className="v3-night__hero" aria-labelledby="night-title">
        <NightLights views={night.views} variant="hero" />
        <div className="v3-shell v3-night__hero-inner">
          <div className="v3-eyebrow"><span className="v3-eyebrow__dash" />03 — AFTER DARK · 야경명소</div>
          <h1 id="night-title" className="v3-night__title">
            <span className="v3-ko">밤이</span> <span className="v3-night__em">오면</span>
            <br />
            <span className="v3-ko">서울이</span> <span className="v3-night__em">켜진다.</span>
          </h1>
          <p className="v3-night__phase" role="status">
            <span className={`v3-night__phase-dot is-${night.phase}`} aria-hidden="true" />
            {phaseLine}
          </p>
          <div className="v3-night__hero-row">
            <p className="v3-night__sub">
              해가 진 뒤 빛나는 {loading ? '—' : `${spots.length}곳`}. 다리 조명 · 공원 · 광장 · 도심 야경 — 오늘 밤 어디로 갈까요.
            </p>
            <dl className="v3-night__stats">
              <div><dt>오늘 일몰</dt><dd>{formatHm(night.sunset)}</dd></div>
              {/* 켜진 곳 = 점등 중 only (0 before sunset → "곧 켜져요"); 갈 수 있는 곳 = 운영 중, counted separately. */}
              <div><dt>켜진 곳</dt><dd className={!loading && night.lit === 0 && night.phase === 'before' ? 'is-soon' : undefined}>{loading ? '—' : night.lit === 0 && night.phase === 'before' ? '곧 켜져요' : `${night.lit}곳`}</dd></div>
              <div><dt>갈 수 있는 곳</dt><dd>{loading ? '—' : `${night.open}곳`}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      {loading && <p className="v3-shell v3-night__status" role="status">야경명소를 불러오는 중...</p>}
      {isError && <p className="v3-shell v3-night__status" role="alert">야경명소를 불러올 수 없습니다.</p>}

      {/* Feature spot */}
      {feature && (
        <section className="v3-night__section" aria-labelledby="night-feature">
          <div className="v3-shell v3-night__feature">
            <div className="v3-night__feature-art">
              <NightArt view={feature} views={night.views} label={`${feature.spot.TITLE} ${feature.photo ? '야경' : '위치'}`} />
              <span className="v3-night__tag">TONIGHT</span>
            </div>
            <div>
              <div className="v3-night__kicker">SPOT № {String(feature.index + 1).padStart(2, '0')} · {feature.state.badge === 'lit' ? '지금 점등 중' : feature.rule.kind === 'sunset' ? '곧 점등' : '오늘 밤'}</div>
              <h2 id="night-feature" className="v3-night__feature-title">{feature.spot.TITLE}</h2>
              {feature.desc && <p className="v3-night__feature-desc">{feature.desc}</p>}
              <dl className="v3-night__facts">
                <div><dt>지역</dt><dd>{feature.district || '—'}</dd></div>
                <div><dt>운영시간</dt><dd>{feature.spot.OPERATING_TIME || '—'}</dd></div>
                <div><dt>입장료</dt><dd>{feature.spot.ENTR_FEE || feature.spot.FREE_YN || '—'}</dd></div>
                <div><dt>지금</dt><dd><StateBadge view={feature} /></dd></div>
              </dl>
              <SpotActions view={feature} saved={isFavorite(feature.fav.id, 'spot')} onToggle={() => toggleFavorite(feature.fav)} />
            </div>
          </div>
        </section>
      )}

      {/* Collections (derived from data) */}
      {!loading && night.views.length > 0 && (
        <section className="v3-night__section" aria-labelledby="night-collections">
          <div className="v3-shell">
            <div className="v3-eyebrow"><span className="v3-eyebrow__dash" />컬렉션</div>
            <h2 id="night-collections" className="v3-night__h2"><span className="v3-night__em">주제별로</span> <span className="v3-ko">골라본 서울 밤.</span></h2>
            <div className="v3-night__collections">
              {COLLECTIONS.map((c, i) => {
                const n = night.views.filter(c.test).length;
                return (
                  <button key={c.id} type="button" className="v3-night__collection v3-focus" aria-pressed={collection === c.id} onClick={() => setCollection((cur) => (cur === c.id ? null : c.id))}>
                    <span className="v3-night__collection-no">COLLECTION 0{i + 1}</span>
                    <span className="v3-night__collection-ko">{c.ko}</span>
                    <span className="v3-night__collection-en">{c.en}</span>
                    <span className="v3-night__collection-n">{n}<small>곳 →</small></span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* All spots */}
      {!loading && night.views.length > 0 && (
        <section className="v3-night__section" aria-labelledby="night-all">
          <div className="v3-shell">
            <div className="v3-night__list-head">
              <div>
                <div className="v3-eyebrow"><span className="v3-eyebrow__dash" />전체 야경명소 {spots.length}곳</div>
                <h2 id="night-all" className="v3-night__h2"><span className="v3-ko">서울의 모든 빛.</span></h2>
              </div>
              <div className="v3-night__filters">
                <div className="v3-night__chips" role="group" aria-label="분류">
                  {subjects.map((s) => (
                    <button key={s} type="button" className="v3-night__chip v3-focus" aria-pressed={subject === s} onClick={() => setSubject(s)}>{s}</button>
                  ))}
                </div>
                {([['lit', '● 지금 켜진 곳만'], ['open', '지금 갈 수 있는 곳만']] as const).map(([f, label]) => (
                  <button key={f} type="button" className="v3-night__chip v3-night__chip--toggle v3-focus" aria-pressed={nowFilter === f} onClick={() => setNowFilter((cur) => (cur === f ? null : f))}>{label}</button>
                ))}
              </div>
            </div>
            <p className="v3-night__count">{shown.length}곳{collection ? ` · ${COLLECTIONS.find((c) => c.id === collection)!.ko}` : ''}</p>
            {shown.length === 0 ? (
              <p className="v3-night__empty">조건에 맞는 야경명소가 없습니다.</p>
            ) : (
              <div className="v3-night__grid">
                {shown.map((v) => (
                  <NightSpotCard key={v.index} view={v} views={night.views} saved={isFavorite(v.fav.id, 'spot')} onToggle={() => toggleFavorite(v.fav)} isTarget={target === v.id} domId={`night-spot-${v.id}`} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default NightPage;
