STATUS: DONE

# 검증 계획 — 3탭 UI 도입 (회의 기록 / 노트 / 대화 번역)

본 문서는 `docs/subagent-loop/meeting-notes-translation-tabs/plan.md` 에 정의된 변경을 **10점 만점**으로 엄격히 채점한다.
"있다/없다"가 아니라 **완전 구현(배점) / 일부 구현(부분 점수) / 미구현(0점)** 3단으로 세분한다.

## 채점 규칙 (공통)

- **합격선**: 총점 ≥ 8.0 **AND** 모든 항목 ≥ 해당 항목 배점의 50%
- 점수는 0.5 단위로 부여. 끝 값(0, 만점)과 50%는 반드시 사용 가능
- 각 항목의 "감점 규칙"에 명시된 수치를 합산해 내려간다 (음수 방지: 0 하한)
- 각 항목은 **실행 가능한 확인 명령 / 브라우저 체크 절차**를 반드시 수행한 뒤 채점

---

## 배점표 (총 10.0점)

| # | 항목 | 배점 |
|---|---|---|
| A | 3탭 기능 완성도 | 2.5 |
| B | 파일 분리 구조 (ADR 0001) | 1.5 |
| C | 기존 기능 무회귀 | 1.5 |
| D | 런타임 안전성 (XSS/localStorage/fetch/로드순서) | 1.5 |
| E | 디자인 / i18n / 접근성 / 다크모드 / 모바일 | 1.5 |
| F | 읽기 전용·해시 공유 호환성 | 0.5 |
| G | `file://` 로컬 실행 호환 | 0.5 |
| H | 커밋 위생 & 스코프 준수 (비범위 침범 금지) | 0.5 |
| **합계** | | **10.0** |

---

## A. 3탭 기능 완성도 (2.5)

3개 탭이 DoD 기준으로 동작해야 만점. sub-score 3개로 쪼갠다.

### A-1. 탭 전환 & 영속 (0.7)

**확인 절차**
1. 크롬에서 `index.html` 를 `file://` 로 연다
2. 탭 버튼(회의/노트/번역) 3개가 헤더 아래에 보이는지
3. 각 버튼 클릭 시 해당 panel만 보이고 나머지는 `display:none`
4. "노트" 탭에서 새로고침 → "노트" 탭 유지되는지
5. DevTools > Application > Local Storage 에 `rt_active_tab` 키가 있고 값이 `notes`인지

**채점 기준**
- 만점(0.7): 위 5개 모두 통과
- -0.2: `rt_active_tab` 영속 실패 (새로고침 시 기본 탭으로 돌아감)
- -0.2: panel 전환 시 이전 panel이 DOM에 남아 덮어씀 / 둘 다 보임
- -0.2: 기본 탭이 `translate` 가 아닌 다른 값 (최초 방문 기준)
- -0.1: 탭 버튼이 시각적으로 활성 상태 표시 없음
- 미구현(0): 탭 바 자체가 없음

### A-2. 노트 탭 CRUD + 마이그레이션 (0.9)

**확인 절차**
1. 노트 탭에서 `+ 새 노트` 3회 → 리스트에 3개 노출, 각 노트 선택 가능
2. 한 노트의 제목/본문에 텍스트 입력 → 500ms 이후 `rt_notes_v1` 에 저장되는지 (Local Storage 확인)
3. 삭제 버튼 → confirm → 2개 남음
4. 새로고침 → 2개 유지 + 내용 복원
5. 사전에 `localStorage.setItem('rt_session_backup', JSON.stringify({note:'이전'}))` 로 넣고 새로고침 → 첫 노트에 "이전 메모" 로 이전되는지
6. 제목/본문을 `<img src=x onerror=alert(1)>` 로 입력 → alert 안 뜨고 그대로 텍스트로 표시 (textContent 렌더)

