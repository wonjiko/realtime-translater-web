/* meeting.js — 회의 탭 로직 (섹션 13c) */
// ============================================================
// 13c. Meeting Tab Logic
// ============================================================
let meetingRecognition = null;
let meetingRecognitionRestarting = false;

function initMeeting() {
  // Load from localStorage
  try {
    const raw = localStorage.getItem('rt_meeting_entries_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      state.meetingEntries = Array.isArray(parsed.entries) ? parsed.entries : [];
      state.meetingTitle = parsed.title || '';
    }
  } catch(e) { state.meetingEntries = []; state.meetingTitle = ''; }

  // Restore title input
  const titleInput = $('#meetingTitleInput');
  if (titleInput && state.meetingTitle) titleInput.value = state.meetingTitle;

  // Render existing entries
  renderMeetingEntries();

  // Update summarize button state
  updateMeetingSummarizeBtn();

  // Event listeners
  const btnMeetingRec = $('#btnMeetingRec');
  if (btnMeetingRec) {
    btnMeetingRec.addEventListener('click', () => {
      if (state.isRecording && state.recordingSurface === 'meeting') {
        stopMeetingRecording();
      } else if (!state.isRecording) {
        startMeetingRecording();
      }
    });
  }
  if (titleInput) {
    titleInput.addEventListener('input', () => {
      state.meetingTitle = titleInput.value;
      saveMeetingEntries();
    });
  }
  const btnDownload = $('#btnMeetingDownload');
  if (btnDownload) btnDownload.addEventListener('click', downloadMeetingTxt);
  const btnClear = $('#btnMeetingClear');
  if (btnClear) btnClear.addEventListener('click', clearMeeting);
  const btnSummarize = $('#btnMeetingSummarize');
  if (btnSummarize) btnSummarize.addEventListener('click', summarizeMeeting);
}

function saveMeetingEntries() {
  try {
    localStorage.setItem('rt_meeting_entries_v1', JSON.stringify({
      entries: state.meetingEntries,
      title: state.meetingTitle,
    }));
  } catch(e) { /* quota */ }
}

function formatMeetingTs(ts) {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return h + ':' + m + ':' + s;
}

function renderMeetingEntries() {
  const container = $('#meetingEntries');
  if (!container) return;
  container.innerHTML = '';
  if (state.meetingEntries.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:var(--text-tertiary);font-size:14px;padding:20px 0;text-align:center;';
    empty.textContent = '회의 기록이 없습니다. REC을 눌러 시작하세요.';
    container.appendChild(empty);
    return;
  }
  state.meetingEntries.forEach(entry => {
    appendMeetingEntryDom(entry);
  });
  container.scrollTop = container.scrollHeight;
}

