# AGENTS.md

이 파일은 Claude Code 및 AGENTS.md 호환 LLM 도구가 공통으로 읽는 **단일 지침 파일**이다.
AI 에이전트(LLM)가 이 프로젝트에서 작업할 때 따라야 하는 지침을 정의한다.

## 프로젝트 개요

- **제품**: 서버 없이 브라우저에서 동작하는 실시간 회의 번역 웹 앱
- **아키텍처**: `index.html` 단일 파일 (HTML + CSS + JS 인라인), 프레임워크 없음
- **외부 의존성**: lz-string CDN 1개만
- **보조 파일**: `gas-proxy.js` (Google Apps Script 프록시)

## 코드 규칙

### 파일 구성 원칙

- HTML 엔트리는 `index.html` 하나로 유지한다
- JS/CSS는 **기능 단위로** 별도 파일 분리 허용. 과도한 분리는 지양한다 ([ADR 0001](docs/adr/0001-allow-js-css-separation.md) 참조)
- 빌드 시스템, 번들러, 패키지 매니저는 도입하지 않는다 (CDN 사용 유지)
- 아키텍처/기술 결정은 [`docs/adr/`](docs/adr/)에 ADR로 기록한다 ([ADR 0000](docs/adr/0000-record-architecture-decisions.md) 참조)

### 스타일

- CSS는 CSS 변수 기반으로 작성한다 (`<style>` 인라인 또는 분리된 `.css` 파일)
- 다크 모드는 `[data-theme="dark"]` 셀렉터로 CSS 변수를 오버라이드한다
- JavaScript는 ES6+ 문법을 사용하며, `<script>` 인라인 또는 분리된 `.js` 파일로 작성한다
- 전역 `state` 객체를 통해 상태를 관리한다 (모듈 간 공유 시 `window.state` 네임스페이스)

### 보안 필수사항

- 사용자 입력이나 외부 API 응답을 `innerHTML`에 삽입할 때 반드시 HTML 이스케이프 처리
- API Key는 localStorage에만 저장, URL 해시에 절대 포함하지 않는다
- fetch 호출에는 반드시 timeout을 적용한다
- 요구사항에 명시되지 않은 기능을 추가하지 않는다
- 기존 기능을 깨뜨리지 않도록 기존 코드의 동작을 먼저 파악한다
- 새로운 외부 의존성을 추가하기 전에 정말 필요한지 검토한다

## 문서 기반 워크플로우

이 프로젝트는 검증 루프 기반 문서 개발 사이클을 따른다.

문서 작성 규칙: [docs/RULES.md](docs/RULES.md)

---

### 검증 루프 워크플로우

피처 구현이 완료되면 **반드시 검증 루프를 실행**한다. 상세 프로토콜과 서브에이전트 프롬프트 템플릿은 [docs/workflows/verification-loop.md](docs/workflows/verification-loop.md)에 정의되어 있다.

#### 핵심 원칙

- **각 단계는 독립된 서브에이전트로 실행**한다. 메인 세션은 오케스트레이터 역할만 수행한다.
- **서브에이전트 간 소통은 `docs/features/` 파일을 통해서만** 이루어진다. (컨텍스트 격리)
- **통과 기준**: 전체 평균 ≥ 8.0 **AND** 모든 항목 ≥ 5 — 두 조건 모두 충족 시 PASS
- **결과 파일 위치**: `docs/features/{feature}-verification-result.md`

#### 5단계 루프

```
① 플랜 에이전트   → {feature}-verification-plan.md (초안)
② 구현 에이전트   → 코드 변경
③ 플랜 보강 에이전트 → {feature}-verification-plan.md (보강본, 코드 위치 구체화)
④ 검증 에이전트   → {feature}-verification-result.md (Round N 채점)
⑤ 수정 에이전트   → 코드 수정 (FAIL 시, ④로 루프백)
```

#### 정체 감지

Round 2 이상에서 평균 점수 변화가 ≤ 0.5인 경우 정체로 판단하여 사용자에게 선택지를 제시한다:
1. 저점수 항목 직접 수정 후 검증 재실행
2. 해당 항목 통과 기준 완화
3. 현재 상태로 수용

#### 각 단계의 오케스트레이터 행동과 프롬프트 템플릿

[docs/workflows/verification-loop.md](docs/workflows/verification-loop.md)의 "오케스트레이터 행동 상세" 테이블과 "서브에이전트 프롬프트 템플릿" 섹션을 그대로 따른다. 이 AGENTS.md에서 중복 서술하지 않는다.

---

## 코드 수정 시 체크리스트

`index.html` 수정 후 아래 항목을 확인한다:

- [ ] 기존 기능이 깨지지 않았는가 (음성 인식, 번역, 공유, 다운로드)
- [ ] `innerHTML` 삽입 시 HTML 이스케이프가 적용되어 있는가
- [ ] 새로운 fetch 호출에 timeout이 적용되어 있는가
- [ ] 다크 모드에서 새 UI 요소가 정상 표시되는가
- [ ] 모바일 뷰에서 레이아웃이 깨지지 않는가
- [ ] 읽기 전용 모드(해시 데이터 URL)에서 새 기능이 적절히 동작하는가
- [ ] API Key가 URL 해시에 포함되지 않는가
