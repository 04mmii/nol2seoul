
import React from 'react';

const MyPage: React.FC = () => {
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
          {[
            { label: '저장한 행사', value: 24 },
            { label: '저장한 장소', value: 12 },
            { label: '작성한 리뷰', value: 8 },
          ].map(stat => (
            <div key={stat.label} className="flex-1 md:w-32 bg-background-light p-6 rounded-2xl flex flex-col items-center justify-center border border-gray-100 cursor-pointer hover:border-primary transition-all">
              <span className="text-3xl font-black text-primary">{stat.value}</span>
              <span className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-widest">{stat.label}</span>
            </div>
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
            <button className="py-6 font-black text-sm border-b-4 border-primary text-navy">저장한 행사 <span className="text-primary ml-1">24</span></button>
            <button className="py-6 font-bold text-sm text-gray-400 hover:text-navy">저장한 장소 <span className="ml-1">12</span></button>
            <button className="py-6 font-bold text-sm text-gray-400 hover:text-navy">작성한 리뷰 <span className="ml-1">8</span></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[
              { title: '서울 미디어 아트 2024', cat: '전시', date: '10.01 - 10.31', loc: 'DDP', img: 'https://picsum.photos/seed/ma/400/500' },
              { title: '경복궁 야간 관람', cat: '체험', date: '상시 운영', loc: '경복궁', img: 'https://picsum.photos/seed/k/400/500' },
              { title: '한강 달빛 야시장', cat: '푸드', date: '매주 주말', loc: '여의도', img: 'https://picsum.photos/seed/nightm/400/500' },
            ].map((item, i) => (
              <div key={i} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                <div className="relative h-64 overflow-hidden">
                  <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={item.img} alt={item.title} />
                  <button className="absolute top-4 right-4 bg-white/90 p-2 rounded-full text-primary shadow-lg"><span className="material-symbols-outlined fill font-bold">favorite</span></button>
                </div>
                <div className="p-5">
                  <p className="text-[10px] font-black text-primary uppercase mb-1 tracking-widest">{item.cat}</p>
                  <h4 className="font-black text-navy mb-3">{item.title}</h4>
                  <div className="space-y-1 text-xs text-gray-400 font-bold">
                    <p className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">calendar_today</span> {item.date}</p>
                    <p className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span> {item.loc}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center h-[380px] group cursor-pointer hover:border-primary/50 transition-colors">
              <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all"><span className="material-symbols-outlined text-3xl">add</span></div>
              <p className="mt-4 text-sm font-black text-gray-400">새로운 행사 찾기</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MyPage;
