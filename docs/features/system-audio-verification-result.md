# 시스템 오디오 캡처 — 검증 결과

> 검증 기준: `docs/features/system-audio-verification-plan.md`
> 검증 일시: 2026-04-08
> 검증 방법: 코드 정적 분석 (index.html)

---

## 1. UI 검증

### 1-1. 버튼 표시
- [x] 페이지 로드 시 REC 버튼 옆에 "🎤 시스템 오디오" 버튼이 표시됨
  - `index.html:701-702` — `btnRec` 바로 뒤에 `btnSysAudio` 배치
- [x] 기본 상태에서 버튼이 비활성(gray) 스타일로 보임
  - `index.html:411` — `.btn-sysaudio` 기본 스타일: `var(--bg-secondary)`, `var(--text-secondary)`
  - `index.html:1003` — `state.useSystemAudio: false` 초기값

### 1-2. 토글 동작
- [x] OpenAI API 키 설정 상태에서 클릭 → 초록색 active 전환
  - `index.html:2380-2388` — 클릭 핸들러에서 `openaiKey` 검사 후 토글
  - `index.html:413` — `.btn-sysaudio.active { background: #e8f4e8; color: #1a7a1a; border-color: #34c759; }`
- [x] 다시 클릭 → 비활성 복귀
  - `index.html:2382` — `const next = !state.useSystemAudio;`
- [x] 녹음 중 클릭 → 아무 반응 없음
  - `index.html:2381` — `if (state.isReadOnly || state.isRecording) return;`

### 1-3. ReadOnly 모드
- [x] 공유 URL 접속 시 버튼 숨김
  - `index.html:2073` — `dom.btnSysAudio.style.display = readOnly ? 'none' : '';`

---

## 2. 시스템 오디오 캡처 동작

### 2-1. 정상 플로우
- [x] Chrome 화면 공유 다이얼로그 표시
  - `index.html:1501` — `getDisplayMedia({ video: true, audio: true })`
- [x] 비디오 트랙 즉시 중단 (오디오만 사용)
  - `index.html:1507-1508` — `getVideoTracks().forEach(track => track.stop())`
- [x] 녹음 시작 + STOP 버튼 전환
  - `index.html:1749` — `state.isRecording = true;`
  - `index.html:1773-1774` — UI 업데이트
- [x] 마이크 + 시스템 오디오 믹싱
  - `index.html:1525-1528` — `AudioContext` + `createMediaStreamDestination`으로 두 소스 합성
- [ ] 상대방 발화 인식 + 번역 표시 → **런타임 테스트 필요**
- [ ] 내 마이크 음성 동시 인식 → **런타임 테스트 필요**

### 2-2. STOP 후 리소스 정리
- [x] 화면 공유 표시 사라짐
  - `index.html:1605-1607` — `displayStream.getTracks().forEach(t => t.stop()); displayStream = null;`
- [x] micStream 정리
  - `index.html:1609-1611` — `micStream.getTracks().forEach(t => t.stop()); micStream = null;`
- [x] AudioContext 정리
  - `index.html:1613-1615` — `audioContext.close().catch(() => {}); audioContext = null;`
- [x] whisperStream 정리
  - `index.html:1601-1603` — `whisperStream.getTracks().forEach(t => t.stop()); whisperStream = null;`

### 2-3. sourceLang 관계
- [x] 시스템 오디오 ON + 특정 언어 → Whisper 모드
  - `index.html:1744` — `state.useWhisper = (state.sourceLang === 'auto') || state.useSystemAudio;`
- [x] 시스템 오디오 OFF + 특정 언어 → Web Speech API 모드
  - 같은 라인: 둘 다 `false`이면 `useWhisper = false`

---

## 3. 에러 핸들링

