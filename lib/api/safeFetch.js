/**
 * Safe fetch utility — adds timeout, retry, and error handling
 * so a slow/flaky external API can't kill a verification.
 *
 * Usage:
 *   const data = await safeFetchJson(url, { timeoutMs: 8000, retries: 1 });
 *   if (data === null) {
 *     // fetch failed — treat as "not found"
 *   }
 */

/**
 * Fetch a URL with timeout and return parsed JSON, or null on any failure.
 * Never throws.
 *
 * @param {string} url
 * @param {object} [opts]
 * @param {number} [opts.timeoutMs=8000] - abort after N ms
 * @param {number} [opts.retries=1] - retry count on network/5xx failure
 * @param {object} [opts.headers] - extra headers
 * @param {string} [opts.method='GET']
 * @param {string} [opts.body]
 * @returns {Promise<object|null>}
 */
async function safeFetchJson(url, opts = {}) {
  const { timeoutMs = 8000, retries = 1, headers = {}, method = 'GET', body } = opts;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'User-Agent': 'Veri9-Verification/1.0 (https://veri9.app)',
          'Accept': 'application/json',
          ...headers,
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timer);

      // 4xx -> definitive "not found", don't retry
      if (res.status >= 400 && res.status < 500) return null;

      // 5xx -> retry
      if (res.status >= 500) {
        if (attempt < retries) continue;
        return null;
      }

      // Only parse JSON if content-type looks like JSON (avoid HTML rate-limit pages)
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('json')) {
        // Sometimes APIs return text that IS json without setting header
        const text = await res.text();
        try { return JSON.parse(text); } catch { return null; }
      }
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      // AbortError (timeout) or network error → retry
      if (attempt < retries) continue;
      // Final attempt → swallow
      return null;
    }
  }
  return null;
}

/**
 * Fetch with timeout and return the raw Response, or null on any failure.
 * Useful when you need to check status codes or non-JSON bodies.
 */
async function safeFetch(url, opts = {}) {
  const { timeoutMs = 8000, retries = 1, headers = {}, method = 'GET', body } = opts;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'User-Agent': 'Veri9-Verification/1.0 (https://veri9.app)',
          ...headers,
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.status >= 500 && attempt < retries) continue;
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (attempt < retries) continue;
      return null;
    }
  }
  return null;
}

module.exports = { safeFetchJson, safeFetch };
