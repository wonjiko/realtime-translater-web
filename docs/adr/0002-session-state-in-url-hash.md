# ADR 0002: 세션 상태는 URL 해시를 Source of Truth로 한다

- **상태**: Accepted
- **날짜**: 2026-04-22

## 배경

이 앱은 서버 없이 브라우저에서만 동작하는 단일 HTML SPA다. 세션(트랜스크립트 / 노트 / 자동 요약 등)은 URL 해시에 LZString으로 압축·직렬화되어 저장되며, **URL 하나만 공유하면 다른 사용자가 같은 회의록을 열람할 수 있는 것**이 원래 설계 의도였다.

하지만 이 원칙은 `AGENTS.md`의 "API Key는 URL 해시에 포함하지 않는다"([AGENTS.md:32](../../AGENTS.md))라는 **반대 방향 제약**만 명시되어 있었고, "세션 데이터는 반드시 해시에 넣는다"라는 **정방향 규칙은 코드 컨벤션으로만 존재**했다. 그 결과 다음 사건이 발생했다:

3탭(회의 기록 / 노트 / 대화 번역) 도입 작업(`feature/meeting-notes-translation-tabs`)에서 노트를 `state.notes[]` 배열 + `rt_notes_v1` 전용 localStorage 키로 분리 저장하는 변경이 들어갔다. 이 구조는 해시 페이로드와 연결되지 않아 **공유 URL에 노트가 포함되지 않는 회귀**를 일으켰다. 사용자 지적 후 단일 `state.note`(문자열) + `serializeState.n` 경로로 되돌렸으나, 룰이 암묵적인 한 같은 실수가 반복될 수 있다.

## 결정

**세션 상태의 Source of Truth는 URL 해시다.** `rt_session_backup` localStorage 키는 해시의 1:1 거울(복구 fallback)로만 존재하며, 독립적인 세션 저장소가 아니다.

### 해시(= `serializeState()`)에 포함해야 하는 것

현재 해시 페이로드 스키마(`v: 1`, [`assets/js/translation.js:1059-1073`](../../assets/js/translation.js)):

| 키 | 내용 |
|---|---|
| `v` | 페이로드 스키마 버전 (현재 `1`) |
| `sl` | 음성 인식 언어(source lang) |
| `tl` | 번역 대상 언어 배열(target langs) |
| `t` | 트랜스크립트 entries (원문 + 번역) |
| `n` | 사용자 노트 (`state.note`, 있을 때만) |
| `sum` | 자동 요약 결과 (`state.summary`, 있을 때만) |
| `d` | 회의 날짜 (첫 entry timestamp) |

기준: **다른 사람에게 공유되어야 의미 있는 데이터**는 해시에 들어간다.

### localStorage 전용 (해시 금지)

다음 값은 기기/사용자 로컬 preference이며 **공유되면 안 된다** — 해시에 절대 포함하지 않는다:

- API Key (OpenAI / Anthropic / GAS URL) — 보안 필수([AGENTS.md:32](../../AGENTS.md))
- 테마 (라이트/다크)
- locale (`rt_locale`)
- 번역 provider, 번역 모드(standard/enhanced), 청크 설정
- 선택된 마이크 장치
- 활성 탭 (`rt_active_tab`)
- 시스템 오디오 토글 플래그 등

### 해시 vs localStorage 구분표

| 종류 | 저장 위치 | 판단 기준 |
|---|---|---|
| 트랜스크립트, 노트, 요약, 언어 선택, 회의 날짜 | **URL 해시** (+ `rt_session_backup` 거울) | 공유 URL을 받은 상대가 보기 위해 필요한가? → 예 |
| API 키, 테마, locale, provider/모드, 마이크 장치, 활성 탭 | **localStorage 전용** | 로컬 preference인가, 공유되면 위험/무의미한가? → 예 |

### 금지 패턴

- **세션 데이터 전용 `rt_{feature}_v1` localStorage 키를 신설하지 않는다.** 세션 데이터는 반드시 `serializeState()`에 필드를 추가하고 `loadFromHash()`에서 복원한다.
- `rt_session_backup`은 해시 write 경로([`assets/js/translation.js:1084`](../../assets/js/translation.js))에서만 갱신한다. 다른 코드 경로에서 이 키에 직접 쓰지 않는다.

### 스키마 버전

현재 `v: 1`. 해시 페이로드 스키마가 변경되면 `v`를 올리고 `loadFromHash()`에 하위 호환 분기를 명시한다([`assets/js/translation.js:1096`](../../assets/js/translation.js)의 `if (data.v !== 1) return false;` 참조).

## 근거

- **공유 URL의 완결성이 제품 정체성**: 서버 없는 SPA에서 "URL 하나로 회의록 공유"는 대체 불가능한 핵심 기능이다. 해시가 누락되면 "공유가 일부만 되는" 상태가 되어 사용자 신뢰가 손상된다.
- **컨벤션만으로는 회귀를 막지 못했다**: 3탭 도입 시 `rt_notes_v1` 분리가 리뷰를 통과해 머지되었다. 명문화된 ADR이 있으면 같은 유형의 PR이 리뷰 단계에서 차단된다.
- **`rt_session_backup`을 백업 거울로만 쓰는 이유**: 해시는 페이지 이동/새로고침 시 일부 브라우저에서 소실될 수 있으므로 localStorage에 거울을 둔다. 단 이것을 "또 다른 저장소"로 취급하면 두 경로가 divergent되어 어느 쪽이 진실인지 모호해진다. 거울로만 한정하면 항상 해시가 정답이다.
- **대안 검토**: IndexedDB / 서버 저장 등은 "서버 없이 정적 호스팅" 전제를 깬다. 고려 대상 아님.

## 결과

### 긍정

- 공유 URL이 항상 완결된 세션을 담는 것을 보장한다.
- 새 기능 추가 시 "이 데이터는 해시? localStorage?" 판단 기준이 명확하다(공유되어야 하나?).
- `rt_session_backup` 동기화 구조(해시 write = backup write)가 단일 진입점으로 유지된다.

### 부정 / 주의

- 해시가 약 8KB를 초과하면 일부 플랫폼에서 URL이 절단될 수 있다. 이미 [`assets/js/translation.js:1420-1422`](../../assets/js/translation.js)에서 `urlTooLong` 토스트로 경고하고 있으며, 장문 세션은 JSON 다운로드를 권장한다.
- `rt_session_backup`에는 노트 등 사용자 생성 텍스트가 포함될 수 있다. 따라서 **API 키 등 비밀값은 절대 세션 페이로드에 넣지 않는다**는 룰이 본 ADR에서도 반복적으로 강조된다.
- 해시 스키마 변경은 `v` bump + 하위 호환을 요구한다 — 자유로운 필드 추가/변경이 어렵다.

### 후속 조치

- `AGENTS.md`의 "보안 필수사항" 섹션에 "세션 상태는 URL 해시를 Source of Truth로 한다 — [ADR 0002](docs/adr/0002-session-state-in-url-hash.md) 참조" 항목 추가 검토. **실제 편집은 본 ADR 작성 범위 밖**이며, 별도 작업으로 처리한다.
