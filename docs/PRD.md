# Real-Time Meeting Translator - PRD

## 1. 개요

### 1.1 제품 요약
서버 없이 브라우저에서 동작하는 실시간 회의 번역 웹 앱. 회의 참가자의 음성을 실시간으로 텍스트로 변환하고, 선택한 언어로 번역하여 표시한다. 회의록은 URL 해시에 압축 저장하여 링크만으로 공유 가능하다.

### 1.2 핵심 가치
- **제로 인프라**: 서버, DB, 호스팅 없이 HTML 파일 하나로 동작
- **실시간 번역**: 음성 → 텍스트 → 번역이 실시간으로 표시
- **즉시 공유**: URL 복사만으로 회의록 + 노트 + 요약 공유
- **다국어 지원**: 영어, 일본어, 한국어 간 양방향 번역

### 1.3 대상 사용자
- 다국어 회의를 진행하는 팀
- 해외 파트너와 소통하는 비즈니스 사용자
- 외국어 강의/세미나 참석자

## 2. 기능 요구사항

### 2.1 음성 인식 (Speech-to-Text)
| 항목 | 요구사항 |
|---|---|
| 지원 언어 | 영어(en-US), 일본어(ja-JP), 한국어(ko-KR) |
| 인식 방식 | Web Speech API (SpeechRecognition) |
| 실시간 표시 | interim(중간) 결과는 회색으로, final(확정) 결과는 정상 표시 |
| 연속 인식 | 자동 재시작으로 끊김 없이 인식 지속 |
| 녹음 컨트롤 | 시작/정지 버튼 |

### 2.2 번역 엔진
3단계 번역 제공자를 지원한다:

| 제공자 | 설정 필요 | 품질 | 비용 | 비고 |
|---|---|---|---|---|
| **MyMemory** (기본) | 없음 | 보통 | 무료 (5,000자/일) | 제로 설정으로 즉시 사용 |
| **LLM API** (추천) | API Key 입력 | 최상 | 저렴 (~$0.05/시간) | OpenAI GPT, Anthropic Claude 지원 |
| **Google Apps Script** (옵션) | GAS 배포 | 우수 | 무료 (5,000건/일) | Google 번역 엔진 활용 |

- 복수 타겟 언어로 병렬 번역
- 번역 실패 시 에러 메시지 표시 + 재시도

### 2.3 트랜스크립트 표시
- 각 항목: 타임스탬프 + 원문(언어 태그) + 번역문(언어별)
- 자동 스크롤 (최신 항목으로)
- 중간 인식 결과는 하단에 회색으로 표시

### 2.4 노트 영역
- 사용자가 자유롭게 메모를 작성하는 텍스트 영역
- 접기/펼치기 토글
- URL 해시에 포함되어 공유 시 함께 전달
- 읽기 전용 모드에서는 편집 불가

### 2.5 회의록 요약 (LLM 연동 시)
- LLM 번역 제공자 사용 시에만 활성화
- 트랜스크립트 기반 자동 요약: 주요 안건 / 결정 사항 / Action Items
- 자동 갱신 (10개 항목 누적 시) + 수동 갱신 버튼
- 접기/펼치기 토글
- MyMemory/GAS 사용 시 비활성 + "LLM 연동 필요" 안내

### 2.6 데이터 저장 및 공유
- **URL 해시 저장**: 모든 공유 대상 데이터(트랜스크립트, 노트, 요약, 언어 설정)는 URL `#` 이후에 LZ-string 압축하여 저장
- **localStorage**: API Key, 번역 제공자 선택, 테마 등 비공유 설정만 저장
- **공유**: URL 복사 버튼 (Clipboard API)
- **다운로드**: JSON 파일로 전체 회의록 + 노트 + 요약 다운로드
- **읽기 전용 모드**: 해시 데이터가 있는 URL을 열면 읽기 전용으로 표시

### 2.7 설정
- 번역 제공자 선택 (MyMemory / LLM / GAS)
- API Key 입력 (OpenAI / Anthropic)
- GAS Web App URL 입력
- 다크 모드 토글
- 설정은 localStorage에 저장

## 3. 비기능 요구사항

### 3.1 브라우저 호환성
- **필수**: Chrome, Edge (Web Speech API 완전 지원)
- **부분 지원**: Safari (WebKit SpeechRecognition, 제한적)
- **미지원**: Firefox (Web Speech API 미지원 → 안내 메시지 표시)

### 3.2 반응형 디자인
- 모바일 우선(Mobile-First) 설계
- 터치 친화적 버튼 (최소 44x44px)
- iOS 안전 영역 대응
- 본문 폰트 16px 이상 (iOS 자동 확대 방지)

### 3.3 성능
- 외부 의존성 최소화 (lz-string CDN 1개만)
- URL 해시 업데이트 디바운스 (2초)
- `history.replaceState` 사용 (브라우저 히스토리 오염 방지)

### 3.4 보안
- API Key는 localStorage에만 저장 (URL에 절대 포함 안 함)
- 공용 PC 사용 시 API Key 노출 주의 안내

## 4. 데이터 스키마

### 4.1 URL 해시 데이터 (공유 대상)
```json
{
  "v": 1,
  "sl": "en",
  "tl": ["ja", "ko"],
  "t": [
    {
      "ts": 1712500000,
      "s": "en",
      "o": "Hello everyone",
      "tr": {
        "ja": "皆さんこんにちは",
        "ko": "여러분 안녕하세요"
      }
    }
  ],
  "n": "사용자 메모 내용",
  "sum": "## 주요 안건\n- ..."
}
```

### 4.2 localStorage (비공유 설정)
| Key | 값 | 설명 |
|---|---|---|
| `rt_provider` | `mymemory` / `openai` / `anthropic` / `gas` | 번역 제공자 |
| `rt_openai_key` | `sk-...` | OpenAI API Key |
| `rt_anthropic_key` | `sk-ant-...` | Anthropic API Key |
| `rt_gas_url` | `https://script.google.com/...` | GAS Web App URL |
| `rt_theme` | `light` / `dark` / `system` | 테마 설정 |

## 5. 기술 스택
| 구분 | 기술 | 비고 |
|---|---|---|
| 음성 인식 | Web Speech API | 브라우저 내장 |
| 번역 | MyMemory API / LLM API / GAS | 클라이언트에서 직접 호출 |
| 압축 | lz-string 1.5.0 (CDN) | URL 해시 데이터 압축 |
| UI | Pure HTML + CSS + JS | 프레임워크 없음, 단일 파일 |

## 6. 제한사항
- Web Speech API는 Chrome/Edge에서만 완전 지원
- MyMemory 무료 한도: 익명 5,000자/일, 이메일 등록 50,000자/일
- URL 공유 시 메신저 앱에서 긴 URL이 잘릴 수 있음 (브라우저 직접 열면 OK)
- 음성 인식 + 번역 모두 인터넷 연결 필요
- API Key는 클라이언트에 저장되므로 공용 환경에서 주의 필요
