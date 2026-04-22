STATUS: DONE

# 3 탭 UI 도입 — 회의 기록 / 노트 / 대화 번역

## 0. 프로젝트 제약 요약 (작업 전 반드시 숙지)

| 항목 | 현황 | 영향 |
|---|---|---|
| 빌드/번들러 | 없음. `index.html`(3,285줄) + `lz-string` CDN 1개 | 번들러/패키지 매니저 **여전히 금지**. 단, [ADR 0001](../../adr/0001-allow-js-css-separation.md)로 **JS/CSS 파일 분리는 허용**됨 (과도한 분리 지양) |
| 프레임워크 | 없음 (vanilla JS + 전역 `state` 객체) | 라우터/컴포넌트 시스템 부재. 탭은 **상태 기반 전환**으로 구현 |
| 모듈 시스템 | 없음 | **ES Module import/export 지양** — `file://` 로컬 실행 호환을 위해 전역 `window.*` 네임스페이스 우선 |
| 스타일 | `<style>` 태그 내 CSS 변수 + `[data-theme="dark"]` 오버라이드 | 토큰 확장은 OK, 기존 변수명 유지. 일부 CSS는 외부 파일로 이전 허용 |
| i18n | `I18N.ko` / `I18N.en` 객체 리터럴 + `data-i18n` 속성 | 새 문자열은 두 locale 모두 추가 필수 |
| 공유 | `LZString`으로 state를 URL 해시에 직렬화 (`serializeState` / `loadFromHash`, 버전 `v:1`) | 탭 개념 추가 시 버전 호환성 유지해야 함 |
| 저장 | 설정은 `rt_*` prefix의 `localStorage`, 세션 백업은 `rt_session_backup` | 새 탭의 데이터도 동일 규약 따름 |
| 기존 "메모" 영역 | `#noteSection` (`<textarea>`). 번역 화면 안에 공존. state.note, localStorage 저장 없음(세션 백업 경유) | **탭 분리 시 독립 탭으로 승격하면서 데이터 모델만 유지** |

> ADR 0001에 따라 **기능 단위 파일 분리는 허용**된다. 다만 "한 함수 = 한 파일" 같은 미시 분할은 금지이며, 본 작업에서는 탭 도입에 필요한 **최소 분리**만 수행한다 (아래 §7 참조). 번들러/패키지 매니저/ES Module은 도입하지 않는다.

---

## 1. 변경 사항 요약

1. 헤더 아래에 3개 탭(**회의 기록 / 노트 / 대화 번역**) 네비게이션 추가
2. 기존 번역 UI(lang-bar, transcript-area, summary-section, control-bar 등)를 "대화 번역" 탭의 컨테이너로 이동
3. 기존 `#noteSection`을 독립 "노트" 탭으로 승격 + 다중 노트(목록) 지원 최소 스펙
4. "회의 기록" 탭 신규 추가: 음성 기록 전용 (번역 토글 off 모드로, 원문만 기록 + 메모 병기)
5. 디자인 개선: 탭/카드/여백 톤 일관화, 기존 CSS 변수 확장(중성 shade 2~3개 추가), 다크모드 동시 대응
6. **구조 개선**: 기존 `index.html` 단일 파일에 인라인되어 있던 JS/CSS 중 일부를 `assets/js/`, `assets/css/`로 **점진적으로** 분리 (ADR 0001 근거)

---

## 2. 탭 UI 설계 결정

### 2-1. 전환 방식
- **상태 기반 단일 페이지** (라우터 도입 금지). `state.activeTab: 'meeting' | 'notes' | 'translate'`
- 전환 시 `data-active-tab` 속성을 `<body>`에 반영 → CSS로 `.tab-panel[data-tab]` 표시/숨김
- 현재 탭은 `localStorage.rt_active_tab`에 영속. 초기값: `translate` (기존 사용자 혼란 최소화)
- URL 해시 공유는 **`translate` 탭의 세션만** 계속 담당(기존 호환). 다른 탭에서는 해시 write 중단

### 2-2. 탭 간 상호작용
| 상황 | 동작 |
|---|---|
| 녹음 중 탭 이동 | 녹음 유지. 상단에 "녹음 중" 작은 배지 노출. (control-bar는 `translate` 탭에만 표시) |
| "회의 기록" 탭에서 REC | 동일 speech recognition 재사용, 단 `state.recordingSurface = 'meeting'`로 구분 — 결과는 `state.meetingEntries`에 축적 |
| 읽기 전용(해시 데이터) | 강제로 `translate` 탭 고정, 탭 네비게이션 disable |

