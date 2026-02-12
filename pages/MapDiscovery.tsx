import { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Mousewheel } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import { useKakaoLoader, useEvents, useCulturalSpaces, useNightViewSpots, useFavorites } from '../hooks';
import type { Event, CulturalSpace, NightViewSpot, KakaoMap, KakaoMarker } from '../types';

type CategoryType = '전체' | '문화행사' | '문화공간' | '야경명소';

const MapDiscovery = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<KakaoMap | null>(null);
  const markersRef = useRef<KakaoMarker[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('전체');
  const [selectedItem, setSelectedItem] = useState<Event | CulturalSpace | NightViewSpot | null>(null);

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

  // 마커 업데이트
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    const { kakao } = window;
    const map = mapInstanceRef.current;

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

    if (selectedCategory === '전체' || selectedCategory === '문화행사') {
      events.slice(0, 4).forEach(e => items.push({ item: e, category: '문화행사' }));
    }
    if (selectedCategory === '전체' || selectedCategory === '문화공간') {
      spaces.slice(0, 4).forEach(s => items.push({ item: s, category: '문화공간' }));
    }
    if (selectedCategory === '전체' || selectedCategory === '야경명소') {
      spots.slice(0, 4).forEach(s => items.push({ item: s, category: '야경명소' }));
    }

    return items.slice(0, 10);
  };

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
                onClick={() => { setSelectedCategory(cat); setSelectedItem(null); }}
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

        return (
          <div className={`absolute top-24 left-6 z-30 w-[360px] rounded-2xl shadow-2xl overflow-hidden ${isNightMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
            <button
              onClick={() => setSelectedItem(null)}
              className={`absolute top-3 right-3 z-10 size-8 rounded-full flex items-center justify-center backdrop-blur-md ${isNightMode ? 'bg-gray-900/60 text-white hover:bg-gray-900/80' : 'bg-white/60 text-gray-600 hover:bg-white/80'}`}
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>

            {/* 야경명소: 그라디언트 헤더 / 나머지: 포스터 이미지 */}
            {spot ? (
              <div className="relative w-full bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 p-6 pb-5">
                <div className="absolute top-3 left-3">
                  <span className="bg-indigo-500/30 text-indigo-300 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-indigo-500/20">야경명소</span>
                </div>
                <div className="mt-6 flex items-start gap-4">
                  <div className="size-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/20">
                    <span className="material-symbols-outlined text-3xl text-indigo-300">nightlight</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-lg text-white leading-tight">{info.title}</h4>
                    <p className="text-indigo-300/70 text-xs font-bold mt-1 truncate">{info.location}</p>
                  </div>
                </div>
              </div>
            ) : (
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
            )}

            {/* 상세 정보 */}
            <div className={`p-5 space-y-3 ${isNightMode ? '' : ''}`}>
              {!spot && <h4 className={`font-black text-lg leading-tight ${isNightMode ? 'text-white' : 'text-navy'}`}>{info.title}</h4>}

              {/* 야경명소 전용 정보 */}
              {spot ? (
                <div className="space-y-2.5">
                  {spot.OPERATING_TIME && (
                    <div className={`flex items-start gap-2.5 text-xs ${isNightMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="material-symbols-outlined text-sm text-indigo-400 mt-0.5 shrink-0">schedule</span>
                      <div>
                        <p className="font-black text-[10px] text-indigo-400 uppercase tracking-widest mb-0.5">운영시간</p>
                        <p className="font-bold">{spot.OPERATING_TIME}</p>
                      </div>
                    </div>
                  )}
                  {spot.ENTR_FEE && (
                    <div className={`flex items-start gap-2.5 text-xs ${isNightMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="material-symbols-outlined text-sm text-indigo-400 mt-0.5 shrink-0">payments</span>
                      <div>
                        <p className="font-black text-[10px] text-indigo-400 uppercase tracking-widest mb-0.5">입장료</p>
                        <p className="font-bold">{spot.ENTR_FEE}</p>
                      </div>
                    </div>
                  )}
                  {spot.SUBWAY && (
                    <div className={`flex items-start gap-2.5 text-xs ${isNightMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="material-symbols-outlined text-sm text-indigo-400 mt-0.5 shrink-0">subway</span>
                      <div>
                        <p className="font-black text-[10px] text-indigo-400 uppercase tracking-widest mb-0.5">지하철</p>
                        <p className="font-bold">{spot.SUBWAY}</p>
                      </div>
                    </div>
                  )}
                  {spot.CONTENT && (
                    <p className={`text-xs leading-relaxed line-clamp-3 ${isNightMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {spot.CONTENT}
                    </p>
                  )}
                </div>
              ) : (
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
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => toggleFavorite({
                    id: info.id,
                    type: info.favType,
                    title: info.title,
                    location: info.location,
                    image: info.image,
                    category: info.type,
                    date: info.date,
                  })}
                  className={`flex-1 py-2.5 rounded-full font-bold text-sm flex items-center justify-center gap-1.5 transition-all ${
                    isFavorite(info.id, info.favType)
                      ? isNightMode ? 'bg-indigo-600 text-white' : 'bg-primary text-white'
                      : isNightMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-navy hover:bg-gray-200'
                  }`}
                >
                  <span className={`material-symbols-outlined text-lg ${isFavorite(info.id, info.favType) ? 'fill' : ''}`}>favorite</span>
                  {isFavorite(info.id, info.favType) ? '저장됨' : '저장'}
                </button>
                {spot?.URL && (
                  <a
                    href={spot.URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 py-2.5 rounded-full font-bold text-sm flex items-center justify-center gap-1.5 transition-all ${
                      isNightMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-primary text-white hover:brightness-110'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">open_in_new</span>
                    상세보기
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 하단 Swiper 카드 슬라이드 */}
      <div className="absolute bottom-8 left-0 right-0 z-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-black text-lg px-4 py-1.5 rounded-full w-fit backdrop-blur-md ${
              isNightMode ? 'bg-gray-900/60 text-white' : 'bg-white/70 text-navy'
            }`}>
              {selectedCategory === '전체' ? '추천 장소' : selectedCategory}
              <span className={`ml-2 ${isNightMode ? 'text-indigo-400' : 'text-primary'}`}>
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
              const spotData = isSpotCard ? item as NightViewSpot : null;

              return (
                <SwiperSlide key={i} style={{ width: isSpotCard ? '260px' : '280px' }}>
                  <div
                    onClick={() => setSelectedItem(item)}
                    className={`rounded-2xl overflow-hidden shadow-2xl flex flex-col cursor-pointer transition-all hover:scale-[1.02] ${
                      isSpotCard
                        ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 border border-indigo-500/20 hover:border-indigo-400/50'
                        : isNightMode
                          ? 'bg-gray-800 border border-gray-700 hover:border-indigo-500'
                          : 'bg-white border border-gray-100 hover:border-primary'
                    }`}
                  >
                    {/* 야경명소: 아이콘 + 텍스트 카드 */}
                    {isSpotCard ? (
                      <div className="p-5 flex flex-col h-[200px]">
                        <div className="flex items-center justify-between mb-3">
                          <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md text-[10px] font-black border border-indigo-500/20">야경명소</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite({ id: info.id, type: info.favType, title: info.title, location: info.location, image: info.image, category: info.type, date: info.date });
                            }}
                            className={`size-7 rounded-full flex items-center justify-center ${
                              isFavorite(info.id, info.favType) ? 'text-indigo-300' : 'text-indigo-500/50 hover:text-indigo-300'
                            }`}
                          >
                            <span className={`material-symbols-outlined text-lg ${isFavorite(info.id, info.favType) ? 'fill' : ''}`}>favorite</span>
                          </button>
                        </div>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="size-10 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0 border border-indigo-500/15">
                            <span className="material-symbols-outlined text-xl text-indigo-300">nightlight</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-white truncate text-sm">{info.title}</h4>
                            <p className="text-indigo-300/60 text-[11px] font-bold truncate mt-0.5">{info.location}</p>
                          </div>
                        </div>
                        <div className="mt-auto space-y-1.5">
                          {spotData?.OPERATING_TIME && (
                            <p className="text-[11px] text-indigo-200/60 font-bold flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-xs text-indigo-400/60">schedule</span>
                              <span className="truncate">{spotData.OPERATING_TIME}</span>
                            </p>
                          )}
                          {spotData?.ENTR_FEE && (
                            <p className="text-[11px] text-indigo-200/60 font-bold flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-xs text-indigo-400/60">payments</span>
                              <span className="truncate">{spotData.ENTR_FEE}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* 문화행사/문화공간: 이미지 카드 */}
                        <div className="relative h-36">
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
                        <div className={`p-4 ${isNightMode ? 'bg-gray-800' : 'bg-white'}`}>
                          <h4 className={`font-bold truncate ${isNightMode ? 'text-white' : 'text-navy'}`}>{info.title}</h4>
                          <p className={`text-xs font-bold flex items-center gap-1 mt-1.5 text-gray-400`}>
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            <span className="truncate">{info.location}</span>
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default MapDiscovery;
