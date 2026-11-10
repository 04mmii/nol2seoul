import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { KakaoCustomOverlay, KakaoMap, KakaoMarker, KakaoMarkerClusterer, KakaoMarkerImageInstance } from '../../types';
import type { MapItem } from './selectors';
import { CLUSTER_CALCULATOR, CLUSTER_MIN_LEVEL, clusterStyles, pinAnchor, pinDataUri, pinSizeForLevel, pinStyle, pinSvg, type PinKind } from './pins';

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

  // `anchor` (the selected place): zoom around it so the selected pin stays where it is on screen
  // (on mobile it sits above the card, off-centre — a centre zoom would push it off screen).
  const zoomBy = useCallback((delta: number, anchor?: { lat: number; lng: number } | null) => {
    const m = mapRef.current;
    if (!m) return;
    const level = m.getLevel() + delta;
    if (anchor) m.setLevel(level, { anchor: new window.kakao.maps.LatLng(anchor.lat, anchor.lng) });
    else m.setLevel(level);
  }, []);
  const zoomIn = useCallback((anchor?: { lat: number; lng: number } | null) => zoomBy(-1, anchor), [zoomBy]);
  const zoomOut = useCallback((anchor?: { lat: number; lng: number } | null) => zoomBy(1, anchor), [zoomBy]);
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

/**
 * Pins for the filtered items: sized by zoom level, clustered while zoomed out (TECH-12), selected pin
 * kept out of clusters (always 13px, on top, with its name label).
 */
export function useMapMarkers(
  map: KakaoMap | null,
  items: MapItem[],
  selectedKey: string | null,
  onSelect: (key: string) => void,
  containerRef: RefObject<HTMLDivElement | null>,
) {
  const entries = useRef<Map<string, Entry>>(new Map());
  const images = useRef<Record<string, KakaoMarkerImageInstance>>({});
  const clusterer = useRef<KakaoMarkerClusterer | null>(null);
  const label = useRef<KakaoCustomOverlay | null>(null);
  const selectedRef = useRef<string | null>(selectedKey);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const image = (kind: PinKind, level: number) => {
    const style = pinStyle(kind, pinSizeForLevel(level));
    const id = `${kind}:${style.size}`;
    if (!images.current[id]) {
      const { kakao } = window;
      const { width, height } = pinSvg(style);
      const a = pinAnchor(style);
      images.current[id] = new kakao.maps.MarkerImage(pinDataUri(style), new kakao.maps.Size(width, height), {
        offset: new kakao.maps.Point(a.x, a.y), // anchor = circle centre
      });
    }
    return images.current[id];
  };

  // One clusterer per map.
  useEffect(() => {
    if (!map || clusterer.current) return;
    clusterer.current = new window.kakao.maps.MarkerClusterer({
      map,
      averageCenter: true,
      minLevel: CLUSTER_MIN_LEVEL,
      gridSize: 60,
      minClusterSize: 2,
      disableClickZoom: false, // clicking a cluster zooms in until it splits
      calculator: CLUSTER_CALCULATOR,
      styles: clusterStyles(),
    });
  }, [map]);

  // (Re)build markers when the filtered items change.
  useEffect(() => {
    const cl = clusterer.current;
    if (!map || !cl) return;
    const { kakao } = window;
    cl.clear();
    entries.current.forEach(({ marker }) => marker.setMap(null));
    entries.current = new Map();
    const level = map.getLevel();
    const clustered: KakaoMarker[] = [];
    for (const item of items) {
      if (item.lat === null || item.lng === null) continue;
      const selected = item.key === selectedRef.current;
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(item.lat, item.lng),
        image: image(selected ? 'selected' : item.kind, level),
        title: item.title,
        zIndex: selected ? 10 : 1,
      });
      kakao.maps.event.addListener(marker, 'click', () => onSelectRef.current(item.key));
      entries.current.set(item.key, { marker, item });
      if (selected) marker.setMap(map); // never inside a cluster
      else clustered.push(marker);
    }
    cl.addMarkers(clustered);
    return () => {
      cl.clear();
      entries.current.forEach(({ marker }) => marker.setMap(null));
      entries.current = new Map();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, items]);

  // Zoom: resize the normal pins (selected stays 13px).
  useEffect(() => {
    if (!map) return;
    const { kakao } = window;
    const onZoom = () => {
      const level = map.getLevel();
      entries.current.forEach(({ marker, item }) => {
        if (item.key !== selectedRef.current) marker.setImage(image(item.kind, level));
      });
    };
    kakao.maps.event.addListener(map, 'zoom_changed', onZoom);
    return () => kakao.maps.event.removeListener(map, 'zoom_changed', onZoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Selection: take the pin out of the clusterer, enlarge + raise it, add the name label, pan to it.
  const prevSelected = useRef<string | null>(null);
  useEffect(() => {
    const cl = clusterer.current;
    if (!map || !cl) return;
    const { kakao } = window;
    selectedRef.current = selectedKey;
    const level = map.getLevel();
    const prev = prevSelected.current && prevSelected.current !== selectedKey ? entries.current.get(prevSelected.current) : undefined;
    if (prev) {
      prev.marker.setImage(image(prev.item.kind, level));
      prev.marker.setZIndex(1);
      prev.marker.setMap(null);
      cl.addMarker(prev.marker);
    }
    label.current?.setMap(null);
    label.current = null;
    const cur = selectedKey ? entries.current.get(selectedKey) : undefined;
    if (cur) {
      cl.removeMarker(cur.marker);
      cur.marker.setImage(image('selected', level));
      cur.marker.setZIndex(10);
      cur.marker.setMap(map);
      const el = document.createElement('div');
      el.className = 'v3-map-pinlabel';
      const name = document.createElement('span');
      name.textContent = cur.item.title; // text only — never HTML from the API
      const tag = document.createElement('span');
      tag.className = 'v3-map-pinlabel__tag';
      tag.textContent = '● 선택';
      el.append(name, tag);
      label.current = new kakao.maps.CustomOverlay({ content: el, position: cur.marker.getPosition(), map, yAnchor: 1.6, zIndex: 11 });
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
