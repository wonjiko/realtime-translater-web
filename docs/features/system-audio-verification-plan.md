# 시스템 오디오 캡처 — 검증 플랜

## 변경 사항 요약

1. `initSystemAudioMixing()` 추가 — `getDisplayMedia` + `AudioContext`로 탭 오디오와 마이크를 믹싱
2. `initWhisperRecording()` 수정 — `state.useSystemAudio` 분기로 믹싱 스트림 또는 마이크 단독 선택
3. `stopWhisperChunkCycle()` 수정 — `displayStream` / `micStream` / `audioContext` cleanup 추가
4. `startRecording()` 수정 — `state.useWhisper` 조건에 `|| state.useSystemAudio` 추가
5. `#btnSysAudio` 버튼 추가 — control-bar HTML, CSS(`.btn-sysaudio`), `dom` 객체, 이벤트 리스너
6. `updateSysAudioToggle()` 추가 — 버튼 active 상태 동기화

---

## 1. UI 검증

### 1-1. 버튼 표시
- [ ] 페이지 로드 시 REC 버튼 옆에 "🎤 시스템 오디오" 버튼이 표시됨
- [ ] 기본 상태에서 버튼이 비활성(gray) 스타일로 보임

### 1-2. 토글 동작
- [ ] OpenAI API 키가 설정된 상태에서 버튼 클릭 → 초록색 active 스타일로 전환
- [ ] 다시 클릭 → 비활성 스타일로 복귀
- [ ] 녹음 중 버튼 클릭 → 아무 반응 없음 (토글 불가)

### 1-3. ReadOnly 모드
- [ ] 공유 URL로 접속(ReadOnly 모드)시 버튼이 숨겨짐

---

## 2. 시스템 오디오 캡처 동작

### 2-1. 정상 플로우 (Chrome + Google Meet)
1. Settings에서 OpenAI API Key 입력
2. "시스템 오디오" 버튼 클릭 → active 상태 확인
3. REC 클릭
4. 확인사항:
   - [ ] Chrome의 화면 공유 다이얼로그가 표시됨
   - [ ] "Chrome 탭" 탭이 선택 가능함
   - [ ] "탭 오디오 공유" 체크박스가 표시됨
5. Google Meet 탭 선택 + "탭 오디오 공유" 체크 후 공유 클릭
6. 확인사항:
   - [ ] 녹음이 시작됨 (버튼이 STOP으로 변경)
   - [ ] 상대방 발화 시 Whisper가 텍스트를 인식하고 번역 결과가 표시됨
   - [ ] 내 마이크 음성도 동시에 인식됨

### 2-2. STOP 후 리소스 정리
- [ ] STOP 클릭 후 브라우저 탭 상단의 화면 공유 표시(빨간 점)가 사라짐
- [ ] 다음 REC 클릭 시 공유 다이얼로그가 다시 정상적으로 뜸
- [ ] 콘솔에 MediaStream 관련 에러 없음

### 2-3. sourceLang 관계
- [ ] 시스템 오디오 ON + sourceLang이 특정 언어(예: `ko-KR`)인 경우에도 Whisper 모드로 동작 (Web Speech API 미사용)
- [ ] 시스템 오디오 OFF + sourceLang이 특정 언어인 경우 기존 Web Speech API 모드로 동작

---

## 3. 에러 핸들링

| 시나리오 | 기대 동작 |
|---|---|
| 화면 공유 다이얼로그에서 취소 | "화면 공유가 취소되었습니다. 마이크만 사용합니다." 토스트 + 녹음 시작 안 됨 |
| 탭 선택 후 "탭 오디오 공유" 미체크 상태로 공유 | "선택한 탭에 오디오가 없습니다…" 토스트 + 녹음 시작 안 됨 |
| 마이크 권한 거부 | "마이크 접근 실패: …" 토스트 + 녹음 시작 안 됨, displayStream도 정리됨 |
| `getDisplayMedia` 미지원 브라우저(Firefox 등) | "이 브라우저는 시스템 오디오 캡처를 지원하지 않습니다." 토스트 |

---

## 4. 엣지 케이스

- [ ] 녹음 중 사용자가 브라우저 탭 공유를 직접 중단 → 오디오는 마이크만 계속 캡처되고 앱 크래시 없음
- [ ] 시스템 오디오 ON + auto-detect(자동 언어감지) 동시 사용 → 정상 동작 (둘 다 Whisper 모드)
- [ ] STOP → 시스템 오디오 OFF → REC → 마이크 단독 모드로 정상 전환
- [ ] 여러 번 연속 REC/STOP 반복 후 콘솔 에러 없음, 메모리 누수 없음(AudioContext 중복 생성 안 됨)
