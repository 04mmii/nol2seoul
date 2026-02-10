
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Mousewheel } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import { useEvents, useFavorites } from '../hooks';

// 배너 슬라이드 데이터 - 이미지를 교체하려면 여기서 수정하세요
const BANNER_SLIDES = [
  {
    image: '/banners/banner1.jpg',
    fallback: 'https://picsum.photos/seed/seoul-night/1920/1080',
    badge: 'Featured',
    title: '서울의 문화를',
    highlight: '지금 만나보세요',
    description: '서울 곳곳에서 열리는 다양한 문화행사를 확인하세요.',
    link: '/events',
  },
  {
    image: '/banners/banner2.jpg',
    fallback: 'https://picsum.photos/seed/seoul-festival/1920/1080',
    badge: 'Hot',
    title: '지도에서 발견하는',
    highlight: '숨겨진 명소',
    description: '내 주변의 문화공간과 야경명소를 지도로 탐색해보세요.',
    link: '/map',
  },
  {
    image: '/banners/banner3.jpg',
    fallback: 'https://picsum.photos/seed/seoul-culture/1920/1080',
    badge: 'New',
    title: '서울의 밤을 수놓는',
    highlight: '야경 명소',
    description: '서울에서 가장 아름다운 야경 스팟을 만나보세요.',
    link: '/map',
  },
];

