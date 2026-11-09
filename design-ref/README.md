# NOLSEOUL Redesign v3 — design reference

- `NOLSEOUL Redesign v3.html` : 전체가 들어있는 단일 파일 (브라우저로 열면 바로 보임, 코스추천 리모컨 포함)
- `src/styles-v3.css` : 디자인 토큰(:root 변수) + 전체 스타일
- `src/chrome-v2.jsx` : LiveBar / Header / Footer
- `src/layout-editorial-v3.jsx` : 홈 (Hero, CategoryStrip, Events, MapPromo, Tonight, Curators)
- `src/page-*.jsx` : 문화행사 / 지도 / 야경 / 스토리 / 마이 / 상세
- `src/course-remote.jsx` : AI 코스추천 리모컨 (프로토타입: window.claude 호출 → 실서비스에선 서버 API로 교체)
- `src/data.jsx` : 더미 데이터 (실서비스 API 데이터로 교체 대상)

주의: 프로토타입은 전역 window + Babel 방식. 실제 프로젝트(React/TS)에는 컴포넌트 단위로 옮겨야 함.
