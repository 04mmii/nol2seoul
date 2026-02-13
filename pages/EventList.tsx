import React, { useState } from "react";
import { Link } from "react-router-dom";

const EventList: React.FC = () => {
  const [filter, setFilter] = useState("latest");

  const eventList = [
    {
      id: "1",
      title: "2024 서울 드럼페스티벌",
      date: "2024.05.25 ~ 2024.05.26",
      location: "노들섬 특설무대",
      tags: ["누구나", "가족"],
      isFree: true,
      image: "https://picsum.photos/seed/drum/600/400",
    },
    {
      id: "2",
      title: "현대미술 기획전: 서울의 얼굴",
      date: "2024.04.10 ~ 2024.06.30",
      location: "서울시립미술관 본관",
      tags: ["청소년", "성인"],
      isFree: false,
      image: "https://picsum.photos/seed/face/600/400",
    },
    {
      id: "3",
      title: "한강 별빛 클래식 콘서트",
      date: "2024.06.01 ~ 2024.06.01",
      location: "여의도 한강공원 물빛무대",
      tags: ["누구나"],
      isFree: true,
      image: "https://picsum.photos/seed/classic/600/400",
    },
    {
      id: "4",
      title: "연극: 기억의 습작",
      date: "2024.05.01 ~ 2024.05.30",
      location: "대학로 소극장 혜화",
      tags: ["성인"],
      isFree: false,
      image: "https://picsum.photos/seed/theater/600/400",
    },
  ];

  return (
    <div className="max-w-[900px] mx-auto px-6 py-10 pb-24">
      {/* Search Header */}

      <div className="mb-10 space-y-4">
        <h2 className="text-3xl font-black">문화행사 탐색</h2>
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          {["자치구 선택", "장르", "유료/무료", "기간 설정"].map((item) => (
            <button
              key={item}
              className="flex items-center gap-1 px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium hover:border-primary whitespace-nowrap"
            >
              {item}{" "}
              <span className="material-symbols-outlined text-gray-400">
                expand_more
              </span>
            </button>
          ))}
          <button className="ml-auto p-2 rounded-full hover:bg-gray-100">
            <span className="material-symbols-outlined">tune</span>
          </button>
        </div>
      </div>

      {/* Sorting & Result Count */}
      <div className="flex items-baseline justify-between mb-8">
        <h3 className="text-lg font-bold">
          총 <span className="text-primary">124</span>건의 문화행사
        </h3>
        <div className="flex gap-4 text-sm font-bold text-gray-400">
          <button
            className={`${filter === "latest" ? "text-primary" : "hover:text-navy"} transition-colors`}
            onClick={() => setFilter("latest")}
          >
            최신순
          </button>
          <button
            className={`${filter === "ending" ? "text-primary" : "hover:text-navy"} transition-colors`}
            onClick={() => setFilter("ending")}
          >
            종료임박순
          </button>
          <button
            className={`${filter === "popular" ? "text-primary" : "hover:text-navy"} transition-colors`}
            onClick={() => setFilter("popular")}
          >
            인기순
          </button>
        </div>
      </div>

      {/* List Grid */}
      <div className="space-y-6">
        {eventList.map((event) => (
          <div
            key={event.id}
            className="bg-white rounded-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row group hover:shadow-xl transition-all"
          >
            <div className="relative w-full md:w-64 h-48 md:h-auto overflow-hidden">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                src={event.image}
                alt={event.title}
              />
              <div
                className={`absolute top-3 left-3 px-3 py-1 ${event.isFree ? "bg-primary" : "bg-gray-500"} text-white text-[10px] font-bold rounded-full shadow-lg`}
              >
                {event.isFree ? "무료" : "유료"}
              </div>
            </div>
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-xl font-bold leading-snug group-hover:text-primary transition-colors cursor-pointer">
                    {event.title}
                  </h4>
                  <button className="text-gray-300 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">favorite</span>
                  </button>
                </div>
                <div className="space-y-1 text-sm text-gray-500 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary/70 text-base">
                      calendar_month
                    </span>
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary/70 text-base">
                      location_on
                    </span>
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 items-center justify-between">
                <div className="flex gap-2">
                  {event.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  to={`/event/${event.id}`}
                  className="px-6 py-2 bg-navy text-white rounded-full text-sm font-bold hover:bg-primary transition-colors"
                >
                  상세보기
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-16 flex justify-center items-center gap-2">
        <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:text-primary">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <button className="w-10 h-10 rounded-full bg-primary text-white font-bold">
          1
        </button>
        <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:text-primary">
          2
        </button>
        <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:text-primary">
          3
        </button>
        <span className="px-2 text-gray-400">...</span>
        <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:text-primary">
          12
        </button>
        <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:text-primary">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      {/* Floating Action Button */}
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
