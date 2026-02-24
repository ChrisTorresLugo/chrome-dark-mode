chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get({ enabled: true, theme: "dark", autoEnable: true, whitelist: [] }, (data) => {
    chrome.storage.sync.set(data);
    updateBadge(data.enabled);
  });
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    updateBadge(changes.enabled.newValue);
  }
});

function updateBadge(enabled) {
  chrome.action.setBadgeText({ text: enabled ? "ON" : "OFF" });
  chrome.action.setBadgeBackgroundColor({
    color: enabled ? "#6c63ff" : "#666",
  });
}

// Initialize badge on startup
chrome.storage.sync.get({ enabled: true }, (data) => {
  updateBadge(data.enabled);
});
