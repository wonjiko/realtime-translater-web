# 기능 정합성 검증 룰 — 검증 플랜

## 메타
- 피처: consistency-rules
- 작성일: 2026-04-08
- 보강일: 2026-04-10
- 검증 대상 파일: index.html
- 통과 기준: 평균 ≥ 8.0 AND 최저 ≥ 5

---

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
- [ ] Settings에서 OpenAI API Key를 비워둔 상태로 페이지 로드 (검증 위치: index.html:2656, `initSettingsUI()`에서 `updateWhisperAvailability()` 호출)
- [ ] "시스템 오디오" 버튼이 `disabled` 상태(클릭 불가, 흐리게 표시)임을 확인 (검증 위치: index.html:2717-2719, `dom.btnSysAudio.disabled = true`)
- [ ] 버튼에 마우스 올리면 "OpenAI API 키가 필요합니다 (Settings에서 설정)" 툴팁 표시 (검증 위치: index.html:2719, `dom.btnSysAudio.title = 'OpenAI API 키가 필요합니다 (Settings에서 설정)'`)

### 1-2. 키 입력 후 버튼 활성화
- [ ] Settings를 열고 OpenAI API Key 입력 후 닫기 (검증 위치: index.html:2759, `saveCurrentSettings()` 말미에 `updateWhisperAvailability()` 호출)
- [ ] "시스템 오디오" 버튼이 클릭 가능한 상태로 전환됨 (검증 위치: index.html:2704-2706, `dom.btnSysAudio.disabled = false; dom.btnSysAudio.title = ''`)

### 1-3. 활성 중 키 삭제 시 자동 해제
- [ ] 시스템 오디오를 ON으로 설정
- [ ] Settings에서 OpenAI Key를 삭제하고 닫기 (검증 위치: index.html:2759, `saveCurrentSettings()` → `updateWhisperAvailability()`)
- [ ] "시스템 오디오" 버튼이 자동으로 비활성(OFF)으로 전환됨 (검증 위치: index.html:2720-2723, `state.useSystemAudio = false; updateSysAudioToggle()`)

### 1-4. 클릭 시 즉각 검사
- [ ] OpenAI 키 없는 상태에서 `btnSysAudio`를 JS로 강제 클릭 (검증 위치: index.html:2938-2948, `btnSysAudio` click 핸들러)
- [ ] "시스템 오디오는 OpenAI API 키가 필요합니다. Settings에서 키를 설정하세요." 토스트 표시 (검증 위치: index.html:2941-2943, `showToast(t('sysAudioRequiresKey'), 'error')`)
- [ ] 버튼 상태가 active로 변경되지 않음 (검증 위치: index.html:2943, `return` 으로 `state.useSystemAudio = next` 할당 전에 탈출)

---

## 2. R2 — 자동 언어감지 + OpenAI 키 (기존 동작 회귀)

- [ ] OpenAI Key 없는 상태에서 소스 언어 드롭다운의 "Auto-Detect" 옵션이 `disabled`로 표시됨 (검증 위치: index.html:2709, `autoOption.disabled = true`)
- [ ] Auto-Detect 선택 중 Key 삭제 → 언어가 `ko-KR`로 자동 복귀 (검증 위치: index.html:2710-2715, `state.sourceLang === 'auto'`이면 `ko-KR`로 강제 복귀 후 localStorage 갱신)

---

## 3. R3 — OpenAI 번역기 + 키 없음

- [ ] Settings에서 번역기를 OpenAI로 선택, OpenAI Key는 비워둠
- [ ] REC 클릭 (검증 위치: index.html:2208, `startRecording()` 진입 직후 `validateBeforeRecording()` 호출)
- [ ] 확인사항:
  - [ ] 녹음이 시작되지 않음 (검증 위치: index.html:2208, `validateBeforeRecording()` 가 false 반환 시 `return`)
  - [ ] "OpenAI 번역을 사용하려면 API 키가 필요합니다. Settings에서 키를 설정하세요." 토스트 표시 (검증 위치: index.html:2186-2188, `settings.provider === 'openai' && !settings.openaiKey` 분기)

---

## 4. R4 — Anthropic 번역기 + 키 없음

- [ ] Settings에서 번역기를 Anthropic으로 선택, Anthropic Key는 비워둠
- [ ] REC 클릭 (검증 위치: index.html:2208, `validateBeforeRecording()` 호출)
- [ ] 확인사항:
  - [ ] 녹음이 시작되지 않음 (검증 위치: index.html:2208, false 반환 시 `return`)
  - [ ] "Anthropic 번역을 사용하려면 API 키가 필요합니다. Settings에서 키를 설정하세요." 토스트 표시 (검증 위치: index.html:2190-2192, `settings.provider === 'anthropic' && !settings.anthropicKey` 분기)

