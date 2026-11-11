import React from 'react';
import { Link } from 'react-router-dom';
import { MAP_DESCRIPTION } from '../../constants/home';

interface Props {
  topEventGenres: string[];
  topSpaceTypes: string[];
}

const CategoryStrip: React.FC<Props> = ({ topEventGenres, topSpaceTypes }) => {
  const cells = [
    {
      num: '01 — EVENTS',
      label: '문화행사',
      desc: topEventGenres.join(' · '),
      to: '/events',
    },
    {
      num: '02 — SPACES',
      label: '문화공간',
      desc: topSpaceTypes.join(' · '),
      to: '/map',
    },
    {
      num: '03 — MAP',
      label: '지도탐색',
      desc: MAP_DESCRIPTION,
      to: '/map',
    },
  ];

  return (
    <nav className="v3-cat-strip" aria-label="카테고리">
      <div className="v3-shell v3-cat-strip__grid">
      {cells.map((c) => (
        <Link key={c.num} to={c.to} className="v3-cat-strip__cell v3-focus">
          <div className="v3-cat-strip__num">{c.num}</div>
          <div className="v3-cat-strip__label">{c.label}</div>
          <div className="v3-cat-strip__desc">{c.desc}</div>
          <span className="v3-cat-strip__arrow" aria-hidden="true">↗</span>
        </Link>
      ))}
      </div>
    </nav>
  );
};

export default CategoryStrip;
