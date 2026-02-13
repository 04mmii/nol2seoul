import type { NightViewSpot } from '../types';

interface NightSpotCardProps {
  spot: NightViewSpot;
  id: string;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onClick: () => void;
}

/** 하단 Swiper 슬라이드용 미니 카드 */
export const NightSpotSlideCard: React.FC<NightSpotCardProps> = ({ spot, isFavorited, onToggleFavorite, onClick }) => (
  <div
    onClick={onClick}
    className="rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full cursor-pointer transition-all hover:scale-[1.02] bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 border border-indigo-500/20 hover:border-indigo-400/50"
  >
    <div className="p-5 flex flex-col flex-1">
      <div className="flex items-center justify-between mb-3">
        <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md text-[10px] font-black border border-indigo-500/20">야경명소</span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className={`size-7 rounded-full flex items-center justify-center ${isFavorited ? 'text-indigo-300' : 'text-indigo-500/50 hover:text-indigo-300'}`}
        >
          <span className={`material-symbols-outlined text-lg ${isFavorited ? 'fill' : ''}`}>favorite</span>
        </button>
      </div>
      <div className="flex items-start gap-3 mb-3">
        <div className="size-10 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0 border border-indigo-500/15">
          <span className="material-symbols-outlined text-xl text-indigo-300">nightlight</span>
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-white truncate text-sm">{spot.TITLE}</h4>
          <p className="text-indigo-300/60 text-[11px] font-bold truncate mt-0.5">{spot.ADDR}</p>
        </div>
      </div>
      <div className="mt-auto space-y-1.5">
        {spot.OPERATING_TIME && (
          <p className="text-[11px] text-indigo-200/60 font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs text-indigo-400/60">schedule</span>
            <span className="truncate">{spot.OPERATING_TIME}</span>
          </p>
        )}
        {spot.ENTR_FEE && (
          <p className="text-[11px] text-indigo-200/60 font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs text-indigo-400/60">payments</span>
            <span className="truncate">{spot.ENTR_FEE}</span>
          </p>
        )}
        {spot.URL && (
          <p className="text-[11px] text-indigo-200/60 font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs text-indigo-400/60">language</span>
            <span className="truncate">홈페이지 있음</span>
          </p>
        )}
      </div>
    </div>
  </div>
);

interface NightSpotDetailProps {
  spot: NightViewSpot;
  id: string;
  isFavorited: boolean;
  isNightMode: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
}

/** 마커 클릭 시 표시되는 상세 카드 */
export const NightSpotDetailCard: React.FC<NightSpotDetailProps> = ({ spot, isFavorited, isNightMode, onToggleFavorite, onClose }) => (
  <div className={`absolute top-24 left-6 z-30 w-[360px] rounded-2xl shadow-2xl overflow-hidden ${isNightMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
    <button
      onClick={onClose}
      className={`absolute top-3 right-3 z-10 size-8 rounded-full flex items-center justify-center backdrop-blur-md ${isNightMode ? 'bg-gray-900/60 text-white hover:bg-gray-900/80' : 'bg-white/60 text-gray-600 hover:bg-white/80'}`}
    >
      <span className="material-symbols-outlined text-sm">close</span>
    </button>

    {/* 그라디언트 헤더 */}
    <div className="relative w-full bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 p-6 pb-5">
      <div className="absolute top-3 left-3">
        <span className="bg-indigo-500/30 text-indigo-300 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-indigo-500/20">야경명소</span>
      </div>
      <div className="mt-6 flex items-start gap-4">
        <div className="size-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/20">
          <span className="material-symbols-outlined text-3xl text-indigo-300">nightlight</span>
        </div>
        <div className="min-w-0">
          <h4 className="font-black text-lg text-white leading-tight">{spot.TITLE}</h4>
          <p className="text-indigo-300/70 text-xs font-bold mt-1 truncate">{spot.ADDR}</p>
        </div>
      </div>
    </div>

    {/* 상세 정보 */}
    <div className="p-5 space-y-3">
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
        {spot.BUS && (
          <div className={`flex items-start gap-2.5 text-xs ${isNightMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <span className="material-symbols-outlined text-sm text-indigo-400 mt-0.5 shrink-0">directions_bus</span>
            <div>
              <p className="font-black text-[10px] text-indigo-400 uppercase tracking-widest mb-0.5">버스</p>
              <p className="font-bold">{spot.BUS}</p>
            </div>
          </div>
        )}
        {spot.CONTENT && (
          <p className={`text-xs leading-relaxed line-clamp-3 ${isNightMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {spot.CONTENT}
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onToggleFavorite}
          className={`flex-1 py-2.5 rounded-full font-bold text-sm flex items-center justify-center gap-1.5 transition-all ${
            isFavorited
              ? isNightMode ? 'bg-indigo-600 text-white' : 'bg-primary text-white'
              : isNightMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-navy hover:bg-gray-200'
          }`}
        >
          <span className={`material-symbols-outlined text-lg ${isFavorited ? 'fill' : ''}`}>favorite</span>
          {isFavorited ? '저장됨' : '저장'}
        </button>
        {spot.URL && (
          <a
            href={spot.URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 py-2.5 rounded-full font-bold text-sm flex items-center justify-center gap-1.5 transition-all ${
              isNightMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-primary text-white hover:brightness-110'
            }`}
          >
            <span className="material-symbols-outlined text-lg">language</span>
            홈페이지
          </a>
        )}
      </div>
    </div>
  </div>
);
