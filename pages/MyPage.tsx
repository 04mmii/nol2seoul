
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../hooks';
import type { FavoriteType } from '../hooks';

const MyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FavoriteType>('event');
  const { favorites, removeFavorite, getByType, eventCount, spaceCount, spotCount } = useFavorites();

  const currentItems = getByType(activeTab);

  const tabs: { key: FavoriteType; label: string; count: number }[] = [
    { key: 'event', label: '저장한 행사', count: eventCount },
    { key: 'space', label: '저장한 장소', count: spaceCount },
    { key: 'spot', label: '저장한 야경', count: spotCount },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10 pb-24 space-y-10">
      {/* Profile Card */}
      <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="size-32 rounded-full overflow-hidden border-4 border-white shadow-xl ring-2 ring-primary/20">
              <img className="w-full h-full object-cover" src="https://picsum.photos/seed/me/400/400" alt="User Profile" />
            </div>
            <button className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white"><span className="material-symbols-outlined text-sm">photo_camera</span></button>
          </div>
          <div className="text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <h2 className="text-3xl font-black">서울여행자님</h2>
              <span className="bg-primary/10 text-primary text-xs font-black px-3 py-1 rounded-full">Lv.4 탐험가</span>
            </div>
            <p className="text-gray-400 font-medium mt-1">seoultraveler@nolseoul.kr</p>
            <div className="flex gap-3 mt-6 justify-center md:justify-start">
              <button className="bg-primary text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110">프로필 수정</button>
              <button className="bg-gray-100 text-navy px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-200">공유하기</button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 md:w-32 p-6 rounded-2xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
                activeTab === tab.key ? 'bg-primary/5 border-primary/30' : 'bg-background-light border-gray-100 hover:border-primary'
              }`}
            >
              <span className="text-3xl font-black text-primary">{tab.count}</span>
              <span className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Content Tabs */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="p-6 border-b border-gray-100"><h3 className="font-black">계정 설정</h3></div>
            <nav className="flex flex-col">
              {['공지사항', '1:1 문의', '환경설정'].map(item => (
                <button key={item} className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 text-gray-500 font-bold text-sm transition-colors text-left">
                  <span className="material-symbols-outlined text-gray-400">{item === '공지사항' ? 'campaign' : item === '1:1 문의' ? 'help_center' : 'settings'}</span>
                  {item}
                </button>
              ))}
              <button className="flex items-center gap-3 px-6 py-4 hover:bg-red-50 text-red-500 font-bold text-sm transition-colors text-left">
                <span className="material-symbols-outlined">logout</span> 로그아웃
              </button>
            </nav>
          </div>
          <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
            <p className="text-[10px] font-black text-primary mb-2 uppercase tracking-widest">NOLSEOUL VIP</p>
            <h4 className="font-black text-navy leading-tight mb-4">전시회 20% 할인 혜택을 놓치지 마세요!</h4>
            <button className="w-full bg-primary text-white py-3 rounded-full text-xs font-black shadow-lg shadow-primary/20">멤버십 가입</button>
          </div>
        </aside>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 flex gap-10 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-6 font-bold text-sm whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'font-black border-b-4 border-primary text-navy'
                    : 'text-gray-400 hover:text-navy'
                }`}
              >
                {tab.label} <span className={activeTab === tab.key ? 'text-primary ml-1' : 'ml-1'}>{tab.count}</span>
              </button>
            ))}
          </div>

          {currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="material-symbols-outlined text-5xl mb-4">
                {activeTab === 'event' ? 'event' : activeTab === 'space' ? 'museum' : 'nightlight'}
              </span>
              <p className="font-bold text-lg mb-2">
                저장한 {activeTab === 'event' ? '행사' : activeTab === 'space' ? '장소' : '야경명소'}가 없습니다
              </p>
              <p className="text-sm mb-6">마음에 드는 항목의 하트를 눌러 저장해보세요</p>
              <Link
                to={activeTab === 'event' ? '/events' : '/map'}
                className="bg-primary text-white px-6 py-3 rounded-full font-bold text-sm hover:brightness-110"
              >
                {activeTab === 'event' ? '행사 둘러보기' : '지도에서 찾기'}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {currentItems.map(item => (
                <div key={`${item.type}-${item.id}`} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                  <Link to={item.type === 'event' ? `/event/${item.id}` : '/map'}>
                    <div className="relative h-52 overflow-hidden bg-gray-50">
                      {item.image ? (
                        <img
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          src={item.image}
                          alt={item.title}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <span className="material-symbols-outlined text-5xl">
                            {item.type === 'event' ? 'event' : item.type === 'space' ? 'museum' : 'nightlight'}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        {item.category && <p className="text-[10px] font-black text-primary uppercase mb-1 tracking-widest">{item.category}</p>}
                        <h4 className="font-black text-navy mb-3 truncate">{item.title}</h4>
                        <div className="space-y-1 text-xs text-gray-400 font-bold">
                          {item.date && <p className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">calendar_today</span> {item.date}</p>}
                          <p className="flex items-center gap-1 truncate"><span className="material-symbols-outlined text-sm">location_on</span> {item.location}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFavorite(item.id, item.type)}
                        className="text-primary shrink-0 ml-2 hover:scale-110 transition-transform"
                      >
                        <span className="material-symbols-outlined fill">favorite</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <Link to={activeTab === 'event' ? '/events' : '/map'} className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center h-[320px] group cursor-pointer hover:border-primary/50 transition-colors">
                <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                  <span className="material-symbols-outlined text-3xl">add</span>
                </div>
                <p className="mt-4 text-sm font-black text-gray-400">
                  {activeTab === 'event' ? '새로운 행사 찾기' : activeTab === 'space' ? '문화공간 찾기' : '야경명소 찾기'}
                </p>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MyPage;
