
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEvents, useCulturalSpaces, useNightViewSpots } from '../hooks';

interface SearchOverlayProps {
  onClose: () => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('nolseoul-recent') || '[]');
    } catch { return []; }
  });

  const { events } = useEvents();
  const { spaces } = useCulturalSpaces();
  const { spots } = useNightViewSpots();

  // 검색어 저장
  const addRecent = (term: string) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 8);
    setRecentSearches(updated);
    localStorage.setItem('nolseoul-recent', JSON.stringify(updated));
  };

  const removeRecent = (term: string) => {
    const updated = recentSearches.filter(s => s !== term);
    setRecentSearches(updated);
    localStorage.setItem('nolseoul-recent', JSON.stringify(updated));
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('nolseoul-recent');
  };

  // 검색 결과
  const searchResults = useMemo(() => {
    if (query.length < 1) return { events: [], spaces: [], spots: [] };
    const q = query.toLowerCase();
    return {
      events: events.filter(e =>
        e.TITLE?.toLowerCase().includes(q) ||
        e.PLACE?.toLowerCase().includes(q) ||
        e.CODENAME?.toLowerCase().includes(q) ||
        e.GUNAME?.toLowerCase().includes(q)
      ).slice(0, 6),
      spaces: spaces.filter(s =>
        s.FAC_NAME?.toLowerCase().includes(q) ||
        s.ADDR?.toLowerCase().includes(q)
      ).slice(0, 4),
      spots: spots.filter(s =>
        s.TITLE?.toLowerCase().includes(q) ||
        s.ADDR?.toLowerCase().includes(q)
      ).slice(0, 4),
    };
  }, [query, events, spaces, spots]);

  const hasResults = searchResults.events.length > 0 || searchResults.spaces.length > 0 || searchResults.spots.length > 0;

  // 인기 장르 (행사 수 기준)
  const popularGenres = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      if (e.CODENAME) counts[e.CODENAME] = (counts[e.CODENAME] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [events]);

  // 추천 행사 (랜덤 3개)
  const recommended = useMemo(() => {
    if (events.length === 0) return [];
    const shuffled = [...events].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [events]);

  const handleSearch = (term: string) => {
    setQuery(term);
    addRecent(term);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col overflow-y-auto">
      {/* Header with Search Input */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 z-10">
        <div className="flex-1 flex items-center bg-gray-100 rounded-full px-5 h-12">
          <span className="material-symbols-outlined text-gray-400">search</span>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && query.trim()) addRecent(query.trim()); }}
            className="flex-1 bg-transparent border-none focus:ring-0 text-lg font-medium placeholder:text-gray-400"
            placeholder="행사, 장소, 키워드를 검색해보세요"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-200 rounded-full text-gray-400">
              <span className="material-symbols-outlined">cancel</span>
            </button>
          )}
        </div>
        <button onClick={onClose} className="text-sm font-bold text-navy px-4">취소</button>
      </div>

      <div className="max-w-4xl mx-auto w-full px-6 py-10 space-y-12">
        {/* 검색 결과 */}
        {query.length > 0 ? (
          hasResults ? (
            <>
              {/* 문화행사 결과 */}
              {searchResults.events.length > 0 && (
                <section>
                  <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">event</span>
                    문화행사
                    <span className="text-sm font-bold text-gray-400 ml-1">{searchResults.events.length}</span>
                  </h2>
                  <div className="space-y-2">
                    {searchResults.events.map((event, i) => {
                      const idx = events.indexOf(event);
                      return (
                        <Link
                          key={i}
                          to={`/event/${idx}`}
                          onClick={() => { addRecent(query); onClose(); }}
                          className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl cursor-pointer group transition-all"
                        >
                          <div className="size-14 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                            {event.MAIN_IMG ? (
                              <img className="size-full object-cover" src={event.MAIN_IMG} alt={event.TITLE} />
                            ) : (
                              <div className="size-full flex items-center justify-center text-gray-300">
                                <span className="material-symbols-outlined">image</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold group-hover:text-primary transition-colors truncate">{event.TITLE}</p>
                            <p className="text-xs text-gray-400 font-bold mt-0.5">{event.PLACE} · {event.CODENAME}</p>
                          </div>
                          <span className="material-symbols-outlined text-gray-200 group-hover:text-primary shrink-0">arrow_forward_ios</span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 문화공간 결과 */}
              {searchResults.spaces.length > 0 && (
                <section>
                  <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-500 text-xl">museum</span>
                    문화공간
                    <span className="text-sm font-bold text-gray-400 ml-1">{searchResults.spaces.length}</span>
                  </h2>
                  <div className="space-y-2">
                    {searchResults.spaces.map((space, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl cursor-pointer group transition-all">
                        <div className="size-14 rounded-xl overflow-hidden shrink-0 bg-blue-50 flex items-center justify-center">
                          <span className="material-symbols-outlined text-blue-400">museum</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold group-hover:text-blue-500 transition-colors truncate">{space.FAC_NAME}</p>
                          <p className="text-xs text-gray-400 font-bold mt-0.5 truncate">{space.ADDR}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 야경명소 결과 */}
              {searchResults.spots.length > 0 && (
                <section>
                  <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-500 text-xl">nightlight</span>
                    야경명소
                    <span className="text-sm font-bold text-gray-400 ml-1">{searchResults.spots.length}</span>
                  </h2>
                  <div className="space-y-2">
                    {searchResults.spots.map((spot, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl cursor-pointer group transition-all">
                        <div className="size-14 rounded-xl overflow-hidden shrink-0 bg-indigo-50 flex items-center justify-center">
                          <span className="material-symbols-outlined text-indigo-400">nightlight</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold group-hover:text-indigo-500 transition-colors truncate">{spot.TITLE}</p>
                          <p className="text-xs text-gray-400 font-bold mt-0.5 truncate">{spot.ADDR}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center py-20 text-gray-400">
              <span className="material-symbols-outlined text-5xl mb-4">search_off</span>
              <p className="font-bold text-lg">'{query}'에 대한 검색 결과가 없습니다</p>
              <p className="text-sm mt-2">다른 키워드로 검색해보세요</p>
            </div>
          )
        ) : (
          <>
            {/* 추천 행사 */}
            {recommended.length > 0 && (
              <section>
                <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">auto_awesome</span>
                  추천 행사
                </h2>
                <div className="space-y-2">
                  {recommended.map((event, i) => {
                    const idx = events.indexOf(event);
                    return (
                      <Link
                        key={i}
                        to={`/event/${idx}`}
                        onClick={onClose}
                        className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl cursor-pointer group transition-all"
                      >
                        <div className="size-14 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                          {event.MAIN_IMG ? (
                            <img className="size-full object-cover" src={event.MAIN_IMG} alt={event.TITLE} />
                          ) : (
                            <div className="size-full flex items-center justify-center text-gray-300">
                              <span className="material-symbols-outlined">image</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold group-hover:text-primary transition-colors truncate">{event.TITLE}</p>
                          <p className="text-xs text-gray-400 font-bold mt-0.5">{event.PLACE} · {event.CODENAME}</p>
                        </div>
                        <span className="material-symbols-outlined text-gray-200 group-hover:text-primary">north_west</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 최근 검색어 */}
            {recentSearches.length > 0 && (
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-black">최근 검색어</h2>
                  <button onClick={clearRecent} className="text-xs font-bold text-gray-400 hover:text-navy transition-colors">전체 삭제</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(tag => (
                    <div key={tag} className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100 hover:border-primary/30 transition-all cursor-pointer"
                      onClick={() => handleSearch(tag)}
                    >
                      <span className="text-sm font-bold">{tag}</span>
                      <span
                        className="material-symbols-outlined text-xs text-gray-300 hover:text-primary"
                        onClick={(e) => { e.stopPropagation(); removeRecent(tag); }}
                      >close</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 인기 장르 */}
            {popularGenres.length > 0 && (
              <section>
                <h2 className="text-lg font-black mb-6">인기 장르</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                  {popularGenres.map((item, i) => (
                    <div
                      key={item.name}
                      onClick={() => handleSearch(item.name)}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-4 font-black text-center ${i < 3 ? 'text-primary' : 'text-gray-300'}`}>{i + 1}</span>
                        <span className="font-bold text-navy">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-400">{item.count}건</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;
