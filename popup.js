const toggleEl = document.getElementById("toggle");
const autoToggleEl = document.getElementById("autoToggle");
const whitelistBtn = document.getElementById("whitelistBtn");
const themeBtns = document.querySelectorAll(".theme-btn");

let currentDomain = "";

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

async function loadState() {
  const tab = await getCurrentTab();
  currentDomain = getDomain(tab?.url || "");

  const data = await chrome.storage.sync.get({
    enabled: true,
    theme: "dark",
    autoEnable: true,
    whitelist: [],
  });

  toggleEl.checked = data.enabled;
  autoToggleEl.checked = data.autoEnable;

  themeBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.theme === data.theme);
  });

  const isWhitelisted = data.whitelist.includes(currentDomain);
  updateWhitelistBtn(isWhitelisted);
}

function updateWhitelistBtn(isWhitelisted) {
  whitelistBtn.classList.toggle("whitelisted", isWhitelisted);
  whitelistBtn.textContent = isWhitelisted
    ? `Remove ${currentDomain} from whitelist`
    : `Whitelist ${currentDomain}`;
}

toggleEl.addEventListener("change", async () => {
  const enabled = toggleEl.checked;
  await chrome.storage.sync.set({ enabled });
  notifyTab({ action: "toggle", enabled });
});

autoToggleEl.addEventListener("change", async () => {
  await chrome.storage.sync.set({ autoEnable: autoToggleEl.checked });
});

themeBtns.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const theme = btn.dataset.theme;
    themeBtns.forEach((b) => b.classList.toggle("active", b === btn));
    await chrome.storage.sync.set({ theme });
    notifyTab({ action: "setTheme", theme });
  });
});

whitelistBtn.addEventListener("click", async () => {
  if (!currentDomain) return;
  const data = await chrome.storage.sync.get({ whitelist: [] });
  const whitelist = data.whitelist;
  const idx = whitelist.indexOf(currentDomain);

  if (idx >= 0) {
    whitelist.splice(idx, 1);
  } else {
    whitelist.push(currentDomain);
  }

  await chrome.storage.sync.set({ whitelist });
  updateWhitelistBtn(idx < 0);
  notifyTab({ action: "toggle", enabled: toggleEl.checked });
});

async function notifyTab(message) {
  const tab = await getCurrentTab();
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, message).catch(() => {});
  }
}

loadState();