const Home: React.FC = () => {
  const { events, loading } = useEvents();
  const [eventTab, setEventTab] = useState<'today' | 'week'>('today');

  const recentEvents = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    if (eventTab === 'today') {
      return events.filter(e => {
        const start = (e.STRTDATE || '').slice(0, 10);
        const end = (e.END_DATE || '').slice(0, 10);
        return start <= todayStr && end >= todayStr;
      }).slice(0, 10);
    } else {
      return events.filter(e => {
        const start = (e.STRTDATE || '').slice(0, 10);
        const end = (e.END_DATE || '').slice(0, 10);
        return start <= weekLater && end >= todayStr;
      }).slice(0, 10);
    }
  }, [events, eventTab]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 700);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % BANNER_SLIDES.length);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length);
  }, [currentSlide, goToSlide]);

  // 자동 슬라이드 (5초 간격)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, isPaused]);

  const { toggleFavorite, isFavorite } = useFavorites();

  const isFree = (event: typeof events[0]) => {
    return event.IS_FREE === '무료' || (event.USE_FEE && event.USE_FEE.includes('무료'));
  };

  const slide = BANNER_SLIDES[currentSlide];

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Banner Slider */}
      <section
        className="relative w-full aspect-[21/9] md:rounded-xl overflow-hidden shadow-2xl max-w-[1200px] mx-auto mt-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Slides */}
        {BANNER_SLIDES.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out ${
              i === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
            style={{ backgroundImage: `url("${s.image}"), url("${s.fallback}")` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-navy/80 via-navy/40 to-transparent"></div>
          </div>
        ))}

        {/* Content */}
        <div className="relative h-full flex flex-col justify-center px-10 lg:px-20 text-white max-w-2xl z-10">
          <span
            className={`inline-block px-3 py-1 bg-primary rounded-full text-xs font-bold mb-4 uppercase tracking-widest w-fit transition-all duration-500 ${
              isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            }`}
          >
            {slide.badge}
          </span>
          <h2
            className={`text-4xl lg:text-5xl font-extrabold leading-tight mb-4 transition-all duration-500 delay-100 ${
              isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            }`}
          >
            {slide.title}<br />
            <span className="text-primary">{slide.highlight}</span>
          </h2>
          <p
            className={`text-lg text-gray-200 mb-8 opacity-90 transition-all duration-500 delay-200 ${
              isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            }`}
          >
            {slide.description}
          </p>
          <div
            className={`flex gap-4 transition-all duration-500 delay-300 ${
              isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            }`}
          >
            <Link to={slide.link} className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-full font-bold transition-all transform hover:translate-y-[-2px] shadow-lg shadow-primary/30">
              자세히 보기
            </Link>
            <Link to="/map" className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-8 py-3 rounded-full font-bold transition-all">
              지도 탐색
            </Link>
          </div>
        </div>

        {/* Arrow Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 size-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
          style={{ opacity: isPaused ? 1 : undefined }}
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 size-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
          style={{ opacity: isPaused ? 1 : undefined }}
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>

        {/* Navigation Dots + Progress */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {BANNER_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>

        {/* Slide Counter */}
        <div className="absolute top-6 right-6 z-20 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold">
          {currentSlide + 1} / {BANNER_SLIDES.length}
        </div>
      </section>

      {/* Main Container for sections */}
      <div className="max-w-[1200px] mx-auto px-6 space-y-16">

        {/* Quick Nav Categories */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link to="/events" className="group relative flex items-center justify-between p-6 bg-white rounded-xl border border-gray-100 hover:shadow-xl hover:border-primary/50 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">event</span>
              </div>
              <div>
                <p className="font-bold text-lg">문화행사</p>
                <p className="text-sm text-gray-500">서울 전역 축제 & 전시</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-gray-300 group-hover:text-primary transition-colors">arrow_forward_ios</span>
          </Link>
          <Link to="/map" className="group relative flex items-center justify-between p-6 bg-white rounded-xl border border-gray-100 hover:shadow-xl hover:border-blue-500/50 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined text-2xl">museum</span>
              </div>
              <div>
                <p className="font-bold text-lg">문화공간</p>
                <p className="text-sm text-gray-500">박물관, 미술관, 공연장</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-gray-300 group-hover:text-blue-600 transition-colors">arrow_forward_ios</span>
          </Link>
          <Link to="/map" className="group relative flex items-center justify-between p-6 bg-white rounded-xl border border-gray-100 hover:shadow-xl hover:border-indigo-500/50 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                <span className="material-symbols-outlined text-2xl">nightlight</span>
              </div>
              <div>
                <p className="font-bold text-lg">야경명소</p>
                <p className="text-sm text-gray-500">서울에서 가장 빛나는 곳</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-gray-300 group-hover:text-indigo-600 transition-colors">arrow_forward_ios</span>
          </Link>
        </section>

        {/* Discovery Section */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black flex items-center gap-2">
                지금 서울에서 열리는 행사
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              </h3>
              <p className="text-gray-500 mt-1">당신의 취향에 맞는 오늘의 서울을 발견하세요.</p>
            </div>
            <div className="flex p-1 bg-gray-100 rounded-full w-fit">
              <button
                onClick={() => setEventTab('today')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${eventTab === 'today' ? 'bg-white shadow-sm text-navy' : 'text-gray-500 hover:text-navy'}`}
              >오늘</button>
              <button
                onClick={() => setEventTab('week')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${eventTab === 'week' ? 'bg-white shadow-sm text-navy' : 'text-gray-500 hover:text-navy'}`}
              >이번주</button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Swiper
              modules={[FreeMode, Mousewheel]}
              freeMode={{ enabled: true, momentum: true, momentumRatio: 0.8, momentumBounceRatio: 0.6 }}
              mousewheel={{ forceToAxis: true }}
              slidesPerView="auto"
              spaceBetween={24}
              grabCursor={true}
              className="pb-6"
            >
              {recentEvents.map((event, idx) => {
                const free = isFree(event);
                return (
                  <SwiperSlide key={idx} className="!w-[280px] lg:!w-[320px]">
                    <Link
                      to={`/event/${idx}`}
                      draggable={false}
                      className="block bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all group/card"
                    >
                      <div className="relative h-48">
                        <img
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                          src={event.MAIN_IMG || 'https://picsum.photos/seed/default/800/600'}
                          alt={event.TITLE}
                          draggable={false}
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/default/800/600'; }}
                        />
                        {free && <div className="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase text-primary">무료 입장</div>}
                        <button
                          className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                            isFavorite(String(idx), 'event') ? 'bg-primary text-white' : 'bg-white/50 text-navy hover:bg-primary hover:text-white'
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            toggleFavorite({
                              id: String(idx),
                              type: 'event',
                              title: event.TITLE,
                              location: event.PLACE || event.GUNAME,
                              image: event.MAIN_IMG,
                              category: event.CODENAME,
                              date: event.DATE,
                            });
                          }}
                        >
                          <span className={`material-symbols-outlined text-xl ${isFavorite(String(idx), 'event') ? 'fill' : ''}`}>favorite</span>
                        </button>
                      </div>
                      <div className="p-5">
                        <p className="text-primary text-xs font-bold mb-2 uppercase tracking-wide">{event.CODENAME}</p>
                        <h4 className="text-lg font-bold mb-2 truncate">{event.TITLE}</h4>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            <span className="truncate">{event.PLACE || event.GUNAME}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                            <span>{event.DATE}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          )}
          <div className="flex justify-center">
            <Link to="/events" className="flex items-center gap-2 px-8 py-3 border border-gray-200 rounded-full text-sm font-bold text-navy hover:bg-navy hover:text-white transition-all">
              전체 행사 보기
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </section>

        {/* Promotion Map Card */}
        <section className="bg-navy rounded-xl p-8 lg:p-12 text-white overflow-hidden relative">
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="flex-1 space-y-6">
              <h3 className="text-3xl font-bold">내 주변의 <span className="text-primary">문화공간</span>을 찾아보세요</h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                지도에서 현재 위치를 기반으로 가장 가까운 박물관, 미술관, 그리고 숨겨진 명소를 실시간으로 확인할 수 있습니다.
              </p>
              <Link to="/map" className="flex items-center gap-2 bg-primary hover:bg-primary-dark px-8 py-3 rounded-full font-bold transition-all w-fit">
                <span className="material-symbols-outlined">map</span>
                지도에서 보기
              </Link>
            </div>
            <div className="w-full lg:w-1/3 aspect-square bg-white/5 rounded-xl overflow-hidden border-4 border-white/10 shadow-2xl rotate-2">
              <img className="w-full h-full object-cover" src="https://picsum.photos/seed/map/500/500" alt="Seoul Map Graphic" />
            </div>
          </div>
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
        </section>
      </div>
    </div>
  );
};

export default Home;
