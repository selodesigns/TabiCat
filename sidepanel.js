const conversationEl = document.getElementById("conversation");
const composerForm = document.getElementById("composer");
const promptInput = document.getElementById("prompt");
const modelSelect = document.getElementById("model");
const sendButton = document.getElementById("send");
const templateList = document.getElementById("templateList");
const addTemplateButton = document.getElementById("addTemplate");
const manageProfilesButton = document.getElementById("manageProfiles");

const DEFAULT_TEMPLATES = [
  {
    id: "template-summary",
    title: "Summarize page",
    content: "Summarize the key points from this page in bullet form."
  },
  {
    id: "template-email",
    title: "Draft reply",
    content: "Draft a professional email reply that is concise and friendly."
  },
  {
    id: "template-ideas",
    title: "Brainstorm ideas",
    content: "Suggest five creative ideas related to this topic with short explanations."
  }
];

const DEFAULT_PROFILES = [
  {
    id: "profile-general",
    label: "General",
    model: "llama3",
    systemPrompt: "You are a helpful assistant."
  },
  {
    id: "profile-creative",
    label: "Creative",
    model: "llama3:8b",
    systemPrompt: "You are a creative brainstorming partner who thinks laterally."
  }
];

let conversation = [];
let templates = [];
let profiles = [];
let currentProfileId = null;

init();

async function init() {
  await loadState();
  renderTemplates();
  renderProfiles();
  renderConversation();
  attachEventListeners();
  if (!promptInput.value) {
    promptInput.focus();
  }
}

function attachEventListeners() {
  composerForm.addEventListener("submit", handleSubmit);
  addTemplateButton.addEventListener("click", handleAddTemplate);
  templateList.addEventListener("click", handleTemplateListClick);
  manageProfilesButton.addEventListener("click", handleManageProfiles);
  modelSelect.addEventListener("change", handleProfileChange);

  chrome.runtime.onMessage.addListener(message => {
    if (message?.type === "context-selection" && message.text) {
      promptInput.value = message.text;
      promptInput.focus();
    }
  });
}

async function loadState() {
  try {
    const [{ conversation: storedConversation = [], pendingPrompt }, { templates: storedTemplates, profiles: storedProfiles, currentProfileId: storedProfileId }] = await Promise.all([
      chrome.storage.local.get(["conversation", "pendingPrompt"]),
      chrome.storage.sync.get(["templates", "profiles", "currentProfileId"])
    ]);

    conversation = Array.isArray(storedConversation)
      ? storedConversation.filter(item => item && typeof item.role === "string" && typeof item.content === "string")
      : [];

    templates = Array.isArray(storedTemplates) && storedTemplates.length
      ? storedTemplates
      : DEFAULT_TEMPLATES;

    profiles = Array.isArray(storedProfiles) && storedProfiles.length
      ? storedProfiles
      : DEFAULT_PROFILES;

    currentProfileId = profiles.some(profile => profile.id === storedProfileId)
      ? storedProfileId
      : profiles[0]?.id ?? null;

    if (pendingPrompt) {
      promptInput.value = pendingPrompt;
      await chrome.storage.local.remove("pendingPrompt");
    }
  } catch (error) {
    console.error("Failed to load state", error);
    conversation = [];
    templates = DEFAULT_TEMPLATES;
    profiles = DEFAULT_PROFILES;
    currentProfileId = profiles[0]?.id ?? null;
  }
}

function renderConversation() {
  conversationEl.innerHTML = "";
  conversation.forEach(message => {
    appendMessageElement(message.role, message.content);
  });
  conversationEl.scrollTop = conversationEl.scrollHeight;
}

function appendMessageElement(role, content) {
  const wrapper = document.createElement("article");
  wrapper.className = `message message--${role}`;

  const roleEl = document.createElement("span");
  roleEl.className = "message__role";
  roleEl.textContent = role === "assistant" ? "Ollama" : "You";

  const contentEl = document.createElement("div");
  contentEl.className = "message__content";
  contentEl.textContent = content;

  wrapper.append(roleEl, contentEl);
  conversationEl.append(wrapper);
  conversationEl.scrollTop = conversationEl.scrollHeight;
}

function renderTemplates() {
  templateList.innerHTML = "";
  if (!templates.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "templates__empty";
    emptyState.textContent = "No templates yet.";
    templateList.append(emptyState);
    return;
  }

  templates.forEach(template => {
    const item = document.createElement("div");
    item.className = "template";
    item.dataset.templateId = template.id;

    const applyButton = document.createElement("button");
    applyButton.type = "button";
    applyButton.className = "template__apply";
    applyButton.textContent = template.title;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "template__delete";
    deleteButton.textContent = "×";
    deleteButton.title = "Delete template";

    item.append(applyButton, deleteButton);
    templateList.append(item);
  });
}

function renderProfiles() {
  modelSelect.innerHTML = "";
  profiles.forEach(profile => {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent = `${profile.label} · ${profile.model}`;
    modelSelect.append(option);
  });

  if (profiles.length) {
    modelSelect.value = currentProfileId ?? profiles[0].id;
  }
}