### 2-3. 상태 모델 확장
```js
state = {
  // 기존
  activeTab: 'translate',         // NEW
  // 대화 번역
  entries: [...],                 // 기존 유지
  // 회의 기록 (신규)
  meetingEntries: [],             // {ts, text, lang}[]  — 번역 없이 원문만
  meetingTitle: '',
  // 노트 (신규, 다중)
  notes: [],                      // {id, title, body, updatedAt}[]
  activeNoteId: null,
  // 호환: 기존 state.note는 "현재 탭 전환 시 첫 노트로 마이그레이션"
}
```

### 2-4. localStorage 키 확장
| 키 | 설명 |
|---|---|
| `rt_active_tab` | 마지막 탭 |
| `rt_notes_v1` | JSON: `{notes: [...], activeNoteId}` |
| `rt_meeting_entries_v1` | JSON: 회의 기록 세션 (단일 세션만 저장, 사용자 종료 시 덮어쓰기) |
| `rt_session_backup` | 기존 — 대화 번역 백업 그대로 유지 |

### 2-5. URL 해시 직렬화 변경
- `serializeState` 는 현재도 번역 데이터 전용. **변경 없음** (회의 기록/노트는 공유 대상이 아님)
- `loadFromHash()`가 데이터를 찾으면 `state.activeTab='translate'` + 읽기 전용 진입 — 기존 동작 유지

---

## 3. 디자인 개선 방향 (최소)

범위는 **토큰 확장 + 탭 바 + 카드 여백 통일**에 한정. 전면 리디자인 금지.

- CSS 변수 추가:
  - `--surface-raised`(탭 활성 패널 배경), `--tab-active`, `--divider-strong`
  - 다크모드 대응 값 동시 추가
- 탭 바: `.tab-bar` (높이 44px, 아이콘+라벨, 활성 탭만 accent underline)
- 각 탭 패널: `.tab-panel { padding: 12px 16px; }` 공통 래퍼
- 기존 `.note-section`, `.summary-section`은 `translate` 탭 내부로 편입 (마크업 위치 이동만, 클래스/ID 유지)
- 모바일: 탭 바는 하단 고정 옵션 없이 상단 유지(이번 범위에서는 레이아웃 재편 금지)

---

## 4. "노트" 탭 최소 스펙

| 항목 | 사양 |
|---|---|
| 저장 | `localStorage.rt_notes_v1` |
| 데이터 | `{id, title, body, updatedAt}` |
| UI | 좌측 목록(제목 + 최근 수정일) / 우측 에디터(제목 input + body textarea). 모바일에서는 목록/에디터 토글 |
| 액션 | `+ 새 노트`, 선택, 삭제(휴지통 아이콘, confirm), 인라인 제목 편집 |
| 자동 저장 | body/title 변경 시 500ms debounce로 localStorage 갱신 |
| 검색/정렬/태그 | **범위 외** (요구 안 됨) |
| 마이그레이션 | 앱 최초 로드 시 기존 `state.note`가 비어있지 않으면 `[{id, title:"이전 메모", body: note, updatedAt: now}]`로 이전 |

---

## 5. "회의 기록" 탭 최소 스펙

- 목적: **번역 없이 원문만** 실시간 받아쓰기
- 언어: 단일 소스 언어 선택(드롭다운 재사용 가능) 또는 Whisper 자동감지
- UI:
  - 상단: 회의 제목 input, 소스 언어 select, [녹음 시작/중지] 버튼
  - 본문: 시간 태그(`HH:MM:SS`) + 문장이 한 줄씩 쌓이는 리스트
  - 하단 액션: `요약하기`(LLM 있을 때만 활성), `TXT 다운로드`, `클리어`
- 데이터: `state.meetingEntries`, `rt_meeting_entries_v1`에 저장(단일 세션)
- 요약: 기존 `generateSummary` 재사용 — `entries` 대신 `meetingEntries`의 원문 텍스트를 입력
- 비고: **이번 범위는 로컬 단일 세션만**. 회의 목록/히스토리 없음

---

## 6. 실행 단계 체크리스트

