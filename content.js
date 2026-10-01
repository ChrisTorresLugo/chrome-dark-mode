(() => {
  const THEME_CLASSES = ['dark', 'dim', 'custom'];
  const STYLE_ID = 'dark-mode-ext-styles';
  let currentTheme = null;

  function styleLink() {
    return document.getElementById(STYLE_ID);
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    if (!root) return false;

    THEME_CLASSES.forEach((name) => root.classList.remove(`dark-mode-ext--${name}`));
    const existing = styleLink();

    if (!theme) {
      existing?.remove();
      currentTheme = null;
      return true;
    }

    root.classList.add(`dark-mode-ext--${theme}`);
    const link = existing || document.createElement('link');
    link.id = STYLE_ID;
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL(`styles/dark-${theme}.css`);
    if (!existing) (document.head || root).appendChild(link);
    currentTheme = theme;
    return true;
  }

  async function init() {
    try {
      const state = await chrome.runtime.sendMessage({ action: 'getTabState' });
      applyTheme(state?.enabled ? state.theme : null);
    } catch {
      applyTheme(null);
    }
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'setTabState') {
      applyTheme(message.enabled ? message.theme : null);
    } else if (message.action === 'setTheme' && currentTheme) {
      applyTheme(message.theme);
    }
  });

  if (document.documentElement) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  }
})();
