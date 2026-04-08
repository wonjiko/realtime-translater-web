# 기능 정합성 검증 룰 — 검증 플랜

## 변경 사항 요약

1. `validateBeforeRecording()` 추가 — 5가지 정합성 규칙을 녹음 시작 전에 일괄 검사
2. `updateWhisperAvailability()` 확장 — `btnSysAudio` 비활성화 및 자동 해제 포함
3. `btnSysAudio` 클릭 핸들러 — 활성화 시 즉각 OpenAI 키 검사
4. `startRecording()` — 진입 직후 `validateBeforeRecording()` 호출

---

## 정합성 규칙 정의

| ID | 조건 | 필요 조건 | 위반 시 동작 |
|---|---|---|---|
| R1 | 시스템 오디오 ON | OpenAI API 키 | 버튼 `disabled`, 자동 OFF, 토스트 |
| R2 | 소스 언어 = 자동감지 | OpenAI API 키 | auto 옵션 `disabled` (기존 동작 유지) |
| R3 | 번역기 = OpenAI | OpenAI API 키 | 녹음 시작 차단 + 토스트 |
| R4 | 번역기 = Anthropic | Anthropic API 키 | 녹음 시작 차단 + 토스트 |
| R5 | 번역기 = GAS | GAS URL | 녹음 시작 차단 + 토스트 |

---

## 1. R1 — 시스템 오디오 + OpenAI 키

### 1-1. 키 없을 때 버튼 비활성화
- [ ] Settings에서 OpenAI API Key를 비워둔 상태로 페이지 로드
- [ ] "시스템 오디오" 버튼이 `disabled` 상태(클릭 불가, 흐리게 표시)임을 확인
- [ ] 버튼에 마우스 올리면 "OpenAI API 키가 필요합니다 (Settings에서 설정)" 툴팁 표시

### 1-2. 키 입력 후 버튼 활성화
- [ ] Settings를 열고 OpenAI API Key 입력 후 닫기
- [ ] "시스템 오디오" 버튼이 클릭 가능한 상태로 전환됨

### 1-3. 활성 중 키 삭제 시 자동 해제
- [ ] 시스템 오디오를 ON으로 설정
- [ ] Settings에서 OpenAI Key를 삭제하고 닫기
- [ ] "시스템 오디오" 버튼이 자동으로 비활성(OFF)으로 전환됨

### 1-4. 클릭 시 즉각 검사
- [ ] OpenAI 키 없는 상태에서 `btnSysAudio`를 JS로 강제 클릭
- [ ] "시스템 오디오는 OpenAI API 키가 필요합니다. Settings에서 키를 설정하세요." 토스트 표시
- [ ] 버튼 상태가 active로 변경되지 않음

---

## 2. R2 — 자동 언어감지 + OpenAI 키 (기존 동작 회귀)

- [ ] OpenAI Key 없는 상태에서 소스 언어 드롭다운의 "Auto-Detect" 옵션이 `disabled`로 표시됨
- [ ] Auto-Detect 선택 중 Key 삭제 → 언어가 `ko-KR`로 자동 복귀

---

## 3. R3 — OpenAI 번역기 + 키 없음

- [ ] Settings에서 번역기를 OpenAI로 선택, OpenAI Key는 비워둠
- [ ] REC 클릭
- [ ] 확인사항:
  - [ ] 녹음이 시작되지 않음
  - [ ] "OpenAI 번역을 사용하려면 API 키가 필요합니다. Settings에서 키를 설정하세요." 토스트 표시

---

## 4. R4 — Anthropic 번역기 + 키 없음

- [ ] Settings에서 번역기를 Anthropic으로 선택, Anthropic Key는 비워둠
- [ ] REC 클릭
- [ ] 확인사항:
  - [ ] 녹음이 시작되지 않음
  - [ ] "Anthropic 번역을 사용하려면 API 키가 필요합니다. Settings에서 키를 설정하세요." 토스트 표시

---

## 5. R5 — GAS 번역기 + URL 없음

- [ ] Settings에서 번역기를 Google Apps Script로 선택, GAS URL은 비워둠
- [ ] REC 클릭
- [ ] 확인사항:
  - [ ] 녹음이 시작되지 않음
  - [ ] "Google Apps Script 번역을 사용하려면 GAS URL이 필요합니다. Settings에서 설정하세요." 토스트 표시

---

## 6. 정상 케이스 (차단되지 않아야 하는 경우)

- [ ] MyMemory(기본) + 키 없음 → REC 정상 시작됨
- [ ] OpenAI 번역기 + OpenAI Key 입력 → REC 정상 시작됨
- [ ] Anthropic 번역기 + Anthropic Key 입력 → REC 정상 시작됨
- [ ] GAS 번역기 + GAS URL 입력 → REC 정상 시작됨
- [ ] 시스템 오디오 ON + OpenAI Key 입력 → REC 시 공유 다이얼로그 표시됨

---

## 7. 엣지 케이스

- [ ] 시스템 오디오 ON + OpenAI 번역기 + 키 없음 → R1 + R3 중 R1이 버튼 단에서 먼저 차단 (R3는 startRecording 진입 시 차단)
- [ ] 오프라인 상태 + R3 위반 → 오프라인 토스트가 먼저 표시됨 (cannotRecordOffline 우선)
- [ ] ReadOnly 모드에서 버튼 클릭 → 어떤 검증도 수행되지 않고 바로 무시됨
