/**
 * NiceTry — Popup Script
 * 
 * Retrieves cached analysis results for the active tab
 * and renders them in the extension popup UI.
 */

const DASHBOARD_URL = 'http://localhost:5173';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function riskClass(score) {
  if (score >= 70) return 'danger';
  if (score >= 40) return 'caution';
  return 'safe';
}

function verdictClass(verdict) {
  if (verdict === 'phishing') return 'phishing';
  if (verdict === 'suspicious') return 'suspicious';
  return 'safe';
}

function verdictLabel(verdict) {
  if (verdict === 'phishing') return '⚠ PHISHING DETECTED';
  if (verdict === 'suspicious') return '⚡ SUSPICIOUS';
  return '✓ LEGITIMATE';
}

function renderResult(result) {
  const rc = riskClass(result.risk_score);
  const vc = verdictClass(result.verdict);

  return `
    <div class="result">
      <div class="verdict-bar verdict-${vc}">
        <div class="risk-score risk-${rc}">${result.risk_score}</div>
        <div class="verdict-text">
          <h2>${verdictLabel(result.verdict)}</h2>
          <p>${escapeHtml(result.domain)}</p>
        </div>
      </div>

      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Confidence</span>
          <span class="detail-value">${(result.confidence * 100).toFixed(1)}%</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Threat Type</span>
          <span class="detail-value">${escapeHtml(result.threat_type?.replace(/_/g, ' ') || 'None')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Action</span>
          <span class="detail-value" style="color: ${rc === 'danger' ? '#ef4444' : rc === 'caution' ? '#f59e0b' : '#10b981'}">${result.recommended_action?.toUpperCase() || 'SAFE'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Latency</span>
          <span class="detail-value">${result.latency_ms}ms</span>
        </div>
      </div>

      ${result.ai_narrative ? `
      <div class="narrative">
        <h3>AI Threat Narrative</h3>
        <p>${escapeHtml(result.ai_narrative)}</p>
      </div>` : ''}

      <div class="actions">
        <button class="btn btn-scan" id="btn-rescan">↻ Re-scan</button>
        <button class="btn btn-dashboard" id="btn-dashboard">Open Dashboard</button>
      </div>
    </div>
  `;
}

function renderIdle(url) {
  const display = url ? escapeHtml(new URL(url).hostname) : 'this page';
  return `
    <div class="status">
      <p class="status-idle">No analysis available for <strong>${display}</strong></p>
      <div class="actions" style="padding: 12px 16px;">
        <button class="btn btn-scan" id="btn-scan-now">Scan Now</button>
        <button class="btn btn-dashboard" id="btn-dashboard">Dashboard</button>
      </div>
    </div>
  `;
}

async function init() {
  const content = document.getElementById('content');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      content.innerHTML = '<div class="status"><p class="status-idle">No active tab</p></div>';
      return;
    }

    const tabUrl = tab.url;

    // Skip non-http pages
    if (!tabUrl || !tabUrl.startsWith('http') || tabUrl.startsWith('chrome')) {
      content.innerHTML = '<div class="status"><p class="status-idle">NiceTry doesn\'t scan internal pages</p></div>';
      return;
    }

    // Get cached result from background
    const result = await chrome.runtime.sendMessage({ type: 'GET_RESULT', tabId: tab.id });

    if (result) {
      content.innerHTML = renderResult(result);
    } else {
      content.innerHTML = renderIdle(tabUrl);
    }

    // ── Button Handlers ──
    document.getElementById('btn-dashboard')?.addEventListener('click', () => {
      chrome.tabs.create({ url: DASHBOARD_URL });
    });

    document.getElementById('btn-scan-now')?.addEventListener('click', async () => {
      content.innerHTML = '<div class="loading"><div class="spinner"></div>Scanning...</div>';
      const scanResult = await chrome.runtime.sendMessage({ type: 'SCAN_URL', url: tabUrl });
      if (scanResult) {
        content.innerHTML = renderResult(scanResult);
        // Re-attach handlers
        document.getElementById('btn-dashboard')?.addEventListener('click', () => {
          chrome.tabs.create({ url: DASHBOARD_URL });
        });
        document.getElementById('btn-rescan')?.addEventListener('click', async () => {
          content.innerHTML = '<div class="loading"><div class="spinner"></div>Re-scanning...</div>';
          const r = await chrome.runtime.sendMessage({ type: 'SCAN_URL', url: tabUrl });
          if (r) content.innerHTML = renderResult(r);
        });
      } else {
        content.innerHTML = '<div class="status"><p class="status-idle">Scan failed — is the backend running?</p></div>';
      }
    });

    document.getElementById('btn-rescan')?.addEventListener('click', async () => {
      content.innerHTML = '<div class="loading"><div class="spinner"></div>Re-scanning...</div>';
      const r = await chrome.runtime.sendMessage({ type: 'SCAN_URL', url: tabUrl });
      if (r) {
        content.innerHTML = renderResult(r);
        document.getElementById('btn-dashboard')?.addEventListener('click', () => {
          chrome.tabs.create({ url: DASHBOARD_URL });
        });
      }
    });

  } catch (err) {
    content.innerHTML = `<div class="status"><p class="status-idle">Error: ${escapeHtml(err.message)}</p></div>`;
  }
}

document.addEventListener('DOMContentLoaded', init);
