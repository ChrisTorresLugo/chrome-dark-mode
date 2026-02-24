(() => {
  const THEME_CLASSES = ["dark-mode-ext--dark", "dark-mode-ext--dim", "dark-mode-ext--custom"];
  const STYLE_ID = "dark-mode-ext-styles";
  let currentTheme = null;

  function injectCSS(theme) {
    removeCSS();
    const link = document.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL(`styles/dark-${theme}.css`);
    (document.head || document.documentElement).appendChild(link);
  }

  function removeCSS() {
    document.getElementById(STYLE_ID)?.remove();
  }

  function applyTheme(theme) {
    THEME_CLASSES.forEach((cls) => document.documentElement.classList.remove(cls));
    if (theme) {
      document.documentElement.classList.add(`dark-mode-ext--${theme}`);
      injectCSS(theme);
      currentTheme = theme;
    } else {
      removeCSS();
      currentTheme = null;
    }
  }

  function getDomain() {
    return location.hostname;
  }

  async function init() {
    const data = await chrome.storage.sync.get({
      enabled: true,
      theme: "dark",
      autoEnable: true,
      whitelist: [],
    });

    const domain = getDomain();
    const isWhitelisted = data.whitelist.includes(domain);

    if (data.enabled && !isWhitelisted) {
      applyTheme(data.theme);
    }
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "toggle") {
      chrome.storage.sync.get({ theme: "dark", whitelist: [] }, (data) => {
        const isWhitelisted = data.whitelist.includes(getDomain());
        if (msg.enabled && !isWhitelisted) {
          applyTheme(data.theme);
        } else {
          applyTheme(null);
        }
      });
    } else if (msg.action === "setTheme") {
      if (currentTheme) {
        applyTheme(msg.theme);
      }
    }
  });

  // Apply as early as possible to reduce flash
  if (document.documentElement) {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
