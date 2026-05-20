/**
 * NiceTry — Background Service Worker
 * 
 * Responsibilities:
 *  1. Intercept navigation events and check URLs against the backend API
 *  2. Cache results for 24h to reduce redundant API calls
 *  3. Update the extension badge with risk-coded color
 *  4. Send analysis results to the popup and content scripts
 */

// ⚠️ DEPLOYMENT: Change this to your production domain before deploying
// Example: const API_BASE = 'https://yourdomain.com/api/v1';
const API_BASE = 'http://localhost:8000/api/v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RISK_THRESHOLDS = { HIGH: 70, MEDIUM: 40 };

// ─── URL Result Cache (in-memory, persisted to storage) ────
const urlCache = new Map();

async function loadCache() {
  try {
    const data = await chrome.storage.local.get('urlCache');
    if (data.urlCache) {
      const entries = JSON.parse(data.urlCache);
      const now = Date.now();
      for (const [url, entry] of entries) {
        if (now - entry.timestamp < CACHE_TTL_MS) {
          urlCache.set(url, entry);
        }
      }
    }
  } catch (err) {
    console.warn('[NiceTry] Cache load error:', err);
  }
}

async function saveCache() {
  try {
    const entries = Array.from(urlCache.entries());
    await chrome.storage.local.set({ urlCache: JSON.stringify(entries) });
  } catch (err) {
    console.warn('[NiceTry] Cache save error:', err);
  }
}

// ─── Badge Update ─────────────────────────────────────────
function updateBadge(tabId, result) {
  if (!result) {
    chrome.action.setBadgeText({ text: '', tabId });
    return;
  }

  const score = result.risk_score;
  let color, text;

  if (score >= RISK_THRESHOLDS.HIGH) {
    color = '#ef4444'; // Red
    text = '⚠';
  } else if (score >= RISK_THRESHOLDS.MEDIUM) {
    color = '#f59e0b'; // Amber
    text = '!';
  } else {
    color = '#10b981'; // Green
    text = '✓';
  }

  chrome.action.setBadgeBackgroundColor({ color, tabId });
  chrome.action.setBadgeText({ text, tabId });
  chrome.action.setTitle({
    title: `NiceTry — Risk: ${score}/100 (${result.verdict})`,
    tabId,
  });
}

// ─── URL Analysis ─────────────────────────────────────────
async function analyzeUrl(url) {
  // Skip non-http URLs and internal Chrome pages
  if (!url || !url.startsWith('http') || url.startsWith('chrome') || url.startsWith('about:')) {
    return null;
  }

  // Check cache first
  const cached = urlCache.get(url);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(`${API_BASE}/check-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[NiceTry] API returned ${response.status} for ${url}`);
      return null;
    }

    const result = await response.json();

    // Cache the result
    urlCache.set(url, { data: result, timestamp: Date.now() });
    saveCache(); // async, fire-and-forget

    return result;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`[NiceTry] Analysis timed out for ${url}`);
    } else {
      console.error(`[NiceTry] Analysis failed for ${url}:`, err.message);
    }
    return null;
  }
}

// ─── Navigation Listener ─────────────────────────────────
chrome.webNavigation.onCompleted.addListener(async (details) => {
  // Only check main frame navigations
  if (details.frameId !== 0) return;

  const result = await analyzeUrl(details.url);
  if (!result) return;

  // Update badge
  updateBadge(details.tabId, result);

  // Store for popup access
  await chrome.storage.session.set({
    [`tab-${details.tabId}`]: result,
  });

  // If high risk, send message to content script for overlay
  if (result.risk_score >= RISK_THRESHOLDS.HIGH) {
    try {
      await chrome.tabs.sendMessage(details.tabId, {
        type: 'NICETRY_WARNING',
        data: result,
      });
    } catch (err) {
      // Content script may not be ready yet, that's OK
      console.debug('[NiceTry] Could not send warning to content script:', err.message);
    }

    // Also show a Chrome notification
    chrome.notifications.create(`phish-${details.tabId}`, {
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: '⚠️ Phishing Warning — NiceTry',
      message: `${result.domain} has a risk score of ${result.risk_score}/100. ${result.verdict === 'phishing' ? 'This site appears to be phishing!' : 'This site looks suspicious.'}`,
      priority: 2,
    });
  }
});

// ─── Message Handler (from popup & content scripts) ──────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_RESULT') {
    const tabId = message.tabId;
    chrome.storage.session.get(`tab-${tabId}`).then((data) => {
      sendResponse(data[`tab-${tabId}`] || null);
    });
    return true; // async sendResponse
  }

  if (message.type === 'SCAN_URL') {
    analyzeUrl(message.url).then((result) => {
      if (result && sender.tab) {
        updateBadge(sender.tab.id, result);
      }
      sendResponse(result);
    });
    return true;
  }

  if (message.type === 'REPORT_DOMAIN') {
    fetch(`${API_BASE}/report-domain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message.data),
    })
      .then((r) => r.json())
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }
});

// ─── Init ─────────────────────────────────────────────────
loadCache();
console.log('[NiceTry] Service worker initialized');