**채점 기준**
- 만점(0.9): 6개 모두 통과
- -0.3: 새로고침 후 복원 실패
- -0.3: XSS 차단 실패 (`innerHTML` 사용 흔적 발견 — `grep -n 'innerHTML' assets/js/notes.js` 로 확인)
- -0.2: 삭제 confirm 미구현
- -0.2: 레거시 `state.note` 마이그레이션 미동작
- -0.1: 선택된 노트 없을 때 에디터 빈 상태 처리 없음 (깨진 화면)
- -0.1: 자동 저장 debounce 없이 매 keystroke마다 write

### A-3. 회의 기록 탭 (0.9)

**확인 절차**
1. 회의 기록 탭 → 제목 input, 소스 언어 select, REC 버튼, 엔트리 리스트 컨테이너 존재
2. REC 시작 → 한 문장 발화 → `{HH:MM:SS}` 타임스탬프 + 원문 한 줄 추가
3. 같은 세션에서 번역 탭으로 이동 후 다시 돌아와도 엔트리 유지
4. REC 중지 후 번역 탭에서 REC → 번역 탭의 `entries`에만 추가, `meetingEntries`에는 추가되지 않음 (교차 오염 검사)
5. 새로고침 → `rt_meeting_entries_v1` 에서 복원
6. `TXT 다운로드` → 타임스탬프+본문이 포함된 텍스트 파일 저장
7. LLM 키 미설정 시 `요약` 버튼 `disabled` 상태
8. `클리어` → confirm 후 엔트리 비워짐 + 저장소 초기화

**채점 기준**
- 만점(0.9): 8개 모두 통과
- -0.3: 번역 탭 ↔ 회의 탭 entries 교차 오염 (가장 위험한 버그)
- -0.2: 새로고침 복원 실패
- -0.2: `recordingSurface` 구분 없이 번역 파이프라인이 회의 기록에도 fetch 호출 (네트워크 탭에서 확인)
- -0.1: 타임스탬프 형식 누락
- -0.1: TXT 다운로드 미구현
- -0.1: LLM 미설정 시 요약 버튼 enabled 상태로 노출

---

## B. 파일 분리 구조 — ADR 0001 (1.5)

### B-1. 디렉토리/파일 존재 & 개수 (0.5)

**확인 명령**
```bash
ls -la /Users/pulp/Desktop/Repositories/realtime-translater-web/assets/css
ls -la /Users/pulp/Desktop/Repositories/realtime-translater-web/assets/js
find /Users/pulp/Desktop/Repositories/realtime-translater-web/assets -type f | wc -l
```

**기대값** (plan.md §7): `base.css`, `tabs.css`, `state.js`, `tabs.js`, `notes.js`, `meeting.js`, `translation.js`, `app.js` 총 **7~8개** (translation.js 는 점진 이전 범위에 따라 생략 가능하되 최소 6개는 존재)

**채점 기준**
- 만점(0.5): `assets/css/` 에 2개 (base.css, tabs.css), `assets/js/` 에 최소 4개 (state, tabs, notes, meeting, app 중 4+) 존재, 총 파일 **10개 이하**
- -0.2: 10개 초과 ("과도한 분리" 위반)
- -0.2: `assets/` 미생성 (인라인만 유지) — 단, 이 경우 B-2/B-3 도 연동 실패
- -0.1: `css/`, `js/` 중 하나만 존재
- -0.1: 파일명이 plan 규격과 다름 (예: `note.js`, `styles.css`)

### B-2. 로드 순서 & 전역 네임스페이스 (0.6)

**확인 명령**
```bash
grep -n 'href="assets/css' /Users/pulp/Desktop/Repositories/realtime-translater-web/index.html
grep -n 'src="assets/js'   /Users/pulp/Desktop/Repositories/realtime-translater-web/index.html
grep -n 'import \|export '  /Users/pulp/Desktop/Repositories/realtime-translater-web/assets/js/*.js
grep -n 'window\.\(State\|Tabs\|Notes\|Meeting\|Translation\)' /Users/pulp/Desktop/Repositories/realtime-translater-web/assets/js/*.js
```

