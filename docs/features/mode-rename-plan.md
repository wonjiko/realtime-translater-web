# 번역 모드 이름 변경 계획

## 변경 내용

| 현재 | 변경 후 |
|------|---------|
| 표준 | 트랜스크립션 번역 |
| 고품질 (Audio) | 멀티모달 |

## 변경 대상 (index.html)

### 한국어 i18n
- `standardMode`: `'표준'` → `'트랜스크립션 번역'`
- `enhancedMode`: `'고품질 (Audio)'` → `'멀티모달'`
- `enhancedModeHint`: `'음성 → 모델(원문+번역 동시 반환) · 1단계 처리 · 고품질'` → `'음성 → Audio 모델(원문+번역 동시 반환) · 1단계 처리'`
- `enhancedFallback`: `'고품질 모드 실패, 표준 모드로 전환합니다'` → `'멀티모달 모드 실패, 트랜스크립션 번역으로 전환합니다'`

### 영어 i18n
- `standardMode`: `'Standard'` → `'Transcription'`
- `enhancedMode`: `'Enhanced (Audio)'` → `'Multimodal'`
- `enhancedModeHint`: `'Audio → Model (transcript + translation at once) · 1-step · high quality'` → `'Audio → Audio model (transcript + translation at once) · 1-step'`
- `enhancedFallback`: `'Enhanced mode failed, falling back to standard mode'` → `'Multimodal mode failed, falling back to transcription mode'`

## 변경하지 않는 것

내부 변수명 및 로직은 그대로 유지:
- `translationMode: 'standard' | 'enhanced'` (localStorage 키 포함)
- `processWhisperChunkStandard()`, `processWhisperChunkEnhanced()`
- `enhancedModel`, `enhancedModelSelect` 등 DOM ID