function appendMeetingEntryDom(entry) {
  const container = $('#meetingEntries');
  if (!container) return;
  // Remove empty placeholder if present
  const empty = container.querySelector('div[style*="text-align:center"]');
  if (empty) empty.remove();

  const div = document.createElement('div');
  div.className = 'meeting-entry';

  const tsSpan = document.createElement('span');
  tsSpan.className = 'meeting-entry-ts';
  tsSpan.textContent = formatMeetingTs(entry.ts);

  const textSpan = document.createElement('span');
  textSpan.className = 'meeting-entry-text';
  textSpan.textContent = entry.text;

  div.appendChild(tsSpan);
  div.appendChild(textSpan);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function updateMeetingSummarizeBtn() {
  const btn = $('#btnMeetingSummarize');
  if (!btn) return;
  const translator = getTranslator();
  btn.disabled = !translator.supportsLLMFeatures || state.meetingEntries.length === 0;
}

function startMeetingRecording() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast(t('browserWarning'), 'error');
    return;
  }
  if (state.isRecording) return;

  const sourceLangEl = $('#meetingSourceLang');
  const lang = sourceLangEl ? sourceLangEl.value : 'ko-KR';

  meetingRecognition = new SpeechRecognition();
  meetingRecognition.continuous = true;
  meetingRecognition.interimResults = false;
  meetingRecognition.lang = lang;

  meetingRecognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        const text = event.results[i][0].transcript.trim();
        if (text && state.recordingSurface === 'meeting') {
          const entry = { ts: Date.now(), text, lang };
          state.meetingEntries.push(entry);
          appendMeetingEntryDom(entry);
          saveMeetingEntries();
          updateMeetingSummarizeBtn();
        }
      }
    }
  };

  meetingRecognition.onerror = (e) => {
    if (e.error === 'no-speech' || e.error === 'aborted') return;
    showToast(t('micError') + ': ' + e.error, 'error');
  };

  meetingRecognition.onend = () => {
    meetingRecognitionRestarting = false;
    if (state.isRecording && state.recordingSurface === 'meeting') {
      meetingRecognitionRestarting = true;
      setTimeout(() => {
        if (state.isRecording && state.recordingSurface === 'meeting') {
          try { meetingRecognition.start(); } catch(e) { /* ignore */ }
        }
        meetingRecognitionRestarting = false;
      }, 300);
    }
  };

  state.isRecording = true;
  state.recordingSurface = 'meeting';
  meetingRecognition.start();

  const btnMeetingRec = $('#btnMeetingRec');
  if (btnMeetingRec) {
    btnMeetingRec.classList.add('recording');
    const span = btnMeetingRec.querySelector('span[data-i18n]');
    if (span) span.textContent = t('stop');
  }
  updateRecordingBadges();
}

function stopMeetingRecording() {
  state.isRecording = false;
  if (meetingRecognition) {
    try { meetingRecognition.abort(); } catch(e) { /* ignore */ }
    meetingRecognition = null;
  }

  const btnMeetingRec = $('#btnMeetingRec');
  if (btnMeetingRec) {
    btnMeetingRec.classList.remove('recording');
    const span = btnMeetingRec.querySelector('span[data-i18n]');
    if (span) span.textContent = t('rec');
  }
  updateRecordingBadges();
}

function downloadMeetingTxt() {
  if (state.meetingEntries.length === 0) {
    showToast(t('meetingNothingToDownload'), 'error');
    return;
  }
  const title = state.meetingTitle || 'meeting';
  const lines = state.meetingEntries.map(e => formatMeetingTs(e.ts) + '  ' + e.text);
  if (title) lines.unshift('# ' + title + '\n');
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'meeting-' + new Date().toISOString().slice(0, 10) + '.txt';
  a.click();
  URL.revokeObjectURL(url);
  showToast(t('downloaded'), 'success');
}

function clearMeeting() {
  if (!confirm(t('meetingClearConfirm'))) return;
  state.meetingEntries = [];
  saveMeetingEntries();
  renderMeetingEntries();
  updateMeetingSummarizeBtn();
  const summaryArea = $('#meetingSummaryArea');
  if (summaryArea) summaryArea.style.display = 'none';
}

async function summarizeMeeting() {
  const translator = getTranslator();
  if (!translator.supportsLLMFeatures || !translator.summarize) {
    showToast(t('summaryRequiresLLM'), 'error');
    return;
  }
  if (state.meetingEntries.length === 0) {
    showToast(t('meetingNothingToSummarize'), 'error');
    return;
  }
  const summaryArea = $('#meetingSummaryArea');
  if (summaryArea) {
    summaryArea.style.display = '';
    summaryArea.textContent = t('loading') || '요약 중...';
  }
  try {
    // Build transcript-like array for the existing summarize API
    const transcriptArr = state.meetingEntries.map(e => ({ s: 'ko', o: e.text, tr: {} }));
    const result = await translator.summarize(transcriptArr);
    if (summaryArea) summaryArea.textContent = result;
  } catch(e) {
    if (summaryArea) summaryArea.textContent = '';
    showToast(t('summaryFailed') + ': ' + e.message, 'error');
  }
}
