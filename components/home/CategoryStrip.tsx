import React from 'react';
import { Link } from 'react-router-dom';
import { MAP_DESCRIPTION } from '../../constants/home';
import { formatCount } from './selectors';

interface Props {
  loading: boolean;
  ongoingEvents: number;
  topEventGenres: string[];
  spaces: number;
  topSpaceTypes: string[];
  nightSpots: number;
}

const CategoryStrip: React.FC<Props> = ({ loading, ongoingEvents, topEventGenres, spaces, topSpaceTypes, nightSpots }) => {
  const cells = [
    {
      num: '01 — EVENTS',
      label: '문화행사',
      desc: topEventGenres.join(' · '),
      count: loading ? '—' : `${formatCount(ongoingEvents)}건 진행 중`,
      to: '/events',
    },
    {
      num: '02 — SPACES',
      label: '문화공간',
      desc: topSpaceTypes.join(' · '),
      count: loading ? '—' : `${formatCount(spaces)}곳`,
      to: '/map',
    },
    {
      num: '03 — MAP',
      label: '지도탐색',
      desc: MAP_DESCRIPTION,
      count: loading ? '—' : `문화공간 ${formatCount(spaces)} · 야경명소 ${formatCount(nightSpots)}`,
      to: '/map',
    },
  ];

  return (
    <nav className="v3-cat-strip" aria-label="카테고리">
      {cells.map((c) => (
        <Link key={c.num} to={c.to} className="v3-cat-strip__cell v3-focus">
          <div className="v3-cat-strip__num">{c.num}</div>
          <div className="v3-cat-strip__label">{c.label}</div>
          <div className="v3-cat-strip__desc">{c.desc}</div>
          <div className="v3-cat-strip__count">{c.count}</div>
          <span className="v3-cat-strip__arrow" aria-hidden="true">↗</span>
        </Link>
      ))}
    </nav>
  );
};

export default CategoryStrip;
