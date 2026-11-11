# 배포 체크리스트 (Vercel)

> 작성 2026-11-11, 브랜치 `redesign-v3` 기준. 이 문서에는 **키 값을 적지 않는다.** 값은 Vercel 대시보드와 각 서비스 콘솔에만 둔다.
> 배포 주소는 저장소에 기록이 없어 아래에서 `<프로젝트>`로 적었다. 실제 주소로 바꿔 읽으면 된다.

## 1. Vercel 환경변수

Vercel → Project → Settings → Environment Variables. `VITE_`로 시작하는 이름만 브라우저 번들에 들어간다.

| 이름 | 용도 | 서버 전용? | 필요 |
|---|---|---|---|
| `SEOUL_API_KEY` | 서울시 열린데이터 (문화행사·문화공간·야경명소). `api/seoulapi.ts` → `api/_lib/seoulApi.ts` | **서버 전용** | 필수 |
| `VITE_KAKAO_MAP_API_KEY` | 카카오맵 JavaScript SDK (지도, 행사 상세 위치 지도) | 브라우저 공개 키 (빌드 시 번들에 들어감). 대신 카카오에서 **도메인 제한** 필수 | 필수 |
| `ANTHROPIC_API_KEY` | AI 코스추천 (`api/course.ts`). 없으면 규칙 기반 코스로 동작하고 화면에 "기본 규칙 코스"라고 표시 | **서버 전용** (절대 `VITE_` 붙이지 말 것) | 선택 |
| `COURSE_AI_DISABLED` | `1`이면 키가 있어도 AI를 부르지 않음 (비용 차단 스위치) | 서버 | 선택 |
| `TOUR_API_KEY` | 한국관광공사 사진 매칭 스크립트(`scripts/match-night-photos.mjs`) 전용. 앱은 커밋된 `data/night-photos.json`만 읽음 | 로컬 스크립트 전용 | **Vercel에 넣지 않음** |
| `GEMINI_API_KEY` | 쓰지 않음 | — | **넣지 말 것.** `vite.config.ts`의 남은 `define`이 빌드 시 이 값을 브라우저 번들에 그대로 넣는다 (DESIGN.md TECH-03) |

- Production / Preview 둘 다 `SEOUL_API_KEY`, `VITE_KAKAO_MAP_API_KEY`가 있어야 미리보기 배포에서도 데이터와 지도가 나온다.
- `ANTHROPIC_API_KEY`를 Preview에도 넣으면 미리보기 링크로도 비용이 발생한다. 처음엔 Production에만 넣는 것을 권장.

## 2. 카카오 디벨로퍼스

[내 애플리케이션] → 앱 선택:

1. **플랫폼 → Web → 사이트 도메인**에 등록 (프로토콜 포함, 와일드카드 불가):
   - 운영: `https://<프로젝트>.vercel.app` (커스텀 도메인을 쓰면 그 주소도)
   - 미리보기: Vercel 미리보기 주소는 배포마다 바뀐다(`https://<프로젝트>-<해시>-<팀>.vercel.app`). 카카오는 와일드카드를 받지 않으므로 **브랜치 고정 주소** `https://<프로젝트>-git-redesign-v3-<팀>.vercel.app` 를 등록하고 그 주소로 확인한다.
   - 로컬: `http://localhost:3000` (이미 등록됨 — 2026-11-10 확인). Playwright/캡처 스크립트가 쓰는 `127.0.0.1:43xx`는 등록되어 있지 않아 그 환경에서는 "카카오맵 SDK 로드 실패"가 콘솔에 찍히는 게 정상.
2. **카카오맵 사용 설정 ON** (제품 설정 → 카카오맵). 꺼져 있으면 키가 맞아도 지도가 안 뜬다 (TECH-14, 2026-11-10에 켬).
3. JavaScript 키가 `VITE_KAKAO_MAP_API_KEY`와 같은지 확인.

## 3. 외부 API 호출량과 캐시

### 서울시 열린데이터 (`/api/seoulapi?type=event|space|night`)
- 한 번 갱신할 때 **모든 페이지**를 받는다 (1,000건씩, 동시에 최대 5개).
  - 문화행사: 원본 약 19,765건 → **약 20회 호출**, 그중 "오늘 진행 중 + 3개월 내 시작"만 응답 (2026-11-11 기준 338건)
  - 문화공간: 1,100건 → **2회**
  - 야경명소: 51건 → **1회**
  - 합계 **약 23회 / 갱신**
