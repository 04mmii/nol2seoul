// Event Types
export interface Event {
  CODENAME: string;
  TITLE: string;
  DATE: string;
  GUNAME: string;
  PLACE: string;
  ORG_NAME: string;
  MAIN_IMG: string;
  STRTDATE?: string;
  END_DATE?: string;
  USE_TRGT?: string;
  USE_FEE?: string;
  PLAYER?: string;
  PROGRAM?: string;
  ETC_DESC?: string;
  ORG_LINK?: string;
  HMPG_ADDR?: string;
  LAT?: string;
  LOT?: string;
  IS_FREE?: string;
  [key: string]: string | undefined;
}

export interface EventItem {
  id: string;
  title: string;
  category: string;
  location: string;
  dateRange: string;
  imageUrl: string;
  isFree?: boolean;
  isHot?: boolean;
  rating?: number;
}

// Cultural Space Types
export interface CulturalSpace {
  /** Fields as sent by the live culturalSpaceInfo API (checked 2026-11-09, BUG-13). */
  NUM: string;
  FAC_NAME: string;
  ADDR: string;
  PHNE: string;
  FAX?: string;
  HOMEPAGE?: string;
  X_COORD: number | string;
  Y_COORD: number | string;
  SUBJCODE?: string;
  CLOSEDAY?: string;
  MAIN_IMG?: string;
  /** HTML — render through utils/space.ts `spaceDescription`. */
  FAC_DESC?: string;
  /** "무료" | "유료". */
  ENTRFREE?: string;
  SUBWAY?: string;
  BUSSTOP?: string;
}

// Night View Spot Types
export interface NightViewSpot {
  TITLE: string;
  ADDR: string;
  LA: string;
  LO: string;
  TEL_NO: string;
  URL: string;
  OPERATING_TIME: string;
  ENTR_FEE: string;
  /** "무료" | "유료". */
  FREE_YN?: string;
  /** Description (BUG-12: the code used to read a non-existent CONTENT). */
  CONTENTS?: string;
  SUBWAY: string;
  BUS: string;
  MAIN_IMG?: string;
  SUBJECT_CD: string;
  NUM: string;
  PARKING_INFO?: string;
  REG_DATE?: string;
  MOD_DATE?: string;
}

// User Profile Types
export interface UserProfile {
  name: string;
  email: string;
  level: string;
  savedEventsCount: number;
  savedPlacesCount: number;
  reviewsCount: number;
  avatarUrl: string;
}

// Kakao Map Types
declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap;
        Marker: new (options: KakaoMarkerOptions) => KakaoMarker;
        MarkerImage: new (src: string, size: KakaoSize, options?: { offset?: KakaoPoint }) => KakaoMarkerImageInstance;
        Point: new (x: number, y: number) => KakaoPoint;
        Size: new (width: number, height: number) => KakaoSize;
        InfoWindow: new (options: KakaoInfoWindowOptions) => KakaoInfoWindow;
        CustomOverlay: new (options: KakaoCustomOverlayOptions) => KakaoCustomOverlay;
        MarkerClusterer: new (options: KakaoMarkerClustererOptions) => KakaoMarkerClusterer;
        event: {
          addListener: (target: unknown, type: string, handler: () => void) => void;
          removeListener: (target: unknown, type: string, handler: () => void) => void;
        };
        services: {
          Geocoder: new () => KakaoGeocoder;
          Places: new () => KakaoPlaces;
        };
      };
    };
  }
}

export interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

export interface KakaoMapOptions {
  center: KakaoLatLng;
  level: number;
}

export interface KakaoMap {
  setCenter: (latlng: KakaoLatLng) => void;
  /** `anchor`: the point that stays fixed on screen while zooming (Kakao Maps v2 option). */
  setLevel: (level: number, options?: { anchor?: KakaoLatLng; animate?: boolean }) => void;
  getLevel: () => number;
  getCenter: () => KakaoLatLng;
  panTo: (latlng: KakaoLatLng) => void;
  /** Moves the centre by (dx, dy) pixels, animated. */
  panBy: (dx: number, dy: number) => void;
}

export interface KakaoMarkerOptions {
  position: KakaoLatLng;
  map?: KakaoMap;
  image?: KakaoMarkerImageInstance;
  /** Tooltip text (Kakao Maps v2 option). */
  title?: string;
  zIndex?: number;
}

export interface KakaoMarker {
  setMap: (map: KakaoMap | null) => void;
  getPosition: () => KakaoLatLng;
  setImage: (image: KakaoMarkerImageInstance) => void;
  setZIndex: (zIndex: number) => void;
}

export interface KakaoMarkerImageInstance {}

export interface KakaoPoint {
  x: number;
  y: number;
}

export interface KakaoSize {
  width: number;
  height: number;
}

export interface KakaoMarkerImage {
  src: string;
  size: { width: number; height: number };
}

export interface KakaoInfoWindowOptions {
  content: string;
  position?: KakaoLatLng;
}

export interface KakaoInfoWindow {
  open: (map: KakaoMap, marker: KakaoMarker) => void;
  close: () => void;
}

export interface KakaoCustomOverlayOptions {
  content: string | HTMLElement;
  position: KakaoLatLng;
  map?: KakaoMap;
  /** 0 = top of the content at the position, 1 = bottom (Kakao default 0.5). */
  yAnchor?: number;
  zIndex?: number;
}

export interface KakaoCustomOverlay {
  setMap: (map: KakaoMap | null) => void;
}

export interface KakaoMarkerClustererOptions {
  map: KakaoMap;
  markers?: KakaoMarker[];
  gridSize?: number;
  averageCenter?: boolean;
  minLevel?: number;
  minClusterSize?: number;
  disableClickZoom?: boolean;
  /** Count thresholds choosing `styles[i]`. */
  calculator?: number[];
  styles?: Array<Record<string, string>>;
}

export interface KakaoMarkerClusterer {
  addMarker: (marker: KakaoMarker) => void;
  addMarkers: (markers: KakaoMarker[]) => void;
  removeMarker: (marker: KakaoMarker) => void;
  clear: () => void;
  redraw: () => void;
}

export interface KakaoGeocoder {
  addressSearch: (
    address: string,
    callback: (result: KakaoGeocoderResult[], status: string) => void
  ) => void;
}

export interface KakaoGeocoderResult {
  x: string;
  y: string;
  address_name: string;
}

export interface KakaoPlaces {
  keywordSearch: (
    keyword: string,
    callback: (result: KakaoPlaceResult[], status: string) => void
  ) => void;
}

export interface KakaoPlaceResult {
  place_name: string;
  x: string;
  y: string;
  address_name: string;
}
