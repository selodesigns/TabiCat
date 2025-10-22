const CONTEXT_MENU_ID = "ollama-sidepanel-selection";
const REMOVE_ORIGIN_RULE_ID = 1;

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.sidePanel.setOptions({ path: "sidepanel.html", enabled: true });
  try {
    await chrome.contextMenus.remove(CONTEXT_MENU_ID);
  } catch (error) {}
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'Ask TabiCat about "%s"',
    contexts: ["selection"]
  });

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [REMOVE_ORIGIN_RULE_ID],
    addRules: [
      {
        id: REMOVE_ORIGIN_RULE_ID,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [
            {
              header: "origin",
              operation: "remove"
            }
          ]
        },
        condition: {
          urlFilter: "||localhost:11434",
          resourceTypes: ["xmlhttprequest"]
        }
      }
    ]
  });
});

chrome.action.onClicked.addListener(tab => {
  chrome.sidePanel.setOptions({ tabId: tab.id, path: "sidepanel.html", enabled: true }, () => {
    chrome.sidePanel.open({ tabId: tab.id }, () => {
      if (chrome.runtime.lastError) {
        console.error("Failed to open side panel:", chrome.runtime.lastError);
      } else {
        console.log("Side panel opened successfully");
      }
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !info?.selectionText?.trim()) {
    return;
  }

  const selectedText = info.selectionText.trim();

  try {
    await chrome.storage.local.set({ pendingPrompt: selectedText });
  } catch (error) {
    console.error("Failed to store pending prompt", error);
  }

  if (tab?.id !== undefined) {
    try {
      await chrome.sidePanel.setOptions({ tabId: tab.id, path: "sidepanel.html", enabled: true });
      if (tab.windowId !== undefined) {
        await chrome.sidePanel.open({ windowId: tab.windowId });
      }
    } catch (error) {
      console.error("Failed to open side panel", error);
    }

    try {
      await chrome.tabs.sendMessage(tab.id, { type: "tabicat-selection", text: selectedText });
    } catch (error) {
      console.error("Failed to send selection to tab", error);
    }
  }

  try {
    await chrome.runtime.sendMessage({ type: "context-selection", text: selectedText });
  } catch (error) {
    // Side panel may not have listeners yet; ignore.
  }
});
