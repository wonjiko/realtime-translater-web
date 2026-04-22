/* meeting.js — 회의 기록 탭: state.entries를 줄글 속기록으로 렌더.
   UI locale(en/ko)에 맞춰 번역된 텍스트를 우선 사용하고, 없으면 원문으로 폴백.
   요약은 요약 탭(translation.js::refreshSummary)이 담당. 다운로드는 헤더의 Download 버튼이 담당. */

function initMeeting() {
  renderMeetingProse();
}

function proseTextOf(entry) {
  if (!entry) return '';
  if (entry.tr && entry.tr[currentLocale]) return entry.tr[currentLocale];
  return entry.o || '';
}

function renderMeetingProse() {
  const container = $('#meetingProse');
  if (!container) return;
  if (state.entries.length === 0) {
    container.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'meeting-empty';
    empty.textContent = t('meetingEmptyPlaceholder');
    container.appendChild(empty);
    return;
  }
  container.textContent = state.entries.map(proseTextOf).join(' ');
  container.scrollTop = container.scrollHeight;
}

function appendMeetingProse(entry) {
  const container = $('#meetingProse');
  if (!container) return;
  const empty = container.querySelector('.meeting-empty');
  const text = proseTextOf(entry);
  if (empty) {
    container.textContent = text;
  } else {
    const prev = container.textContent || '';
    container.textContent = prev ? prev + ' ' + text : text;
  }
  container.scrollTop = container.scrollHeight;
}
