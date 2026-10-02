// ==========================================
// SIMPLE CHAT — REPLICATE GPT-4.1 NANO
// ==========================================

const REPLICATE_URL =
  "https://api.replicate.com/v1/models/openai/gpt-4.1-nano/predictions";


// ==========================================
// ELEMENTS
// ==========================================

const settingsBtn = document.getElementById("settingsBtn");
const settingsDialog = document.getElementById("settingsDialog");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const cancelSettingsBtn = document.getElementById("cancelSettingsBtn");

const settingsForm = document.getElementById("settingsForm");
const apiTokenInput = document.getElementById("apiToken");
const systemPromptInput = document.getElementById("systemPrompt");

const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

const messagesContainer = document.getElementById("messages");
const welcome = document.getElementById("welcome");


// ==========================================
// STORAGE KEYS
// ==========================================

const TOKEN_KEY = "simpleChat_replicateToken";
const SYSTEM_PROMPT_KEY = "simpleChat_systemPrompt";


// ==========================================
// CHAT STATE
// ==========================================

let isSending = false;


// ==========================================
// LOAD SAVED SETTINGS
// ==========================================

function loadSettings() {
  const savedToken = localStorage.getItem(TOKEN_KEY);
  const savedSystemPrompt = localStorage.getItem(SYSTEM_PROMPT_KEY);

  if (savedToken) {
    apiTokenInput.value = savedToken;
  }

  if (savedSystemPrompt) {
    systemPromptInput.value = savedSystemPrompt;
  }
}


// ==========================================
// SAVE SETTINGS
// ==========================================

function saveSettings() {
  const token = apiTokenInput.value.trim();
  const systemPrompt = systemPromptInput.value.trim();

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }

  if (systemPrompt) {
    localStorage.setItem(SYSTEM_PROMPT_KEY, systemPrompt);
  } else {
    localStorage.removeItem(SYSTEM_PROMPT_KEY);
  }
}


// ==========================================
// GET API TOKEN
// ==========================================

function getApiToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}


// ==========================================
// GET SYSTEM PROMPT
// ==========================================

function getSystemPrompt() {
  return localStorage.getItem(SYSTEM_PROMPT_KEY) || "";
}


// ==========================================
// OPEN SETTINGS
// ==========================================

settingsBtn.addEventListener("click", () => {
  apiTokenInput.value = getApiToken();
  systemPromptInput.value = getSystemPrompt();

  settingsDialog.showModal();
});


// ==========================================
// CLOSE SETTINGS
// ==========================================

function closeSettings() {
  settingsDialog.close();
}

closeSettingsBtn.addEventListener("click", closeSettings);

cancelSettingsBtn.addEventListener("click", closeSettings);


// ==========================================
// CLOSE DIALOG WHEN CLICKING OUTSIDE
// ==========================================

settingsDialog.addEventListener("click", (event) => {
  const rect = settingsDialog.getBoundingClientRect();

  const clickedInside =
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom;

  if (!clickedInside) {
    settingsDialog.close();
  }
});


// ==========================================
// SAVE SETTINGS FORM
// ==========================================

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();

  saveSettings();

  closeSettings();

  showTemporaryNotice("Settings saved.");
});


// ==========================================
// TEMPORARY NOTICE
// ==========================================

function showTemporaryNotice(message) {
  const notice = document.createElement("div");

  notice.textContent = message;

  notice.style.position = "fixed";
  notice.style.left = "50%";
  notice.style.bottom = "90px";
  notice.style.transform = "translateX(-50%)";
  notice.style.padding = "9px 14px";
  notice.style.borderRadius = "9px";
  notice.style.background = "#171717";
  notice.style.color = "#ffffff";
  notice.style.fontSize = "12px";
  notice.style.zIndex = "9999";
  notice.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";

  document.body.appendChild(notice);

  setTimeout(() => {
    notice.remove();
  }, 1800);
}


// ==========================================
// ADD MESSAGE
// ==========================================

function addMessage(role, text) {
  welcome.classList.add("hidden");

  const message = document.createElement("div");
  message.className = `message ${role}`;

  const content = document.createElement("div");
  content.className = "message-content";

  content.textContent = text;

  message.appendChild(content);
  messagesContainer.appendChild(message);

  scrollToBottom();

  return message;
}


// ==========================================
// ADD LOADING MESSAGE
// ==========================================

function addLoadingMessage() {
  welcome.classList.add("hidden");

  const message = document.createElement("div");
  message.className = "message assistant";
  message.id = "loadingMessage";

  const content = document.createElement("div");
  content.className = "message-content";

  const loading = document.createElement("div");
  loading.className = "loading-message";

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("span");
    dot.className = "loading-dot";
    loading.appendChild(dot);
  }

  content.appendChild(loading);
  message.appendChild(content);

  messagesContainer.appendChild(message);

  scrollToBottom();

  return message;
}


// ==========================================
// REMOVE LOADING MESSAGE
// ==========================================

function removeLoadingMessage() {
  const loadingMessage = document.getElementById("loadingMessage");

  if (loadingMessage) {
    loadingMessage.remove();
  }
}


