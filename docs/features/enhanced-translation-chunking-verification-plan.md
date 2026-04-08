# 번역 품질 개선 + 청크 분할 설정 — 검증 플랜

## 변경 사항 요약

1. `loadSettings()` / `saveSettings()` — 6개 신규 설정 키 추가 (translationMode, enhancedModel, chunkMode, chunkDuration, silenceThreshold, maxChunkDuration)
2. Settings 모달 — 번역 모드 토글 + 모델 선택 드롭다운 + 청크 분할 설정 UI 추가
3. `startWhisperChunkCycle()` 리팩터 — time/silence 모드 디스패치
4. `startWhisperSilenceChunkCycle()` 신규 — AnalyserNode 기반 무음 감지 분할
5. `processWhisperChunk()` 분기 — enhanced/standard 모드 라우팅
6. `processWhisperChunkEnhanced()` 신규 — GPT-4o audio input 직접 번역
7. i18n — 한국어/영어 17개 키 추가
8. `applyTheme()` — `.theme-btn` → `[data-theme-val]` 셀렉터 한정 (회귀 방지)

---

## 1. 코드 레벨 검증 (자동)

### 1-1. 구문 오류
- [x] JS 구문 파싱 통과 (`new Function()`)
- [x] HTML 태그 매칭: div 72/72, button 27/27, select 2/2

### 1-2. Settings 키 정합성
- [x] `loadSettings()` 6개 신규 키 ↔ `saveSettings()` 6개 신규 키 일치
- [x] `saveCurrentSettings()` 6개 신규 키 포함

### 1-3. HTML/JS 바인딩
- [x] 8개 신규 ID 모두 HTML ↔ JS 매칭 확인
- [x] 4개 data-* 속성 (mode-val, chunk-mode, chunk-dur, max-dur) HTML ↔ JS 매칭

### 1-4. 기존 기능 회귀
- [x] `$$('.theme-btn')` 순회 제거 → `$$('[data-theme-val]')` 한정으로 변경
- [x] provider 전환 시 번역 모드 표시/숨김 정상

---

## 2. Settings UI 검증 (수동)

### 2-1. 번역 모드 섹션
- [ ] OpenAI provider 선택 시 "번역 모드" 섹션 표시
- [ ] MyMemory / Anthropic / GAS provider 선택 시 "번역 모드" 섹션 숨김
- [ ] "표준" 버튼 기본 active 상태
- [ ] "고품질 (Audio)" 클릭 → active 전환 + 모델 드롭다운 표시
- [ ] "표준" 다시 클릭 → 모델 드롭다운 숨김

### 2-2. 모델 선택
- [ ] 드롭다운에 4개 프리셋 모델 표시 (gpt-4.5-preview, gpt-4.1, gpt-4o-audio-preview, gpt-4o-mini-audio-preview)
- [ ] 기본 선택값: gpt-4o-audio-preview
- [ ] "직접 입력" 선택 → 텍스트 입력 필드 표시
- [ ] 프리셋 모델 재선택 → 텍스트 입력 필드 숨김

### 2-3. 청크 분할 설정
- [ ] "시간 기반" 버튼 기본 active
- [ ] 시간 옵션 표시: 2s / 4s(기본 active) / 6s / 8s
- [ ] "무음 감지" 클릭 → 시간 옵션 숨김 + 감도 슬라이더 + 최대 시간 표시
- [ ] 슬라이더 기본값: 30
- [ ] 최대 시간 기본: 10s active
- [ ] "시간 기반" 다시 클릭 → 시간 옵션 복원

### 2-4. 설정 유지 (localStorage)
- [ ] 모든 설정 변경 후 새로고침 → 값 유지 확인
- [ ] 번역 모드: standard/enhanced 유지
- [ ] 모델 선택: 프리셋/커스텀 값 유지
- [ ] 청크 모드: time/silence 유지
- [ ] 청크 시간: 선택한 값 유지
- [ ] 무음 감도: 슬라이더 값 유지
- [ ] 최대 시간: 선택한 값 유지

### 2-5. i18n
- [ ] 한국어 모드: 모든 라벨/힌트 한국어 표시
- [ ] 영어 모드 (EN 버튼 클릭): 모든 라벨/힌트 영어 표시

---

## 3. 시간 기반 청크 검증 (수동)

