const PIN_KEY = "wc_pinned";

async function applyPinState() {
  const { [PIN_KEY]: pinned } = await chrome.storage.local.get(PIN_KEY);
  const openOnClick = pinned !== false;
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: openOnClick });
  } catch (_) {}
}

chrome.runtime.onInstalled.addListener(applyPinState);
chrome.runtime.onStartup.addListener(applyPinState);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && PIN_KEY in changes) {
    applyPinState();
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (_) {}
});
