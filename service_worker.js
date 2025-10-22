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

chrome.action.onClicked.addListener(async tab => {
  await chrome.sidePanel.setOptions({ tabId: tab.id, path: "sidepanel.html", enabled: true });
  await chrome.sidePanel.open({ windowId: tab.windowId });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !info.selectionText) {
    return;
  }

  await chrome.storage.local.set({ pendingPrompt: info.selectionText });

  if (tab?.id !== undefined) {
    await chrome.sidePanel.setOptions({ tabId: tab.id, path: "sidepanel.html", enabled: true });
    if (tab.windowId !== undefined) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  }

  try {
    await chrome.runtime.sendMessage({ type: "context-selection", text: info.selectionText });
  } catch (error) {}
});
