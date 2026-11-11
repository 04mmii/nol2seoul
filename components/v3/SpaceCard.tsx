import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CulturalSpace } from '../../types';
import { spaceId } from '../../utils/placeId';
import { districtFromAddress } from '../home/selectors';

/**
 * Cultural-space card in the shared v3 card frame (.v3-event-card, styles/v3.css): photo 3:4 cover
 * (hatched placeholder when missing), category, name (stretched link to /space/<id>), district + `foot`.
 * Used by MyPage and the space detail "가까운 공간" (2026-11-11).
 */
const SpaceCard: React.FC<{
  space: CulturalSpace;
  saved: boolean;
  onToggleFavorite: () => void;
  /** Right side of the footer (e.g. "약 650m", "월요일 휴관"). */
  foot?: React.ReactNode;
  headingLevel?: 'h3' | 'h4';
}> = ({ space, saved, onToggleFavorite, foot, headingLevel = 'h3' }) => {
  const [broken, setBroken] = useState(false);
  const Heading = headingLevel;
  return (
    <article className="v3-event-card">
      <div className="v3-event-card__thumb">
        {space.MAIN_IMG && !broken ? (
          <img src={space.MAIN_IMG} alt="" loading="lazy" onError={() => setBroken(true)} />
        ) : (
          <span className="v3-event-card__ph" aria-hidden="true"><span className="v3-event-card__ph-cap">문화공간</span></span>
        )}
        <button type="button" className="v3-event-card__heart v3-focus" aria-pressed={saved} aria-label={`${space.FAC_NAME} ${saved ? '찜 해제' : '찜하기'}`} onClick={onToggleFavorite}>
          <span aria-hidden="true">{saved ? '♥' : '♡'}</span>
        </button>
      </div>
      <div className="v3-event-card__body">
        <div className="v3-event-card__cat">문화공간{space.SUBJCODE ? ` · ${space.SUBJCODE}` : ''}</div>
        <Heading className="v3-event-card__title"><Link to={`/space/${spaceId(space)}`} className="v3-event-card__link">{space.FAC_NAME}</Link></Heading>
        <div className="v3-event-card__foot">
          <span>{districtFromAddress(space.ADDR) || space.ADDR}</span>
          {foot && <span className="v3-space-card__foot-right">{foot}</span>}
        </div>
      </div>
    </article>
  );
};

export default SpaceCard;
