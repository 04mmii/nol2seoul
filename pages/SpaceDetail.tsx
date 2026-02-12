import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCulturalSpaces, useFavorites } from '../hooks';

const SpaceDetail: React.FC = () => {
  const { id } = useParams();
  const { spaces, loading, isError } = useCulturalSpaces();
  const { toggleFavorite, isFavorite } = useFavorites();

  const spaceIndex = Number(id);
  const space = spaces[spaceIndex];

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-20 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-navy font-bold">문화공간 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (isError || !space) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">error</span>
        <p className="text-gray-500 font-bold mb-4">문화공간 정보를 찾을 수 없습니다.</p>
        <Link to="/map" className="text-primary font-bold hover:underline">지도로 돌아가기</Link>
      </div>
    );
  }

  const image = space.MAIN_IMG || space.IMG_URL;
  const hasTicket = space.TICKET_YN === 'Y';
  const favId = String(spaceIndex);

  // 비슷한 분류의 공간
  const similarSpaces = spaces
    .filter((s, i) => i !== spaceIndex && s.SUBJCODE === space.SUBJCODE)
    .slice(0, 4);

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-10 pb-24">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8 font-medium">
        <Link to="/" className="hover:text-primary">홈</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link to="/map" className="hover:text-primary">지도탐색</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-navy truncate max-w-[200px]">{space.FAC_NAME}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-2 space-y-10">
          {/* 히어로 이미지 */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
            {image ? (
              <img
                className="w-full object-contain bg-gray-50"
                src={image}
                alt={space.FAC_NAME}
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/space-default/1200/800'; }}
              />
            ) : (
              <div className="w-full h-[400px] bg-gray-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-8xl text-gray-300">museum</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-8 left-8 text-white">
              <div className="flex gap-2 mb-4">
                {space.SUBJCODE && <span className="bg-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">{space.SUBJCODE}</span>}
                {hasTicket && <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">유료</span>}
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-4">{space.FAC_NAME}</h2>
              <p className="text-white/80 font-medium">{space.ADDR}</p>
            </div>
          </div>

          {/* 탭 */}
          <div className="flex border-b border-gray-100 gap-10">
            <button className="pb-4 border-b-2 border-primary text-primary font-bold">상세정보</button>
          </div>

          {/* 소개 */}
          <section className="space-y-6">
            <h3 className="text-2xl font-black flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">auto_awesome</span>
              공간 소개
            </h3>
            <div className="text-gray-600 leading-relaxed text-lg font-medium space-y-4">
              {space.FAC_DESC ? (
                <p>{space.FAC_DESC}</p>
              ) : space.DTLCONT ? (
                <div dangerouslySetInnerHTML={{ __html: space.DTLCONT.replace(/<[^>]*>/g, ' ').trim() || `${space.FAC_NAME} - 서울의 문화공간입니다.` }} />
              ) : (
                <p>{space.FAC_NAME} - 서울에 위치한 문화공간입니다.</p>
              )}
            </div>
          </section>

          {/* 교통 정보 */}
          {space.TRAFFIC_INFO && (
            <section className="space-y-6">
              <h3 className="text-2xl font-black flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">directions</span>
                교통 안내
              </h3>
              <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
                <p className="text-sm text-gray-600 font-medium leading-relaxed">{space.TRAFFIC_INFO}</p>
              </div>
            </section>
          )}

          {/* 오시는 길 */}
          <section className="space-y-6">
            <h3 className="text-2xl font-black flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">location_on</span>
              오시는 길
            </h3>
            <div className="bg-primary/5 rounded-xl p-5 border border-primary/10 flex gap-4">
              <span className="material-symbols-outlined text-primary">info</span>
              <div>
                <p className="text-sm font-bold text-primary mb-1">주소</p>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{space.ADDR}</p>
              </div>
            </div>
          </section>
        </div>

        {/* 사이드바 */}
        <aside className="lg:col-span-1">
          <div className="sticky top-28 bg-white border border-gray-100 rounded-2xl p-8 shadow-xl shadow-primary/5 space-y-8">
            <div className="space-y-6">
              {[
                { label: '주소', value: space.ADDR, icon: 'map' },
                { label: '전화', value: space.PHNE, icon: 'call' },
                ...(space.FAX ? [{ label: '팩스', value: space.FAX, icon: 'fax' }] : []),
                ...(space.CLOSEDAY ? [{ label: '휴관일', value: space.CLOSEDAY, icon: 'event_busy' }] : []),
                { label: '입장료', value: hasTicket ? '유료' : '무료', icon: 'payments', highlight: true },
                ...(space.SUBJCODE ? [{ label: '분류', value: space.SUBJCODE, icon: 'category' }] : []),
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
              {space.HOMEPAGE && (
                <a
                  href={space.HOMEPAGE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-primary text-white py-4 rounded-full font-bold text-lg shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all text-center"
                >
                  홈페이지 가기
                </a>
              )}
              <button
                onClick={() => toggleFavorite({
                  id: favId,
                  type: 'space',
                  title: space.FAC_NAME,
                  location: space.ADDR,
                  image: image,
                  category: space.SUBJCODE || '문화공간',
                })}
                className={`w-full py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  isFavorite(favId, 'space')
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-gray-100 text-navy hover:bg-gray-200'
                }`}
              >
                <span className={`material-symbols-outlined ${isFavorite(favId, 'space') ? 'fill' : ''}`}>favorite</span>
                {isFavorite(favId, 'space') ? '관심장소 등록됨' : '관심장소 등록'}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* 비슷한 문화공간 */}
      {similarSpaces.length > 0 && (
        <section className="mt-20 py-10 border-t border-gray-100">
          <h3 className="text-2xl font-black mb-8">비슷한 문화공간</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {similarSpaces.map((s, i) => {
              const idx = spaces.indexOf(s);
              const sImg = s.MAIN_IMG || s.IMG_URL;
              return (
                <Link to={`/space/${idx}`} key={i} className="group cursor-pointer">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4">
                    {sImg ? (
                      <img
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        src={sImg}
                        alt={s.FAC_NAME}
                        onError={(ev) => { (ev.target as HTMLImageElement).src = 'https://picsum.photos/seed/space/400/300'; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        <span className="material-symbols-outlined text-4xl text-gray-300">museum</span>
                      </div>
                    )}
                  </div>
                  {s.SUBJCODE && <p className="text-xs font-bold text-primary mb-1">{s.SUBJCODE}</p>}
                  <h4 className="font-bold mb-1 group-hover:text-primary transition-colors truncate">{s.FAC_NAME}</h4>
                  <p className="text-xs text-gray-400 font-bold truncate">{s.ADDR}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default SpaceDetail;
