import React from 'react';
import { CURATORS } from '../../constants/home';

/** "03 — CURATION" intro that precedes After Dark and the curators. */
export const CurationIntro: React.FC = () => (
  <div className="v3-curation-intro">
    <div className="v3-shell">
      <div className="v3-eyebrow"><span className="v3-eyebrow__dash" />03 — CURATION · 에디터의 선택</div>
      <h2 className="v3-section-title">
        행사 다음에 갈 곳,<br />에디터가 고른 <em>서울.</em>
      </h2>
    </div>
  </div>
);

/**
 * Curator notes. Content comes from constants/home.ts (not from the API) and is currently
 * PLACEHOLDER content from the prototype — see CURATORS_ARE_PLACEHOLDERS.
 * v3's "전체 스토리 →" button is omitted: the 스토리 page is out of scope.
 */
export const Curators: React.FC = () => (
  <section className="v3-curators" aria-labelledby="home-curators-title">
    <div className="v3-shell">
      <div className="v3-section-header">
        <div>
          <div className="v3-eyebrow"><span className="v3-eyebrow__dash" />STORIES · 큐레이터의 노트</div>
          <h2 id="home-curators-title" className="v3-sub-title">그들이 고른 <em>서울.</em></h2>
        </div>
      </div>
      <div className="v3-curator-grid">
        {CURATORS.map((c) => (
          <article key={c.name} className="v3-curator-card">
            <div className="v3-curator-card__avatar" aria-hidden="true" />
            <h3 className="v3-curator-card__name">{c.name}</h3>
            <div className="v3-curator-card__role">{c.role}</div>
            <blockquote className="v3-curator-card__quote">“{c.quote}”</blockquote>
            <div className="v3-curator-card__picks">{c.picks}</div>
          </article>
        ))}
      </div>
    </div>
  </section>
);
