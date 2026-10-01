importScripts('state.js');

const DEFAULTS = { theme: 'dark', whitelist: [] };

function sessionGet() {
  return chrome.storage.session.get({ tabStates: {} });
}

function syncGet() {
  return chrome.storage.sync.get(DEFAULTS);
}

async function getRuntimeState(tabId, url = '') {
  const [{ tabStates }, preferences] = await Promise.all([sessionGet(), syncGet()]);
  const enabled = getTabState(tabStates, tabId).enabled;
  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch {
    // Restricted or malformed URLs simply have no whitelist match.
  }
  const whitelisted = preferences.whitelist.includes(hostname);
  return {
    enabled: enabled && !whitelisted,
    tabEnabled: enabled,
    theme: preferences.theme,
    whitelisted,
  };
}

async function updateBadge(tabId, enabled) {
  if (!tabId) return;
  await chrome.action.setBadgeText({ tabId, text: enabled ? 'ON' : 'OFF' });
  await chrome.action.setBadgeBackgroundColor({ tabId, color: enabled ? '#6c63ff' : '#666' });
}

async function sendToTab(tabId, message) {
  if (!tabId) return;
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch {
    // Content scripts cannot run on every restricted page and PDF viewers.
  }
}

async function injectPdf(tabId, url, theme, enabled) {
  if (!isPdfUrl(url)) return;
  const files = ['dark', 'dim', 'custom'].map((name) => `styles/dark-${name}.css`);
  for (const file of files) {
    try {
      await chrome.scripting.removeCSS({ target: { tabId }, files: [file] });
    } catch {
      // It is normal for a theme not to have been injected yet.
    }
  }
  if (enabled) {
    try {
      await chrome.scripting.insertCSS({ target: { tabId }, files: [`styles/dark-${theme}.css`] });
    } catch {
      // Chrome's built-in viewer may reject extension injection; keep PDFs usable.
    }
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.sync.get(DEFAULTS);
  await chrome.storage.sync.set(data);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id || message.tabId;
  if (!tabId) return false;

  (async () => {
    if (message.action === 'getTabState') {
      const tab = await chrome.tabs.get(tabId);
      sendResponse(await getRuntimeState(tabId, tab.url));
      return;
    }

    if (message.action === 'setTabEnabled') {
      const { tabStates } = await sessionGet();
      await chrome.storage.session.set({ tabStates: setTabEnabled(tabStates, tabId, message.enabled) });
      const tab = await chrome.tabs.get(tabId);
      const state = await getRuntimeState(tabId, tab.url);
      await updateBadge(tabId, state.enabled);
      await sendToTab(tabId, { action: 'setTabState', ...state });
      await injectPdf(tabId, tab.url, state.theme, state.enabled);
      sendResponse(state);
      return;
    }

    if (message.action === 'setTheme') {
      await chrome.storage.sync.set({ theme: message.theme });
      const tab = await chrome.tabs.get(tabId);
      const state = await getRuntimeState(tabId, tab.url);
      await sendToTab(tabId, { action: 'setTheme', theme: state.theme });
      await injectPdf(tabId, tab.url, state.theme, state.enabled);
      sendResponse(state);
    }
  })().catch(() => sendResponse({ enabled: false }));

  return true;
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const { tabStates } = await sessionGet();
  await chrome.storage.session.set({ tabStates: removeTabState(tabStates, tabId) });
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  const state = await getRuntimeState(tabId, tab.url);
  await updateBadge(tabId, state.enabled);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  const state = await getRuntimeState(tabId, tab.url);
  await updateBadge(tabId, state.enabled);
  await injectPdf(tabId, tab.url, state.theme, state.enabled);
});
