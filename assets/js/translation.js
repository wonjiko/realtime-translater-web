/* translation.js — 번역 엔진/음성인식/Whisper/URL직렬화/UI렌더링/요약/공유 (섹션 7a, 7, 8, 8b, 9, 10, 11, 15) */
// ============================================================
// 7a. Fetch with Timeout
// ============================================================
async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
    throw e;
  } finally {
    clearTimeout(id);
  }
}

// ============================================================
// 7. Translation Engine (Adapter Pattern)
// ============================================================
const translators = {
  mymemory: {
    async translate(text, from, to) {
      const truncated = text.length > 500;
      const params = new URLSearchParams({
        q: text.substring(0, 500),
        langpair: `${from}|${to}`,
      });
      const settings = getSettings();
      if (settings.mymemoryEmail) params.set('de', settings.mymemoryEmail);
      const res = await fetchWithTimeout(`https://api.mymemory.translated.net/get?${params}`);
      if (!res.ok) {
        if (res.status === 429) throw new Error(t('mymemoryLimit'));
        throw new Error(`MyMemory API error: ${res.status}`);
      }
      const data = await res.json();
      if (data.responseStatus !== 200) throw new Error(data.responseDetails || 'Translation failed');
      let result = data.responseData.translatedText;
      if (truncated) {
        result += ' [truncated]';
        showToast(t('textTruncated'), 'info');
      }
      return result;
    },
    supportsLLMFeatures: false,
  },

  openai: {
    async translate(text, from, to) {
      const settings = getSettings();
      if (!settings.openaiKey) throw new Error('OpenAI API key not configured');
      const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'system',
            content: `You are a professional translator. Translate the following ${LANG_NAMES[from]} text to ${LANG_NAMES[to]}. Return ONLY the translation, no explanations.`
          }, {
            role: 'user',
            content: text
          }],
          temperature: 0.1,
          max_tokens: 1000,
        }),
      }, 15000);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `OpenAI API error: ${res.status}`);
      }
      const data = await res.json();
      return data.choices[0].message.content.trim();
    },
    supportsLLMFeatures: true,

    async summarize(transcript) {
      const settings = getSettings();
      if (!settings.openaiKey) throw new Error('OpenAI API key not configured');
      const text = transcript.map(e =>
        `[${LANG_NAMES[e.s]}] ${e.o}`
      ).join('\n');
      const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'system',
            content: `You are a meeting assistant. Summarize the following meeting transcript.
Format your response in ${currentLocale === 'ko' ? 'Korean' : 'English'} with these sections:
## Key Topics
## Decisions
## Action Items

Keep it concise. Use bullet points.`
          }, {
            role: 'user',
            content: text
          }],
          temperature: 0.2,
          max_tokens: 2000,
        }),
      }, 30000);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `OpenAI API error: ${res.status}`);
      }
      const data = await res.json();
      return data.choices[0].message.content.trim();
    },
  },

  anthropic: {
    async translate(text, from, to) {
      const settings = getSettings();
      if (!settings.anthropicKey) throw new Error('Anthropic API key not configured');
      const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.anthropicKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Translate the following ${LANG_NAMES[from]} text to ${LANG_NAMES[to]}. Return ONLY the translation, no explanations.\n\n${text}`
          }],
        }),
      }, 15000);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Anthropic API error: ${res.status}`);
      }
      const data = await res.json();
      return data.content[0].text.trim();
    },
    supportsLLMFeatures: true,

    async summarize(transcript) {
      const settings = getSettings();
      if (!settings.anthropicKey) throw new Error('Anthropic API key not configured');
      const text = transcript.map(e =>
        `[${LANG_NAMES[e.s]}] ${e.o}`
      ).join('\n');
      const res = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.anthropicKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: `Summarize the following meeting transcript. Format your response in ${currentLocale === 'ko' ? 'Korean' : 'English'} with these sections:
## Key Topics
## Decisions
## Action Items

Keep it concise. Use bullet points.

Transcript:
${text}`
          }],
        }),
      }, 30000);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Anthropic API error: ${res.status}`);
      }
      const data = await res.json();
      return data.content[0].text.trim();
    },
  },

  gas: {
    async translate(text, from, to) {
      const settings = getSettings();
      if (!settings.gasUrl) throw new Error('GAS Web App URL not configured');
      const res = await fetchWithTimeout(settings.gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ text, from, to }),
      }, 15000);
      if (!res.ok) throw new Error(`GAS error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.translation;
    },
    supportsLLMFeatures: false,
  },
};

function getTranslator() {
  const settings = getSettings();
  return translators[settings.provider] || translators.mymemory;
}

async function translateWithRetry(translator, text, from, to, maxRetries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await translator.translate(text, from, to);
    } catch (e) {
      lastError = e;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}

async function translateEntry(entry) {
  const translator = getTranslator();
  const targets = state.targetLangs.filter(l => l !== entry.s);
  if (targets.length === 0) return;

  const promises = targets.map(async (targetLang) => {
    try {
      entry.tr[targetLang] = await translateWithRetry(translator, entry.o, entry.s, targetLang);
    } catch (e) {
      console.error(`Translation error (${entry.s}->${targetLang}):`, e);
      entry.tr[targetLang] = `[${t('translationError')}]`;
      showToast(`${t('translationFailed')}: ${e.message}`, 'error');
    }
  });
  await Promise.all(promises);
}

