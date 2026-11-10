import React from 'react';
import { riverPoints, type NightSpotView } from './selectors';

/**
 * "밤이 오면 켜진다" graphic (no photos in the API): every night spot at its real position over a stylised
 * Han River line. Glowing spots = ember light with a soft halo; others = night dots with a faint ring
 * (the same night pin as on the map page, switched on). Lights fade in one by one unless the user
 * prefers reduced motion (CSS). `focus` highlights one spot (cards, feature).
 */
const NightLights: React.FC<{
  views: NightSpotView[];
  focus?: number;
  variant: 'hero' | 'card';
  label?: string;
}> = ({ views, focus, variant, label }) => {
  const river = riverPoints();
  const path = river.map((p, i) => `${i ? 'L' : 'M'}${p.left.toFixed(2)} ${p.top.toFixed(2)}`).join(' ');
  return (
    <svg
      className={`v3-night-lights v3-night-lights--${variant}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <radialGradient id={`glow-${variant}`}>
          <stop offset="0%" stopColor="rgb(232 183 129)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="rgb(232 183 129)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={path} className="v3-night-lights__river" />
      {views.map((v, i) => {
        if (!v.pos) return null;
        const isFocus = focus === v.index;
        if (variant === 'card' && !isFocus) {
          return <circle key={v.index} cx={v.pos.left} cy={v.pos.top} r={0.9} className="v3-night-lights__ghost" />;
        }
        const r = variant === 'hero' ? 0.55 : 2.6;
        return (
          <g
            key={v.index}
            className={`v3-night-lights__spot ${v.glowing ? 'is-on' : 'is-off'} ${isFocus ? 'is-focus' : ''}`}
            style={{ animationDelay: `${(i % 17) * 0.12}s` }}
          >
            {v.glowing && <circle cx={v.pos.left} cy={v.pos.top} r={r * (variant === 'hero' ? 4 : 5)} fill={`url(#glow-${variant})`} className="v3-night-lights__halo" />}
            <circle cx={v.pos.left} cy={v.pos.top} r={r} className="v3-night-lights__dot" />
          </g>
        );
      })}
    </svg>
  );
};

export default NightLights;