각 단계 끝에 "검증 방법"을 명시한다. 매 단계마다 `index.html`을 Chrome에서 열어 smoke test.

> **파일 분리 원칙**: 기능이 확정된 뒤에 **점진적으로** 외부 파일로 이동한다. 한 번에 모든 코드를 옮기지 않는다 — 회귀 위험을 단계별로 격리한다.

### 단계 1 — 탭 스켈레톤 마크업 + 상태 (여전히 인라인)
- [ ] 수정: `index.html`
  - `#header` 바로 아래에 `<nav class="tab-bar">` 3개 버튼 추가 (`data-tab="meeting|notes|translate"`)
  - 기존 `#langBar` ~ `#controlBar`를 `<section class="tab-panel" data-tab="translate">`로 감싼다
  - 빈 panel 추가: `<section class="tab-panel" data-tab="meeting">`, `<section class="tab-panel" data-tab="notes">`
  - `state.activeTab` 추가, `switchTab(tab)` 함수 추가 (body에 `data-active-tab` 세팅)
  - `localStorage.rt_active_tab` 읽기/쓰기
- [ ] 수정: CSS (인라인 유지)
  - `.tab-bar`, `.tab-btn`, `.tab-btn.active`, `.tab-panel { display:none } .tab-panel.active { display:flex|block }`
  - 다크모드 동시 스타일
- [ ] 수정: i18n 키 3개 추가 (`tabMeeting`, `tabNotes`, `tabTranslate`) — `I18N.ko` / `I18N.en` 양쪽
- [ ] 검증:
  - [ ] 3개 탭 버튼 클릭 시 해당 panel만 표시
  - [ ] 새로고침해도 마지막 탭 유지
  - [ ] 기존 번역 기능(REC, 공유, 다운로드, 설정) 무회귀
  - [ ] 다크모드 전환 시 탭 바 스타일 정상

### 단계 2 — 기존 "메모"를 노트 탭으로 승격 (여전히 인라인)
- [ ] 수정: 기존 `#noteSection` 마크업을 `translate` 패널에서 제거, `notes` 패널에 재배치. id 유지(`noteSection`, `noteTextarea`)
- [ ] 추가: 노트 리스트 사이드바 마크업(`<aside class="notes-list">`) + 노트 에디터 영역(`<div class="notes-editor">`)
- [ ] 추가: `initNotes()` — localStorage 로드, 마이그레이션, 렌더
- [ ] 추가: `renderNotesList()`, `selectNote(id)`, `createNote()`, `deleteNote(id)`, `saveNotesDebounced()`
- [ ] 삭제(정리): `initSectionToggles()` 중 note 토글 부분은 유지하되, 번역 탭 쪽 참조만 제거
- [ ] i18n: `newNote`, `deleteNote`, `untitledNote`, `notesEmpty` 키 추가
- [ ] 검증:
  - [ ] 새 노트 생성/선택/삭제
  - [ ] 제목·본문 입력 후 새로고침 시 복원
  - [ ] 기존 `state.note`가 있으면 자동 이전되어 첫 노트로 표시
  - [ ] 대화 번역 탭에서는 노트 섹션이 더 이상 보이지 않음 (의도된 변경)
  - [ ] XSS 방지: 제목/본문은 `textContent`로 렌더 (innerHTML 금지)

### 단계 3 — "회의 기록" 탭 추가 (여전히 인라인)
- [ ] 마크업: 제목 input, 소스 언어 select(기존 `LANG_MAP` 재사용), REC 버튼, 엔트리 리스트 컨테이너, 요약/다운로드/클리어 버튼
- [ ] 상태: `state.meetingEntries`, `state.meetingTitle`, `state.recordingSurface`
- [ ] 로직:
  - [ ] `recognition.onresult` 핸들러 분기: `recordingSurface === 'meeting'`이면 번역 파이프라인 건너뛰고 `meetingEntries.push({ts, text, lang})`
  - [ ] `renderMeetingEntries()` — 시간 + 원문 줄 단위 DOM 추가 (innerHTML 금지)
  - [ ] `rt_meeting_entries_v1` 저장/로드
  - [ ] TXT 다운로드: 기존 `download` 유틸 재사용 또는 간단한 blob 생성
  - [ ] 요약: `meetingEntries.map(e=>e.text).join('\n')`를 기존 `generateSummary`에 전달