// ==========================================
// SCROLL TO BOTTOM
// ==========================================

function scrollToBottom() {
  requestAnimationFrame(() => {
    messagesContainer.scrollTop =
      messagesContainer.scrollHeight;
  });
}


// ==========================================
// AUTO RESIZE TEXTAREA
// ==========================================

function resizeTextarea() {
  messageInput.style.height = "auto";

  const newHeight = Math.min(
    messageInput.scrollHeight,
    160
  );

  messageInput.style.height = `${newHeight}px`;
}

messageInput.addEventListener("input", resizeTextarea);


// ==========================================
// ENTER TO SEND
// SHIFT + ENTER = NEW LINE
// ==========================================

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();

    chatForm.requestSubmit();
  }
});


// ==========================================
// SEND MESSAGE
// ==========================================

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (isSending) {
    return;
  }

  const prompt = messageInput.value.trim();

  if (!prompt) {
    return;
  }

  const apiToken = getApiToken();

  if (!apiToken) {
    addMessage(
      "assistant",
      "Please open Settings ⚙ and enter your Replicate API token first."
    );

    settingsDialog.showModal();
    apiTokenInput.focus();

    return;
  }

  // Show user's message
  addMessage("user", prompt);

  // Clear input
  messageInput.value = "";
  messageInput.style.height = "auto";

  // Lock sending
  isSending = true;
  sendBtn.disabled = true;

  // Show loading
  addLoadingMessage();

  try {
    const response = await sendToReplicate(
      prompt,
      apiToken,
      getSystemPrompt()
    );

    removeLoadingMessage();

    const assistantText = extractResponseText(response);

    if (!assistantText) {
      addMessage(
        "assistant",
        "The model returned an empty response."
      );
    } else {
      addMessage("assistant", assistantText);
    }

  } catch (error) {
    removeLoadingMessage();

    addMessage(
      "assistant",
      `Error: ${getReadableError(error)}`
    );

  } finally {
    isSending = false;
    sendBtn.disabled = false;

    messageInput.focus();
  }
});


// ==========================================
// REPLICATE API REQUEST
// ==========================================

async function sendToReplicate(
  prompt,
  apiToken,
  systemPrompt
) {
  const requestBody = {
    input: {
      top_p: 1,
      prompt: prompt,
      messages: [],
      image_input: [],
      temperature: 1,
      system_prompt: systemPrompt,
      presence_penalty: 0,
      frequency_penalty: 0,
      max_completion_tokens: 2000
    }
  };

  const response = await fetch(REPLICATE_URL, {
    method: "POST",

    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      "Prefer": "wait"
    },

    body: JSON.stringify(requestBody)
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Server returned HTTP ${response.status}.`
    );
  }

  if (!response.ok) {
    const errorMessage =
      data?.detail ||
      data?.error ||
      data?.title ||
      `Request failed with HTTP ${response.status}.`;

    throw new Error(errorMessage);
  }

  return data;
}


// ==========================================
// EXTRACT MODEL RESPONSE
// ==========================================

function extractResponseText(data) {
  if (!data) {
    return "";
  }

  /*
    Replicate can return output in different formats.

    This function handles:
    - output as a string
    - output as an array of strings
    - output as an array of objects
    - output as an object
  */

  if (typeof data.output === "string") {
    return data.output.trim();
  }

  if (Array.isArray(data.output)) {
    return data.output
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (
          item &&
          typeof item === "object"
        ) {
          return (
            item.text ||
            item.content ||
            item.output ||
            ""
          );
        }

        return "";
      })
      .join("")
      .trim();
  }

  if (
    data.output &&
    typeof data.output === "object"
  ) {
    return (
      data.output.text ||
      data.output.content ||
      data.output.output ||
      ""
    ).trim();
  }

  if (typeof data.text === "string") {
    return data.text.trim();
  }

  if (typeof data.content === "string") {
    return data.content.trim();
  }

  return "";
}


// ==========================================
// READABLE ERROR
// ==========================================

function getReadableError(error) {
  if (!error) {
    return "Something went wrong.";
  }

  const message =
    error.message ||
    String(error);

  const lower = message.toLowerCase();

  if (
    lower.includes("401") ||
    lower.includes("unauthorized") ||
    lower.includes("invalid token") ||
    lower.includes("authentication")
  ) {
    return "The API token appears to be invalid. Please check it in Settings.";
  }

  if (
    lower.includes("403") ||
    lower.includes("forbidden")
  ) {
    return "The API token does not have permission to use this request.";
  }

  if (
    lower.includes("429") ||
    lower.includes("rate limit")
  ) {
    return "The API rate limit was reached. Please wait a little and try again.";
  }

  if (
    lower.includes("failed to fetch") ||
    lower.includes("network")
  ) {
    return "The request could not reach Replicate. Please check your internet connection.";
  }

  return message;
}


// ==========================================
// INITIALIZE
// ==========================================

loadSettings();

messageInput.focus();


// ==========================================
// ESCAPE KEY
// ==========================================

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    settingsDialog.open
  ) {
    settingsDialog.close();
  }
});
```
