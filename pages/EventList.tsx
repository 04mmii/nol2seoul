
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useFavorites } from '../hooks';

const EventList: React.FC = () => {
  const [filter, setFilter] = useState('latest');
  const [selectedGu, setSelectedGu] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const { events, loading, isError } = useEvents();
  const { toggleFavorite, isFavorite } = useFavorites();

  // 필터링된 이벤트
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    if (selectedGu) {
      filtered = filtered.filter(e => e.GUNAME === selectedGu);
    }
    if (selectedGenre) {
      filtered = filtered.filter(e => e.CODENAME === selectedGenre);
    }

    // 정렬
    if (filter === 'latest') {
      filtered.sort((a, b) => (b.STRTDATE || '').localeCompare(a.STRTDATE || ''));
    } else if (filter === 'ending') {
      filtered.sort((a, b) => (a.END_DATE || '').localeCompare(b.END_DATE || ''));
    }

    return filtered;
  }, [events, filter, selectedGu, selectedGenre]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // 자치구 목록 추출
  const guList = useMemo(() => {
    const set = new Set(events.map(e => e.GUNAME).filter(Boolean));
    return Array.from(set).sort();
  }, [events]);

  // 장르(CODENAME) 목록 추출
  const genreList = useMemo(() => {
    const set = new Set(events.map(e => e.CODENAME).filter(Boolean));
    return Array.from(set).sort();
  }, [events]);

  const formatDate = (event: typeof events[0]) => {
    if (event.STRTDATE && event.END_DATE) {
      return `${event.STRTDATE.slice(0, 10)} ~ ${event.END_DATE.slice(0, 10)}`;
    }
    return event.DATE || '';
  };

  const isFree = (event: typeof events[0]) => {
    return event.IS_FREE === '무료' || (event.USE_FEE && event.USE_FEE.includes('무료'));
  };

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto px-6 py-20 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-navy font-bold">문화행사를 불러오는 중...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-[900px] mx-auto px-6 py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">error</span>
        <p className="text-gray-500 font-bold">데이터를 불러오는데 실패했습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10 pb-24">
      {/* Search Header */}
      <div className="mb-10 space-y-4">
        <h2 className="text-3xl font-black">문화행사 탐색</h2>
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          <select
            value={selectedGu}
            onChange={e => { setSelectedGu(e.target.value); setCurrentPage(1); }}
            className="w-40 px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium hover:border-primary appearance-none cursor-pointer"
          >
            <option value="">자치구 전체</option>
            {guList.map(gu => (
              <option key={gu} value={gu}>{gu}</option>
            ))}
          </select>
          <select
            value={selectedGenre}
            onChange={e => { setSelectedGenre(e.target.value); setCurrentPage(1); }}
            className="w-40 px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium hover:border-primary appearance-none cursor-pointer"
          >
            <option value="">장르 전체</option>
            {genreList.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sorting & Result Count */}
      <div className="flex items-baseline justify-between mb-8">
        <h3 className="text-lg font-bold">총 <span className="text-primary">{filteredEvents.length}</span>건의 문화행사</h3>
        <div className="flex gap-4 text-sm font-bold text-gray-400">
          <button className={`${filter === 'latest' ? 'text-primary' : 'hover:text-navy'} transition-colors`} onClick={() => setFilter('latest')}>최신순</button>
          <button className={`${filter === 'ending' ? 'text-primary' : 'hover:text-navy'} transition-colors`} onClick={() => setFilter('ending')}>종료임박순</button>
        </div>
      </div>

      {/* List Grid - 2열 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paginatedEvents.map((event, idx) => {
          const eventIndex = (currentPage - 1) * ITEMS_PER_PAGE + idx;
          const free = isFree(event);
          return (
            <Link to={`/event/${eventIndex}`} key={eventIndex} className="bg-white rounded-xl overflow-hidden border border-gray-100 flex h-52 group hover:shadow-xl transition-all">
              <div className="relative w-40 h-52 shrink-0 bg-gray-50">
                <img
                  className="w-full h-full object-contain"
                  src={event.MAIN_IMG || 'https://picsum.photos/seed/default/600/400'}
                  alt={event.TITLE}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/default/600/400'; }}
                />
                <div className={`absolute top-3 left-3 px-3 py-1 ${free ? 'bg-primary' : 'bg-gray-500'} text-white text-[10px] font-bold rounded-full shadow-lg`}>
                  {free ? '무료' : '유료'}
                </div>
              </div>
              <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold leading-snug group-hover:text-primary transition-colors">{event.TITLE}</h4>
                    <button
                      className={`shrink-0 ml-2 transition-colors ${isFavorite(String(eventIndex), 'event') ? 'text-primary' : 'text-gray-300 hover:text-primary'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite({
                          id: String(eventIndex),
                          type: 'event',
                          title: event.TITLE,
                          location: event.PLACE || event.GUNAME,
                          image: event.MAIN_IMG,
                          category: event.CODENAME,
                          date: formatDate(event),
                        });
                      }}
                    >
                      <span className={`material-symbols-outlined ${isFavorite(String(eventIndex), 'event') ? 'fill' : ''}`}>favorite</span>
                    </button>
                  </div>
                  <div className="space-y-1 text-sm text-gray-500 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary/70 text-base">calendar_month</span>
                      <span>{formatDate(event)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary/70 text-base">location_on</span>
                      <span className="truncate">{event.PLACE || event.GUNAME}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">{event.CODENAME}</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">{event.GUNAME}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-16 flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:text-primary disabled:opacity-30"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let page: number;
            if (totalPages <= 5) {
              page = i + 1;
            } else if (currentPage <= 3) {
              page = i + 1;
            } else if (currentPage >= totalPages - 2) {
              page = totalPages - 4 + i;
            } else {
              page = currentPage - 2 + i;
            }
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  currentPage === page
                    ? 'bg-primary text-white'
                    : 'border border-gray-100 hover:text-primary'
                }`}
              >
                {page}
              </button>
            );
          })}
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span className="px-2 text-gray-400">...</span>
              <button
                onClick={() => setCurrentPage(totalPages)}
                className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:text-primary font-bold"
              >
                {totalPages}
              </button>
            </>
          )}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:text-primary disabled:opacity-30"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <Link to="/map" className="fixed bottom-10 right-10 bg-primary text-white flex items-center gap-2 px-6 py-4 rounded-full shadow-2xl font-bold transition-transform hover:scale-105 active:scale-95 z-40">
        <span className="material-symbols-outlined">map</span>
        지도 보기
      </Link>
    </div>
  );
};

export default EventList;