// ============================================================
// 8. Speech Recognition
// ============================================================
let recognition = null;
let interimTranslateTimer = null;
let interimEntry = null;
let interimTranslateAbort = false;
let recognitionRestarting = false;
let restartAttempts = 0;

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    dom.browserWarning.classList.add('visible');
    dom.btnRec.disabled = true;
    return false;
  }

  // Destroy previous instance to prevent duplicate sessions on mobile
  if (recognition) {
    try { recognition.abort(); } catch(e) { /* ignore */ }
    recognition = null;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = state.sourceLang;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    restartAttempts = 0;
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        const text = result[0].transcript.trim();
        if (text) {
          // Cancel pending interim translation
          clearTimeout(interimTranslateTimer);
          interimTranslateAbort = true;
          removeInterimEntry();

          const entry = {
            ts: Math.floor(Date.now() / 1000),
            s: LANG_MAP[state.sourceLang].code,
            o: text,
            tr: {},
          };
          state.entries.push(entry);
          const idx = state.entries.length - 1;
          state.interimText = '';
          renderEntry(entry, idx);
          scheduleHashUpdate();
          translateEntry(entry).then(() => {
            updateEntryTranslations(idx, entry);
            scheduleHashUpdate();
            checkAutoSummary();
          });
        }
      } else {
        interim += result[0].transcript;
      }
    }
    if (interim) {
      state.interimText = interim;
      renderInterim(interim);
      scheduleInterimTranslation(interim);
    }
  };

  recognition.onerror = (event) => {
    if (event.error === 'no-speech') return;
    if (event.error === 'aborted') return;
    console.error('Speech recognition error:', event.error);
    showToast(`${t('micError')}: ${event.error}`, 'error');
  };

  recognition.onend = () => {
    recognitionRestarting = false;
    if (state.isRecording) {
      restartAttempts++;
      if (restartAttempts > 5) {
        showToast(t('speechStopped'), 'error');
        stopRecording();
        restartAttempts = 0;
        return;
      }
      recognitionRestarting = true;
      setTimeout(() => {
        if (!state.isRecording) {
          recognitionRestarting = false;
          return;
        }
        try {
          recognition.start();
        } catch(e) {
          recognitionRestarting = false;
          showToast(t('restartFailed'), 'error');
          stopRecording();
        }
      }, 300 * restartAttempts);
    } else {
      restartAttempts = 0;
    }
  };

  return true;
}

// ============================================================
// 8b. Whisper Auto-Detect Pipeline
// ============================================================
let whisperMediaRecorder = null;
let whisperStream = null;
let whisperChunkTimer = null;
let whisperAudioChunks = [];
let whisperMimeType = 'audio/webm';
let displayStream = null;
let audioContext = null;
let micStream = null;

// Audio level meters (mic + system separate)
let meterCtx = null;
let meterRafId = null;
let meterAnalysers = {}; // { mic, sys }
let meterOnlyStream = null; // stream created solely for meter (non-whisper mode)
let selectedDeviceId = localStorage.getItem('rt_mic_device') || '';

function startAudioMeters(micStreamRef, sysStreamRef) {
  meterCtx = new AudioContext();
  meterAnalysers = {};

  if (micStreamRef) {
    const a = meterCtx.createAnalyser();
    a.fftSize = 64;
    meterCtx.createMediaStreamSource(micStreamRef).connect(a);
    meterAnalysers.mic = a;
  }
  if (sysStreamRef) {
    const a = meterCtx.createAnalyser();
    a.fftSize = 64;
    meterCtx.createMediaStreamSource(sysStreamRef).connect(a);
    meterAnalysers.sys = a;
  }

  function drawBars(analyser, el, h) {
    const bars = el.querySelectorAll('span');
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const step = Math.max(1, Math.floor(data.length / bars.length));
    for (let i = 0; i < bars.length; i++) {
      const val = data[i * step] / 255;
      bars[i].style.height = Math.max(2, val * h) + 'px';
    }
  }

  function draw() {
    if (meterAnalysers.mic) drawBars(meterAnalysers.mic, $('#micMeter'), 16);
    if (meterAnalysers.sys) drawBars(meterAnalysers.sys, $('#sysMeter'), 16);
    // In-button meter: show sys if available (system audio mode), else mic
    const btnMeter = $('#audioMeter');
    const btnSource = meterAnalysers.sys || meterAnalysers.mic;
    if (btnMeter && btnSource) {
      const bars = btnMeter.querySelectorAll('span');
      const data = new Uint8Array(btnSource.frequencyBinCount);
      btnSource.getByteFrequencyData(data);
      const step = Math.max(1, Math.floor(data.length / bars.length));
      for (let i = 0; i < bars.length; i++) {
        const val = data[i * step] / 255;
        bars[i].style.height = Math.max(3, val * 20) + 'px';
      }
    }
    meterRafId = requestAnimationFrame(draw);
  }
  draw();
}

function stopAudioMeters() {
  if (meterRafId) { cancelAnimationFrame(meterRafId); meterRafId = null; }
  if (meterCtx) { meterCtx.close().catch(() => {}); meterCtx = null; }
  if (meterOnlyStream) { meterOnlyStream.getTracks().forEach(t => t.stop()); meterOnlyStream = null; }
  meterAnalysers = {};
  ['#micMeter', '#sysMeter'].forEach(sel => {
    const el = $(sel);
    if (el) el.querySelectorAll('span').forEach(b => b.style.height = '2px');
  });
  const btnMeter = $('#audioMeter');
  if (btnMeter) {
    btnMeter.classList.remove('active');
    btnMeter.querySelectorAll('span').forEach(b => b.style.height = '3px');
  }
}

