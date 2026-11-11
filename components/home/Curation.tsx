import React from 'react';

/**
 * "03 — CURATION" intro, directly above the editor picks (components/home/EditorPicks.tsx).
 * The prototype's curator notes (fictional people and quotes) were removed on 2026-11-11.
 */
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
