/* meeting.js — 회의 기록 탭: state.entries를 줄글 속기록으로 렌더.
   요약은 요약 탭(translation.js::refreshSummary)이 담당. 다운로드는 헤더의 Download 버튼이 담당. */

function initMeeting() {
  renderMeetingProse();
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
  container.textContent = state.entries.map(e => e.o).join(' ');
  container.scrollTop = container.scrollHeight;
}

function appendMeetingProse(entry) {
  const container = $('#meetingProse');
  if (!container) return;
  const empty = container.querySelector('.meeting-empty');
  if (empty) {
    container.textContent = entry.o;
  } else {
    const prev = container.textContent || '';
    container.textContent = prev ? prev + ' ' + entry.o : entry.o;
  }
  container.scrollTop = container.scrollHeight;
}
