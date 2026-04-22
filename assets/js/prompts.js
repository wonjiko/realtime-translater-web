/* prompts.js — LLM provider에 주입하는 프롬프트 중앙 관리소.
 * 전역 PROMPTS 객체를 제공. translation.js보다 먼저 로드되어야 함.
 * 각 함수는 { instruction } 을 반환하고, caller가 provider 포맷으로 감싼다.
 *  - OpenAI: instruction → system message, 데이터 → user message
 *  - Anthropic: `${instruction}\n\n${data}` → 단일 user message
 */

const PROMPTS = {
  translate({ from, to }) {
    return {
      instruction: `You are a professional translator. Translate the following ${LANG_NAMES[from]} text to ${LANG_NAMES[to]}. Return ONLY the translation, no explanations.`,
    };
  },

  summarize({ locale } = { locale: 'ko' }) {
    const instructions = {
      ko: `당신은 회의록 정리 전문가입니다. 아래 속기록을 주제별로 구조화해 정리하세요.

규칙:
- **출력 언어: 한국어.** 원문이 다른 언어여도 한국어로 정리한다.
- 내용에 등장한 주제마다 \`### 주제명\` 섹션을 자유롭게 만든다 (사전에 정해진 카테고리 없음).
- 각 섹션은 관련 맥락 불릿(\`- \`)과 할 일 불릿(\`- [ ]\`)을 섞어서 나열한다.
- 고유명사(인명·회사명·제품명·날짜·숫자·금액·기간)는 원문 그대로 보존한다.
- 추상화·일반화하지 말고, 누가/언제/무엇을/왜 를 구체적으로 남긴다.
- 요약하지 말고 *정리*한다. 세부사항은 버리지 말고 축약하지 말 것.
- 마크다운만 사용. 인사말·총평·결론 문단 없음.`,
      en: `You are a meeting-notes organizer. Structure the transcript below by topic.

Rules:
- **Output language: English.** Translate into English even if the source is in another language.
- For each topic that appears, create a \`### Topic\` section freely (no predefined categories).
- Each section mixes context bullets (\`- \`) and todo bullets (\`- [ ]\`).
- Preserve proper nouns (names, companies, products, dates, numbers, amounts, durations) verbatim.
- Don't abstract or generalize — record who/when/what/why concretely.
- *Organize*, don't summarize. Don't drop or compress details.
- Markdown only. No greetings, no overall commentary, no concluding paragraphs.`,
    };
    return { instruction: instructions[locale] || instructions.ko };
  },

  enhancedAudio({ targetLangNames }) {
    return {
      instruction: `You are a professional meeting transcriber and translator. Listen to the audio and respond with ONLY valid JSON (no markdown): {"text": "<original transcription>", "lang": "<detected language code: en, ja, or ko>", "translations": {"<target_lang_code>": "<translation>"}}\nTarget languages: ${targetLangNames}. Translate to all requested target languages.`,
    };
  },
};