function getMicConstraints() {
  if (selectedDeviceId) return { audio: { deviceId: { exact: selectedDeviceId } } };
  return { audio: true };
}

async function showDeviceDropdown() {
  const dropdown = $('#deviceDropdown');
  if (dropdown.classList.contains('open')) { dropdown.classList.remove('open'); return; }
  const devices = await navigator.mediaDevices.enumerateDevices();
  const audioInputs = devices.filter(d => d.kind === 'audioinput');
  dropdown.innerHTML = '';
  audioInputs.forEach(d => {
    const btn = document.createElement('button');
    btn.textContent = d.label || 'Microphone';
    if (d.deviceId === selectedDeviceId) btn.classList.add('selected');
    btn.addEventListener('click', () => {
      selectedDeviceId = d.deviceId;
      localStorage.setItem('rt_mic_device', d.deviceId);
      dropdown.classList.remove('open');
      const label = $('#micLabel');
      if (label) label.textContent = d.label || 'Microphone';
    });
    dropdown.appendChild(btn);
  });
  dropdown.classList.add('open');
}

function getSupportedMimeType() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

function getFileExtension(mimeType) {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
}

async function initSystemAudioMixing() {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    showToast(t('sysAudioNotSupported'), 'error');
    return null;
  }

  let displayStreamLocal;
  try {
    displayStreamLocal = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
  } catch (e) {
    showToast(t('displayShareCancelled'), 'info');
    return null;
  }

  // 비디오 트랙 즉시 중단 (오디오만 필요)
  displayStreamLocal.getVideoTracks().forEach(track => track.stop());

  if (displayStreamLocal.getAudioTracks().length === 0) {
    displayStreamLocal.getTracks().forEach(track => track.stop());
    showToast(t('noTabAudio'), 'error');
    return null;
  }

  let micStreamLocal;
  try {
    micStreamLocal = await navigator.mediaDevices.getUserMedia(getMicConstraints());
  } catch (e) {
    displayStreamLocal.getTracks().forEach(track => track.stop());
    showToast(`마이크 접근 실패: ${e.message}`, 'error');
    return null;
  }

  const ctx = new AudioContext();
  const dest = ctx.createMediaStreamDestination();
  ctx.createMediaStreamSource(micStreamLocal).connect(dest);
  ctx.createMediaStreamSource(displayStreamLocal).connect(dest);

  displayStream = displayStreamLocal;
  micStream = micStreamLocal;
  audioContext = ctx;

  // 사용자가 브라우저 UI에서 탭 공유를 직접 중단한 경우 알림
  displayStreamLocal.getAudioTracks().forEach(track => {
    track.addEventListener('ended', () => {
      showToast(t('displayShareEnded'), 'info');
      if (displayStream) {
        displayStream.getTracks().forEach(t => t.stop());
        displayStream = null;
      }
    });
  });

  return dest.stream;
}

async function initWhisperRecording() {
  try {
    let streamToRecord;

    if (state.useSystemAudio) {
      streamToRecord = await initSystemAudioMixing();
      if (!streamToRecord) return false;
    } else {
      streamToRecord = await navigator.mediaDevices.getUserMedia(getMicConstraints());
    }

    whisperStream = streamToRecord;
    const mime = getSupportedMimeType();
    whisperMimeType = mime || 'audio/webm';
    whisperMediaRecorder = new MediaRecorder(whisperStream, {
      mimeType: mime || undefined,
    });
    whisperMediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) whisperAudioChunks.push(event.data);
    };
    return true;
  } catch (e) {
    console.error('Whisper mic access error:', e);
    showToast(`${t('micAccessFailed')}: ${e.message}`, 'error');
    return false;
  }
}

let silenceCheckInterval = null;

function startWhisperChunkCycle() {
  if (!whisperMediaRecorder) return;
  const settings = getSettings();
  if (settings.chunkMode === 'silence') {
    startWhisperSilenceChunkCycle(settings);
  } else {
    startWhisperTimeChunkCycle(settings);
  }
}

function setupWhisperOnStop(recordNextChunk) {
  whisperMediaRecorder.onstop = () => {
    if (whisperAudioChunks.length > 0) {
      const audioBlob = new Blob(whisperAudioChunks, { type: whisperMimeType });
      whisperAudioChunks = [];
      processWhisperChunk(audioBlob);
    }
    if (state.isRecording && state.useWhisper) {
      recordNextChunk();
    }
  };
}

function startWhisperTimeChunkCycle(settings) {
  function recordNextChunk() {
    whisperAudioChunks = [];
    try { whisperMediaRecorder.start(); } catch(e) { return; }
    updateWhisperStatus(t('listening'));
  }
  setupWhisperOnStop(recordNextChunk);
  recordNextChunk();
  whisperChunkTimer = setInterval(() => {
    if (whisperMediaRecorder && whisperMediaRecorder.state === 'recording') {
      whisperMediaRecorder.stop();
    }
  }, settings.chunkDuration || WHISPER_CHUNK_DURATION_MS);
}

