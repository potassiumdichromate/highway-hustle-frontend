/**
 * Browser auto-login helpers.
 * Reads `token` and `source` from URL query or hash params,
 * and provides helpers to clean them up after use.
 *
 * Reference: guesstheai/guess_the_ai_frontend/src/lib/session.ts
 */

export const getJwtFromUrl = () => {
  if (typeof window === 'undefined') return '';
  const queryParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
  return queryParams.get('token') || hashParams.get('token') || '';
};

export const getSourceFromUrl = () => {
  if (typeof window === 'undefined') return '';
  const queryParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
  return queryParams.get('source') || hashParams.get('source') || '';
};

export const clearAutoLoginParams = () => {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  let changed = false;

  for (const key of ['token', 'source']) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }

  if (changed) {
    window.history.replaceState({}, '', url.toString());
  }

  // Also clean hash params if present
  if (url.hash.includes('token=') || url.hash.includes('source=')) {
    const hashParams = new URLSearchParams(url.hash.replace(/^#\/?/, ''));
    hashParams.delete('token');
    hashParams.delete('source');
    const cleaned = hashParams.toString();
    url.hash = cleaned ? `#/${cleaned}` : '';
    window.history.replaceState({}, '', url.toString());
  }
};
