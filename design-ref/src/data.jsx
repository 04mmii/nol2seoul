// Shared data for NOLSEOUL redesign

const TONIGHT_SPOTS = [
  {
    id: 1, name: "남산서울타워", en: "N Seoul Tower",
    district: "용산구", elev: "243m",
    tags: ["360°", "케이블카", "야경"],
    crowd: "보통", time: "19:30 SUNSET",
    sub: "시내 한복판, 가장 클래식한 서울 야경",
    feature: true,
  },
  {
    id: 2, name: "한강 반포대교", en: "Banpo Bridge",
    district: "서초구", elev: "수면 위",
    tags: ["분수쇼", "피크닉"],
    crowd: "혼잡", time: "20:00 무지개분수",
    sub: "달빛무지개분수 — 21:00 finale",
  },
  {
    id: 3, name: "낙산공원", en: "Naksan Park",
    district: "종로구", elev: "125m",
    tags: ["성곽길", "데이트"],
    crowd: "여유", time: "지속 OPEN",
    sub: "동대문 일대를 한눈에",
  },
  {
    id: 4, name: "노을공원", en: "Noeul Park",
    district: "마포구", elev: "98m",
    tags: ["일몰", "억새"],
    crowd: "보통", time: "18:50 SUNSET",
    sub: "이름 그대로, 가장 아름다운 서울 노을",
  },
  {
    id: 5, name: "응봉산", en: "Eungbongsan",
    district: "성동구", elev: "94m",
    tags: ["한강뷰", "야경"],
    crowd: "여유", time: "21:00 PEAK",
    sub: "동호대교와 강변북로의 빛줄기",
  },
];

const EVENTS = [
  { id: 1, cat: "전시·미술", title: "2026 은평역사한옥박물관 기획전", venue: "은평한옥박물관 3F", date: "05.13 — 09.06", price: "무료", thumb: "a", placeholder: "EXHIBITION POSTER", index: "EX 001" },
  { id: 2, cat: "교육·체험", title: "신비한 유물 도감", venue: "한성백제박물관 교육실", date: "05.13 — 06.24", price: "무료", thumb: "b", placeholder: "WORKSHOP IMG", index: "ED 014" },
  { id: 3, cat: "공연·뮤지컬", title: "서울문화예술 앙상블 음악회", venue: "서초 앙상블실 1", date: "05.13 — 05.27", price: "₩20,000", thumb: "c", placeholder: "PERFORMANCE", index: "PF 088" },
  { id: 4, cat: "뮤지컬·오페라", title: "노원문화재단 기획공연", venue: "노원어린이극장", date: "05.15 — 05.30", price: "₩15,000", thumb: "d", placeholder: "STAGE PHOTO", index: "PF 091" },
  { id: 5, cat: "축제·이벤트", title: "한강 달빛 야시장", venue: "여의도 한강공원", date: "05.17 — 09.30 토·일", price: "무료", thumb: "e", placeholder: "FESTIVAL IMG", index: "FE 003" },
  { id: 6, cat: "전시·미술", title: "Modern Korea 1960s", venue: "서울시립 미술관 본관", date: "05.20 — 11.15", price: "₩9,000", thumb: "f", placeholder: "EXHIBITION", index: "EX 022" },
  { id: 7, cat: "클래스·강좌", title: "도시 산책자를 위한 글쓰기", venue: "서울도서관 4F", date: "매주 토 10:00", price: "무료", thumb: "g", placeholder: "CLASS IMG", index: "CL 045" },
  { id: 8, cat: "공연·뮤지컬", title: "마포 재즈 인 더 가든", venue: "문화비축기지 T6", date: "06.07 18:00", price: "₩30,000", thumb: "h", placeholder: "JAZZ PHOTO", index: "PF 102" },
];

const CURATORS = [
  { name: "이도연", role: "Editor · @SeoulCity Mag", quote: "지금 서울에서 가장 흥미로운 건 사라지는 것들과 새로 생기는 것들이 한 골목에 같이 있다는 점.", picks: "PICKS — 낙산공원 · 익선동 골목 · 동묘 벼룩시장" },
  { name: "Han Soo Min", role: "Photographer", quote: "야경은 빛이 아니라 그 빛 사이의 어둠을 찍는 일이라고 생각해요.", picks: "PICKS — 응봉산 · 한강 다리 5선 · 북악 스카이웨이" },
  { name: "박재희", role: "Festival Programmer", quote: "5월의 서울은 도시 전체가 무대예요. 매주 새로운 페스티벌이 열립니다.", picks: "PICKS — 한강 야시장 · 마포 재즈 · 종로 등불축제" },
];

const TICKER_ITEMS = [
  { type: "alert", text: "오늘의 일몰 19:14" },
  { type: "normal", text: "한강 달빛 분수 20:00 / 20:30 / 21:00" },
  { type: "hot", text: "🔥 신비한 유물 도감 잔여 8석" },
  { type: "normal", text: "기온 21°C · 미세먼지 좋음" },
  { type: "normal", text: "남산 케이블카 운영 22:00까지" },
  { type: "hot", text: "🎫 5월 문화행사 1,284건 진행 중" },
  { type: "normal", text: "지금 서울 일출 05:31 · 일몰 19:14" },
];

window.NOLSEOUL_DATA = { TONIGHT_SPOTS, EVENTS, CURATORS, TICKER_ITEMS };