function startWhisperSilenceChunkCycle(settings) {
  // Reuse meter analyser if available, otherwise fall back to time-based
  const analyser = meterAnalysers.mic || meterAnalysers.sys;
  if (!analyser) {
    startWhisperTimeChunkCycle(settings);
    return;
  }

  const threshold = settings.silenceThreshold || 30;
  const maxMs = settings.maxChunkDuration || 10000;
  const minChunkMs = 1500;
  const silenceMinMs = 800;
  let silenceDuration = 0;
  let chunkStartTime = 0;

  function recordNextChunk() {
    whisperAudioChunks = [];
    chunkStartTime = Date.now();
    silenceDuration = 0;
    try { whisperMediaRecorder.start(); } catch(e) { return; }
    updateWhisperStatus(t('listening'));
  }
  setupWhisperOnStop(recordNextChunk);
  recordNextChunk();

  const data = new Uint8Array(analyser.frequencyBinCount);
  silenceCheckInterval = setInterval(() => {
    if (!whisperMediaRecorder || whisperMediaRecorder.state !== 'recording') return;

    analyser.getByteFrequencyData(data);
    const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
    const elapsed = Date.now() - chunkStartTime;

    if (avg < threshold) {
      silenceDuration += 100;
    } else {
      silenceDuration = 0;
    }

    if ((silenceDuration >= silenceMinMs && elapsed >= minChunkMs) || elapsed >= maxMs) {
      whisperMediaRecorder.stop();
    }
  }, 100);
}

function stopWhisperChunkCycle() {
  clearInterval(whisperChunkTimer);
  whisperChunkTimer = null;
  clearInterval(silenceCheckInterval);
  silenceCheckInterval = null;
  if (whisperMediaRecorder && whisperMediaRecorder.state === 'recording') {
    try { whisperMediaRecorder.stop(); } catch(e) { /* ignore */ }
  }
  if (whisperStream) {
    whisperStream.getTracks().forEach(t => t.stop());
    whisperStream = null;
  }
  if (displayStream) {
    displayStream.getTracks().forEach(t => t.stop());
    displayStream = null;
  }
  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
    micStream = null;
  }
  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
  whisperMediaRecorder = null;
  updateWhisperStatus('');
}

function setChunkSettingsLocked(locked) {
  const el = $('#fieldsChunkSettings');
  if (!el) return;
  el.style.opacity = locked ? '0.5' : '';
  el.style.pointerEvents = locked ? 'none' : '';
}

async function processWhisperChunk(audioBlob) {
  if (audioBlob.size < 1000) return;

  const settings = getSettings();
  if (!settings.openaiKey) return;

  if (settings.translationMode === 'enhanced' && settings.provider === 'openai') {
    try {
      await processWhisperChunkEnhanced(audioBlob, settings);
      return;
    } catch (e) {
      console.warn('Enhanced mode failed, falling back:', e);
      showToast(t('enhancedFallback'), 'info');
    }
  }
  await processWhisperChunkStandard(audioBlob, settings);
}

async function processWhisperChunkStandard(audioBlob, settings) {
  updateWhisperStatus(t('processing'));

  const ext = getFileExtension(audioBlob.type || 'audio/webm');
  const formData = new FormData();
  formData.append('file', audioBlob, `audio.${ext}`);
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');
  // Pass language hint when source is explicitly set (not auto-detect)
  if (state.sourceLang !== 'auto' && LANG_MAP[state.sourceLang]) {
    formData.append('language', LANG_MAP[state.sourceLang].code);
  }

  try {
    const res = await fetchWithTimeout('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${settings.openaiKey}` },
      body: formData,
    }, 15000);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Whisper API error: ${res.status}`);
    }

    const data = await res.json();
    handleWhisperResult(data);
  } catch (e) {
    console.error('Whisper API error:', e);
    showToast(`Whisper: ${e.message}`, 'error');
  } finally {
    if (state.isRecording && state.useWhisper) {
      updateWhisperStatus(t('listening'));
    }
  }
}

function getAudioFormat(mimeType) {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mp3') || mimeType.includes('mpeg')) return 'mp3';
  return 'webm';
}

async function convertBlobToWav(blob) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  ctx.close();

  const numChannels = 1;
  const sampleRate = audioBuffer.sampleRate;
  const samples = audioBuffer.getChannelData(0);
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeStr(offset, str) { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); }
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return new Uint8Array(buffer);
}

async function processWhisperChunkEnhanced(audioBlob, settings) {
  updateWhisperStatus(t('processing'));

  const targets = state.targetLangs.map(l => LANG_NAMES[l] || l).join(', ');
  const wavBytes = await convertBlobToWav(audioBlob);
  let binary = '';
  for (let i = 0; i < wavBytes.length; i++) binary += String.fromCharCode(wavBytes[i]);
  const base64 = btoa(binary);
  const format = 'wav';

  const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.openaiKey}`,
    },
    body: JSON.stringify({
      model: settings.enhancedModel || 'gpt-4o-audio-preview',
      messages: [{
        role: 'system',
        content: `You are a professional meeting transcriber and translator. Listen to the audio and respond with ONLY valid JSON (no markdown): {"text": "<original transcription>", "lang": "<detected language code: en, ja, or ko>", "translations": {"<target_lang_code>": "<translation>"}}\nTarget languages: ${targets}. Translate to all requested target languages.`
      }, {
        role: 'user',
        content: [{
          type: 'input_audio',
          input_audio: { data: base64, format }
        }]
      }],
      temperature: 0.1,
      max_tokens: 1500,
    }),
  }, 30000);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Enhanced API error: ${res.status}`);
  }

  const data = await res.json();
  let content = data.choices[0].message.content.trim();
  // Strip markdown code fences if present
  if (content.startsWith('```')) {
    content = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  const result = JSON.parse(content);

  if (!result.text?.trim()) return;

  const detectedLang = WHISPER_LANG_TO_APP[result.lang?.toLowerCase()] || result.lang;

  // Skip if source language is explicitly set and detected language doesn't match
  if (state.sourceLang !== 'auto' && LANG_MAP[state.sourceLang] && detectedLang && detectedLang !== LANG_MAP[state.sourceLang].code) {
    return;
  }
  const entry = {
    ts: Math.floor(Date.now() / 1000),
    s: detectedLang || '??',
    o: result.text.trim(),
    tr: {},
  };

  // Map translations to lang codes
  if (result.translations) {
    for (const [key, val] of Object.entries(result.translations)) {
      const code = WHISPER_LANG_TO_APP[key.toLowerCase()] || key.toLowerCase();
      entry.tr[code] = val;
    }
  }

  state.entries.push(entry);
  const idx = state.entries.length - 1;
  state.interimText = '';
  removeInterim();
  renderEntry(entry, idx);
  updateEntryTranslations(idx, entry);
  scheduleHashUpdate();
  checkAutoSummary();

  if (state.isRecording && state.useWhisper) {
    updateWhisperStatus(t('listening'));
  }
}