- 캐시: `Cache-Control: public, max-age=0, s-maxage=86400, stale-while-revalidate=86400` → Vercel CDN이 **하루 한 번 정도** 갱신 (지역 엣지마다). 일부 페이지 실패 시 `s-maxage=60`(1분)만 캐시, 전체 실패 시 `no-store`.
- 오래된 캐시에서도 끝난 행사는 브라우저에서 한 번 더 걸러냄 (`dropEndedEvents`).

### 한국관광공사 관광사진 API
- **앱은 호출하지 않는다.** `scripts/match-night-photos.mjs`를 사람이 돌릴 때만 호출 (전체 1회 ≈ 120회, 일일 한도 1,000회). `--cache`로 재실행하면 0회.
- 사진은 `data/night-photos.json`에 고정 (15곳), 이미지 자체는 관광공사 서버(`tong.visitkorea.or.kr`)에서 로드.

### Anthropic (AI 코스추천, `POST /api/course`)
- 키가 있을 때만 호출. 모델 `claude-haiku-5-5`(2026-11-11 사용자 결정), effort `low`, 거절 시 서버 측 대체 모델 없음 → 규칙 코스로 대체, 최대 출력 2,000토큰, 요청당 후보 최대 120곳(종류별 40, 브라우저는 30씩 보냄).
- 비용 보호: 같은 입력은 서버 메모리 캐시(1시간, 300개) + 브라우저 세션 캐시, 클라이언트(IP)당 3초에 1회·10분에 8회 (초과 시 429 → 화면은 규칙 코스로 대체), 브라우저에서도 3초 간격.
- **한계:** 캐시·제한이 함수 인스턴스 메모리에 있어서, 인스턴스가 여러 개 뜨면 각자 따로 센다. 확실한 제한이 필요하면 Vercel KV 같은 저장소가 필요(아직 설정 안 함). Anthropic 콘솔에서 **월 사용 한도(spend limit)** 를 함께 걸어 두는 것을 권장.
- 함수 실행 시간: SDK 타임아웃 25초. Vercel 플랜의 기본 함수 최대 시간이 그보다 짧으면 `vercel.json`의 `functions`에서 `api/course.ts`의 `maxDuration`을 늘려야 한다 (배포 후 확인).

## 4. 배포 후 확인할 것

| 항목 | 확인 방법 | 기대 결과 |
|---|---|---|
| 데이터 | `/#/`, `/#/events` 열기 | 행사 카드, "총 N건" |
| 캐시 헤더 | `curl -sI "https://<프로젝트>.vercel.app/api/seoulapi?type=event"` | `cache-control: public, max-age=0, s-maxage=86400, stale-while-revalidate=86400`, 두 번째 요청부터 `x-vercel-cache: HIT` |
| 함수 시간 | 위 요청의 첫 응답 시간 | 행사는 20페이지라 첫 갱신이 느릴 수 있음. 함수 시간 초과(504)면 `maxDuration` 조정 |
| 지도 | `/#/map` (운영 주소, 미리보기 주소 둘 다) | 타일과 핀 표시, 콘솔에 "카카오맵 SDK 로드 실패" 없음. 확대/축소 시 클러스터 |
| 행사 상세 위치 지도 | 좌표 있는 행사 상세 | 작은 지도 표시 |
| 야경 사진 | `/#/night` | 사진 15곳 로드 (관광공사 이미지), 실패 시 그래픽으로 대체되는지 |
| 코스추천 (키 없음) | 오른쪽 아래 버튼 → 조건 입력 | 3곳 코스 + "기본 규칙 코스 — AI 연결이 없어…" |
| 코스추천 (키 있음) | 같은 방법 | "AI 추천 · 목록에 있는 곳만", 같은 입력 재요청 시 즉시(캐시), 연속 요청 시 "요청이 잦아…" |
| 코스 → 지도 | 결과의 "지도에서 보기" | `/#/map?sel=event:<id>`로 이동, 첫 정류장 선택됨 |
| 키 노출 | 배포된 JS에서 `SEOUL_API_KEY`·`ANTHROPIC` 값 검색 | 없음 (카카오 JS 키만 있음) |
| 찜 이전 | 기존 사용자 브라우저 | `nolseoul-favorites-v1-backup`, `nolseoul-favorites-v2-backup` 백업 키 생성, 찜 유지 |

## 5. 자동 점검 (배포 전 로컬)

```bash
npm run typecheck
npm run test:e2e        # 180개 (2026-11-11), 실제 Anthropic 호출 없음 (COURSE_AI_DISABLED=1 + 가짜 응답)
npx vite build --outDir /tmp/nolseoul-build --emptyOutDir
```
`/index.css doesn't exist at build time` 경고는 기존 것(TECH-01).
