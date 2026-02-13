import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Mousewheel } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import { useKakaoLoader, useEvents, useCulturalSpaces, useNightViewSpots, useFavorites } from '../hooks';
import { NightSpotSlideCard, NightSpotDetailCard } from '../components/NightSpotCard';
import type { Event, CulturalSpace, NightViewSpot, KakaoMap, KakaoMarker } from '../types';

type CategoryType = '전체' | '문화행사' | '문화공간' | '야경명소';

const MARKER_COLORS: Record<string, string> = {
  '문화행사': '#ff6933',
  '문화공간': '#10b981',
  '야경명소': '#8b5cf6',
};
const SELECTED_COLOR = '#ef4444';

const createMarkerSvg = (color: string, size: number) => {
  const h = Math.round(size * 1.4);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${h}" viewBox="0 0 24 34"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 22 12 22s12-13 12-22C24 5.4 18.6 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

type MarkerEntry = { marker: KakaoMarker; item: Event | CulturalSpace | NightViewSpot; category: string };

const MapDiscovery = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<KakaoMap | null>(null);
  const markersRef = useRef<MarkerEntry[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('전체');
  const [selectedItem, setSelectedItem] = useState<Event | CulturalSpace | NightViewSpot | null>(null);
  const [isListOpen, setIsListOpen] = useState(false);
  const [subFilter, setSubFilter] = useState<string>('전체');

  const { isLoaded, error: mapError } = useKakaoLoader();
  const { events, loading: eventsLoading } = useEvents();
  const { spaces, loading: spacesLoading } = useCulturalSpaces();
  const { spots, loading: spotsLoading } = useNightViewSpots();
  const { toggleFavorite, isFavorite } = useFavorites();

  const isLoading = eventsLoading || spacesLoading || spotsLoading;
  const isNightMode = selectedCategory === '야경명소';

  // 카카오 지도 초기화
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const { kakao } = window;
    const mapOption = {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level: 8,
    };

    mapInstanceRef.current = new kakao.maps.Map(mapRef.current, mapOption);
  }, [isLoaded]);

  // 마커 이미지 생성 헬퍼
  const getMarkerImage = (category: string, selected: boolean) => {
    const { kakao } = window;
    const size = selected ? 40 : 28;
    const color = selected ? SELECTED_COLOR : (MARKER_COLORS[category] || '#ff6933');
    const h = Math.round(size * 1.4);
    return new kakao.maps.MarkerImage(createMarkerSvg(color, size), new kakao.maps.Size(size, h));
  };

  // 마커 업데이트
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    const { kakao } = window;
    const map = mapInstanceRef.current;

    markersRef.current.forEach(({ marker }) => marker.setMap(null));
    markersRef.current = [];

    const addMarker = (lat: number, lng: number, item: Event | CulturalSpace | NightViewSpot, category: string) => {
      const position = new kakao.maps.LatLng(lat, lng);
      const image = getMarkerImage(category, false);
      const marker = new kakao.maps.Marker({ position, map, image });

      kakao.maps.event.addListener(marker, 'click', () => {
        setSelectedItem(item);
        map.panTo(position);
      });

      markersRef.current.push({ marker, item, category });
    };

    if (selectedCategory === '전체' || selectedCategory === '문화행사') {
      events.forEach(event => {
        if (event.LAT && event.LOT) {
          const lat = parseFloat(event.LAT);
          const lng = parseFloat(event.LOT);
          if (!isNaN(lat) && !isNaN(lng)) {
            addMarker(lat, lng, event, '문화행사');
          }
        }
      });
    }

    if (selectedCategory === '전체' || selectedCategory === '문화공간') {
      spaces.forEach(space => {
        // API에서 X_COORD=위도(37.xx), Y_COORD=경도(127.xx)로 반대로 내려옴
        const lat = parseFloat(String(space.X_COORD));
        const lng = parseFloat(String(space.Y_COORD));
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          addMarker(lat, lng, space, '문화공간');
        }
      });
    }

    if (selectedCategory === '전체' || selectedCategory === '야경명소') {
      spots.forEach(spot => {
        if (spot.LA && spot.LO) {
          const lat = parseFloat(spot.LA);
          const lng = parseFloat(spot.LO);
          if (!isNaN(lat) && !isNaN(lng)) {
            addMarker(lat, lng, spot, '야경명소');
          }
        }
      });
    }
  }, [isLoaded, selectedCategory, events, spaces, spots]);

  // 선택된 마커 하이라이트
  useEffect(() => {
    if (!isLoaded) return;
    markersRef.current.forEach(({ marker, item, category }) => {
      marker.setImage(getMarkerImage(category, item === selectedItem));
    });
  }, [selectedItem, isLoaded]);

  const moveToCurrentLocation = () => {
    if (!mapInstanceRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const moveLatLng = new window.kakao.maps.LatLng(latitude, longitude);
        mapInstanceRef.current?.panTo(moveLatLng);
        mapInstanceRef.current?.setLevel(5);
      },
      (error) => console.error('위치 정보를 가져올 수 없습니다:', error)
    );
  };

  const zoomIn = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setLevel(mapInstanceRef.current.getLevel() - 1);
  };

  const zoomOut = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setLevel(mapInstanceRef.current.getLevel() + 1);
  };

  const getItemInfo = (item: Event | CulturalSpace | NightViewSpot) => {
    if ('CODENAME' in item) {
      return {
        id: String(events.indexOf(item)),
        title: item.TITLE,
        location: item.PLACE || item.GUNAME,
        date: item.DATE,
        image: item.MAIN_IMG,
        type: item.CODENAME,
        category: '문화행사' as const,
        favType: 'event' as const,
      };
    } else if ('FAC_NAME' in item) {
      return {
        id: String(spaces.indexOf(item)),
        title: item.FAC_NAME,
        location: item.ADDR,
        date: item.CLOSEDAY ? `휴관일: ${item.CLOSEDAY}` : '',
        image: item.MAIN_IMG || item.IMG_URL,
        type: '문화공간',
        category: '문화공간' as const,
        favType: 'space' as const,
      };
    } else {
      return {
        id: String(spots.indexOf(item)),
        title: item.TITLE,
        location: item.ADDR,
        date: item.OPERATING_TIME,
        image: item.MAIN_IMG,
        type: '야경명소',
        category: '야경명소' as const,
        favType: 'spot' as const,
      };
    }
  };

  const getRecentItems = () => {
    const items: Array<{ item: Event | CulturalSpace | NightViewSpot; category: string }> = [];

    if (selectedCategory === '전체') {
      // 전체: 각 카테고리에서 라운드 로빈으로 골고루 뽑기
      const buckets = [
        events.slice(0, 10).map(e => ({ item: e as Event | CulturalSpace | NightViewSpot, category: '문화행사' })),
        spaces.slice(0, 10).map(s => ({ item: s as Event | CulturalSpace | NightViewSpot, category: '문화공간' })),
        spots.slice(0, 10).map(s => ({ item: s as Event | CulturalSpace | NightViewSpot, category: '야경명소' })),
      ];
      const mixed: typeof items = [];
      for (let i = 0; mixed.length < 10; i++) {
        let added = false;
        for (const bucket of buckets) {
          if (i < bucket.length) {
            mixed.push(bucket[i]);
            added = true;
          }
        }
        if (!added) break;
      }
      return mixed.slice(0, 10);
    }

    if (selectedCategory === '문화행사') {
      events.slice(0, 4).forEach(e => items.push({ item: e, category: '문화행사' }));
    }
    if (selectedCategory === '문화공간') {
      spaces.slice(0, 4).forEach(s => items.push({ item: s, category: '문화공간' }));
    }
    if (selectedCategory === '야경명소') {
      spots.slice(0, 4).forEach(s => items.push({ item: s, category: '야경명소' }));
    }

    return items.slice(0, 10);
  };

  // 서브 카테고리 추출 (문화행사는 자체 페이지가 있으므로 제외)
  const getSubCategories = (): string[] => {
    if (selectedCategory === '야경명소') {
      const codes = [...new Set(spots.map(s => s.SUBJECT_CD).filter(Boolean))];
      return ['전체', ...codes];
    }
    if (selectedCategory === '문화공간') {
      const codes = [...new Set(spaces.map(s => s.SUBJCODE).filter(Boolean))];
      return ['전체', ...codes];
    }
    return [];
  };

  // 서브 필터 적용된 전체 리스트
  const getFilteredItems = (): Array<{ item: Event | CulturalSpace | NightViewSpot; category: string }> => {
    if (selectedCategory === '야경명소') {
      const filtered = subFilter === '전체' ? spots : spots.filter(s => s.SUBJECT_CD === subFilter);
      return filtered.map(s => ({ item: s, category: '야경명소' }));
    }
    if (selectedCategory === '문화공간') {
      const filtered = subFilter === '전체' ? spaces : spaces.filter(s => s.SUBJCODE === subFilter);
      return filtered.map(s => ({ item: s, category: '문화공간' }));
    }
    if (selectedCategory === '문화행사') {
      const filtered = subFilter === '전체' ? events : events.filter(e => e.CODENAME === subFilter);
      return filtered.map(e => ({ item: e, category: '문화행사' }));
    }
    return getRecentItems();
  };

  const subCategories = getSubCategories();
  const filteredItems = getFilteredItems();

  const categories: CategoryType[] = ['전체', '문화행사', '문화공간', '야경명소'];

  return (
    <div className={`relative h-screen w-full overflow-hidden transition-colors duration-500 ${isNightMode ? 'bg-gray-900' : 'bg-gray-200'}`}>
      {/* 카카오 지도 */}
      <div
        ref={mapRef}
        className={`absolute inset-0 z-0 transition-all duration-500 ${isNightMode ? 'grayscale invert brightness-90' : ''}`}
      />

      {/* 야경 오버레이 */}
      {isNightMode && <div className="absolute inset-0 z-[1] bg-indigo-950/30 pointer-events-none" />}

      {/* 에러 표시 */}
      {mapError && (
        <div className="absolute inset-0 z-50 bg-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <span className="material-symbols-outlined text-5xl text-red-400">error</span>
            <p className="text-navy font-bold text-lg">지도를 불러올 수 없습니다</p>
            <p className="text-gray-400 text-sm max-w-md">{mapError}</p>
            <div className="bg-gray-50 rounded-xl p-4 text-left text-xs text-gray-500 max-w-md w-full space-y-1">
              <p className="font-bold text-navy mb-2">확인해주세요:</p>
              <p>1. 카카오 개발자 콘솔 &gt; 내 애플리케이션 &gt; 플랫폼</p>
              <p>2. Web 플랫폼에 사이트 도메인 등록 (예: https://nol2seoul.vercel.app)</p>
              <p>3. JavaScript 키가 올바른지 확인</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-6 py-3 rounded-full font-bold text-sm mt-2"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {/* 로딩 표시 */}
      {!mapError && (!isLoaded || isLoading) && (
        <div className={`absolute inset-0 z-50 flex items-center justify-center ${isNightMode ? 'bg-gray-900/80' : 'bg-white/80'}`}>
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className={`font-bold ${isNightMode ? 'text-white' : 'text-navy'}`}>지도를 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* 카테고리 필터 */}
      <div className="absolute top-24 left-0 right-0 z-20 px-6 pointer-events-none">
        <div className="max-w-[1200px] mx-auto flex flex-col items-center gap-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setSelectedItem(null); setSubFilter('전체'); setIsListOpen(false); }}
                className={`px-6 py-2.5 rounded-full font-bold shadow-xl whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? cat === '야경명소' ? 'bg-indigo-600 text-white' : 'bg-primary text-white'
                    : isNightMode
                      ? 'bg-gray-800/90 backdrop-blur-md border border-gray-700 text-gray-200'
                      : 'bg-white/90 backdrop-blur-md border border-gray-100'
                }`}
              >
                {cat === '야경명소' && <span className="material-symbols-outlined text-sm align-middle mr-1">nightlight</span>}
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 지도 컨트롤 */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
        <div className={`flex flex-col rounded-2xl shadow-2xl p-1 ${isNightMode ? 'bg-gray-800' : 'bg-white'}`}>
          <button onClick={zoomIn} className={`size-11 flex items-center justify-center hover:text-primary ${isNightMode ? 'text-gray-300' : ''}`}>
            <span className="material-symbols-outlined">add</span>
          </button>
          <div className={`h-px mx-2 ${isNightMode ? 'bg-gray-700' : 'bg-gray-100'}`}></div>
          <button onClick={zoomOut} className={`size-11 flex items-center justify-center hover:text-primary ${isNightMode ? 'text-gray-300' : ''}`}>
            <span className="material-symbols-outlined">remove</span>
          </button>
        </div>
        <button
          onClick={moveToCurrentLocation}
          className={`size-11 rounded-2xl shadow-2xl flex items-center justify-center hover:text-primary ${isNightMode ? 'bg-gray-800 text-gray-300' : 'bg-white'}`}
        >
          <span className="material-symbols-outlined">my_location</span>
        </button>
      </div>

      {/* 선택된 아이템 정보 카드 */}
      {selectedItem && (() => {
        const info = getItemInfo(selectedItem);
        const isSpot = !('CODENAME' in selectedItem) && !('FAC_NAME' in selectedItem);
        const spot = isSpot ? selectedItem as NightViewSpot : null;

        if (spot) {
          return (
            <NightSpotDetailCard
              spot={spot}
              id={info.id}
              isFavorited={isFavorite(info.id, 'spot')}
              isNightMode={isNightMode}
              onToggleFavorite={() => toggleFavorite({ id: info.id, type: 'spot', title: info.title, location: info.location, image: info.image, category: '야경명소', date: info.date })}
              onClose={() => setSelectedItem(null)}
            />
          );
        }

        return (
          <div className={`absolute top-24 left-6 z-30 w-[360px] rounded-2xl shadow-2xl overflow-hidden ${isNightMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
            <button
              onClick={() => setSelectedItem(null)}
              className={`absolute top-3 right-3 z-10 size-8 rounded-full flex items-center justify-center backdrop-blur-md ${isNightMode ? 'bg-gray-900/60 text-white hover:bg-gray-900/80' : 'bg-white/60 text-gray-600 hover:bg-white/80'}`}
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>

            <div className="relative w-full h-[280px] bg-gray-100">
              {info.image ? (
                <img src={info.image} alt={info.title} className="w-full h-full object-contain bg-gray-50" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${isNightMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <span className={`material-symbols-outlined text-6xl ${isNightMode ? 'text-gray-500' : 'text-gray-300'}`}>
                    {info.category === '문화행사' ? 'event' : 'museum'}
                  </span>
                </div>
              )}
              <div className="absolute top-3 left-3">
                <span className="bg-primary text-white px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">{info.type}</span>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <h4 className={`font-black text-lg leading-tight ${isNightMode ? 'text-white' : 'text-navy'}`}>{info.title}</h4>
              <div className="space-y-2">
                <p className={`text-xs font-bold flex items-center gap-1.5 ${isNightMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {info.location}
                </p>
                {info.date && (
                  <p className={`text-xs font-bold flex items-center gap-1.5 ${isNightMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {info.date}
                  </p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => toggleFavorite({ id: info.id, type: info.favType, title: info.title, location: info.location, image: info.image, category: info.type, date: info.date })}
                  className={`flex-1 py-2.5 rounded-full font-bold text-sm flex items-center justify-center gap-1.5 transition-all ${
                    isFavorite(info.id, info.favType)
                      ? isNightMode ? 'bg-indigo-600 text-white' : 'bg-primary text-white'
                      : isNightMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-navy hover:bg-gray-200'
                  }`}
                >
                  <span className={`material-symbols-outlined text-lg ${isFavorite(info.id, info.favType) ? 'fill' : ''}`}>favorite</span>
                  {isFavorite(info.id, info.favType) ? '저장됨' : '저장'}
                </button>
                {'CODENAME' in selectedItem && (
                  <Link
                    to={`/event/${info.id}`}
                    className="flex-1 py-2.5 rounded-full font-bold text-sm flex items-center justify-center gap-1.5 bg-primary text-white hover:brightness-110 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    상세보기
                  </Link>
                )}
                {'FAC_NAME' in selectedItem && (
                  <Link
                    to={`/space/${info.id}`}
                    className="flex-1 py-2.5 rounded-full font-bold text-sm flex items-center justify-center gap-1.5 bg-primary text-white hover:brightness-110 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    상세보기
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 하단 바텀 시트 */}
      <div className={`absolute left-0 right-0 z-20 transition-all duration-300 ease-out ${
        isListOpen ? 'top-20 bottom-0' : 'bottom-0'
      }`}>
        <div className={`h-full flex flex-col ${isListOpen ? '' : 'justify-end'}`}>
          {/* 헤더 + 서브 필터 */}
          <div className={`px-6 pt-4 pb-3 rounded-t-3xl ${
            isListOpen
              ? isNightMode ? 'bg-gray-900 border-t border-gray-700' : 'bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]'
              : ''
          }`}>
            <div className="max-w-[1200px] mx-auto">
              {/* 타이틀 */}
              <div className="flex items-center justify-between mb-3">
                {selectedCategory === '문화행사' ? (
                  <Link
                    to="/events"
                    className={`font-black text-lg px-4 py-1.5 rounded-full w-fit backdrop-blur-md flex items-center gap-2 ${
                      isNightMode ? 'bg-gray-800/90 text-white' : 'bg-white/90 text-navy shadow-lg'
                    }`}
                  >
                    문화행사
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => setIsListOpen(!isListOpen)}
                    className={`font-black text-lg px-4 py-1.5 rounded-full w-fit backdrop-blur-md flex items-center gap-2 ${
                      isNightMode ? 'bg-gray-800/90 text-white' : 'bg-white/90 text-navy shadow-lg'
                    }`}
                  >
                    {selectedCategory === '전체' ? '추천 장소' : selectedCategory}
                    {isListOpen && (
                      <span className={`${isNightMode ? 'text-indigo-400' : 'text-primary'}`}>
                        {selectedCategory === '전체'
                          ? events.length + spaces.length + spots.length
                          : selectedCategory === '문화공간'
                            ? spaces.length
                            : spots.length}건
                      </span>
                    )}
                    <span className={`material-symbols-outlined text-sm transition-transform ${isListOpen ? 'rotate-180' : ''}`}>expand_less</span>
                  </button>
                )}
              </div>

              {/* 서브 카테고리 필터 */}
              {selectedCategory !== '전체' && subCategories.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {subCategories.map(sub => (
                    <button
                      key={sub}
                      onClick={() => setSubFilter(sub)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        subFilter === sub
                          ? isNightMode ? 'bg-indigo-600 text-white' : 'bg-primary text-white'
                          : isNightMode ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 컨텐츠 영역 */}
          {isListOpen && selectedCategory !== '문화행사' ? (
            /* 펼쳐진 리스트 */
            <div className={`flex-1 overflow-y-auto px-6 pb-6 ${isNightMode ? 'bg-gray-900' : 'bg-white'}`}>
              <div className="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {filteredItems.map(({ item }, i) => {
                  const info = getItemInfo(item);
                  const isSpotItem = !('CODENAME' in item) && !('FAC_NAME' in item);
                  const spotData = isSpotItem ? item as NightViewSpot : null;

                  return (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedItem(item);
                        setIsListOpen(false);
                      }}
                      className={`flex gap-4 p-3.5 rounded-xl cursor-pointer transition-all ${
                        isNightMode
                          ? 'hover:bg-gray-800 border border-gray-800 hover:border-gray-700'
                          : 'hover:bg-gray-50 border border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {/* 썸네일 / 아이콘 */}
                      {isSpotItem ? (
                        <div className="size-16 rounded-xl bg-gradient-to-br from-indigo-950 to-violet-950 flex items-center justify-center shrink-0 border border-indigo-500/20">
                          <span className="material-symbols-outlined text-2xl text-indigo-300">nightlight</span>
                        </div>
                      ) : info.image ? (
                        <img src={info.image} alt={info.title} className="size-16 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className={`size-16 rounded-xl flex items-center justify-center shrink-0 ${isNightMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          <span className={`material-symbols-outlined text-2xl ${isNightMode ? 'text-gray-500' : 'text-gray-300'}`}>
                            {'CODENAME' in item ? 'event' : 'museum'}
                          </span>
                        </div>
                      )}

                      {/* 텍스트 */}
                      <div className="min-w-0 flex-1">
                        <h4 className={`font-bold text-sm truncate ${isNightMode ? 'text-white' : 'text-navy'}`}>{info.title}</h4>
                        <p className={`text-[11px] font-bold truncate mt-0.5 ${isNightMode ? 'text-gray-400' : 'text-gray-400'}`}>
                          {info.location}
                        </p>
                        {spotData ? (
                          <div className="flex gap-3 mt-1.5">
                            {spotData.OPERATING_TIME && (
                              <span className="text-[10px] text-indigo-400 font-bold flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[11px]">schedule</span>
                                {spotData.OPERATING_TIME.length > 15 ? spotData.OPERATING_TIME.slice(0, 15) + '...' : spotData.OPERATING_TIME}
                              </span>
                            )}
                            {spotData.URL && (
                              <span className="text-[10px] text-indigo-400 font-bold flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[11px]">language</span>
                                홈페이지
                              </span>
                            )}
                          </div>
                        ) : info.date ? (
                          <p className={`text-[10px] font-bold mt-1 ${isNightMode ? 'text-gray-500' : 'text-gray-300'}`}>{info.date}</p>
                        ) : null}
                      </div>

                      {/* 즐겨찾기 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite({ id: info.id, type: info.favType, title: info.title, location: info.location, image: info.image, category: info.type, date: info.date });
                        }}
                        className={`shrink-0 self-center ${
                          isFavorite(info.id, info.favType)
                            ? isNightMode ? 'text-indigo-400' : 'text-primary'
                            : isNightMode ? 'text-gray-600' : 'text-gray-300'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-xl ${isFavorite(info.id, info.favType) ? 'fill' : ''}`}>favorite</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* 접힌 Swiper 카드 */
            <div className="px-6 pb-8">
              <div className="max-w-[1200px] mx-auto">
                <Swiper
                  modules={[FreeMode, Mousewheel]}
                  freeMode={{ enabled: true, sticky: false, momentumBounce: false }}
                  mousewheel={{ forceToAxis: true }}
                  slidesPerView="auto"
                  spaceBetween={16}
                  className="!overflow-visible"
                >
                  {getRecentItems().map(({ item, category }, i) => {
                    const info = getItemInfo(item);
                    const isSpotCard = !('CODENAME' in item) && !('FAC_NAME' in item);

                    return (
                      <SwiperSlide key={i} style={{ width: '280px', height: '218px' }}>
                        {isSpotCard ? (
                          <NightSpotSlideCard
                            spot={item as NightViewSpot}
                            id={info.id}
                            isFavorited={isFavorite(info.id, 'spot')}
                            onToggleFavorite={() => toggleFavorite({ id: info.id, type: 'spot', title: info.title, location: info.location, image: info.image, category: '야경명소', date: info.date })}
                            onClick={() => setSelectedItem(item)}
                          />
                        ) : (
                          <div
                            onClick={() => setSelectedItem(item)}
                            className={`rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full cursor-pointer transition-all hover:scale-[1.02] ${
                              isNightMode
                                ? 'bg-gray-800 border border-gray-700 hover:border-indigo-500'
                                : 'bg-white border border-gray-100 hover:border-primary'
                            }`}
                          >
                            <div className="relative h-[144px] shrink-0">
                              {info.image ? (
                                <img className="w-full h-full object-cover" src={info.image} alt={info.title} />
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center ${isNightMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                  <span className={`material-symbols-outlined text-4xl ${isNightMode ? 'text-gray-500' : 'text-gray-300'}`}>
                                    {'CODENAME' in item ? 'event' : 'museum'}
                                  </span>
                                </div>
                              )}
                              <div className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-black text-white ${
                                isNightMode ? 'bg-indigo-600' : 'bg-navy'
                              }`}>
                                {category}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite({ id: info.id, type: info.favType, title: info.title, location: info.location, image: info.image, category: info.type, date: info.date });
                                }}
                                className={`absolute top-2.5 right-2.5 size-8 rounded-full flex items-center justify-center backdrop-blur-md ${
                                  isFavorite(info.id, info.favType) ? 'bg-primary/80 text-white' : 'bg-white/50 text-gray-600 hover:text-primary'
                                }`}
                              >
                                <span className={`material-symbols-outlined text-lg ${isFavorite(info.id, info.favType) ? 'fill' : ''}`}>favorite</span>
                              </button>
                            </div>
                            <div className={`p-4 flex-1 ${isNightMode ? 'bg-gray-800' : 'bg-white'}`}>
                              <h4 className={`font-bold truncate ${isNightMode ? 'text-white' : 'text-navy'}`}>{info.title}</h4>
                              <p className="text-xs font-bold flex items-center gap-1 mt-1.5 text-gray-400">
                                <span className="material-symbols-outlined text-sm">location_on</span>
                                <span className="truncate">{info.location}</span>
                              </p>
                            </div>
                          </div>
                        )}
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapDiscovery;