---

## 5. R5 — GAS 번역기 + URL 없음

- [ ] Settings에서 번역기를 Google Apps Script로 선택, GAS URL은 비워둠
- [ ] REC 클릭 (검증 위치: index.html:2208, `validateBeforeRecording()` 호출)
- [ ] 확인사항:
  - [ ] 녹음이 시작되지 않음 (검증 위치: index.html:2208, false 반환 시 `return`)
  - [ ] "Google Apps Script 번역을 사용하려면 GAS URL이 필요합니다. Settings에서 설정하세요." 토스트 표시 (검증 위치: index.html:2194-2196, `settings.provider === 'gas' && !settings.gasUrl` 분기)

---

## 6. 정상 케이스 (차단되지 않아야 하는 경우)

- [ ] MyMemory(기본) + 키 없음 → REC 정상 시작됨 (검증 위치: index.html:2170-2200, `validateBeforeRecording()`에 mymemory 분기 없음 → true 반환)
- [ ] OpenAI 번역기 + OpenAI Key 입력 → REC 정상 시작됨 (검증 위치: index.html:2186-2188, `settings.openaiKey` truthy → 분기 통과)
- [ ] Anthropic 번역기 + Anthropic Key 입력 → REC 정상 시작됨 (검증 위치: index.html:2190-2192, `settings.anthropicKey` truthy → 분기 통과)
- [ ] GAS 번역기 + GAS URL 입력 → REC 정상 시작됨 (검증 위치: index.html:2194-2196, `settings.gasUrl` truthy → 분기 통과)
- [ ] 시스템 오디오 ON + OpenAI Key 입력 → REC 시 공유 다이얼로그 표시됨 (검증 위치: index.html:2174-2177, 키 있으면 통과 → `initWhisperRecording()` 진입)

---

## 7. 엣지 케이스

- [ ] 시스템 오디오 ON + OpenAI 번역기 + 키 없음 → R1 + R3 중 R1이 버튼 단에서 먼저 차단 (R3는 startRecording 진입 시 차단) (검증 위치: index.html:2938-2943, btnSysAudio 클릭 핸들러가 disabled 상태에서 이미 막히고, 설령 클릭돼도 즉각 검사 → 2174-2177의 R1 체크가 먼저 실행)
- [ ] 오프라인 상태 + R3 위반 → 오프라인 토스트가 먼저 표시됨 (cannotRecordOffline 우선) (검증 위치: index.html:2202-2206, `!navigator.onLine` 체크가 `validateBeforeRecording()` 호출보다 앞에 있음)
- [ ] ReadOnly 모드에서 버튼 클릭 → 어떤 검증도 수행되지 않고 바로 무시됨 (검증 위치: index.html:2930, `btnRec` 핸들러 첫 줄 `if (state.isReadOnly) return`)

---

## 카테고리별 검증 요약 테이블

| 카테고리 | 해당 항목 | 항목 수 | 검증 기준 |
|---|---|---|---|
| 기능 정합성 | 1-1 ~ 1-4, 2, 3, 4, 5 | 13 | 각 규칙(R1~R5)의 차단 조건이 정확하게 동작하며, 정상 케이스(섹션 6)에서는 차단이 없어야 함. 토스트 메시지 문구도 코드와 일치해야 함. |
| 에러 핸들링 | 3, 4, 5, 7(오프라인) | 5 | 토스트 `type='error'`로 표시되고 녹음이 시작되지 않으며, 오프라인 우선순위가 validateBeforeRecording보다 높음을 확인. |
| 코드 품질 | 1-4, 7(R1+R3 중복) | 2 | 중복 검사 없이 단일 진입점(validateBeforeRecording)에서 일괄 처리되며, 버튼 단의 즉각 검사와 녹음 진입 시 검사가 역할을 분리하고 있음을 확인. |
| UX/접근성 | 1-1(disabled), 1-2(활성화), 1-3(자동 해제), 1-4(툴팁) | 4 | `disabled` 속성, `title` 툴팁, 상태 자동 해제가 UI에서 시각적으로 반영되고 사용자에게 명확한 피드백을 제공하는지 확인. |
| 엣지 케이스 | 7(R1+R3 중복, 오프라인, ReadOnly) | 3 | 규칙 우선순위(R1 버튼 단 > 오프라인 체크 > validateBeforeRecording), ReadOnly 무시가 각각 독립적으로 보장되는지 확인. |
