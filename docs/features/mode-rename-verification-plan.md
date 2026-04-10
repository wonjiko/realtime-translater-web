# 번역 모드 이름 변경 — 검증 플랜

## 피처 요약
- HTML 버튼 텍스트: "표준" -> "트랜스크립션 번역", "고품질 (Audio)" -> "멀티모달"
- i18n ko/en 키 값 업데이트 (standardMode, enhancedMode, enhancedModeHint, enhancedFallback)
- 내부 변수명/로직은 변경 없음

## 통과 기준
- 전체 평균 >= 8.0 AND 모든 항목 >= 5

---

## 1. 기능 정합성

### 1-1. i18n ko 키 값 정확성
- **확인**: `I18N.ko` 객체에서 standardMode, enhancedMode, enhancedModeHint, enhancedFallback 4개 키의 값이 피처 명세와 일치하는지
- **코드 위치**: index.html:951-957

### 1-2. i18n en 키 값 정확성
- **확인**: `I18N.en` 객체에서 standardMode, enhancedMode, enhancedModeHint, enhancedFallback 4개 키의 값이 피처 명세와 일치하는지
- **코드 위치**: index.html:1056-1062

### 1-3. HTML 기본 텍스트 일치
- **확인**: `data-i18n="standardMode"` 버튼의 기본 텍스트가 ko 키 값('트랜스크립션 번역')과 일치하는지, `data-i18n="enhancedMode"` 버튼도 동일
- **코드 위치**: index.html:802-803

### 1-4. 내부 변수명 미변경
- **확인**: localStorage 키(rt_translation_mode, rt_enhanced_model), data-mode-val 값(standard, enhanced), DOM ID(enhancedModelGroup, translationModeHint 등), 함수명이 기존과 동일한지
- **코드 위치**: index.html:1189-1205, 802-803, 805, 814, 2663-2676

---

## 2. 에러 핸들링

### 2-1. 폴백 메시지 정확성 (ko)
- **확인**: `enhancedFallback` ko 값이 새 모드명을 반영하여 '멀티모달 모드 실패, 트랜스크립션 번역으로 전환합니다'인지
- **코드 위치**: index.html:957

### 2-2. 폴백 메시지 정확성 (en)
- **확인**: `enhancedFallback` en 값이 새 모드명을 반영하여 'Multimodal mode failed, falling back to transcription mode'인지
- **코드 위치**: index.html:1062

### 2-3. 폴백 호출 위치에서 i18n 키 사용
- **확인**: `showToast(t('enhancedFallback'), 'info')` 호출이 하드코딩 문자열 없이 i18n 키를 통해 메시지를 표시하는지
- **코드 위치**: index.html:1952

---

## 3. 코드 품질

### 3-1. ko/en 키 1:1 대응
- **확인**: standardMode, enhancedMode, standardModeHint, enhancedModeHint, enhancedFallback 키가 ko와 en 양쪽 모두 존재하는지
- **코드 위치**: index.html:951-957 (ko), 1056-1062 (en)

### 3-2. 네이밍 일관성
- **확인**: 새 모드명이 코드 전반에서 일관적인지 (ko: '트랜스크립션 번역'/'멀티모달', en: 'Transcription'/'Multimodal'). 구 명칭('표준', '고품질', 'Standard', 'High Quality')이 남아있지 않은지
- **코드 위치**: index.html 전체

---

## 4. UX / 접근성

### 4-1. 버튼 텍스트 가독성
- **확인**: '트랜스크립션 번역', '멀티모달' 텍스트가 UI에서 잘리거나 넘치지 않을 정도의 길이인지 (기존 '표준', '고품질 (Audio)' 대비)
- **코드 위치**: index.html:802-803

### 4-2. 힌트 문구 정확성
- **확인**: standardModeHint, enhancedModeHint 값이 각 모드의 실제 동작을 정확히 설명하는지. 힌트 전환 로직(translationModeHint)이 올바른 키를 참조하는지
- **코드 위치**: index.html:953-954 (ko), 1058-1059 (en), 2664-2667 (전환 로직), 3074-3076 (토글 이벤트)

---

## 5. 엣지 케이스

### 5-1. localStorage 기존값 호환
- **확인**: localStorage에 저장되는 값이 여전히 'standard'/'enhanced' 문자열이므로, 기존 사용자의 저장값이 호환되는지
- **코드 위치**: index.html:1189 (읽기), 1204 (쓰기), 2751 (수집)

### 5-2. 언어 전환 시 텍스트 반영
- **확인**: `setLocale()` 호출 시 `data-i18n` 속성을 통해 standardMode, enhancedMode 버튼 텍스트가 올바르게 전환되는지. 힌트 영역도 `data-i18n` 속성이 설정되어 있어 언어 전환 시 반영되는지
- **코드 위치**: index.html:1102-1106 (setLocale), 802-803 (data-i18n 속성), 814 (힌트 data-i18n)
