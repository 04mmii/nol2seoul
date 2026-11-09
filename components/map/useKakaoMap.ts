import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { KakaoCustomOverlay, KakaoMap, KakaoMarker, KakaoMarkerImageInstance } from '../../types';
import type { MapItem } from './selectors';
import { PIN_STYLES, pinDataUri, pinSvg } from './pins';

/**
 * Kakao map for the v3 map page. Keeps the pre-v3 behaviour: map centred on Seoul City Hall at level 8,
 * one marker per item with coordinates, marker click selects + pans, zoom in/out, current location
 * (pan + level 5). New: v3 pin images, a name label above the selected pin, and pins follow all filters.
 */
export function useKakaoMap(containerRef: RefObject<HTMLDivElement | null>, isLoaded: boolean) {
  const mapRef = useRef<KakaoMap | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || mapRef.current) return;
    const { kakao } = window;
    mapRef.current = new kakao.maps.Map(containerRef.current, { center: new kakao.maps.LatLng(37.5665, 126.978), level: 8 });
    setReady(true);
  }, [isLoaded, containerRef]);

  const zoomIn = useCallback(() => { const m = mapRef.current; if (m) m.setLevel(m.getLevel() - 1); }, []);
  const zoomOut = useCallback(() => { const m = mapRef.current; if (m) m.setLevel(m.getLevel() + 1); }, []);
  const locate = useCallback((onError: () => void) => {
    if (!mapRef.current || !navigator.geolocation) return onError();
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        mapRef.current?.panTo(new window.kakao.maps.LatLng(coords.latitude, coords.longitude));
        mapRef.current?.setLevel(5);
      },
      () => onError(),
    );
  }, []);

  return { map: ready ? mapRef.current : null, zoomIn, zoomOut, locate };
}

type Entry = { marker: KakaoMarker; item: MapItem };

export function useMapMarkers(
  map: KakaoMap | null,
  items: MapItem[],
  selectedKey: string | null,
  onSelect: (key: string) => void,
  containerRef: RefObject<HTMLDivElement | null>,
) {
  const entries = useRef<Map<string, Entry>>(new Map());
  const images = useRef<Record<string, KakaoMarkerImageInstance>>({});
  const label = useRef<KakaoCustomOverlay | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const image = (style: keyof typeof PIN_STYLES) => {
    if (!images.current[style]) {
      const { kakao } = window;
      const { width, height } = pinSvg(PIN_STYLES[style]);
      images.current[style] = new kakao.maps.MarkerImage(pinDataUri(PIN_STYLES[style]), new kakao.maps.Size(width, height), {
        offset: new kakao.maps.Point(width / 2, PIN_STYLES[style].size / 2), // anchor = circle centre
      });
    }
    return images.current[style];
  };

  // (Re)build markers when the filtered items change.
  useEffect(() => {
    if (!map) return;
    const { kakao } = window;
    entries.current.forEach(({ marker }) => marker.setMap(null));
    entries.current = new Map();
    for (const item of items) {
      if (item.lat === null || item.lng === null) continue;
      const selected = item.key === selectedKey;
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(item.lat, item.lng),
        map,
        image: image(selected ? 'selected' : item.kind),
        title: item.title,
        zIndex: selected ? 10 : 1,
      });
      kakao.maps.event.addListener(marker, 'click', () => onSelectRef.current(item.key));
      entries.current.set(item.key, { marker, item });
    }
    return () => {
      entries.current.forEach(({ marker }) => marker.setMap(null));
      entries.current = new Map();
    };
    // selectedKey intentionally omitted: selection changes are handled below without rebuilding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, items]);

  // Selection: swap pin images, raise the pin, show the name label, pan to it.
  const prevSelected = useRef<string | null>(null);
  useEffect(() => {
    if (!map) return;
    const { kakao } = window;
    const prev = prevSelected.current && entries.current.get(prevSelected.current);
    if (prev) { prev.marker.setImage(image(prev.item.kind)); prev.marker.setZIndex(1); }
    label.current?.setMap(null);
    label.current = null;
    const cur = selectedKey ? entries.current.get(selectedKey) : undefined;
    if (cur) {
      cur.marker.setImage(image('selected'));
      cur.marker.setZIndex(10);
      const el = document.createElement('div');
      el.className = 'v3-map-pinlabel';
      const name = document.createElement('span');
      name.textContent = cur.item.title; // text only — never HTML from the API
      const tag = document.createElement('span');
      tag.className = 'v3-map-pinlabel__tag';
      tag.textContent = '● 선택';
      el.append(name, tag);
      label.current = new kakao.maps.CustomOverlay({ content: el, position: cur.marker.getPosition(), map, yAnchor: 1.9, zIndex: 11 });
      map.panTo(cur.marker.getPosition());
      // Mobile: the selected card covers the middle of the map, so shift the view to put the pin in the
      // upper quarter (above the card). Desktop: the card sits bottom-right, the centre stays visible.
      if (window.matchMedia?.('(max-width: 900px)').matches) {
        const h = containerRef.current?.clientHeight ?? window.innerHeight;
        const dy = Math.round(h * 0.25);
        window.setTimeout(() => map.panBy(0, dy), 320);
      }
    }
    prevSelected.current = selectedKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedKey, items]);
}
