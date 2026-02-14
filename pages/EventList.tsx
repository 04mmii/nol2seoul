import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useFavorites } from '../hooks';

const ITEMS_PER_PAGE = 12;

const EventList: React.FC = () => {
  const { events, loading, isError } = useEvents();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [feeFilter, setFeeFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [page, setPage] = useState(1);

  // 카테고리 목록
  const categories = useMemo(() => {
    const codes = [...new Set(events.map(e => e.CODENAME).filter(Boolean))];
    return ['전체', ...codes];
  }, [events]);

  // 필터링
  const filteredEvents = useMemo(() => {
    let list = events;
    if (selectedCategory !== '전체') {
      list = list.filter(e => e.CODENAME === selectedCategory);
    }
    if (feeFilter === 'free') {
      list = list.filter(e => e.IS_FREE === '무료');
    } else if (feeFilter === 'paid') {
      list = list.filter(e => e.IS_FREE !== '무료');
    }
    return list;
  }, [events, selectedCategory, feeFilter]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const pagedEvents = filteredEvents.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-20 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-navy font-bold">문화행사를 불러오는 중...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">error</span>
        <p className="text-gray-500 font-bold">문화행사를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10 pb-24">
      {/* 헤더 */}
      <div className="mb-8 space-y-4">
        <h2 className="text-3xl font-black">문화행사 탐색</h2>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 유무료 필터 */}
        <div className="flex gap-2">
          {([['all', '전체'], ['free', '무료'], ['paid', '유료']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setFeeFilter(key); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                feeFilter === key
                  ? 'bg-navy text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 결과 수 */}
      <div className="flex items-baseline justify-between mb-8">
        <h3 className="text-lg font-bold">
          총 <span className="text-primary">{filteredEvents.length}</span>건의 문화행사
        </h3>
      </div>

      {/* 행사 목록 */}
      {pagedEvents.length === 0 ? (
        <div className="py-20 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-300 block mb-4">search_off</span>
          <p className="text-gray-400 font-bold">조건에 맞는 행사가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {pagedEvents.map((event) => {
            const idx = events.indexOf(event);
            const favId = String(idx);
            const isFree = event.IS_FREE === '무료';

            return (
              <div
                key={idx}
                className="bg-white rounded-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row group hover:shadow-xl transition-all"
              >
                {/* 이미지 */}
                <div className="relative w-full md:w-64 h-48 md:h-auto overflow-hidden shrink-0">
                  {event.MAIN_IMG ? (
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={event.MAIN_IMG}
                      alt={event.TITLE}
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/event/600/400'; }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-gray-300">event</span>
                    </div>
                  )}
                  <div className={`absolute top-3 left-3 px-3 py-1 ${isFree ? 'bg-primary' : 'bg-gray-500'} text-white text-[10px] font-bold rounded-full shadow-lg`}>
                    {isFree ? '무료' : '유료'}
                  </div>
                  {event.CODENAME && (
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-navy/80 backdrop-blur-sm text-white text-[10px] font-bold rounded-full">
                      {event.CODENAME}
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <Link to={`/event/${idx}`} className="text-xl font-bold leading-snug group-hover:text-primary transition-colors">
                        {event.TITLE}
                      </Link>
                      <button
                        onClick={() => toggleFavorite({ id: favId, type: 'event', title: event.TITLE, location: event.PLACE || event.GUNAME, image: event.MAIN_IMG, category: event.CODENAME, date: event.DATE })}
                        className={`shrink-0 ml-3 transition-colors ${isFavorite(favId, 'event') ? 'text-primary' : 'text-gray-300 hover:text-primary'}`}
                      >
                        <span className={`material-symbols-outlined ${isFavorite(favId, 'event') ? 'fill' : ''}`}>favorite</span>
                      </button>
                    </div>
                    <div className="space-y-1 text-sm text-gray-500 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary/70 text-base">calendar_month</span>
                        <span>{event.DATE}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary/70 text-base">location_on</span>
                        <span>{event.PLACE || event.GUNAME}</span>
                      </div>
                      {event.USE_FEE && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary/70 text-base">payments</span>
                          <span className="truncate">{event.USE_FEE}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    {event.USE_TRGT && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold truncate max-w-[200px]">
                        {event.USE_TRGT}
                      </span>
                    )}
                    <Link
                      to={`/event/${idx}`}
                      className="px-6 py-2 bg-navy text-white rounded-full text-sm font-bold hover:bg-primary transition-colors ml-auto"
                    >
                      상세보기
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-16 flex justify-center items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:text-primary disabled:opacity-30"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          {getPageNumbers().map((p, i) =>
            p === '...' ? (
              <span key={`dot-${i}`} className="px-2 text-gray-400">...</span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-full font-bold ${
                  page === p ? 'bg-primary text-white' : 'border border-gray-100 hover:text-primary'
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:text-primary disabled:opacity-30"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      )}

      {/* 지도 보기 FAB */}
      <Link
        to="/map"
        className="fixed bottom-10 right-10 bg-primary text-white flex items-center gap-2 px-6 py-4 rounded-full shadow-2xl font-bold transition-transform hover:scale-105 active:scale-95 z-40"
      >
        <span className="material-symbols-outlined">map</span>
        지도 보기
      </Link>
    </div>
  );
};

export default EventList;
