/**
 * NiceTry — Content Script
 * 
 * Injected into every page. Listens for high-risk warnings
 * from the background service worker and renders a full-page
 * intervention overlay when triggered.
 */

(function () {
  'use strict';

  let overlayVisible = false;

  function createOverlay(data) {
    if (overlayVisible) return;
    overlayVisible = true;

    const overlay = document.createElement('div');
    overlay.id = 'nicetry-overlay';

    const riskColor = data.risk_score >= 75 ? '#ef4444' : '#f59e0b';
    const riskLabel = data.verdict === 'phishing' ? 'PHISHING DETECTED' : 'SUSPICIOUS SITE';

    overlay.innerHTML = `
      <div id="nicetry-modal">
        <div class="nicetry-header">
          <div class="nicetry-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="${riskColor}" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h1 class="nicetry-title" style="color: ${riskColor}">⚠ ${riskLabel}</h1>
          <p class="nicetry-subtitle">Risk Score: <strong>${data.risk_score}/100</strong></p>
        </div>

        <div class="nicetry-details">
          <div class="nicetry-detail-row">
            <span class="nicetry-label">Domain</span>
            <span class="nicetry-value">${escapeHtml(data.domain)}</span>
          </div>
          ${data.threat_type ? `
          <div class="nicetry-detail-row">
            <span class="nicetry-label">Threat Type</span>
            <span class="nicetry-value">${escapeHtml(data.threat_type.replace(/_/g, ' '))}</span>
          </div>` : ''}
          <div class="nicetry-detail-row">
            <span class="nicetry-label">Confidence</span>
            <span class="nicetry-value">${(data.confidence * 100).toFixed(1)}%</span>
          </div>
          <div class="nicetry-detail-row">
            <span class="nicetry-label">Recommended Action</span>
            <span class="nicetry-value nicetry-action-${data.recommended_action}">${data.recommended_action?.toUpperCase()}</span>
          </div>
        </div>

        ${data.ai_narrative ? `
        <div class="nicetry-narrative">
          <p>${escapeHtml(data.ai_narrative)}</p>
        </div>` : ''}

        <div class="nicetry-actions">
          <button id="nicetry-exit" class="nicetry-btn nicetry-btn-safe">
            ← Exit Safely
          </button>
          <button id="nicetry-report" class="nicetry-btn nicetry-btn-report">
            🚩 Report Site
          </button>
          <button id="nicetry-proceed" class="nicetry-btn nicetry-btn-danger">
            Continue (Not Recommended) →
          </button>
        </div>

        <p class="nicetry-footer">Protected by NiceTry — 7-Layer AI Detection</p>
      </div>
    `;

    document.documentElement.appendChild(overlay);

    // ── Button Handlers ──
    document.getElementById('nicetry-exit').addEventListener('click', () => {
      window.location.href = 'about:blank';
      history.pushState(null, '', 'about:blank');
    });

    document.getElementById('nicetry-proceed').addEventListener('click', () => {
      overlay.remove();
      overlayVisible = false;
    });

    document.getElementById('nicetry-report').addEventListener('click', () => {
      chrome.runtime.sendMessage({
        type: 'REPORT_DOMAIN',
        data: {
          url: data.url,
          category: data.threat_type || 'other',
          reporter_id: 'extension-user',
        },
      }, (response) => {
        const reportBtn = document.getElementById('nicetry-report');
        if (response && !response.error) {
          reportBtn.textContent = '✓ Reported';
          reportBtn.disabled = true;
          reportBtn.style.opacity = '0.6';
        } else {
          reportBtn.textContent = '✗ Report Failed';
        }
      });
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  // ── Listen for warnings from background ──
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'NICETRY_WARNING') {
      createOverlay(message.data);
    }
  });
})();
