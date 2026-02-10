
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEvents, useFavorites } from '../hooks';

const EventDetail: React.FC = () => {
  const { id } = useParams();
  const { events, loading, isError } = useEvents();

  const { toggleFavorite, isFavorite } = useFavorites();
  const eventIndex = Number(id);
  const event = events[eventIndex];

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-20 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-navy font-bold">행사 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">error</span>
        <p className="text-gray-500 font-bold mb-4">행사 정보를 찾을 수 없습니다.</p>
        <Link to="/events" className="text-primary font-bold hover:underline">목록으로 돌아가기</Link>
      </div>
    );
  }

  const isFree = event.IS_FREE === '무료' || (event.USE_FEE && event.USE_FEE.includes('무료'));
  const dateRange = event.STRTDATE && event.END_DATE
    ? `${event.STRTDATE.slice(0, 10)} ~ ${event.END_DATE.slice(0, 10)}`
    : event.DATE || '';

  // 비슷한 장르의 행사 4개
  const similarEvents = events
    .filter((e, i) => i !== eventIndex && e.CODENAME === event.CODENAME)
    .slice(0, 4);

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-10 pb-24">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8 font-medium">
        <Link to="/" className="hover:text-primary">홈</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link to="/events" className="hover:text-primary">문화행사</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-navy truncate max-w-[200px]">{event.TITLE}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-10">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
            <img
              className="w-full object-contain bg-gray-50"
              src={event.MAIN_IMG || 'https://picsum.photos/seed/event-default/1200/800'}
              alt={event.TITLE}
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/event-default/1200/800'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-8 left-8 text-white">
              <div className="flex gap-2 mb-4">
                <span className="bg-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">{event.CODENAME}</span>
                {isFree && <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">무료</span>}
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-4">{event.TITLE}</h2>
              <p className="text-white/80 font-medium">#{event.CODENAME} #{event.GUNAME}</p>
            </div>
          </div>

          <div className="flex border-b border-gray-100 gap-10">
            <button className="pb-4 border-b-2 border-primary text-primary font-bold">상세정보</button>
          </div>

          <section className="space-y-6">
            <h3 className="text-2xl font-black flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              행사 소개
            </h3>
            <div className="text-gray-600 leading-relaxed text-lg font-medium space-y-4">
              {event.PROGRAM && <p>{event.PROGRAM}</p>}
              {event.ETC_DESC && <p>{event.ETC_DESC}</p>}
              {!event.PROGRAM && !event.ETC_DESC && (
                <p>{event.TITLE} - {event.PLACE}에서 진행되는 문화행사입니다.</p>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-2xl font-black flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">location_on</span>
              오시는 길
            </h3>
            <div className="bg-primary/5 rounded-xl p-5 border border-primary/10 flex gap-4">
              <span className="material-symbols-outlined text-primary">info</span>
              <div>
                <p className="text-sm font-bold text-primary mb-1">장소 안내</p>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{event.PLACE} ({event.GUNAME})</p>
                {event.ORG_NAME && <p className="text-sm text-gray-400 mt-1">주관: {event.ORG_NAME}</p>}
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Sticky Card */}
        <aside className="lg:col-span-1">
          <div className="sticky top-28 bg-white border border-gray-100 rounded-2xl p-8 shadow-xl shadow-primary/5 space-y-8">
            <div className="space-y-6">
              {[
                { label: '일정', value: dateRange, icon: 'calendar_today' },
                { label: '비용', value: event.USE_FEE || (isFree ? '무료' : '정보 없음'), icon: 'payments', highlight: true },
                { label: '대상', value: event.USE_TRGT || '전체', icon: 'group' },
                { label: '장소', value: event.PLACE || event.GUNAME, icon: 'map' },
                ...(event.PLAYER ? [{ label: '출연진', value: event.PLAYER, icon: 'person' }] : []),
              ].map(info => (
                <div key={info.label} className="flex gap-4">
                  <div className="bg-primary/10 p-3 rounded-full text-primary shrink-0 flex items-center justify-center size-12">
                    <span className="material-symbols-outlined">{info.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{info.label}</p>
                    <p className={`text-lg font-extrabold break-words ${'highlight' in info && info.highlight ? 'text-primary' : 'text-navy'}`}>{info.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-8 border-t border-gray-100 flex flex-col gap-4">
              {(event.ORG_LINK || event.HMPG_ADDR) && (
                <a
                  href={event.ORG_LINK || event.HMPG_ADDR}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-primary text-white py-4 rounded-full font-bold text-lg shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all text-center"
                >
                  홈페이지 가기
                </a>
              )}
              <button
                onClick={() => toggleFavorite({
                  id: String(eventIndex),
                  type: 'event',
                  title: event.TITLE,
                  location: event.PLACE || event.GUNAME,
                  image: event.MAIN_IMG,
                  category: event.CODENAME,
                  date: dateRange,
                })}
                className={`w-full py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  isFavorite(String(eventIndex), 'event')
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-gray-100 text-navy hover:bg-gray-200'
                }`}
              >
                <span className={`material-symbols-outlined ${isFavorite(String(eventIndex), 'event') ? 'fill' : ''}`}>favorite</span>
                {isFavorite(String(eventIndex), 'event') ? '관심행사 등록됨' : '관심행사 등록'}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Similar Events */}
      {similarEvents.length > 0 && (
        <section className="mt-20 py-10 border-t border-gray-100">
          <h3 className="text-2xl font-black mb-8">비슷한 테마의 행사</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {similarEvents.map((e, i) => {
              const idx = events.indexOf(e);
              return (
                <Link to={`/event/${idx}`} key={i} className="group cursor-pointer">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4">
                    <img
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      src={e.MAIN_IMG || 'https://picsum.photos/seed/similar/400/300'}
                      alt={e.TITLE}
                      onError={(ev) => { (ev.target as HTMLImageElement).src = 'https://picsum.photos/seed/similar/400/300'; }}
                    />
                  </div>
                  <p className="text-xs font-bold text-primary mb-1">{e.CODENAME}</p>
                  <h4 className="font-bold mb-1 group-hover:text-primary transition-colors truncate">{e.TITLE}</h4>
                  <p className="text-xs text-gray-400 font-bold">{e.GUNAME}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default EventDetail;