- [ ] i18n: `meetingTitle`, `meetingPlaceholder`, `clearMeeting`, `downloadTxt`, `summarize` 등 추가
- [ ] 검증:
  - [ ] REC 시작 → 한 문장 말하기 → 엔트리에 시간+원문 추가
  - [ ] 다른 탭으로 이동했다 돌아와도 엔트리 유지
  - [ ] 번역 탭에서 REC 후 번역 결과가 번역 탭 entries에만 쌓이는지 (교차 오염 없음)
  - [ ] 새로고침 후 `rt_meeting_entries_v1` 복원
  - [ ] LLM 미설정 시 요약 버튼 disabled

### 단계 4 — 공유/해시 호환성 + 읽기 전용 모드
- [ ] `loadFromHash()`가 데이터를 찾으면: `state.activeTab = 'translate'`로 강제 + 탭 버튼 `disabled`
- [ ] `scheduleHashUpdate()`는 `activeTab === 'translate'`일 때만 실행(기존 대비 no-op 조건 추가만)
- [ ] 검증:
  - [ ] 공유 URL(해시) 접속 시 번역 탭 고정, 탭 버튼 비활성
  - [ ] 해시 데이터 없는 정상 모드에서는 해시가 회의기록/노트 편집에 영향 없음
  - [ ] 기존 공유 URL 역호환 OK (serializeState 포맷 변경 없음)

### 단계 5 — 디자인 토큰 확장 + 시각 일관화
- [ ] `:root`와 `[data-theme="dark"]`에 `--surface-raised`, `--tab-active`, `--divider-strong` 3개만 추가
- [ ] 탭 바 스타일 확정(활성 탭 accent underline + bold)
- [ ] 3개 탭 패널의 padding/gap 통일 (12px/16px)
- [ ] 기존 컴포넌트 색/폰트/라운드는 **건드리지 않음** — "Surgical Changes" 원칙 준수
- [ ] 검증:
  - [ ] Light/Dark 각각 모든 탭 시각 확인
  - [ ] 모바일 viewport(375px)에서 탭 바 가로 스크롤 없이 표시되는지
  - [ ] 기존 회의록 렌더, 설정 모달 외형 무변화

### 단계 6 — 인라인 → 외부 파일 점진 분리 (ADR 0001)

단계 1~5에서 안정화된 코드를 `assets/` 하위로 옮긴다. **각 sub-step마다 새로고침하여 기존 기능 무회귀를 확인**한 뒤 다음으로 진행한다.

- [ ] 6-1. 디렉토리 생성: `assets/css/`, `assets/js/` (`ls`로 사전 확인)
- [ ] 6-2. **CSS 먼저 분리** (JS보다 리스크가 낮음)
  - [ ] `assets/css/base.css` 생성: `:root` 토큰, `[data-theme="dark"]` 오버라이드, 기본 레이아웃(`body`, `#header`, 공통 버튼/인풋 등) 이전
  - [ ] `assets/css/tabs.css` 생성: `.tab-bar`, `.tab-btn`, `.tab-panel` 및 탭별 레이아웃(노트 리스트/에디터, 회의 리스트) 이전
  - [ ] `index.html <head>`에 `<link rel="stylesheet" href="assets/css/base.css">` → `<link rel="stylesheet" href="assets/css/tabs.css">` 순서로 로드
  - [ ] 이전한 부분을 `<style>`에서 삭제. 남은 인라인 CSS는 기존 탭 외 피처(예: 설정 모달, 요약 섹션)에 한정되며 그대로 둔다
  - [ ] 검증: Light/Dark, 3개 탭 모두 시각 무변화, 모바일 375px OK
- [ ] 6-3. **JS 분리 — 전역 state와 탭**
  - [ ] `assets/js/state.js` 생성: `window.state = { ... }` 초기값, `saveState`/`loadState` 등 localStorage 헬퍼 (기존과 동일 키). 다른 파일은 모두 `window.state`를 참조
  - [ ] `assets/js/tabs.js` 생성: `switchTab`, `initTabs`, `guardTabForReadOnly`를 `window.Tabs` 네임스페이스로 노출
  - [ ] `index.html` 하단 스크립트 태그 순서 확정: `state.js` → `tabs.js` → (이후 feature 파일들) → `app.js`
  - [ ] 검증: 탭 전환/새로고침 유지/읽기 전용 가드 정상