function handleWhisperResult(data) {
  const text = data.text?.trim();
  if (!text) return;

  const detectedLang = WHISPER_LANG_TO_APP[data.language?.toLowerCase()];

  // Skip if source language is explicitly set and detected language doesn't match
  if (state.sourceLang !== 'auto' && LANG_MAP[state.sourceLang] && detectedLang && detectedLang !== LANG_MAP[state.sourceLang].code) {
    return;
  }

  const entry = {
    ts: Math.floor(Date.now() / 1000),
    s: detectedLang || data.language?.substring(0, 2) || '??',
    o: text,
    tr: {},
  };

  state.entries.push(entry);
  const idx = state.entries.length - 1;
  state.interimText = '';
  removeInterim();
  renderEntry(entry, idx);
  scheduleHashUpdate();

  if (!detectedLang) {
    showToast(`${t('unsupportedLang')}: ${data.language}`, 'info');
    return;
  }

  translateEntry(entry).then(() => {
    updateEntryTranslations(idx, entry);
    scheduleHashUpdate();
    checkAutoSummary();
  });
}

function updateWhisperStatus(text) {
  const el = $('#whisperStatus');
  if (!el) return;
  el.textContent = text;
  el.style.display = text ? '' : 'none';
}

function updateSysAudioToggle() {
  if (!dom.btnSysAudio) return;
  dom.btnSysAudio.classList.toggle('active', state.useSystemAudio);
}

// 녹음 전 정합성 검사 — 문제가 있으면 toast 표시 후 false 반환
function validateBeforeRecording() {
  const settings = getSettings();

  // 시스템 오디오 → OpenAI 키 필수 (Whisper 사용)
  if (state.useSystemAudio && !settings.openaiKey) {
    showToast(t('sysAudioRequiresKey'), 'error');
    return false;
  }

  // 자동 언어감지 → OpenAI 키 필수 (Whisper 사용)
  if (state.sourceLang === 'auto' && !settings.openaiKey) {
    showToast('자동 언어 감지는 OpenAI API 키가 필요합니다. Settings에서 키를 설정하세요.', 'error');
    return false;
  }

  // 번역 제공자별 자격증명 확인
  if (settings.provider === 'openai' && !settings.openaiKey) {
    showToast('OpenAI 번역을 사용하려면 API 키가 필요합니다. Settings에서 키를 설정하세요.', 'error');
    return false;
  }
  if (settings.provider === 'anthropic' && !settings.anthropicKey) {
    showToast('Anthropic 번역을 사용하려면 API 키가 필요합니다. Settings에서 키를 설정하세요.', 'error');
    return false;
  }
  if (settings.provider === 'gas' && !settings.gasUrl) {
    showToast('Google Apps Script 번역을 사용하려면 GAS URL이 필요합니다. Settings에서 설정하세요.', 'error');
    return false;
  }

  return true;
}

