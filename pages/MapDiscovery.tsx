import { useEffect, useRef, useState } from 'react';
import { useKakaoLoader, useEvents, useCulturalSpaces, useNightViewSpots } from '../hooks';
import type { Event, CulturalSpace, NightViewSpot, KakaoMap, KakaoMarker } from '../types';

type CategoryType = '전체' | '문화행사' | '문화공간' | '야경명소';

const MapDiscovery = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<KakaoMap | null>(null);
  const markersRef = useRef<KakaoMarker[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('전체');
  const [selectedItem, setSelectedItem] = useState<Event | CulturalSpace | NightViewSpot | null>(null);

  const { isLoaded } = useKakaoLoader();
  const { events, loading: eventsLoading } = useEvents();
  const { spaces, loading: spacesLoading } = useCulturalSpaces();
  const { spots, loading: spotsLoading } = useNightViewSpots();

  const isLoading = eventsLoading || spacesLoading || spotsLoading;

  // 카카오 지도 초기화
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const { kakao } = window;
    const mapOption = {
      center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울 시청
      level: 8,
    };

    mapInstanceRef.current = new kakao.maps.Map(mapRef.current, mapOption);
  }, [isLoaded]);

  // 마커 업데이트
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    const { kakao } = window;
    const map = mapInstanceRef.current;

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const createMarker = (lat: number, lng: number, item: Event | CulturalSpace | NightViewSpot) => {
      const position = new kakao.maps.LatLng(lat, lng);
      const marker = new kakao.maps.Marker({ position, map });

      kakao.maps.event.addListener(marker, 'click', () => {
        setSelectedItem(item);
        map.panTo(position);
      });

      return marker;
    };

    // 카테고리별 마커 생성
    if (selectedCategory === '전체' || selectedCategory === '문화행사') {
      events.forEach(event => {
        if (event.LAT && event.LOT) {
          const lat = parseFloat(event.LAT);
          const lng = parseFloat(event.LOT);
          if (!isNaN(lat) && !isNaN(lng)) {
            markersRef.current.push(createMarker(lat, lng, event));
          }
        }
      });
    }

    if (selectedCategory === '전체' || selectedCategory === '문화공간') {
      spaces.forEach(space => {
        if (space.X_COORD && space.Y_COORD) {
          markersRef.current.push(createMarker(space.Y_COORD, space.X_COORD, space));
        }
      });
    }

    if (selectedCategory === '전체' || selectedCategory === '야경명소') {
      spots.forEach(spot => {
        if (spot.LA && spot.LO) {
          const lat = parseFloat(spot.LA);
          const lng = parseFloat(spot.LO);
          if (!isNaN(lat) && !isNaN(lng)) {
            markersRef.current.push(createMarker(lat, lng, spot));
          }
        }
      });
    }
  }, [isLoaded, selectedCategory, events, spaces, spots]);

  // 현재 위치로 이동
  const moveToCurrentLocation = () => {
    if (!mapInstanceRef.current) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const moveLatLng = new window.kakao.maps.LatLng(latitude, longitude);
        mapInstanceRef.current?.panTo(moveLatLng);
        mapInstanceRef.current?.setLevel(5);
      },
      (error) => {
        console.error('위치 정보를 가져올 수 없습니다:', error);
      }
    );
  };

  // 줌 컨트롤
  const zoomIn = () => {
    if (!mapInstanceRef.current) return;
    const level = mapInstanceRef.current.getLevel();
    mapInstanceRef.current.setLevel(level - 1);
  };

  const zoomOut = () => {
    if (!mapInstanceRef.current) return;
    const level = mapInstanceRef.current.getLevel();
    mapInstanceRef.current.setLevel(level + 1);
  };

  // 아이템 정보 가져오기
  const getItemInfo = (item: Event | CulturalSpace | NightViewSpot) => {
    if ('CODENAME' in item) {
      // Event
      return {
        title: item.TITLE,
        location: item.PLACE || item.GUNAME,
        date: item.DATE,
        image: item.MAIN_IMG,
        type: item.CODENAME,
      };
    } else if ('FAC_NAME' in item) {
      // CulturalSpace
      return {
        title: item.FAC_NAME,
        location: item.ADDR,
        date: item.CLOSEDAY ? `휴관일: ${item.CLOSEDAY}` : '',
        image: item.MAIN_IMG || item.IMG_URL,
        type: '문화공간',
      };
    } else {
      // NightViewSpot
      return {
        title: item.TITLE,
        location: item.ADDR,
        date: item.OPERATING_TIME,
        image: item.MAIN_IMG,
        type: '야경명소',
      };
    }
  };

  // 카테고리별 최근 아이템
  const getRecentItems = () => {
    const items: Array<{ item: Event | CulturalSpace | NightViewSpot; category: string }> = [];

    if (selectedCategory === '전체' || selectedCategory === '문화행사') {
      events.slice(0, 3).forEach(e => items.push({ item: e, category: '문화행사' }));
    }
    if (selectedCategory === '전체' || selectedCategory === '문화공간') {
      spaces.slice(0, 3).forEach(s => items.push({ item: s, category: '문화공간' }));
    }
    if (selectedCategory === '전체' || selectedCategory === '야경명소') {
      spots.slice(0, 3).forEach(s => items.push({ item: s, category: '야경명소' }));
    }

    return items.slice(0, 6);
  };

  const categories: CategoryType[] = ['전체', '문화행사', '문화공간', '야경명소'];

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-200">
      {/* 카카오 지도 */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* 로딩 표시 */}
      {(!isLoaded || isLoading) && (
        <div className="absolute inset-0 z-50 bg-white/80 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-navy font-bold">지도를 불러오는 중...</p>
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
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-full font-bold shadow-xl whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-white/90 backdrop-blur-md border border-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 지도 컨트롤 */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4">
        <div className="flex flex-col bg-white rounded-2xl shadow-2xl p-1">
          <button onClick={zoomIn} className="size-12 flex items-center justify-center hover:text-primary">
            <span className="material-symbols-outlined">add</span>
          </button>
          <div className="h-px bg-gray-100 mx-2"></div>
          <button onClick={zoomOut} className="size-12 flex items-center justify-center hover:text-primary">
            <span className="material-symbols-outlined">remove</span>
          </button>
        </div>
        <button onClick={moveToCurrentLocation} className="size-12 bg-white rounded-2xl shadow-2xl flex items-center justify-center hover:text-primary">
          <span className="material-symbols-outlined">my_location</span>
        </button>
      </div>

      {/* 선택된 아이템 정보 */}
      {selectedItem && (
        <div className="absolute top-36 left-6 z-30 bg-white rounded-2xl shadow-2xl p-4 max-w-sm">
          <button
            onClick={() => setSelectedItem(null)}
            className="absolute -top-2 -right-2 size-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
          {(() => {
            const info = getItemInfo(selectedItem);
            return (
              <>
                {info.image && (
                  <img src={info.image} alt={info.title} className="w-full h-32 object-cover rounded-xl mb-3" />
                )}
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded">{info.type}</span>
                <h4 className="font-bold text-navy mt-2">{info.title}</h4>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {info.location}
                </p>
                {info.date && (
                  <p className="text-xs text-gray-400 mt-1">{info.date}</p>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* 하단 카드 캐러셀 */}
      <div className="absolute bottom-10 left-0 right-0 z-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-navy font-black text-xl bg-white/50 backdrop-blur-md px-4 py-1 rounded-full w-fit">
              {selectedCategory === '전체' ? '추천 장소' : selectedCategory}
              <span className="text-primary ml-2">
                {selectedCategory === '전체'
                  ? events.length + spaces.length + spots.length
                  : selectedCategory === '문화행사'
                    ? events.length
                    : selectedCategory === '문화공간'
                      ? spaces.length
                      : spots.length}건
              </span>
            </h3>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
            {getRecentItems().map(({ item, category }, i) => {
              const info = getItemInfo(item);
              return (
                <div
                  key={i}
                  onClick={() => setSelectedItem(item)}
                  className="min-w-[320px] bg-white rounded-2xl overflow-hidden shadow-2xl snap-center flex flex-col border border-gray-100 cursor-pointer hover:border-primary transition-colors"
                >
                  <div className="relative h-40">
                    {info.image ? (
                      <img className="w-full h-full object-cover" src={info.image} alt={info.title} />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-gray-400">image</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-md text-[10px] font-black text-white bg-navy">
                      {category}
                    </div>
                    <button className="absolute top-3 right-3 size-8 bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center hover:text-primary">
                      <span className="material-symbols-outlined text-xl">favorite</span>
                    </button>
                  </div>
                  <div className="p-4 bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-navy truncate w-48">{info.title}</h4>
                        <p className="text-xs text-gray-400 font-bold flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {info.location}
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded">
                        {info.type}
                      </span>
                    </div>
                    {info.date && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-xs font-bold text-gray-500">{info.date}</p>
                        <button className="text-primary text-xs font-bold flex items-center">
                          상세보기 <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapDiscovery;