function handleProfileChange() {
  currentProfileId = modelSelect.value;
  saveProfiles();
}

function handleTemplateListClick(event) {
  const templateItem = event.target.closest(".template");
  if (!templateItem) {
    return;
  }

  const templateId = templateItem.dataset.templateId;
  const template = templates.find(item => item.id === templateId);
  if (!template) {
    return;
  }

  if (event.target.classList.contains("template__delete")) {
    if (confirm(`Delete template "${template.title}"?`)) {
      templates = templates.filter(item => item.id !== templateId);
      renderTemplates();
      saveTemplates();
    }
    return;
  }

  promptInput.value = template.content;
  promptInput.focus();
}

function handleAddTemplate() {
  const title = prompt("Template name");
  if (!title) {
    return;
  }
  const content = prompt("Template content");
  if (!content) {
    return;
  }

  const id = `template-${Date.now()}`;
  templates = [...templates, { id, title, content }];
  renderTemplates();
  saveTemplates();
}

function handleManageProfiles() {
  const action = prompt("Type 'add' to create a profile or 'remove' to delete the selected profile.");
  if (!action) {
    return;
  }

  if (action.toLowerCase() === "add") {
    const label = prompt("Profile label", "Custom");
    if (!label) {
      return;
    }
    const model = prompt("Ollama model", "llama3");
    if (!model) {
      return;
    }
    const systemPrompt = prompt("Optional system prompt", "You are a helpful assistant.") ?? "";
    const id = `profile-${Date.now()}`;
    profiles = [...profiles, { id, label, model, systemPrompt }];
    currentProfileId = id;
    renderProfiles();
    saveProfiles();
    return;
  }

  if (action.toLowerCase() === "remove") {
    if (!currentProfileId) {
      return;
    }
    const currentProfile = profiles.find(profile => profile.id === currentProfileId);
    if (!currentProfile) {
      return;
    }
    if (profiles.length === 1) {
      alert("At least one profile is required.");
      return;
    }
    if (confirm(`Delete profile "${currentProfile.label}"?`)) {
      profiles = profiles.filter(profile => profile.id !== currentProfileId);
      currentProfileId = profiles[0]?.id ?? null;
      renderProfiles();
      saveProfiles();
    }
  }
}

function getCurrentProfile() {
  return profiles.find(profile => profile.id === currentProfileId) ?? profiles[0] ?? {
    id: "profile-fallback",
    label: "Fallback",
    model: "llama3",
    systemPrompt: "You are a helpful assistant."
  };
}

async function handleSubmit(event) {
  event.preventDefault();
  const prompt = promptInput.value.trim();
  if (!prompt) {
    return;
  }

  const profile = getCurrentProfile();
  const userIndex = addMessage("user", prompt);
  const assistantIndex = addMessage("assistant", "...");

  promptInput.value = "";
  promptInput.disabled = true;
  modelSelect.disabled = true;
  sendButton.disabled = true;

  try {
    const assistantMessage = await queryOllama(prompt, profile, assistantIndex);
    updateMessage(assistantIndex, assistantMessage);
  } catch (error) {
    console.error(error);
    updateMessage(assistantIndex, `Error: ${error.message}`);
  } finally {
    promptInput.disabled = false;
    modelSelect.disabled = false;
    sendButton.disabled = false;
    promptInput.focus();
    saveConversation();
  }
}

function addMessage(role, content) {
  conversation = [...conversation, { role, content }];
  appendMessageElement(role, content);
  saveConversation();
  return conversation.length - 1;
}

function updateMessage(index, content) {
  if (!conversation[index]) {
    return;
  }
  conversation[index] = { ...conversation[index], content };
  const messageElements = conversationEl.querySelectorAll(".message");
  const target = messageElements[index];
  if (target) {
    const contentEl = target.querySelector(".message__content");
    if (contentEl) {
      contentEl.textContent = content;
    }
  } else {
    renderConversation();
  }
  saveConversation();
}

async function queryOllama(prompt, profile, assistantIndex) {
  const messages = [];
  if (profile.systemPrompt) {
    messages.push({ role: "system", content: profile.systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: profile.model,
      messages
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let assistantMessage = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const chunk = decoder.decode(value, { stream: true });

    for (const line of chunk.split("\n")) {
      if (!line.trim()) {
        continue;
      }
      try {
        const json = JSON.parse(line);
        if (json?.message?.role === "assistant") {
          assistantMessage += json.message.content ?? "";
          updateMessage(assistantIndex, assistantMessage);
        }
      } catch (error) {
        console.error("Failed to parse Ollama chunk", error, line);
      }
    }
  }

  return assistantMessage;
}

function saveConversation() {
  chrome.storage.local.set({ conversation }).catch(error => {
    console.error("Failed to save conversation", error);
  });
}

function saveTemplates() {
  chrome.storage.sync.set({ templates }).catch(error => {
    console.error("Failed to save templates", error);
  });
}

function saveProfiles() {
  chrome.storage.sync.set({ profiles, currentProfileId }).catch(error => {
    console.error("Failed to save profiles", error);
  });
}
