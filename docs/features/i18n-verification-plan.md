# i18n + Auto-detect UX + GitHub 뱃지 검증 플랜

## 변경 사항 요약

1. UI 다국어 지원 (한국어 기본, 영어 전환)
2. Auto-detect 옵션 UX 개선 (OpenAI Whisper 의존성 명시)
3. 사용자 Preference localStorage 저장/복원
4. README GitHub 뱃지 추가

---

## 1. 기본 로딩

- [ ] 첫 방문 시 (localStorage 비어있는 상태) UI가 한국어로 표시되는가
- [ ] `<html lang="ko">`, `<title>` "실시간 회의 번역기" 확인
- [ ] Voice 기본값 `Korean`, 번역 대상 기본값 `EN`, `JA` 체크 확인
- [ ] 헤더에 `EN` 토글 버튼이 Settings 버튼 왼쪽에 표시되는가

---

## 2. 언어 전환 (KO/EN)

### 2-1. 토글 동작
- [ ] `EN` 버튼 클릭 → 전체 UI 영어 전환, 버튼 텍스트 `KO`로 변경
- [ ] `KO` 버튼 클릭 → 한국어 복귀, 버튼 텍스트 `EN`으로 변경
- [ ] 빠르게 여러 번 토글해도 정상 동작하는가

### 2-2. 전환 시 변경 항목 전수 확인

#### 헤더
- [ ] 앱 타이틀: "실시간 번역기" ↔ "Real-Time Translator"
- [ ] Settings 버튼 title/aria-label: "설정" ↔ "Settings"

#### 언어바
- [ ] Voice 라벨: "음성 언어" ↔ "Voice"
- [ ] Translate 라벨: "번역 대상" ↔ "Translate"
- [ ] Auto-detect 옵션: "자동 감지 (OpenAI Whisper 필요)" ↔ "Auto-detect (requires OpenAI Whisper)"

#### 빈 상태 안내문
- [ ] 제목: "회의 번역 준비 완료" ↔ "Ready to translate your meeting"
- [ ] 3단계 안내문 한/영 전환

#### 섹션
- [ ] 메모 헤더: "메모" ↔ "Notes"
- [ ] 메모 placeholder: 한/영 전환
- [ ] 회의 요약 헤더: "회의 요약" ↔ "Meeting Summary"
- [ ] 새로고침 버튼: "새로고침" ↔ "Refresh"
- [ ] 요약 비활성 안내문 한/영 전환

#### 컨트롤 바
- [ ] REC 버튼: "REC" (동일)
- [ ] 공유 버튼: "공유" ↔ "Share"
- [ ] 다운로드 버튼: "다운로드" ↔ "Download"

#### 설정 모달
- [ ] 제목: "설정" ↔ "Settings"
- [ ] 번역 제공자 라벨 한/영 전환
- [ ] 4개 제공자 이름 + 설명 한/영 전환
- [ ] API Key 라벨, 힌트 텍스트 한/영 전환
- [ ] GAS URL 라벨, 힌트, 연결 테스트 버튼 한/영 전환
- [ ] 테마 라벨 + 3개 버튼 (라이트/다크/시스템) 한/영 전환

---

## 3. Locale 저장/복원

- [ ] 영어로 전환 후 새로고침 → 영어 유지
- [ ] 한국어로 전환 후 새로고침 → 한국어 유지
- [ ] DevTools > Application > localStorage에 `rt_locale` 값 확인

---

## 4. Auto-detect UX

### 4-1. 비활성 상태 (OpenAI key 미설정)
- [ ] "자동 감지 (OpenAI Whisper 필요)" 옵션이 `disabled` 상태로 표시되는가
- [ ] disabled 옵션은 select에서 선택 불가한가

### 4-2. 활성화
- [ ] 설정에서 OpenAI를 provider로 선택 + API key 입력 후 모달 닫기
- [ ] Auto-detect 옵션이 활성화(disabled 해제)되는가
- [ ] 선택 후 REC 시 Whisper 파이프라인 정상 동작

### 4-3. 비활성화 복귀
- [ ] Auto-detect 선택 중 상태에서 OpenAI key 제거 후 모달 닫기
- [ ] Voice가 자동으로 Korean(또는 저장된 기본값)으로 되돌아가는가
- [ ] 번역 대상 체크박스가 정상 업데이트되는가

---

## 5. Preference 저장/복원

### 5-1. 음성 언어
- [ ] Voice를 `English`로 변경 후 새로고침 → `English` 유지
- [ ] Voice를 `Japanese`로 변경 후 새로고침 → `Japanese` 유지
- [ ] `localStorage.getItem('rt_source_lang')` 값 확인

### 5-2. 번역 대상
- [ ] 체크 변경 (예: KO만 체크) 후 새로고침 → 변경 유지
- [ ] 전체 해제 후 새로고침 → 해제 유지
- [ ] `localStorage.getItem('rt_target_langs')` JSON 배열 확인

---

## 6. 동적 텍스트 i18n

### 6-1. 녹음 관련
- [ ] 한국어 모드: REC 클릭 → 버튼 "STOP" 표시
- [ ] 한국어 모드: STOP 클릭 → 버튼 "REC" 복귀
- [ ] 오프라인 상태에서 REC → "오프라인에서는 녹음할 수 없습니다" toast

### 6-2. 공유/다운로드
- [ ] 회의록 없이 공유 클릭 → "공유할 회의록이 없습니다" toast
- [ ] 회의록 없이 다운로드 클릭 → "다운로드할 회의록이 없습니다" toast
- [ ] 정상 공유 → "URL이 클립보드에 복사되었습니다!" toast
- [ ] 정상 다운로드 → "다운로드 완료!" toast

### 6-3. 영어 모드 확인
- [ ] 영어 전환 후 위 동작 반복 → 모든 toast 영어 표시

### 6-4. 설정 모달 내
- [ ] GAS URL 미입력 상태에서 연결 테스트 → 한/영 에러 toast
- [ ] 회의 요약 새로고침 버튼 → 로딩 중 텍스트 한/영

---

## 7. 엣지 케이스

- [ ] 공유 링크(read-only)로 접속 시 "공유된 회의록 — 읽기 전용" 배너 표시
- [ ] 세션 복원 confirm 다이얼로그 한국어/영어 텍스트
- [ ] Chrome 외 브라우저 경고 메시지 한/영
- [ ] 번역 실패 시 `[번역 오류]` / `[Translation error]` 표시

---

## 8. README 뱃지

- [ ] README.md에 GitHub Pages (녹색), Source (파란색) 뱃지 2개 렌더링
- [ ] GitHub Pages 뱃지 → `https://wonjiko.github.io/realtime-translater-web/` 링크
- [ ] Source 뱃지 → `https://github.com/wonjiko/realtime-translater-web` 링크
