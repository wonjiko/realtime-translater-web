# UI 일관성 개선 — 검증 플랜

## 메타
- 피처: UI 일관성 개선
- 생성: 2026-04-10 (플랜 에이전트)
- 보강: 2026-04-10 (플랜 보강 에이전트)

---

## 검증 카테고리

### 1. 기능 정합성 (Functional Correctness)

| # | 항목 | 검증 방법 | 10점 기준 | 5점 미만 기준 |
|---|------|----------|----------|-------------|
| 1-1 | 청크 힌트 텍스트가 ko/en 모두 "녹음 중에는 변경 불가" 문구를 포함한다 | index.html:969 (`chunkHint` ko), index.html:1074 (`chunkHint` en), index.html:850 (HTML 기본값) — 세 곳 모두 동일 의미의 문구가 존재하는지 확인 | ko/en/HTML 세 곳 모두 "녹음 중에는 변경 불가" / "Locked during recording" 문구가 정확히 존재 | 셋 중 하나라도 해당 문구가 누락되었거나 의미가 다름 |
| 1-2 | Enhanced 모드에서 openai 외 provider로 변경 시 standard로 자동 리셋된다 | index.html:2997-3014 — provider 라디오 change 핸들러에서 `newProvider !== 'openai'` 조건 확인. enhanced active 상태일 때 standard로 전환, `#enhancedModelGroup` 숨김, 힌트 텍스트 `standardModeHint`로 변경되는지 확인 | provider 변경 시 enhanced→standard 자동 전환 + UI(모델 그룹 숨김, 힌트 갱신) 모두 올바르게 동작 | provider 변경 후에도 enhanced 모드가 유지되거나, UI가 standard 상태로 갱신되지 않음 |
| 1-3 | provider/API 키 변경 시 즉시 저장된다 | index.html:3013 (`saveCurrentSettings()` in provider change), index.html:3017-3019 (API 키 change 이벤트에서 `saveCurrentSettings()`) — change 이벤트에 저장 호출이 바인딩되어 있는지 확인 | provider 라디오 변경과 API 키 입력 change 모두 `saveCurrentSettings()` 호출로 즉시 localStorage에 반영 | 저장 호출이 누락되어 모달 닫기 전에는 설정이 반영되지 않음 |

### 2. 에러 핸들링 (Error Handling)

| # | 항목 | 검증 방법 | 10점 기준 | 5점 미만 기준 |
|---|------|----------|----------|-------------|
| 2-1 | 녹음 중 소스 언어 변경 시 토스트가 표시되고 녹음이 재시작된다 | index.html:2946-2963 — `dom.sourceLang` change 핸들러에서 `state.isRecording` 확인 후 `showToast(t('langChangedRestart'), 'info')` 호출, `stopRecording()` → `startRecording()` 순서 확인 | 녹음 중 언어 변경 시 info 토스트 표시 + 녹음 정지 후 재시작이 순서대로 동작 | 토스트 없이 녹음이 멈추거나, 재시작이 호출되지 않아 녹음이 중단된 채로 남음 |
| 2-2 | 자동 감지(auto) 선택 시 OpenAI 키 없으면 에러 토스트를 표시하고 이전 값으로 복원한다 | index.html:2948-2956 — `val === 'auto'` 조건에서 `settings.openaiKey` 체크, 없으면 `showToast(t('autoDetectRequiresKey'), 'error')` 호출 후 `e.target.value = state.sourceLang`으로 롤백 | 키 미설정 시 에러 토스트 + 드롭다운 값 롤백이 모두 동작 | 에러 토스트 없이 auto로 전환되거나, 롤백 없이 auto 상태로 남음 |
| 2-3 | langChangedRestart i18n 키가 ko/en 모두 정의되어 있다 | index.html:980 (ko: `'언어가 변경되어 녹음을 재시작합니다'`), index.html:1085 (en: `'Language changed — restarting recording'`) — 양쪽 locale 객체에 키가 존재하는지 확인 | ko/en 모두 키가 존재하고 사용자에게 의미 전달이 명확한 문구 | 한쪽 locale에 키가 누락되어 `undefined` 표시 |

### 3. 코드 품질 (Code Quality)

