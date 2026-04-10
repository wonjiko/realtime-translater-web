# UI 일관성 개선 플랜

## 배경

2026-04-10 UI/동작 불일치 전수 조사 결과, 수정이 필요한 항목을 정리한다.

### 제외 항목 (사용자 확인 완료 — 정상 동작)

- Provider별 API 키 필드 표시/숨김 → 정상
- 녹음 중 시스템 오디오 버튼 클릭 무시 → 의도된 동작
- JSON 파일 읽기 전용 → 현재 적절

---

## 수정 항목

### 1. 청크 설정 힌트 텍스트 불일치 (중)

**현상:** "녹음 중 변경 시 다음 녹음부터 적용"이라고 쓰여있지만, 실제로는 녹음 중 변경 자체가 불가능 (잠금 처리 완료).

**수정:**
- ko: `Whisper 모드(자동 감지/시스템 오디오)에만 적용 · 녹음 중에는 변경 불가`
- en: `Whisper mode only (auto-detect / system audio) · Locked during recording`

**위치:** i18n `chunkHint` 키 (ko/en)

---

### 2. Enhanced 모드 + provider 변경 시 silent 폴백 (중)

**현상:** Enhanced 모드 선택 상태에서 provider를 변경하면, 설정은 enhanced로 남지만 실제로는 standard로 동작. 알림 없음.

**수정:**
- provider 변경 시 현재 translationMode가 `enhanced`이면 `standard`로 자동 리셋
- 또는: provider를 OpenAI가 아닌 것으로 변경할 때, translationMode를 `standard`로 강제 변경 + localStorage 갱신

**위치:** `updateProviderFields()` 또는 provider 라디오 change 이벤트

---

### 3. Settings 모달 저장 일관성 (낮)

**현상:** 테마·번역 모드·청크 설정은 클릭 시 즉시 저장되지만, provider 라디오와 API 키는 모달 닫을 때만 저장. 일관성 없음.

**수정:**
- provider 라디오에 `change` → `saveCurrentSettings()` 호출 추가
- API 키 input에 `change` → `saveCurrentSettings()` 호출 추가
- 이렇게 하면 모든 설정이 변경 즉시 저장되어 일관됨

**위치:** 이벤트 핸들러 등록 영역 (init 함수 내)

---

### 4. 녹음 중 언어 변경 피드백 없음 (낮)

**현상:** 녹음 중 소스 언어를 변경하면 녹음이 자동 재시작되지만, 사용자에게 아무런 알림이 없음.

**수정:**
- 언어 변경 + 녹음 중일 때 토스트 표시: "언어가 변경되어 녹음을 재시작합니다"
- i18n 키 추가: `langChangedRestart` (ko/en)

**위치:** sourceLang change 이벤트 핸들러

---

### 5. 커스텀 모델명 UX 개선 (낮)

**현상:** Enhanced 모드에서 직접 입력한 모델명이 audio input을 지원하지 않으면 API 에러 후 standard 폴백.

**수정:**
- 커스텀 입력 필드에 placeholder를 좀 더 명확하게: "audio input 지원 모델명"
- 또는 힌트 텍스트 추가: "input_audio를 지원하는 모델만 사용 가능합니다"

**위치:** `enhancedModelCustomInput` placeholder 또는 하단 hint

---

## 우선순위

| 순서 | 항목 | 심각도 | 예상 작업량 |
|------|------|--------|-----------|
| 1 | 청크 힌트 텍스트 수정 | 중 | i18n 2줄 |
| 2 | Enhanced + provider 변경 리셋 | 중 | JS 5줄 |
| 3 | Settings 저장 일관성 | 낮 | JS 3줄 |
| 4 | 녹음 중 언어 변경 피드백 | 낮 | JS 3줄 + i18n 2줄 |
| 5 | 커스텀 모델 placeholder | 낮 | HTML 1줄 + i18n 2줄 |
