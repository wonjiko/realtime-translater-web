/* tabs.js — 탭 관리 (섹션 3b) */
// ============================================================
// 3b. Tab Management
// ============================================================
function switchTab(tab) {
  const validTabs = ['meeting', 'notes', 'translate'];
  if (!validTabs.includes(tab)) tab = 'translate';
  state.activeTab = tab;
  try { localStorage.setItem('rt_active_tab', tab); } catch(e) { /* quota */ }

  // Update panels
  $$('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.dataset.tab === tab);
  });
  // Update buttons
  $$('.tab-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  // Show/hide recording badge on non-translate tabs
  updateRecordingBadges();
}

function updateRecordingBadges() {
  const meetingBadge = $('#meetingRecBadge');
  const translateBadge = $('#translateRecBadge');
  if (meetingBadge) meetingBadge.classList.toggle('visible', state.isRecording && state.recordingSurface === 'meeting' && state.activeTab !== 'meeting');
  if (translateBadge) translateBadge.classList.toggle('visible', state.isRecording && state.recordingSurface === 'translate' && state.activeTab !== 'translate');
}

function initTabs() {
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      switchTab(btn.dataset.tab);
    });
  });
  // Restore last active tab
  const savedTab = localStorage.getItem('rt_active_tab') || 'translate';
  switchTab(savedTab);
}
