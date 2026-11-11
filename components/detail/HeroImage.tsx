import React, { useState } from 'react';

/** Detail hero image (event / space). No image or a broken one → the v3 hatched placeholder. */
const HeroImage: React.FC<{ src?: string; alt?: string }> = ({ src, alt = '' }) => {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <span className="v3-detail-hero__ph" aria-hidden="true">
        <span className="v3-detail-hero__ph-cap">NO IMAGE</span>
      </span>
    );
  }
  return <img key={src} src={src} alt={alt} onError={() => setBroken(true)} />;
};

export default HeroImage;