**기대값**
- `<head>`: `base.css` → `tabs.css` 순
- `<body>` 하단: `lz-string CDN` → `state.js` → `tabs.js` → (feature들) → `app.js`
- ES Module `import`/`export` **0건**
- 각 feature 파일이 `window.<Namespace>` 로 노출

**채점 기준**
- 만점(0.6): 기대값 4개 모두 충족
- -0.3: `import`/`export` 사용 (ADR 0001 조건부 위반 — `file://` 깨짐)
- -0.2: 스크립트 순서 역전 (`tabs.js` 가 `state.js` 전에 로드됨 등)
- -0.2: 전역 네임스페이스 없이 let/const 로 선언되어 다른 파일에서 참조 불가 (또는 top-level scope 오염)
- -0.1: `defer` 없이 `app.js` 가 `DOMContentLoaded` 전에 실행 시도

### B-3. 번들러/패키지 매니저 미도입 & 인라인 정리 (0.4)

**확인 명령**
```bash
ls /Users/pulp/Desktop/Repositories/realtime-translater-web/package.json 2>/dev/null
ls /Users/pulp/Desktop/Repositories/realtime-translater-web/node_modules 2>/dev/null
ls /Users/pulp/Desktop/Repositories/realtime-translater-web/vite.config.* /Users/pulp/Desktop/Repositories/realtime-translater-web/webpack.config.* 2>/dev/null
wc -l /Users/pulp/Desktop/Repositories/realtime-translater-web/index.html
```

**기대값**
- `package.json`/`node_modules`/번들러 설정 **없음**
- `index.html` 줄 수가 이전(3,285줄)보다 눈에 띄게 감소 (≥ 500줄 감소 권장, 분리한 블록이 실제로 빠져나갔음을 증빙)

**채점 기준**
- 만점(0.4): 번들러/패키지 매니저 0, index.html 줄 수 감소 ≥ 500줄
- -0.3: `package.json` 신규 추가
- -0.2: 번들러 설정 파일 존재
- -0.1: 줄 수 감소 < 200줄 (분리만 흉내내고 실제로 인라인 중복)
- -0.1: 이전 완료된 블록의 원본 인라인이 `<style>`/`<script>` 에 잔류

---

## C. 기존 기능 무회귀 (1.5)

plan §11 DoD 4번: "대화 번역 탭 기존 동작 무회귀"

### C-1. 핵심 기능 스모크 (1.0)

**브라우저 체크리스트 (순서대로 실행)** — 각 항목 통과 시 체크
1. [ ] 번역 탭 REC 시작 → 음성 인식 동작
2. [ ] 번역 결과가 `#entries`(기존) 에 누적
3. [ ] 공유 버튼 → URL 해시에 `#v=1/...` 포맷 생성 (API key 미포함)
4. [ ] 해시 공유 URL을 새 탭에서 열기 → 엔트리 복원
5. [ ] TXT/JSON 다운로드 동작
6. [ ] 설정 모달 열기/닫기/저장 정상
7. [ ] 테마 토글 (라이트 ↔ 다크) 정상
8. [ ] 요약 버튼 (LLM 설정 시) → 요약 섹션에 결과 표시
9. [ ] 시스템 오디오 캡처 모드 토글 정상
10. [ ] 언어 스왑 버튼 정상

**채점 기준**
- 만점(1.0): 10/10
- 1개 실패마다 -0.1
- 3개 이상 실패 시 최대 0.4점 cap

### C-2. 기존 localStorage 키 & URL 해시 포맷 역호환 (0.5)