| 시나리오 | 기대 동작 | 코드 위치 | 결과 |
|---|---|---|---|
| 화면 공유 취소 | 토스트 + 녹음 시작 안 됨 | `1502-1504` → `return null` → `1543` `return false` → `1748` `return` | :warning: **토스트 메시지 불일치** (아래 이슈 #1) |
| 탭 오디오 미체크 | 토스트 + 녹음 시작 안 됨 | `1510-1513` → `return null` | :white_check_mark: 통과 |
| 마이크 권한 거부 | 토스트 + displayStream 정리 | `1517-1522` → `displayStream cleanup` + `return null` | :white_check_mark: 통과 |
| getDisplayMedia 미지원 | 토스트 | `1494-1497` → `return null` | :white_check_mark: 통과 |

---

## 4. 엣지 케이스

- :x: **녹음 중 탭 공유 직접 중단** → `displayStream` 트랙의 `ended` 이벤트 핸들러가 없음 (아래 이슈 #2)
- [x] 시스템 오디오 ON + auto-detect 동시 사용 → 둘 다 Whisper 모드이므로 정상
- [x] STOP → 시스템 오디오 OFF → REC → 마이크 단독 전환
  - `stopWhisperChunkCycle()`에서 모든 리소스 정리 후, 다음 녹음에서 `useSystemAudio=false` 분기로 진입
- [x] REC/STOP 반복 → AudioContext 중복 생성 안 됨
  - 매 STOP마다 `audioContext.close()` + `null` 처리, 매 REC마다 새로 생성

---

## 발견된 이슈

### 이슈 #1: 토스트 메시지와 실제 동작 불일치 (Bug)

- **위치**: `index.html:1503`
- **현재 메시지**: "화면 공유가 취소되었습니다. **마이크만 사용합니다.**"
- **실제 동작**: `return null` → `initWhisperRecording()` `return false` → `startRecording()` `return` → **녹음 시작 안 됨**
- **문제**: "마이크만 사용합니다"라고 안내하지만 실제로 녹음이 시작되지 않아 사용자 혼란 유발
- **수정 방안**: 토스트 메시지를 실제 동작에 맞게 변경

### 이슈 #2: displayStream 트랙 종료 핸들러 미구현 (Missing Feature)

- **위치**: `index.html:1530` (displayStream 할당 직후)
- **시나리오**: 녹음 중 사용자가 브라우저 UI에서 탭 공유를 직접 중단
- **현재 동작**: `displayStream` 오디오 트랙이 `ended` 상태가 되지만, 앱은 인지하지 못함. MediaRecorder는 마이크 오디오만 계속 캡처하나 사용자에게 알림 없음
- **수정 방안**: `displayStream` 오디오 트랙에 `ended` 이벤트 리스너 추가, 사용자에게 토스트 알림

### 이슈 #3: 시스템 오디오 관련 텍스트 i18n 미적용 (Bug)

- **위치**: 여러 곳
  - `index.html:702` — 버튼 텍스트 "시스템 오디오"에 `data-i18n` 속성 없음
  - `index.html:702` — `aria-label="Toggle system audio capture"` 영어 하드코딩
  - `index.html:1495, 1503, 1512, 1709, 2384` — 에러/안내 메시지가 `t()` 함수 미사용
- **비교**: 다른 버튼들(`btnRec`, `btnShare`, `btnDownload`, `btnOpen`)은 모두 `data-i18n` 적용됨
- **수정 방안**: i18n 키 추가 및 `t()` 함수 적용

---

## 검증 요약

| 카테고리 | 항목 수 | 통과 | 미통과 | 런타임 필요 |
|---|---|---|---|---|
| UI 검증 | 6 | 6 | 0 | 0 |
| 캡처 동작 | 10 | 8 | 0 | 2 |
| 에러 핸들링 | 4 | 3 | 1 | 0 |
| 엣지 케이스 | 4 | 3 | 1 | 0 |
| **합계** | **24** | **20** | **2** | **2** |

- **코드 레벨 통과율**: 20/22 (90.9%)
- **미통과 2건**: 토스트 메시지 불일치, displayStream ended 핸들러 누락
- **추가 발견**: i18n 미적용 (검증 플랜에 없던 항목)
