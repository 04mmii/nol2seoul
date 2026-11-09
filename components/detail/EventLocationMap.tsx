import React, { useEffect, useRef } from 'react';
import { useKakaoLoader } from '../../hooks';
import type { KakaoMap, KakaoMarker } from '../../types';

/**
 * Small Kakao map for one event location. Reuses the existing SDK loader (hooks/useKakaoLoader),
 * the same one MapDiscovery uses; the loader itself is not modified.
 * Falls back to a labelled placeholder when coordinates are missing or the SDK cannot load
 * (missing key, unregistered domain, network).
 */
const EventLocationMap: React.FC<{ coords: { lat: number; lng: number } | null; label: string }> = ({ coords, label }) => {
  const { isLoaded, error } = useKakaoLoader();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markerRef = useRef<KakaoMarker | null>(null);

  useEffect(() => {
    if (!isLoaded || !coords || !containerRef.current) return;
    const { kakao } = window;
    const position = new kakao.maps.LatLng(coords.lat, coords.lng);
    if (!mapRef.current) {
      mapRef.current = new kakao.maps.Map(containerRef.current, { center: position, level: 4 });
    } else {
      mapRef.current.setCenter(position);
    }
    markerRef.current?.setMap(null);
    markerRef.current = new kakao.maps.Marker({ position, map: mapRef.current });
  }, [isLoaded, coords?.lat, coords?.lng]);

  let status: string | null = null;
  if (!coords) status = '위치 정보가 없습니다';
  else if (error) status = '지도를 불러올 수 없습니다';
  else if (!isLoaded) status = '지도를 불러오는 중...';

  return (
    <div className="v3-detail-map" role="img" aria-label={status ?? `${label} 위치 지도`}>
      <div ref={containerRef} className="v3-detail-map__canvas" />
      {status && (
        <div className="v3-detail-map__placeholder">
          <div className="v3-detail-map__grid" aria-hidden="true" />
          <span className="v3-detail-map__status">{status}</span>
        </div>
      )}
    </div>
  );
};

export default EventLocationMap;