- [ ] 6-4. **JS 분리 — feature 단위**
  - [ ] `assets/js/notes.js` 생성: 단계 2의 `initNotes` ~ `saveNotesDebounced`를 `window.Notes`로 노출
  - [ ] `assets/js/meeting.js` 생성: 단계 3의 `initMeeting` ~ `summarizeMeeting`을 `window.Meeting`으로 노출
  - [ ] `assets/js/translation.js` 생성: 기존 번역 파이프라인(speech recognition 결과 처리, 번역 API 호출, entries 렌더, 요약) 중 **이번 작업으로 명확히 경계가 잡히는 부분**만 이전. 기존 `index.html` 스크립트에서 참조 지점이 많은 공용 유틸(i18n, LANG_MAP, download, LZ-string 래퍼 등)은 이번 범위에서 **이전하지 않고 인라인 유지** — 추후 별도 작업에서 정리
  - [ ] 각 파일 이전 직후 해당 탭 smoke test 실행
- [ ] 6-5. **부트스트랩 파일 `assets/js/app.js`**
  - [ ] 기존 인라인 `DOMContentLoaded` 블록에서 하던 초기화(`initTabs`, `initNotes`, `initMeeting`, `initTranslation`, `loadFromHash` 등)만 담는다
  - [ ] `<script src="assets/js/app.js" defer>`를 마지막에 둔다
  - [ ] 검증: 새로고침 후 모든 탭 정상, 콘솔 에러 0건
- [ ] 6-6. 마무리
  - [ ] 이전 완료된 인라인 블록은 모두 제거, 남아있는 인라인은 "미이전/의존성 있음" 주석으로 표시
  - [ ] 총 파일 수는 **10개 이하**를 지킨다 (본 범위 예상: 2 CSS + 5 JS = 7)
  - [ ] 번들러/패키지 매니저 추가 **없음** 확인 (`package.json` 없음, CDN 그대로)

### 단계 7 — 회귀 테스트 & 체크리스트
- [ ] `AGENTS.md` "코드 수정 시 체크리스트" 항목 통과
- [ ] 3개 탭 각각에서 REC 접근 시 동작 확인
- [ ] 새 fetch 호출 없음(기존 번역 API만 사용)
- [ ] `innerHTML` 신규 사용 금지 — 모든 신규 DOM 삽입은 `textContent`/`createElement`
- [ ] localStorage 키 3개 추가 외 기존 키 규약 무변경
- [ ] `file://` 로 `index.html` 직접 열기 시에도 정상 동작 (CORS/모듈 에러 없음)

---

## 7. 파일 분리 구조 (ADR 0001 기반)

본 작업 범위에서 실제로 생성할 파일은 다음 **7개**이다. 과도한 분리를 피하기 위해 ADR 0001의 예시 중 일부(`i18n.js`)는 이번 범위에서 만들지 않는다 — i18n은 기존 인라인 위치를 유지한다.

```
/
  index.html                # 엔트리 + 마크업 + 부트스트랩 <link>/<script> 태그
  assets/
    css/
      base.css              # :root 토큰, [data-theme="dark"], 공통 레이아웃 (기존 인라인에서 이전)
      tabs.css              # 탭 바/패널, 노트 리스트·에디터, 회의 리스트 (신규 + 일부 이전)
    js/
      state.js              # window.state 초기값 + localStorage save/load 헬퍼
      tabs.js               # window.Tabs: switchTab, initTabs, guardTabForReadOnly
      notes.js              # window.Notes: initNotes, renderNotesList, select/create/deleteNote, saveNotesDebounced, migrateLegacyNote
      meeting.js            # window.Meeting: initMeeting, pushMeetingEntry, renderMeetingEntries, clearMeeting, downloadMeetingTxt, summarizeMeeting
      translation.js        # window.Translation: 대화 번역 렌더/파이프라인 중 경계가 명확한 부분 (점진 이전)
      app.js                # DOMContentLoaded 부트: 각 init* 호출, loadFromHash 등
```

### 7-1. 로드 순서 (중요)

`index.html`의 `<head>`:
```
<link rel="stylesheet" href="assets/css/base.css">
<link rel="stylesheet" href="assets/css/tabs.css">
```

`index.html` `<body>` 하단 (순서 엄수):
```
<script src="https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js"></script>
<script src="assets/js/state.js"></script>
<script src="assets/js/tabs.js"></script>
<script src="assets/js/notes.js"></script>
<script src="assets/js/meeting.js"></script>
<script src="assets/js/translation.js"></script>
<script src="assets/js/app.js" defer></script>
```