async function startRecording() {
  if (!navigator.onLine) {
    showToast(t('cannotRecordOffline'), 'error');
    return;
  }

  if (!validateBeforeRecording()) return;

  state.recordingSurface = 'translate'; // translate 탭 전용
  state.useWhisper = (state.sourceLang === 'auto') || state.useSystemAudio;

  let micStreamRef = null;
  let sysStreamRef = null;

  if (state.useWhisper) {
    const ok = await initWhisperRecording();
    if (!ok) return;
    state.isRecording = true;
    sysStreamRef = displayStream || null;
    // Get a separate mic stream for the meter to avoid AudioContext conflicts
    if (micStream) {
      try {
        micStreamRef = await navigator.mediaDevices.getUserMedia(getMicConstraints());
        meterOnlyStream = micStreamRef;
      } catch(e) { micStreamRef = null; }
    } else {
      micStreamRef = whisperStream;
    }
    startWhisperChunkCycle();
  } else {
    // Always create a fresh recognition instance to avoid stale sessions on mobile
    if (!initSpeechRecognition()) return;
    recognition.lang = state.sourceLang;
    restartAttempts = 0;
    recognitionRestarting = false;
    state.isRecording = true;
    try {
      micStreamRef = await navigator.mediaDevices.getUserMedia(getMicConstraints());
      meterOnlyStream = micStreamRef;
    } catch(e) { /* meter is optional */ }
    try {
      recognition.start();
    } catch(e) {
      // Already started — abort and retry once
      try { recognition.abort(); } catch(e2) { /* ignore */ }
      setTimeout(() => {
        if (!state.isRecording) return;
        try { recognition.start(); } catch(e3) {
          showToast(t('restartFailed'), 'error');
          stopRecording();
        }
      }, 200);
    }
  }

  setChunkSettingsLocked(true);
  dom.btnRec.classList.add('recording');
  dom.btnRec.innerHTML = `&#9632; <span data-i18n="stop">${t('stop')}</span><span class="audio-meter" id="audioMeter"><span></span><span></span><span></span><span></span><span></span></span>`;

  // Start separate meters
  startAudioMeters(micStreamRef, sysStreamRef);
  const btnMeter = $('#audioMeter');
  if (btnMeter && micStreamRef) btnMeter.classList.add('active');

  // Show mic info panel
  const micInfo = $('#micInfo');
  if (micInfo && micStreamRef) {
    const track = micStreamRef.getAudioTracks()[0];
    const label = $('#micLabel');
    if (track && label) label.textContent = track.label || 'Microphone';
    micInfo.classList.add('active');
  }
  dom.emptyState.style.display = 'none';
}

function stopRecording() {
  state.isRecording = false;
  recognitionRestarting = false;
  setChunkSettingsLocked(false);
  stopAudioMeters();
  const micInfo = $('#micInfo');
  if (micInfo) micInfo.classList.remove('active');
  const dropdown = $('#deviceDropdown');
  if (dropdown) dropdown.classList.remove('open');

  if (state.useWhisper) {
    stopWhisperChunkCycle();
  } else {
    if (recognition) {
      try { recognition.abort(); } catch(e) { /* ignore */ }
    }
  }

  dom.btnRec.classList.remove('recording');
  dom.btnRec.innerHTML = `&#9679; <span data-i18n="rec">${t('rec')}</span><span class="audio-meter" id="audioMeter"><span></span><span></span><span></span><span></span><span></span></span>`;
  state.interimText = '';
  clearTimeout(interimTranslateTimer);
  interimTranslateAbort = true;
  removeInterimEntry();
  removeInterim();
  updateRecordingBadges();
}

// ============================================================
// 9. URL Hash Serialization
// ============================================================
let hashUpdateTimer = null;

function serializeState() {
  const data = {
    v: 1,
    sl: state.sourceLang === 'auto' ? 'auto' : LANG_MAP[state.sourceLang].code,
    tl: state.targetLangs,
    t: state.entries,
  };
  if (state.note) data.n = state.note;
  if (state.summary) data.sum = state.summary;
  // Meeting date: use first entry's timestamp or current time
  if (state.entries.length > 0) {
    data.d = state.entries[0].ts;
  }
  return data;
}

function scheduleHashUpdate() {
  // 번역 탭 전용 — 다른 탭이거나 읽기 전용 모드에서는 해시 write 중단
  if (state.activeTab !== 'translate' || state.isReadOnly) return;
  clearTimeout(hashUpdateTimer);
  hashUpdateTimer = setTimeout(() => {
    const json = JSON.stringify(serializeState());
    const compressed = LZString.compressToEncodedURIComponent(json);
    history.replaceState(null, '', '#' + compressed);
    // Backup to localStorage
    try { localStorage.setItem('rt_session_backup', json); } catch(e) { /* quota exceeded */ }
  }, HASH_UPDATE_DEBOUNCE);
}

function loadFromHash() {
  const hash = location.hash.slice(1);
  if (!hash) return false;

  try {
    const json = LZString.decompressFromEncodedURIComponent(hash);
    if (!json) return false;
    const data = JSON.parse(json);
    if (data.v !== 1) return false;

    // Restore source lang
    if (data.sl === 'auto') {
      state.sourceLang = 'auto';
    } else {
      const slEntry = Object.entries(LANG_MAP).find(([, v]) => v.code === data.sl);
      if (slEntry) state.sourceLang = slEntry[0];
    }

    state.targetLangs = data.tl || ['ja', 'ko'];
    state.entries = data.t || [];
    state.note = data.n || '';
    state.summary = data.sum || '';
    state.meetingDate = data.d || null;
    // 해시 데이터 있으면 번역 탭 강제
    state.activeTab = 'translate';

    return true;
  } catch (e) {
    console.error('Failed to load hash data:', e);
    showToast(t('hashLoadFailed'), 'error');
    return false;
  }
}