### 3-1. 기본값 (4초)
- [ ] 표준 모드 + 시간 기반 4초 → 기존과 동일하게 4초마다 Whisper API 호출
- [ ] 콘솔에서 Whisper API 요청 간격 확인

### 3-2. 변경값
- [ ] 2초 선택 → 약 2초마다 청크 분할 확인
- [ ] 8초 선택 → 약 8초마다 청크 분할 확인

---

## 4. 무음 감지 청크 검증 (수동)

### 4-1. 기본 동작
- [ ] 무음 감지 모드 + 녹음 시작
- [ ] 말하는 동안 → 청크 분할 안 됨 (최대 시간까지)
- [ ] 말 멈추고 약 0.8초 후 → 청크 분할 확인

### 4-2. 최대 시간 제한
- [ ] 최대 10초 설정 → 10초 이상 연속 발화 시 강제 분할 확인
- [ ] 최대 6초 설정 → 6초에서 강제 분할 확인

### 4-3. 감도 조절
- [ ] 낮은 감도 (10) → 작은 소리에도 분할되지 않음 (더 민감하게 무음 인식)
- [ ] 높은 감도 (80) → 시끄러운 환경에서도 무음 감지

### 4-4. 최소 청크 길이
- [ ] 0.5초만 말하고 멈춤 → 1.5초 미만이므로 즉시 분할 안 됨 (1.5초 후 분할)

---

## 5. 고품질 번역 모드 검증 (수동, OpenAI 키 필요)

### 5-1. 정상 동작
1. Settings → OpenAI provider + API 키 입력
2. 번역 모드 → "고품질 (Audio)" 선택
3. 모델 → gpt-4o-audio-preview (기본)
4. REC 클릭 → 음성 입력
5. 확인사항:
   - [ ] 원문 텍스트가 표시됨
   - [ ] 번역이 원문과 동시에 표시됨 (별도 번역 호출 없이)
   - [ ] 감지된 소스 언어가 정확함

### 5-2. 다른 모델
- [ ] gpt-4o-mini-audio-preview 선택 → 정상 동작 (응답 속도 더 빠를 수 있음)
- [ ] gpt-4.1 선택 → audio input 미지원 시 폴백 토스트 표시 + 표준 모드로 전환

### 5-3. 폴백 동작
- [ ] 지원하지 않는 모델 입력 → "고품질 모드 실패, 표준 모드로 전환합니다" 토스트
- [ ] 토스트 후 표준 모드(Whisper + 번역)로 정상 동작 계속

### 5-4. Provider 조건
- [ ] Anthropic provider + enhanced 모드 → standard로 자동 폴백 (enhanced는 OpenAI 전용)
- [ ] MyMemory provider + enhanced 모드 → standard로 자동 폴백

---

## 6. 조합 검증 (수동)

### 6-1. 고품질 + 무음 감지
- [ ] 고품질 모드 + 무음 감지 청크 → 무음 구간에서 분할 + 직접 번역

### 6-2. 고품질 + 시간 2초
- [ ] 고품질 모드 + 2초 청크 → 2초마다 직접 번역 (짧은 오디오도 처리)

### 6-3. 시스템 오디오 + 무음 감지
- [ ] 시스템 오디오 + 무음 감지 → 마이크 기준 무음 감지 작동

### 6-4. 시스템 오디오 + 고품질
- [ ] 시스템 오디오 믹싱 + 고품질 모드 → 믹싱된 오디오가 GPT-4o로 전송

---

## 7. 기존 기능 회귀 검증 (수동)

### 7-1. 테마 전환
- [ ] 라이트/다크/시스템 테마 전환 정상
- [ ] 테마 변경 시 새 설정 버튼들의 active 상태 유지

### 7-2. Provider 전환
- [ ] OpenAI → Anthropic → MyMemory 전환 시 API 키 필드 표시/숨김 정상
- [ ] 번역 모드 섹션이 OpenAI에서만 표시

### 7-3. 기존 표준 번역
- [ ] Web Speech API 모드 (특정 언어 선택) → 기존과 동일 동작
- [ ] Whisper 모드 (자동 감지) → 기존과 동일 동작 (표준 모드일 때)

### 7-4. 요약 기능
- [ ] 서비스 언어(ko/en) 기준 요약 언어 설정 유지

---

## 검증 환경

- 브라우저: Chrome (최신)
- HTTPS 필수 (마이크/화면 공유)
- OpenAI API 키 필요 (고품질 모드, Whisper 모드)