| # | 항목 | 검증 방법 | 10점 기준 | 5점 미만 기준 |
|---|------|----------|----------|-------------|
| 3-1 | provider 리셋 로직이 DOM 선택자와 클래스 조작을 일관되게 사용한다 | index.html:3003-3011 — `document.querySelector('[data-mode-val].active')` 로 현재 모드 확인, `$$('[data-mode-val]')` 로 전체 해제, `document.querySelector('[data-mode-val="standard"]')` 로 standard 활성화 — 기존 Translation mode toggle(index.html:3034-3045)과 동일 패턴인지 비교 | provider 리셋 로직과 기존 모드 토글 로직이 동일한 선택자/패턴을 사용하여 일관성 유지 | 서로 다른 방식으로 모드를 전환하여 향후 하나만 수정 시 불일치 발생 가능 |
| 3-2 | i18n 키 네이밍이 기존 컨벤션과 일관적이다 | index.html:968 (`enhancedModelPlaceholder`), index.html:969 (`chunkHint`), index.html:980 (`langChangedRestart`) — 기존 키 네이밍(camelCase, 의미 기반)과 비교 | 신규 키가 모두 camelCase이며 기존 키 네이밍 규칙(동사+명사 또는 명사+설명)을 따름 | 네이밍이 snake_case 혼용이거나 기존 규칙과 명확히 다른 패턴 |
| 3-3 | `data-i18n-placeholder` 속성이 locale 전환 시 반영된다 | index.html:812 (`data-i18n-placeholder="enhancedModelPlaceholder"`), index.html:1104 (`$$('[data-i18n-placeholder]').forEach(...)` in `setLocale`) — `setLocale` 함수가 해당 속성을 순회하여 placeholder를 갱신하는지 확인 | locale 변경 시 `enhancedModelCustomInput`의 placeholder가 ko/en으로 자동 갱신됨 | `data-i18n-placeholder` 속성이 있지만 `setLocale`에서 처리하지 않아 locale 변경 시 placeholder가 바뀌지 않음 |

### 4. UX / 접근성 (UX & Accessibility)

| # | 항목 | 검증 방법 | 10점 기준 | 5점 미만 기준 |
|---|------|----------|----------|-------------|
| 4-1 | 커스텀 모델 placeholder가 사용자에게 어떤 모델을 입력해야 하는지 명확히 안내한다 | index.html:812 (placeholder: `"audio input 지원 모델명 입력"`), index.html:968 (ko), index.html:1073 (en: `"Enter audio-input compatible model name"`) — placeholder 문구가 "audio input 지원"이라는 기술 조건을 명시하는지 확인 | ko/en 모두 "audio input 지원/compatible" 조건을 명시하여 사용자가 호환 모델만 입력하도록 유도 | placeholder가 비어있거나 "모델명 입력"처럼 기술 조건이 없어 비호환 모델 입력 유발 |
| 4-2 | 녹음 중 언어 변경 토스트가 info 타입으로 표시되어 에러와 구분된다 | index.html:2960 — `showToast(t('langChangedRestart'), 'info')` 호출에서 두 번째 인자가 `'info'`인지 확인 | `'info'` 타입으로 호출되어 에러(빨강)가 아닌 정보성(파랑/회색) 스타일로 표시 | `'error'` 타입으로 호출되어 사용자가 문제가 발생한 것으로 오인 |
| 4-3 | provider 변경 시 enhanced→standard 전환이 시각적으로 즉시 반영된다 | index.html:3005-3010 — active 클래스 해제/부여, `#enhancedModelGroup` display none, 힌트 텍스트 갱신이 동기적으로 실행되는지 확인 | provider 변경 즉시 모드 버튼 하이라이트, 모델 선택 영역, 힌트 텍스트가 모두 standard 상태로 갱신 | UI 일부만 갱신되어 모드 버튼은 standard인데 모델 그룹이 보이는 등 불일치 발생 |

### 5. 엣지 케이스 (Edge Cases)

| # | 항목 | 검증 방법 | 10점 기준 | 5점 미만 기준 |
|---|------|----------|----------|-------------|
| 5-1 | provider가 이미 openai일 때 openai로 다시 선택해도 enhanced 모드가 리셋되지 않는다 | index.html:3002 — `newProvider !== 'openai'` 조건이 정확히 openai가 아닌 경우만 분기하는지 확인 | openai→openai 재선택 시 enhanced 모드가 유지됨 | openai 재선택 시에도 standard로 리셋되어 사용자 설정이 소실 |
| 5-2 | enhanced 모드가 아닌 상태(standard)에서 non-openai provider로 변경 시 불필요한 DOM 조작이 없다 | index.html:3003-3004 — `activeMode.dataset.modeVal === 'enhanced'` 조건이 standard일 때 내부 블록을 스킵하는지 확인 | standard 모드에서 provider 변경 시 모드 전환 로직이 실행되지 않고 `saveCurrentSettings()`만 호출 | standard 상태에서도 리셋 로직이 실행되어 예상치 못한 부작용 발생 |
| 5-3 | 비녹음 상태에서 소스 언어 변경 시 토스트가 표시되지 않고 정상 적용된다 | index.html:2957-2964 — `state.isRecording` false일 때 토스트/stopRecording/startRecording 블록에 진입하지 않고, `state.sourceLang` 갱신과 `localStorage` 저장만 수행되는지 확인 | 비녹음 시 토스트 없이 언어가 조용히 변경되고 localStorage에 저장 | 비녹음 상태에서도 토스트가 표시되거나 불필요한 stopRecording 호출 발생 |