- 의존성 규칙: `state.js`는 항상 가장 먼저. feature 파일들은 서로 참조하지 않고 오직 `window.state` / 공용 유틸에만 의존. `app.js`가 마지막에서 오케스트레이션만 담당.
- 모든 전역 노출은 **`window.<Namespace>` 형태**로 제한 (예: `window.Notes.init()`). `export`/`import` 사용 금지.

### 7-2. 이번 범위에서 **하지 않는** 분리

- `i18n.js` — 기존 인라인 위치 유지 (이동 시 초기 렌더 타이밍 이슈 리스크 대비 회피)
- 기존 Whisper/시스템 오디오/설정 모달 관련 블록 — 이번 탭 작업과 경계가 겹치지 않으므로 인라인 유지
- HTML 조각(template)의 별도 파일화 — 엔트리 HTML은 `index.html` 하나만 유지

---

## 8. 타입/린트 유의 (TS 없음 — 런타임 안전성만 체크)

- `JSON.parse(localStorage.getItem(...))`는 try/catch로 감싸고 실패 시 기본값 반환 (기존 패턴과 동일)
- `state.notes`는 항상 배열 보장 (`Array.isArray` 가드)
- `state.activeNoteId`가 null일 때 에디터 영역은 "선택된 노트 없음" 빈 상태 노출
- 이벤트 리스너는 `init*()` 내부에서만 등록 (중복 바인딩 금지)
- `data-tab` 값은 오직 `'meeting' | 'notes' | 'translate'` 세 개로 제한 — switch 문 default는 `translate`로 fallback
- 외부 파일로 이전된 코드는 **IIFE 또는 명시적 `window.NS = { ... }` 할당**으로 전역 오염 최소화

---

## 9. 비범위 (이번 작업에서 하지 않는 것)

- 노트 검색/태그/내보내기
- 회의 기록 여러 세션 저장/목록
- 탭별 URL 라우팅 (history.pushState)
- 빌드 도구/TS/React/번들러/패키지 매니저 도입
- ES Module(`import`/`export`) 사용
- 기존 번역 파이프라인, Whisper, 시스템 오디오 로직 **리팩터** (파일 이동은 §6-4 최소 범위에서만)
- CSS 변수 명 리네이밍, 기존 디자인 톤의 전면 변경
- i18n 블록의 외부 파일화

---

## 10. 롤백 전략

- 단계 1~5 각 단계는 **독립 커밋**으로 진행 → 실패 시 해당 커밋만 revert
- 단계 6 파일 분리 sub-step도 **sub-step 단위 커밋**(6-2 CSS, 6-3 state+tabs, 6-4 features, 6-5 app.js) → 특정 분리에서 회귀 발생 시 해당 커밋만 revert하고 인라인 상태로 복귀
- 탭 도입 전 롤백 경로: `data-active-tab` 기본값을 `translate`로 둬서 탭 바를 숨기면 사실상 기존 UI와 동일하게 유지됨 (feature flag: `window.__DISABLE_TABS__ = true` 시 tab-bar `display:none`)

---

## 11. 완료 기준 (DoD)

- [ ] 3개 탭 전환 정상, 새로고침 후 마지막 탭 복원
- [ ] 노트 3개 생성 → 삭제 1개 → 새로고침 시 2개 유지
- [ ] 회의 기록 탭에서 음성 입력 1분 녹음 → 원문 엔트리 축적, 새로고침 시 복원
- [ ] 대화 번역 탭 기존 동작(REC/공유/다운로드/설정 모달/요약/시스템오디오/테마) 무회귀
- [ ] 공유 URL 역호환 OK, 해시 모드 진입 시 번역 탭 강제
- [ ] Light/Dark, 모바일(375px) 시각 확인
- [ ] AGENTS.md 체크리스트 항목 통과
- [ ] `assets/css/`, `assets/js/` 분리 완료: 파일 수 10개 이하 (예상 7개), 번들러/패키지 매니저 추가 없음
- [ ] `file://` 로컬 실행에서도 정상 (CORS/모듈 에러 0건)
- [ ] 스크립트 로드 순서(`state → tabs → features → app`) 준수, 전역 오염은 `window.<Namespace>` 형태로만
