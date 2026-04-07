# Real-Time Meeting Translator

서버 없이 브라우저에서 동작하는 실시간 회의 번역 웹 앱.

회의 참가자의 음성을 실시간으로 텍스트로 변환하고, 선택한 언어로 번역하여 표시한다. 회의록은 URL에 압축 저장하여 링크만으로 공유 가능하다.

## 핵심 기능

- **실시간 음성 인식**: Web Speech API 기반, 영어/일본어/한국어 지원
- **다중 번역 엔진**: MyMemory (무료, 기본) / OpenAI GPT / Anthropic Claude / Google Apps Script
- **URL 공유**: 회의록 + 노트 + 요약을 URL 해시에 LZ-string 압축하여 공유
- **회의록 요약**: LLM 연동 시 주요 안건 / 결정 사항 / Action Items 자동 생성
- **제로 인프라**: HTML 파일 하나로 동작, 서버/DB 불필요

## 기술 스택

| 구분 | 기술 |
|---|---|
| 음성 인식 | Web Speech API (브라우저 내장) |
| 번역 | MyMemory API / OpenAI API / Anthropic API / Google Apps Script |
| 압축 | lz-string 1.5.0 (CDN) |
| UI | Pure HTML + CSS + JS (프레임워크 없음, 단일 파일) |

## 빠른 시작

1. **Chrome** 또는 **Edge**에서 `index.html`을 열기
2. Voice 언어 선택 후 `● REC` 버튼 클릭
3. 마이크 권한 허용 → 음성 인식 시작

기본 번역 엔진(MyMemory)은 API Key 없이 바로 사용 가능하다.

### 번역 제공자 설정

고품질 번역이 필요하면 설정(⚙)에서 제공자를 변경한다:

| 제공자 | 설정 | 품질 | 비용 |
|---|---|---|---|
| **MyMemory** (기본) | 없음 | 보통 | 무료 (5,000자/일) |
| **OpenAI GPT** | API Key 입력 | 최상 | ~$0.05/시간 |
| **Anthropic Claude** | API Key 입력 | 최상 | ~$0.05/시간 |
| **Google Apps Script** | GAS 배포 + URL 입력 | 우수 | 무료 (5,000건/일) |

> LLM 제공자(OpenAI/Anthropic)를 설정하면 회의록 요약 기능이 활성화된다.

### Google Apps Script 배포

1. [script.google.com](https://script.google.com)에서 새 프로젝트 생성
2. `gas-proxy.js` 내용 붙여넣기
3. 배포 → 웹 앱 → "누구나 액세스 가능"으로 배포
4. 설정에서 Web App URL 입력

## 브라우저 호환성

| 브라우저 | 지원 |
|---|---|
| Chrome | ✅ 완전 지원 |
| Edge | ✅ 완전 지원 |
| Safari | ⚠️ 부분 지원 (WebKit SpeechRecognition) |
| Firefox | ❌ 미지원 (Web Speech API 없음) |

## 문서 구조

이 프로젝트는 문서 기반 개발 워크플로우를 따른다. 새 기능 구현 시 아래 문서들을 순서대로 작성하여 LLM 기반 구현/검증에 활용한다.

```
docs/
├── RULES.md              ← 문서 작성 규칙 (시작점)
├── templates/             ← 빈 템플릿
├── v1/                    ← 최초 릴리즈 문서 (예시)
└── features/              ← 기능별 문서
```

자세한 내용은 [docs/RULES.md](docs/RULES.md) 참조.

## 라이선스

MIT
