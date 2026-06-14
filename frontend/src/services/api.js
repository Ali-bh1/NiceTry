const API_BASE = 'https://nicetry.site/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };

  const res = await fetch(url, config);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  checkUrl: (url, includeVisual = false) =>
    request('/check-url', {
      method: 'POST',
      body: JSON.stringify({ url, include_visual: includeVisual }),
    }),

  reportDomain: (url, category, reporterId = 'anonymous') =>
    request('/report-domain', {
      method: 'POST',
      body: JSON.stringify({ url, category, reporter_id: reporterId }),
    }),

  getDashboard: () => request('/dashboard'),

  getThreatGraph: (domain = '', depth = 2) => {
    const params = new URLSearchParams();
    if (domain) params.set('domain', domain);
    params.set('depth', depth);
    return request(`/threat-graph?${params}`);
  },

  getHealth: () => request('/health'),

  clearThreatGraph: () =>
    request('/threat-graph', { method: 'DELETE' }),
};
