# 번역 품질 개선 + 청크 분할 설정 — 검증 플랜

## 메타
- 피처: 번역 품질 개선 + 청크 분할 설정
- 생성: 2026-04-08 (플랜 에이전트)
- 보강: 2026-04-08 (플랜 보강 에이전트)

---

## 검증 카테고리

### 1. 기능 정합성 (Functional Correctness)

| # | 항목 | 검증 방법 | 10점 기준 | 5점 미만 기준 |
|---|------|----------|----------|-------------|
| 1-1 | 시간 기반 청크 분할 | `startWhisperTimeChunkCycle()` (index.html:1828-1841) — `setInterval`로 `settings.chunkDuration`(2s/4s/6s/8s)마다 `whisperMediaRecorder.stop()` 호출 확인. 브라우저에서 각 설정값 선택 후 콘솔에서 Whisper API 요청 간격 측정 | 4개 설정값(2s/4s/6s/8s) 모두 ±500ms 이내로 정확히 분할됨 | 2개 이상 설정값이 동작하지 않거나 분할 간격 편차 >2s |
| 1-2 | 무음 감지 청크 분할 | `startWhisperSilenceChunkCycle()` (index.html:1843-1883) — `AnalyserNode.getByteFrequencyData`로 100ms 간격 체크, avg < threshold면 silenceDuration 누적, 분할 조건 `(silenceDuration >= 800ms && elapsed >= 1500ms) \|\| elapsed >= maxMs` 확인 (line 1879). 실제 마이크 입력으로 말→멈춤→분할 동작 검증 | 무음 구간(0.8s+)에서 자동 분할, 최대시간(6s/10s/15s) 도달 시 강제 분할 모두 정상 | 무음 감지 분할 자체가 동작하지 않거나 maxMs 강제 분할 미작동 |
| 1-3 | 고품질(Enhanced) 번역 모드 | `processWhisperChunkEnhanced()` (index.html:1973-2050) — audio blob→base64 변환(1977-1981), GPT-4o `chat/completions` API에 `input_audio` 형식 전송(1997-2000), JSON 응답 파싱(text/lang/translations)(2018-2036). OpenAI 키로 실제 음성 전송 후 원문+번역 동시 표시 확인 | 원문, 감지 언어, 번역이 모두 정확하게 표시되고 별도 번역 API 호출 없음 | 원문 또는 번역이 표시되지 않거나 JSON 파싱 실패 |
| 1-4 | Settings 키 정합성 | `loadSettings()` (index.html:1172-1177)의 6개 신규 키와 `saveSettings()` (1187-1192)의 6개 키 1:1 대응 확인. `saveCurrentSettings()` (2651-2676)에서 동일 6개 키 수집 확인. 키 이름: translationMode, enhancedModel, chunkMode, chunkDuration, silenceThreshold, maxChunkDuration | 3개 함수 간 6개 키 이름·타입·기본값 완전 일치 | load/save/saveCurrentSettings 간 키 불일치 1개 이상 |

### 2. 에러 핸들링 (Error Handling)

