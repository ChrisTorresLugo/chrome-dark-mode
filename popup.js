const toggleEl = document.getElementById('toggle');
const whitelistBtn = document.getElementById('whitelistBtn');
const themeBtns = document.querySelectorAll('.theme-btn');

let currentDomain = '';
let currentState = { enabled: false, theme: 'dark' };

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

async function send(message) {
  const tab = await getCurrentTab();
  if (!tab?.id) return {};
  return chrome.runtime.sendMessage({ ...message, tabId: tab.id });
}

async function loadState() {
  const tab = await getCurrentTab();
  currentDomain = getDomain(tab?.url || '');
  currentState = await send({ action: 'getTabState' });
  const data = await chrome.storage.sync.get({ theme: 'dark', whitelist: [] });
  currentState.theme = data.theme;
  toggleEl.checked = currentState.tabEnabled;
  themeBtns.forEach((btn) => btn.classList.toggle('active', btn.dataset.theme === data.theme));
  updateWhitelistBtn(data.whitelist.includes(currentDomain));
}

function updateWhitelistBtn(isWhitelisted) {
  whitelistBtn.classList.toggle('whitelisted', isWhitelisted);
  whitelistBtn.textContent = isWhitelisted
    ? `Remove ${currentDomain} from whitelist`
    : `Whitelist ${currentDomain}`;
}

toggleEl.addEventListener('change', async () => {
  currentState = await send({ action: 'setTabEnabled', enabled: toggleEl.checked });
  toggleEl.checked = currentState.tabEnabled;
});

themeBtns.forEach((btn) => {
  btn.addEventListener('click', async () => {
    const theme = btn.dataset.theme;
    themeBtns.forEach((b) => b.classList.toggle('active', b === btn));
    await chrome.storage.sync.set({ theme });
    currentState = await send({ action: 'setTheme', theme });
  });
});

whitelistBtn.addEventListener('click', async () => {
  if (!currentDomain) return;
  const data = await chrome.storage.sync.get({ whitelist: [] });
  const whitelist = new Set(data.whitelist);
  if (whitelist.has(currentDomain)) whitelist.delete(currentDomain);
  else whitelist.add(currentDomain);
  await chrome.storage.sync.set({ whitelist: [...whitelist] });
  updateWhitelistBtn(whitelist.has(currentDomain));
  currentState = await send({ action: 'setTabEnabled', enabled: toggleEl.checked });
  toggleEl.checked = currentState.tabEnabled;
});

loadState();