**확인 명령**
```bash
grep -nE "localStorage\.(get|set|remove)Item\('rt_" /Users/pulp/Desktop/Repositories/realtime-translater-web/index.html /Users/pulp/Desktop/Repositories/realtime-translater-web/assets/js/*.js 2>/dev/null
grep -nE "v\s*:\s*1|'v':\s*1|\"v\":\s*1" /Users/pulp/Desktop/Repositories/realtime-translater-web/index.html /Users/pulp/Desktop/Repositories/realtime-translater-web/assets/js/*.js 2>/dev/null
```

**기대값**
- 기존 `rt_*` 키는 모두 존재 (`rt_session_backup`, `rt_llm_*`, `rt_theme` 등)
- 신규 키는 `rt_active_tab`, `rt_notes_v1`, `rt_meeting_entries_v1` 3개만 추가
- `serializeState` 버전 `v:1` 그대로 유지

**재현 테스트**
- 변경 전 브랜치에서 생성한 공유 URL (있으면) → 현재 브랜치 빌드에서 로드 성공

**채점 기준**
- 만점(0.5): 기존 키 보존 + 신규 키 정확히 3개 + 해시 포맷 무변경
- -0.3: 기존 키 이름 변경/삭제 (기존 사용자 데이터 소실)
- -0.2: 해시 포맷 버전 올라감 (`v:2`) 또는 payload 구조 변경
- -0.1: 신규 키가 plan 규격과 다름 (예: `rt_notes` vs `rt_notes_v1`)
- -0.1: 구 버전 공유 URL 열기 실패

---

## D. 런타임 안전성 (1.5)

AGENTS.md "보안 필수사항" + plan §8.

### D-1. `innerHTML` / XSS (0.5)

**확인 명령**
```bash
grep -n 'innerHTML' /Users/pulp/Desktop/Repositories/realtime-translater-web/assets/js/*.js
grep -n 'innerHTML' /Users/pulp/Desktop/Repositories/realtime-translater-web/index.html | grep -v '^[^:]*:[[:space:]]*//'
```

**기대값**
- `assets/js/notes.js`, `meeting.js`, `tabs.js` 에 `innerHTML` **0건** (신규 코드)
- `index.html` 인라인에 남은 `innerHTML` 은 기존 코드(요약 렌더, 설정 모달 등) 한정. 신규 추가 **0건**

**채점 기준**
- 만점(0.5): 신규 JS 파일에 `innerHTML` 0건 + 기존 `innerHTML` 사용처에 이스케이프 함수 적용 유지
- -0.3: 신규 코드에 `innerHTML` + 이스케이프 없이 사용자 입력 주입 (위 A-2 재현 테스트에서 alert 뜸)
- -0.2: 신규 코드에 `innerHTML` + 이스케이프 처리됨 (방어는 되지만 규칙 위반)
- -0.1: `insertAdjacentHTML` 같은 우회 패턴 신규 사용

### D-2. localStorage JSON.parse 가드 (0.3)

**확인 명령**
```bash
grep -nB2 -A5 'JSON.parse' /Users/pulp/Desktop/Repositories/realtime-translater-web/assets/js/*.js
```

**기대값**: `rt_notes_v1`, `rt_meeting_entries_v1`, `rt_active_tab` 을 읽는 모든 위치에 `try/catch` 또는 기본값 fallback, `Array.isArray` 가드

**채점 기준**
- 만점(0.3): 모든 `JSON.parse` 가 try/catch + 기본값 반환 + `Array.isArray` 가드
- -0.2: localStorage 깨진 값 주입 시 앱 크래시 (재현: `localStorage.setItem('rt_notes_v1','{'); 새로고침`)
- -0.1: try/catch 없이 optional chaining 만 사용

### D-3. fetch timeout & API key 비공개 (0.4)

**확인 명령**
```bash
grep -n 'fetch(' /Users/pulp/Desktop/Repositories/realtime-translater-web/assets/js/*.js /Users/pulp/Desktop/Repositories/realtime-translater-web/index.html
grep -nE 'AbortController|signal:|setTimeout.*abort' /Users/pulp/Desktop/Repositories/realtime-translater-web/assets/js/*.js /Users/pulp/Desktop/Repositories/realtime-translater-web/index.html
```

