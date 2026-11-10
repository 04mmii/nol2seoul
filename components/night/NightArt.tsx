import React, { useState } from 'react';
import NightLights from './NightLights';
import type { NightSpotView } from './selectors';

/**
 * Card / feature artwork. A night photo from 한국관광공사 when the spot has one (static mapping,
 * data/night-photos.json), otherwise the mini light map (B). Both share the same 4:3 frame, the same
 * night tone and the same caption position, so mixed grids read as one design. If the photo fails
 * to load, the graphic takes its place.
 */
const NightArt: React.FC<{ view: NightSpotView; views: NightSpotView[]; label?: string }> = ({ view, views, label }) => {
  const [broken, setBroken] = useState(false);
  const photo = !broken ? view.photo : null;
  return (
    <figure className={`v3-night-art ${photo ? 'has-photo' : 'has-graphic'} ${view.glowing ? 'is-on' : ''}`}>
      {photo ? (
        <img src={photo.url} alt={label ?? `${view.spot.TITLE} 야경`} loading="lazy" onError={() => setBroken(true)} />
      ) : (
        <NightLights views={views} focus={view.index} variant="card" label={label} />
      )}
      <figcaption className="v3-night-art__cap">
        {photo ? `사진: 한국관광공사 · 촬영 ${photo.photographer}` : '실제 위치 그래픽'}
      </figcaption>
    </figure>
  );
};

export default NightArt;