| # | 항목 | 검증 방법 | 10점 기준 | 5점 미만 기준 |
|---|------|----------|----------|-------------|
| 2-1 | Enhanced→Standard 폴백 | `processWhisperChunk()` (index.html:1919-1928) — enhanced 모드 실패 시 `showToast(t('enhancedFallback'), 'info')` 호출 후 `processWhisperChunkStandard()` (1928) 자동 전환 확인. 지원하지 않는 모델(예: gpt-4.1) 입력 후 실제 폴백 동작 검증 | 폴백 토스트 표시 + 표준 모드로 정상 전환 + 이후 녹음 계속 동작 | 폴백 없이 에러로 중단되거나 토스트 미표시 |
| 2-2 | Provider 조건부 Enhanced 제한 | `processWhisperChunk()` (index.html:1919) — `settings.translationMode === 'enhanced' && settings.provider === 'openai'` 조건 확인. `updateProviderFields()` (2648) — OpenAI 외 provider에서 번역 모드 섹션 숨김. Anthropic/MyMemory provider에서 enhanced 설정 상태로 녹음 시 standard 동작 확인 | OpenAI 외 provider에서 enhanced 코드 경로 진입 차단 + UI 섹션 숨김 | 비-OpenAI provider에서 enhanced API 호출 시도 |
| 2-3 | 무음 감지 Analyser 미존재 처리 | `startWhisperSilenceChunkCycle()` (index.html:1862-1863) — `meterAnalysers.mic \|\| meterAnalysers.sys` null일 때 early return. Analyser 없이 무음 감지 모드 선택 후 녹음 시 에러 없이 동작 확인 (시간 기반으로 자연스럽게 미분할) | Analyser 없을 때 에러 없이 녹음 지속 (분할만 안 됨) | 런타임 에러 발생 또는 녹음 중단 |
| 2-4 | Enhanced API 응답 JSON 파싱 | `processWhisperChunkEnhanced()` (index.html:2015-2018) — markdown code fence 제거 (line 2015-2017: `` ``` `` 시작 시 regex strip), `JSON.parse(content)` 실패 시 catch→폴백 경로(1923-1926). 잘못된 JSON 응답 시뮬레이션으로 폴백 동작 확인 | code fence 포함 응답, 순수 JSON 응답 모두 정상 파싱. 파싱 실패 시 폴백 | JSON 파싱 에러 시 폴백 없이 중단 |

### 3. 코드 품질 (Code Quality)

| # | 항목 | 검증 방법 | 10점 기준 | 5점 미만 기준 |
|---|------|----------|----------|-------------|
| 3-1 | applyTheme 셀렉터 회귀 방지 | `applyTheme()` (index.html:1207) — `$$('[data-theme-val]')` 셀렉터 사용. 번역 모드 버튼(data-mode-val)과 청크 모드 버튼(data-chunk-mode)이 테마 전환 시 active 상태 변경되지 않는지 확인 | 테마 전환 시 data-theme-val 버튼만 active 토글, 다른 data-*-val 버튼 영향 없음 | 테마 전환 시 번역 모드/청크 모드 버튼의 active 상태 변경됨 |
| 3-2 | i18n 키 완전성 | ko i18n (index.html:945-959) 15개 키와 en i18n (1044-1058) 15개 키의 1:1 대응 확인. HTML data-i18n 속성(lines 800-845)에서 참조하는 키가 모두 양 언어에 존재하는지 대조 | ko/en 키 완전 일치 + HTML 참조 키 100% 커버 | 누락 키 1개 이상 또는 ko/en 불일치 |
| 3-3 | 청크 타이머 정리 | `stopWhisperChunkCycle()` (index.html:1885-1889) — `clearInterval(whisperChunkTimer)` + `clearInterval(silenceCheckInterval)` 양쪽 모두 정리 확인. 녹음 시작→중지→재시작 시 이전 타이머 잔존 여부 확인 | 양쪽 interval 모두 정리 + null 초기화, 녹음 재시작 시 중복 타이머 없음 | clearInterval 누락으로 타이머 누수 또는 중복 분할 |
| 3-4 | HTML/JS ID 바인딩 일관성 | 8개 신규 ID(fieldsTranslationMode, enhancedModelGroup, enhancedModelSelect, enhancedModelCustomInput, fieldsChunkSettings, chunkTimeOptions, chunkSilenceOptions, silenceThresholdSlider)가 HTML(799-845)과 JS(2583-2612, 2651-2676, 2961-3010)에서 모두 정확히 매칭되는지 확인 | 8개 ID 모두 HTML 정의 ↔ JS 참조 완전 일치 | ID 불일치 또는 미참조 ID 1개 이상 |

### 4. UX / 접근성 (UX & Accessibility)

| # | 항목 | 검증 방법 | 10점 기준 | 5점 미만 기준 |
|---|------|----------|----------|-------------|
| 4-1 | Settings UI 토글 연동 | 이벤트 핸들러(index.html:2961-3010) — 번역 모드 토글 시 enhancedModelGroup 표시/숨김(2967), 청크 모드 토글 시 chunkTimeOptions/chunkSilenceOptions 교차 표시(2985-2986). 실제 UI에서 각 토글 클릭 후 하위 옵션 표시/숨김 확인 | 모든 토글(번역 모드·청크 모드) 클릭 즉시 하위 옵션 정확히 표시/숨김 전환 | 토글 클릭 후 하위 옵션 미갱신 또는 잘못된 옵션 표시 |
| 4-2 | 설정값 localStorage 유지 | Settings 복원 로직(index.html:2583-2612) — 페이지 새로고침 후 6개 설정값(translationMode, enhancedModel, chunkMode, chunkDuration, silenceThreshold, maxChunkDuration) active 상태 및 값 복원 확인 | 6개 설정 모두 새로고침 후 변경 전 값과 동일하게 복원 | 2개 이상 설정값 유실 |
| 4-3 | 커스텀 모델 입력 UX | 모델 선택(index.html:2588-2598, 2973-2977) — 드롭다운에서 "직접 입력" 선택 시 텍스트 필드 표시, 프리셋 재선택 시 숨김. 커스텀 값 입력 후 새로고침 시 드롭다운 "직접 입력" + 텍스트 필드에 값 복원(2594-2597) | 커스텀 입력 표시/숨김 전환 정상 + 새로고침 후 커스텀 값 완벽 복원 | 커스텀 입력 필드 미표시 또는 새로고침 후 값 유실 |
| 4-4 | i18n 라벨 전환 | HTML data-i18n 속성(index.html:800-845) — ko/en 전환 시 번역 모드·청크 분할 관련 모든 라벨/힌트 텍스트 언어 변경 확인. ko(945-959), en(1044-1058) 키 대조 | ko↔en 전환 시 15개 신규 라벨 모두 즉시 변경 | 3개 이상 라벨 미번역 또는 키 누락으로 원문 표시 |

### 5. 엣지 케이스 (Edge Cases)

| # | 항목 | 검증 방법 | 10점 기준 | 5점 미만 기준 |
|---|------|----------|----------|-------------|
| 5-1 | 최소 청크 길이 제한 | `startWhisperSilenceChunkCycle()` (index.html:1846) — `minChunkMs=1500`. 분할 조건(1879)에서 `elapsed >= minChunkMs` 확인. 0.5초 발화 후 즉시 멈춤 → 1.5초 전에는 분할되지 않음 + `processWhisperChunk()` (1914) `audioBlob.size < 1000` 필터 | 1.5초 미만 청크 분할 방지 + 극소 blob 필터링 정상 동작 | minChunkMs 조건 무시로 극소 청크 다수 생성 |
| 5-2 | 고품질 + 무음 감지 조합 | `startWhisperChunkCycle()` (index.html:1805-1813)에서 chunkMode=silence 디스패치 + `processWhisperChunk()` (1919)에서 enhanced 분기 진입 확인. 무음 감지 분할된 오디오가 GPT-4o로 전송되어 원문+번역 표시 | 무음 감지 분할 시점에 enhanced API 호출 + 결과 정상 렌더링 | 조합 시 분할 또는 번역 중 하나 미동작 |
| 5-3 | 시스템 오디오 + 무음 감지 조합 | `startWhisperSilenceChunkCycle()` (index.html:1862) — `meterAnalysers.mic \|\| meterAnalysers.sys` 폴백으로 시스템 오디오 Analyser 사용 가능 확인. 시스템 오디오만 활성화(마이크 없이) 시 sys analyser로 무음 감지 동작 검증 | sys analyser로 정상 무음 감지 + 분할 동작 | sys analyser 미사용으로 무음 감지 불가 |
| 5-4 | 감도 경계값 동작 | 슬라이더(index.html:836) min=10, max=80. `startWhisperSilenceChunkCycle()` (1844) threshold 사용. 극단값(10, 80) 설정 후 동작 확인: 10=매우 민감(작은 소리도 음성으로 인식), 80=매우 둔감(큰 소리만 음성으로 인식) | 경계값 10/80에서 예상대로 감도 차이 확인 가능 | 경계값에서 감도 차이 없거나 비정상 동작 |