**재현 테스트**: 공유 URL 생성 후 해시에 `sk-` / `apikey` / `llmKey` 키워드 검색 → 0건이어야 함

**채점 기준**
- 만점(0.4): 신규 fetch 호출 **0건** (기존 번역/요약 API 재사용만) + 기존 fetch의 AbortController/timeout 유지 + 해시에 API key 포함 0건
- -0.2: 신규 fetch 추가 + timeout 누락
- -0.2: 공유 해시에 API key 포함 확인됨
- -0.1: 신규 fetch 추가됐지만 timeout 은 있음

### D-4. 이벤트 중복 바인딩 / 전역 오염 (0.3)

**확인 절차**
1. 탭 이동 → 복귀 → REC 시작을 3회 반복했을 때 console 에 같은 이벤트가 다중 발화되지 않는지 (console.log 주입으로 확인 or 엔트리가 중복 삽입되지 않는지)
2. `Object.keys(window).filter(k => !Original.has(k))` 로 전역 네임스페이스가 `State/Tabs/Notes/Meeting/Translation/state` 수준에서만 증가

**채점 기준**
- 만점(0.3): 중복 바인딩 0 + 전역 오염이 명시된 네임스페이스에 한정
- -0.2: 탭 전환 시 리스너 누적 → 엔트리 중복/메모리 누수
- -0.1: `window.foo`, `window.tmp` 등 이름 없는 전역 변수 노출

---

## E. 디자인 / i18n / 접근성 / 다크모드 / 모바일 (1.5)

### E-1. 디자인 토큰 + 3탭 시각 일관화 (0.4)

**확인 명령**
```bash
grep -nE '\-\-surface-raised|\-\-tab-active|\-\-divider-strong' /Users/pulp/Desktop/Repositories/realtime-translater-web/assets/css/*.css /Users/pulp/Desktop/Repositories/realtime-translater-web/index.html
```

**기대값**
- `:root` 와 `[data-theme="dark"]` 양쪽에 3개 토큰 모두 정의
- 활성 탭 버튼에 accent underline + bold
- 3개 탭 panel 의 padding 12/16px 통일

**채점 기준**
- 만점(0.4): 위 3개 모두 충족
- -0.2: 토큰이 light/dark 중 한쪽에만 정의
- -0.2: 활성 탭 시각 구분 없음 (색/밑줄/bold 전부 없음)
- -0.1: 탭 panel 간 padding/gap 불일치

### E-2. i18n 양쪽 locale (0.3)

**확인 명령**
```bash
grep -nE "tabMeeting|tabNotes|tabTranslate|newNote|deleteNote|untitledNote|notesEmpty|meetingTitle|meetingPlaceholder|clearMeeting|downloadTxt|summarize" /Users/pulp/Desktop/Repositories/realtime-translater-web/index.html
```

**기대값**: `I18N.ko` 와 `I18N.en` 양쪽에 동일 키 개수 존재

**채점 기준**
- 만점(0.3): 신규 키가 ko/en 양쪽에 누락 없이 추가됨 (`data-i18n` 적용 요소도 실제로 번역됨)
- -0.2: 한쪽 locale 에만 존재 → 언어 전환 시 key 문자열 그대로 노출
- -0.1: 신규 UI 문자열 중 일부가 하드코딩되어 `data-i18n` 미적용

### E-3. 다크모드 (0.3)

**확인 절차**
1. 테마 토글 → 3탭 모두 순회
2. 각 탭에서 텍스트 대비, 경계선, 활성 탭 강조가 라이트/다크 모두 정상

