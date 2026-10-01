const DEFAULT_THEME = 'dark';

function getTabState(tabStates, tabId) {
  const state = tabStates?.[String(tabId)];
  return { enabled: Boolean(state?.enabled) };
}

function setTabEnabled(tabStates, tabId, enabled) {
  return {
    ...(tabStates || {}),
    [String(tabId)]: { enabled: Boolean(enabled) },
  };
}

function removeTabState(tabStates, tabId) {
  const next = { ...(tabStates || {}) };
  delete next[String(tabId)];
  return next;
}

function isPdfUrl(url) {
  return typeof url === 'string' && /\.pdf(?:[?#]|$)/i.test(url);
}

if (typeof module !== 'undefined') {
  module.exports = {
    DEFAULT_THEME,
    getTabState,
    setTabEnabled,
    removeTabState,
    isPdfUrl,
  };
}