// ============================================================
// 10. UI Rendering
// ============================================================
function formatTime(ts) {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderEntry(entry, index) {
  dom.emptyState.style.display = 'none';
  removeInterim();

  const div = document.createElement('div');
  div.className = 'entry';
  div.id = `entry-${index}`;

  const translationsHtml = Object.entries(entry.tr)
    .map(([lang, text]) =>
      `<div class="translation-line">
        <span class="lang-tag ${lang}">${lang.toUpperCase()}</span>
        <span>${escapeHtml(text)}</span>
      </div>`
    ).join('');

  div.innerHTML = `
    <div class="entry-header">
      <span class="entry-time">${formatTime(entry.ts)}</span>
      <span class="lang-tag ${entry.s}">${entry.s.toUpperCase()}</span>
    </div>
    <div class="entry-original">${escapeHtml(entry.o)}</div>
    <div class="entry-translations" id="translations-${index}">${translationsHtml || `<span style="color:var(--text-tertiary)">${t('translating')}</span>`}</div>
  `;

  dom.transcriptArea.appendChild(div);
  dom.transcriptArea.scrollTop = dom.transcriptArea.scrollHeight;
}

function updateEntryTranslations(index, entry) {
  const container = $(`#translations-${index}`);
  if (!container) return;

  container.innerHTML = Object.entries(entry.tr)
    .map(([lang, text]) =>
      `<div class="translation-line">
        <span class="lang-tag ${lang}">${lang.toUpperCase()}</span>
        <span>${escapeHtml(text)}</span>
      </div>`
    ).join('');
}

function renderInterim(text) {
  removeInterim();
  const div = document.createElement('div');
  div.className = 'interim-text';
  div.id = 'interimText';
  div.textContent = text;
  dom.transcriptArea.appendChild(div);
  dom.transcriptArea.scrollTop = dom.transcriptArea.scrollHeight;
}

function removeInterim() {
  const el = $('#interimText');
  if (el) el.remove();
}

function scheduleInterimTranslation(text) {
  clearTimeout(interimTranslateTimer);
  interimTranslateTimer = setTimeout(() => {
    const trimmed = text.trim();
    if (!trimmed) return;

    interimTranslateAbort = false;
    interimEntry = {
      ts: Math.floor(Date.now() / 1000),
      s: LANG_MAP[state.sourceLang].code,
      o: trimmed,
      tr: {},
    };
    renderInterimEntry(interimEntry);
    const capturedEntry = interimEntry;
    translateEntry(capturedEntry).then(() => {
      if (interimTranslateAbort || interimEntry !== capturedEntry) return;
      updateInterimEntryTranslations(capturedEntry);
    });
  }, 1000);
}

function renderInterimEntry(entry) {
  removeInterimEntry();
  const div = document.createElement('div');
  div.className = 'entry interim-entry';
  div.id = 'interimEntry';

  const langCode = entry.s;
  div.innerHTML = `
    <div class="entry-header">
      <span class="entry-time">${formatTime(entry.ts)}</span>
      <span class="lang-tag ${langCode}">${langCode.toUpperCase()}</span>
    </div>
    <div class="entry-original">${escapeHtml(entry.o)}</div>
    <div class="entry-translations" id="translations-interim"><span style="color:var(--text-tertiary)">${t('translating')}</span></div>
  `;

  // Insert before the interim text element
  const interimText = $('#interimText');
  if (interimText) {
    dom.transcriptArea.insertBefore(div, interimText);
  } else {
    dom.transcriptArea.appendChild(div);
  }
  dom.transcriptArea.scrollTop = dom.transcriptArea.scrollHeight;
}

function updateInterimEntryTranslations(entry) {
  const container = $('#translations-interim');
  if (!container) return;
  container.innerHTML = Object.entries(entry.tr)
    .map(([lang, text]) =>
      `<div class="translation-line">
        <span class="lang-tag ${lang}">${lang.toUpperCase()}</span>
        <span>${escapeHtml(text)}</span>
      </div>`
    ).join('');
}

function removeInterimEntry() {
  const el = $('#interimEntry');
  if (el) el.remove();
  interimEntry = null;
}

function renderAllEntries() {
  dom.transcriptArea.innerHTML = '';
  if (state.entries.length === 0) {
    dom.transcriptArea.appendChild(dom.emptyState);
    dom.emptyState.style.display = '';
    return;
  }
  dom.emptyState.style.display = 'none';
  state.entries.forEach((entry, i) => renderEntry(entry, i));
}

function renderNote() {
  if (dom.noteTextarea) dom.noteTextarea.value = state.note;
}

function renderSummary() {
  const settings = getSettings();
  const translator = getTranslator();

  if (!translator.supportsLLMFeatures) {
    dom.summaryDisabled.style.display = '';
    dom.summaryContent.querySelector('.summary-text')?.remove();
    dom.btnRefreshSummary.style.display = 'none';
    return;
  }

  dom.summaryDisabled.style.display = 'none';
  dom.btnRefreshSummary.style.display = '';

  let textEl = dom.summaryContent.querySelector('.summary-text');
  if (!textEl) {
    textEl = document.createElement('div');
    textEl.className = 'summary-text';
    dom.summaryContent.appendChild(textEl);
  }

  if (state.summary) {
    textEl.innerHTML = markdownToHtml(state.summary);
  } else {
    textEl.innerHTML = `<span style="color:var(--text-tertiary)">${t('startRecordingForSummary')}</span>`;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function markdownToHtml(md) {
  const safe = escapeHtml(md);
  const lines = safe.split('\n');
  let html = '';
  let inList = false;
  for (const line of lines) {
    const headingMatch = line.match(/^#{2,3}\s+(.+)$/);
    const listMatch = line.match(/^-\s+(.+)$/);
    if (headingMatch) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h3>${headingMatch[1]}</h3>`;
    } else if (listMatch) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${listMatch[1]}</li>`;
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      if (line.trim()) html += line + '<br>';
    }
  }
  if (inList) html += '</ul>';
  return html;
}

function setReadOnlyMode(readOnly) {
  state.isReadOnly = readOnly;
  dom.readonlyBanner.classList.toggle('visible', readOnly);
  dom.langBar.style.display = readOnly ? 'none' : '';
  dom.btnSettings.style.display = readOnly ? 'none' : '';
  // In read-only mode, hide rec/share but keep download/open visible
  dom.btnRec.style.display = readOnly ? 'none' : '';
  dom.btnSysAudio.style.display = readOnly ? 'none' : '';
  dom.btnShare.style.display = readOnly ? 'none' : '';
  if (dom.noteTextarea) {
    dom.noteTextarea.readOnly = readOnly;
    if (readOnly) {
      dom.noteTextarea.placeholder = '';
    } else {
      dom.noteTextarea.placeholder = t('notePlaceholder');
    }
  }
  // Show meeting date in readonly banner if available
  if (readOnly) {
    const dateEl = $('#meetingDate');
    if (dateEl && state.meetingDate) {
      const d = new Date(state.meetingDate * 1000);
      dateEl.textContent = '(' + d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) + ')';
    }
  }
  // Tab bar disabled in readonly mode
  $$('#tabBar .tab-btn').forEach(btn => { btn.disabled = readOnly; });
  if (readOnly) {
    switchTab('translate');
  }
}

// ============================================================
// 11. Summary (LLM)
// ============================================================
let summaryLoading = false;

async function refreshSummary() {
  const translator = getTranslator();
  if (!translator.supportsLLMFeatures || !translator.summarize) {
    showToast(t('summaryRequiresLLM'), 'error');
    return;
  }
  if (state.entries.length === 0) {
    showToast(t('noTranscript'), 'error');
    return;
  }
  if (summaryLoading) return;

  summaryLoading = true;
  dom.btnRefreshSummary.classList.add('loading');
  dom.btnRefreshSummary.textContent = `⏳ ${t('loading')}`;

  try {
    state.summary = await translator.summarize(state.entries);
    state.summaryEntryCount = state.entries.length;
    renderSummary();
    scheduleHashUpdate();
    showToast(t('summaryUpdated'), 'success');
  } catch (e) {
    console.error('Summary error:', e);
    showToast(`${t('summaryFailed')}: ${e.message}`, 'error');
  } finally {
    summaryLoading = false;
    dom.btnRefreshSummary.classList.remove('loading');
    dom.btnRefreshSummary.innerHTML = `&#8635; ${t('refresh')}`;
  }
}

function checkAutoSummary() {
  const translator = getTranslator();
  if (!translator.supportsLLMFeatures) return;
  const newEntries = state.entries.length - state.summaryEntryCount;
  if (newEntries >= SUMMARY_ENTRY_THRESHOLD) {
    refreshSummary();
  }
}

// ============================================================
// 15. Share & Download
// ============================================================
async function shareUrl() {
  if (state.entries.length === 0) {
    showToast(t('noTranscriptToShare'), 'error');
    return;
  }
  const json = JSON.stringify(serializeState());
  const compressed = LZString.compressToEncodedURIComponent(json);
  const base = location.origin === 'null'
    ? location.href.split('#')[0]
    : location.origin + location.pathname;
  const url = base + '#' + compressed;

  if (url.length > 8000) {
    showToast(t('urlTooLong'), 'error');
  }

  try {
    await navigator.clipboard.writeText(url);
    showToast(t('urlCopied'), 'success');
  } catch (e) {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = url;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    showToast(t('urlCopied'), 'success');
  }
}

function downloadJson() {
  if (state.entries.length === 0) {
    showToast(t('noTranscriptToDownload'), 'error');
    return;
  }
  const data = serializeState();
  data.exportedAt = new Date().toISOString();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meeting-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(t('downloaded'), 'success');
}

function openJsonFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.v !== 1 || !Array.isArray(data.t)) {
        showToast(t('invalidJsonFile'), 'error');
        return;
      }

      // Stop recording if active
      if (state.isRecording) stopRecording();

      // Restore source lang
      if (data.sl === 'auto') {
        state.sourceLang = 'auto';
      } else {
        const slEntry = Object.entries(LANG_MAP).find(([, v]) => v.code === data.sl);
        if (slEntry) state.sourceLang = slEntry[0];
      }

      state.targetLangs = data.tl || ['en', 'ja'];
      state.entries = data.t || [];
      state.note = data.n || '';
      state.summary = data.sum || '';
      state.meetingDate = data.d || null;

      setReadOnlyMode(true);
      renderAllEntries();
      renderNote();
      renderSummary();

      // Sync UI
      dom.sourceLang.value = state.sourceLang === 'auto' ? 'auto' : state.sourceLang;
      $$('.target-langs input[type="checkbox"]').forEach(cb => {
        cb.checked = state.targetLangs.includes(cb.value);
      });

      showToast(t('fileLoaded'), 'success');
    } catch (err) {
      showToast(t('invalidJsonFile'), 'error');
    }
  };
  reader.readAsText(file);
}