**채점 기준**
- 만점(0.3): 3탭 × 2테마 = 6개 스크린 모두 정상
- -0.2: 다크 모드에서 탭 바/패널 배경이 라이트 색 잔존
- -0.1: 다크 모드에서 텍스트 대비 부족 (눈으로 봐서 판독 어려움)

### E-4. 모바일 375px & 접근성 (0.5)

**확인 절차**
1. DevTools device toolbar → iPhone SE (375×667)
2. 탭 바가 가로 스크롤 없이 보이고, 3개 버튼이 한 줄에 정렬
3. 노트 탭: 목록/에디터가 모바일에서 토글 가능 (plan §4)
4. 탭 버튼에 `role="tab"` 또는 `<button>` + `aria-selected` 적용
5. 탭 panel 에 `role="tabpanel"` 또는 semantic `<section>` + `aria-hidden` 적용
6. 키보드: Tab 키로 탭 버튼 순회, Enter/Space 로 전환

**채점 기준**
- 만점(0.5): 6개 모두 통과
- -0.2: 모바일 탭 바가 가로 스크롤 발생 / 깨짐
- -0.2: aria 속성 전무
- -0.1: 모바일 노트 목록/에디터 토글 미구현
- -0.1: 키보드로 탭 전환 불가

---

## F. 읽기 전용·해시 공유 호환성 (0.5)

plan §2-5, §6 단계 4.

**확인 절차**
1. 기존 번역 탭에서 엔트리 생성 → 공유 버튼 → URL 복사
2. 새 시크릿 창에서 해당 URL 열기
3. 번역 탭에 강제 진입 + 엔트리 복원
4. 탭 버튼 3개가 `disabled` (클릭 불가, 시각적으로 회색)
5. 회의/노트 탭의 write 경로 비활성 (새 노트 추가 등 안 됨)
6. 정상 모드로 재진입(해시 제거) → 탭 자유 전환 복원

**확인 명령**
```bash
grep -nE 'guardTabForReadOnly|readOnly|isReadOnly' /Users/pulp/Desktop/Repositories/realtime-translater-web/assets/js/*.js /Users/pulp/Desktop/Repositories/realtime-translater-web/index.html
grep -nE 'scheduleHashUpdate|activeTab.*translate' /Users/pulp/Desktop/Repositories/realtime-translater-web/assets/js/*.js /Users/pulp/Desktop/Repositories/realtime-translater-web/index.html
```

**채점 기준**
- 만점(0.5): 6개 절차 모두 통과 + `scheduleHashUpdate` 가 `activeTab === 'translate'` 조건 추가됨
- -0.2: 해시 모드에서 탭 버튼 클릭 가능
- -0.2: 해시 모드에서 `scheduleHashUpdate` 가 회의/노트 변경에도 호출
- -0.1: 해시 제거 후 탭 disabled 잔류

---

## G. `file://` 로컬 실행 호환 (0.5)

**확인 절차**
1. 터미널: `open /Users/pulp/Desktop/Repositories/realtime-translater-web/index.html` (Chrome 열림, URL `file://...`)
2. DevTools > Console 에 에러 **0건**
3. 3개 탭 순회 → 모두 렌더
4. Network 탭: `lz-string` CDN 과 자체 `assets/*` 만 로드, 404 없음
5. CORS 관련 에러 없음 (`import`/`export` 미사용 증명)

**채점 기준**
- 만점(0.5): 5개 모두 통과
- -0.3: 콘솔에 ES Module CORS 에러 (`import` 사용)
- -0.2: `assets/*` 404 (경로 오타)
- -0.1: 경고(warning) 다수 (`file://` 특유 warning 제외)

---

## H. 커밋 위생 & 스코프 준수 (0.5)

plan §6(단계 독립 커밋), §9(비범위), §10(롤백).

**확인 명령**
```bash
git -C /Users/pulp/Desktop/Repositories/realtime-translater-web log --oneline main..HEAD
git -C /Users/pulp/Desktop/Repositories/realtime-translater-web diff --stat main..HEAD
```

