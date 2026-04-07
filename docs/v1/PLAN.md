> 📌 이 문서는 [docs/RULES.md](../RULES.md)의 **PLAN** 작성 규칙 예시입니다.

# Implementation Plan

**Based on**: [TESTING-REPORT.md](./TESTING-REPORT.md) (Overall Score: 6.5/10)
**Goal**: 6.5 → 8.5+ 까지 품질 향상

---

## Phase 1 — P0: Security & Data Integrity (Critical)

테스트 리포트에서 Critical/High로 분류된 보안 및 데이터 무결성 이슈를 먼저 해결한다.

### 1.1 XSS 취약점 수정
- **문제**: `markdownToHtml()`이 LLM 응답을 escape 없이 `innerHTML`에 삽입 → 임의 스크립트 실행 가능
- **위치**: Line ~1304, 1316-1327
- **해결**:
  - `escapeHtml()` 함수 추가 — markdown 변환 전에 HTML 엔티티 이스케이프
  - `markdownToHtml()` 입력 단계에서 `escapeHtml()` 적용
  - 또는 DOMPurify CDN 도입하여 최종 HTML sanitize

### 1.2 Race Condition 수정
- **문제**: `translateEntry().then()` 콜백에서 `state.entries.length - 1`로 index 접근 → 비동기 완료 시 잘못된 entry에 번역 결과 렌더링
- **위치**: Line ~1088-1093
- **해결**:
  ```javascript
  const idx = state.entries.length - 1;
  renderEntry(entry, idx);
  translateEntry(entry).then(() => {
    updateEntryTranslations(idx, entry);
  });
  ```

### 1.3 Fetch Timeout 추가
- **문제**: 모든 fetch 호출(6곳)에 timeout 없음 → 네트워크 불안정 시 무한 대기
- **해결**:
  - `fetchWithTimeout(url, options, timeoutMs = 10000)` 유틸 함수 작성 (`AbortController` + `setTimeout`)
  - 모든 `fetch()` 호출을 `fetchWithTimeout()`으로 교체
  - timeout 시 사용자에게 명확한 에러 메시지 표시

### 1.4 데이터 소실 방지
- **문제**: 탭 닫기/새로고침 시 트랜스크립트 전체 소실, localStorage 백업 없음, beforeunload 경고 없음
- **해결**:
  - `beforeunload` 이벤트로 녹음 중/데이터 있을 때 이탈 경고
  - URL 해시 업데이트 시 `localStorage`에도 세션 백업 저장
  - 페이지 로드 시 해시 없으면 localStorage 백업에서 복구 제안

---

## Phase 2 — P1: Reliability & UX

사용성에 직접 영향을 미치는 신뢰성 이슈를 해결한다.

### 2.1 번역 Retry 로직
- **문제**: PRD에 명시된 "번역 실패 시 재시도"가 미구현
- **해결**:
  - Exponential backoff으로 최대 2회 자동 재시도 (1초 → 2초)
  - 최종 실패 시 에러 메시지 표시 + 수동 재시도 버튼

### 2.2 Share URL file:// 대응
- **문제**: `location.origin`이 `file://`에서 `"null"` 반환 → URL 공유 불가
- **해결**:
  - `location.origin === "null"` 체크 → `location.href` 기반 URL 생성
  - 해시 부분만 추출하여 현재 경로에 붙이는 방식

### 2.3 URL 길이 경고
- **문제**: 장시간 회의 시 URL이 수만 자 → 일부 플랫폼에서 잘림
- **해결**:
  - 압축 후 URL이 8,000자 초과 시 경고 토스트 표시
  - JSON 다운로드를 대안으로 안내

### 2.4 MyMemory 500자 Truncation 알림
- **문제**: 500자 초과 시 silent truncation → 사용자 인지 불가
- **해결**:
  - 잘린 경우 번역 결과에 `[truncated]` 표시
  - 토스트로 "텍스트가 500자 제한으로 잘렸습니다" 안내

### 2.5 오프라인 감지
- **문제**: 네트워크 상태 감지 없음
- **해결**:
  - `navigator.onLine` + `offline`/`online` 이벤트 리스너
  - 오프라인 시 상단 배너 표시 + 녹음 시작 차단

### 2.6 markdownToHtml 파서 버그 수정
- **문제**: `(<li>.*<\/li>)` 정규식에 `s` flag → 모든 리스트가 하나의 `<ul>`로 합쳐짐
- **해결**:
  - 섹션별 독립적인 `<ul>` 생성하도록 정규식 수정
  - 또는 간단한 line-by-line 파서로 교체

### 2.7 에러 토스트 지속시간 분리
- **문제**: 중요한 에러(API key 오류 등)도 3초 후 자동 사라짐
- **해결**:
  - `showToast(msg, type)` → type에 따라 지속시간 분리: info 3초, error 6초
  - error 토스트에 수동 닫기(X) 버튼 추가

---

## Phase 3 — P2: Polish & Accessibility

사용 품질과 접근성을 개선한다.

### 3.1 접근성 기본 대응
- 주요 버튼에 `aria-label` 추가
- 녹음 상태에 `aria-live="polite"` + `role="status"`
- 키보드 네비게이션: Tab 순서 정리, Enter/Space 핸들링
- `user-scalable=no` 제거

### 3.2 터치 타겟 확대
- icon-btn: 36px → 44px
- section-toggle: 28px → 44px

### 3.3 CDN Fallback
- lz-string CDN 로드 실패 시 fallback 로직 추가
- 또는 lz-string을 inline으로 포함

### 3.4 모바일 키보드 대응
- 노트 textarea focus 시 레이아웃 보정
- `visualViewport` API 활용하여 키보드 높이 대응

### 3.5 Speech Recognition 안정성
- `recognition.onend` auto-restart 실패 시 사용자에게 피드백 제공
- 재시도 로직의 타이밍 의존성 개선

### 3.6 기타 개선
- MyMemory 한도 초과 시 "다른 제공자로 전환" 안내 메시지
- GAS `Content-Type` 의도 주석 추가
- 빈 entries일 때 JSON 다운로드 방지
- 읽기 전용 모드에서 Settings 버튼 숨김

---

## Implementation Order

```
Phase 1 (P0)  ──→  Phase 2 (P1)  ──→  Phase 3 (P2)
  1.1 XSS             2.1 Retry           3.1 Accessibility
  1.2 Race condition   2.2 file:// URL     3.2 Touch targets
  1.3 Fetch timeout    2.3 URL length      3.3 CDN fallback
  1.4 Data loss        2.4 Truncation      3.4 Mobile keyboard
                       2.5 Offline         3.5 Recognition
                       2.6 Markdown fix    3.6 Misc
                       2.7 Toast duration
```

## Out of Scope (이번 계획에서 제외)

- 코드 모듈 분리 / 빌드 시스템 도입 (단일 파일 유지 원칙)
- 자동화된 테스트 추가 (별도 계획 필요)
- Anthropic `dangerous-direct-browser-access` 제거 (서버 프록시 필요 — 제로 인프라 원칙과 충돌)
- 추가 언어 지원 (현재 EN/JA/KO 유지)
- API 키 암호화 저장 (별도 보안 설계 필요)
