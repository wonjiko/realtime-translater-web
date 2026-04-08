# Real-Time Meeting Translator

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen?logo=github)](https://wonjiko.github.io/realtime-translater-web/)
[![View on GitHub](https://img.shields.io/badge/Source-GitHub-blue?logo=github)](https://github.com/wonjiko/realtime-translater-web)

서버 없이 브라우저에서 동작하는 실시간 회의 번역 웹 앱.

**[바로 사용하기](https://wonjiko.github.io/realtime-translater-web/)**

## 핵심 기능

- **실시간 음성 인식**: Web Speech API 기반, 영어/일본어/한국어 지원
- **실시간 중간 번역**: 발화 중에도 디바운스 방식으로 번역 미리보기 제공
- **다중 번역 엔진**: MyMemory (무료, 기본) / OpenAI GPT / Anthropic Claude / Google Apps Script
- **시스템 오디오 캡처**: Google Meet 등 화상회의에서 상대방 음성도 동시 인식 (OpenAI Whisper + Chrome 탭 공유)
- **URL 공유**: 회의록을 URL에 LZ-string 압축하여 링크만으로 공유
- **회의록 요약**: LLM 연동 시 주요 안건 / 결정 사항 / Action Items 자동 생성
- **제로 인프라**: HTML 파일 하나로 동작, 서버/DB 불필요

## 빠른 시작

1. [GitHub Pages](https://wonjiko.github.io/realtime-translater-web/)에서 바로 사용하거나, `index.html`을 Chrome/Edge에서 열기
2. Voice 언어 선택 후 `REC` 버튼 클릭
3. 마이크 권한 허용 → 음성 인식 시작

기본 번역 엔진(MyMemory)은 API Key 없이 바로 사용 가능.

### 시스템 오디오 캡처 (Google Meet 등 화상회의)

1. Settings에서 OpenAI API Key 입력 (Whisper 음성 인식에 필요)
2. "🎤 시스템 오디오" 버튼 클릭 → 초록색으로 활성화
3. REC 클릭 → Chrome 화면 공유 다이얼로그에서 **"Chrome 탭"** 선택
4. Google Meet 탭 선택 + **"탭 오디오 공유" 체크** → 공유 클릭
5. 내 마이크 + 상대방 음성이 믹싱되어 실시간 인식/번역

> 시스템 오디오 모드는 항상 Whisper(자동 언어감지) 모드로 동작하므로 OpenAI API Key가 반드시 필요하다.

### 번역 제공자 설정

| 제공자 | 설정 | 품질 | 비용 |
|---|---|---|---|
| **MyMemory** (기본) | 없음 | 보통 | 무료 (5,000자/일) |
| **OpenAI GPT** | API Key 입력 | 최상 | ~$0.05/시간 |
| **Anthropic Claude** | API Key 입력 | 최상 | ~$0.05/시간 |
| **Google Apps Script** | GAS 배포 + URL 입력 | 우수 | 무료 (5,000건/일) |

> LLM 제공자(OpenAI/Anthropic)를 설정하면 회의록 요약 기능이 활성화된다.

## 브라우저 호환성

| 브라우저 | 지원 |
|---|---|
| Chrome | 완전 지원 |
| Edge | 완전 지원 |
| Safari | 부분 지원 (WebKit SpeechRecognition) |
| Firefox | 미지원 (Web Speech API 없음) |