**기대값**
- plan의 단계(1~6) 별로 커밋이 분리되어 있음 (최소 5개 이상)
- 커밋 메시지가 Conventional Commit 형식 (`feat(tabs):`, `refactor(assets):` 등)
- diff stat 에서 **비범위 파일 변경 0건**:
  - `gas-proxy.js`, README, ADR, docs 하위 비관련 파일 **변경 없음** (이 작업에서는 plan.md/verification 문서만 허용)
- 기존 Whisper/시스템 오디오/설정 모달 로직의 **리팩터 흔적 없음** (파일 이동만 허용)

**채점 기준**
- 만점(0.5): 5개 이상 커밋 + 컨벤션 준수 + 비범위 변경 0
- -0.2: 1개 거대 커밋(squashed without separation) — 롤백 불가
- -0.2: 비범위 파일 리팩터 (예: Whisper 로직 "개선", CSS 변수 이름 바꿈)
- -0.1: 커밋 메시지가 `wip`, `fix`, `update` 같은 모호한 값
- -0.1: `package.json`/node_modules 등 금지 파일 포함

---

## 실행 체크리스트 요약 (검증 에이전트 가이드)

검증 에이전트는 다음 순서로 실행한다:

1. **정적 검사** (bash 명령 묶음)
   ```bash
   cd /Users/pulp/Desktop/Repositories/realtime-translater-web
   ls assets/css assets/js
   find assets -type f | wc -l
   wc -l index.html
   grep -n 'href="assets/css'  index.html
   grep -n 'src="assets/js'    index.html
   grep -n 'import \|export '  assets/js/*.js
   grep -n 'window\.\(State\|Tabs\|Notes\|Meeting\|Translation\)' assets/js/*.js
   grep -n 'innerHTML'         assets/js/*.js
   grep -n 'fetch('            assets/js/*.js
   grep -nE '\-\-surface-raised|\-\-tab-active|\-\-divider-strong' assets/css/*.css
   grep -nE "tabMeeting|tabNotes|tabTranslate|newNote|untitledNote|meetingTitle|clearMeeting|downloadTxt" index.html
   grep -nE "localStorage\.(get|set)Item\('rt_" index.html assets/js/*.js
   ls package.json node_modules vite.config.* webpack.config.* 2>/dev/null || echo "빌드툴 없음 확인"
   git log --oneline main..HEAD
   git diff --stat main..HEAD
   ```

2. **브라우저 스모크 테스트** (체크리스트 순서대로)
   - A-1 탭 전환/영속 → A-2 노트 CRUD → A-3 회의 기록
   - C-1 기존 10개 기능 회귀
   - E-3 다크모드 / E-4 모바일 375px
   - F 읽기 전용 모드
   - G `file://` 로컬 실행

3. **채점 & 리포트**
   - 각 항목 sub-score 합산 → 항목 점수
   - 항목 점수 합산 → 총점
   - **합격**: 총점 ≥ 8.0 AND 모든 항목이 배점의 50% 이상
   - 각 감점 사유에 **재현 단계와 증빙**(명령 출력, 스크린샷 경로, 파일 라인 번호)을 붙인다

---

## 부록: 빠른 판정 (Early Reject)

다음 중 하나라도 해당하면 총점과 무관하게 **Round 재진입(수정 필요)** 으로 판정:

- `package.json` 또는 번들러 설정 파일 신규 추가
- `assets/js/*.js` 에서 `import`/`export` 사용
- 공유 URL 해시에 API key 노출 확인
- 신규 코드의 `innerHTML` 에 사용자 입력을 이스케이프 없이 주입하여 XSS 재현
- 기존 `rt_session_backup` / `rt_llm_*` / `rt_theme` 등 기존 localStorage 키 손실
- `index.html` 외에 HTML 엔트리 파일 추가 (예: `notes.html`)
