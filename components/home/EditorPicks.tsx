import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CulturalSpace } from '../../types';
import type { NightSpotView } from '../night/selectors';
import NightArt from '../night/NightArt';
import { findSpace } from '../../utils/placeId';
import { districtFromAddress } from './selectors';
import picks from '../../data/editor-picks.json' with { type: 'json' };

/**
 * "에디터가 고른 서울" (decision 2026-11-11, replaces the placeholder curators): places the editor picked
 * in data/editor-picks.json — cultural spaces ("s<NUM>", photo) and night spots ("n<NUM>", photo or
 * mini light map + state). The comment shows only when the editor wrote one. Unknown ids are skipped.
 */
type Pick = { id: string; comment?: string };
const PICKS: Pick[] = (picks as { picks: Pick[] }).picks;

type Card =
  | { kind: 'space'; id: string; comment: string; space: CulturalSpace }
  | { kind: 'night'; id: string; comment: string; view: NightSpotView };

const SpacePhoto: React.FC<{ src?: string }> = ({ src }) => {
  const [broken, setBroken] = useState(false);
  return src && !broken
    ? <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} />
    : <span className="v3-pick__ph" aria-hidden="true" />;
};

const EditorPicks: React.FC<{ spaces: CulturalSpace[]; nightViews: NightSpotView[] }> = ({ spaces, nightViews }) => {
  const cards = useMemo(() => PICKS.flatMap((p): Card[] => {
    const comment = (p.comment ?? '').trim();
    if (p.id.startsWith('s')) {
      const hit = findSpace(spaces, p.id);
      return hit ? [{ kind: 'space', id: p.id, comment, space: hit.space }] : [];
    }
    const view = nightViews.find((v) => v.id === p.id);
    return view ? [{ kind: 'night', id: p.id, comment, view }] : [];
  }), [spaces, nightViews]);

  if (cards.length === 0) return null;
  return (
    <section className="v3-picks" aria-label="에디터가 고른 장소">
      <div className="v3-shell">
        <ul className="v3-picks__grid">
          {cards.map((c, i) => (
            <li key={c.id} className="v3-pick">
              <Link to={c.kind === 'space' ? `/space/${c.id}` : `/night?spot=${c.id}`} className="v3-pick__link v3-focus">
                <span className="v3-pick__art">
                  {c.kind === 'space' ? <SpacePhoto src={c.space.MAIN_IMG} /> : <NightArt view={c.view} views={nightViews} />}
                </span>
                <span className="v3-pick__body">
                  <span className="v3-pick__top">
                    <span className="v3-pick__kicker">PICK № {String(i + 1).padStart(2, '0')} · {c.kind === 'space' ? '문화공간' : '야경명소'}</span>
                    {c.kind === 'night' && c.view.state.badge !== 'none' && (
                      <span className={`v3-pick__state is-${c.view.state.badge}`}>{c.view.state.badge === 'lit' ? '● ' : ''}{c.view.state.label}</span>
                    )}
                  </span>
                  <span className="v3-pick__name">{c.kind === 'space' ? c.space.FAC_NAME : c.view.spot.TITLE}</span>
                  <span className="v3-pick__meta">
                    {c.kind === 'space'
                      ? [districtFromAddress(c.space.ADDR), (c.space.SUBJCODE || '').split('/')[0]].filter(Boolean).join(' · ')
                      : [c.view.district, c.view.spot.OPERATING_TIME].filter(Boolean).join(' · ')}
                  </span>
                  {c.comment && <span className="v3-pick__comment">{c.comment}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default EditorPicks;
