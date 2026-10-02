```javascript
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
// STORAGE
// ==========================================

const TOKEN_KEY = "simpleChat_replicateToken";
const SYSTEM_PROMPT_KEY = "simpleChat_systemPrompt";


// ==========================================
// STATE
// ==========================================

let isSending = false;


// ==========================================
// SETTINGS
// ==========================================

function loadSettings() {
  apiTokenInput.value =
    localStorage.getItem(TOKEN_KEY) || "";

  systemPromptInput.value =
    localStorage.getItem(SYSTEM_PROMPT_KEY) || "";
}


function saveSettings() {
  const token = apiTokenInput.value.trim();
  const systemPrompt = systemPromptInput.value.trim();

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }

  if (systemPrompt) {
    localStorage.setItem(
      SYSTEM_PROMPT_KEY,
      systemPrompt
    );
  } else {
    localStorage.removeItem(SYSTEM_PROMPT_KEY);
  }
}


function getApiToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}


function getSystemPrompt() {
  return localStorage.getItem(SYSTEM_PROMPT_KEY) || "";
}


// ==========================================
// OPEN SETTINGS
// ==========================================

settingsBtn.addEventListener("click", function () {
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


closeSettingsBtn.addEventListener(
  "click",
  closeSettings
);


cancelSettingsBtn.addEventListener(
  "click",
  closeSettings
);


// ==========================================
// CLICK OUTSIDE DIALOG
// ==========================================

settingsDialog.addEventListener(
  "click",
  function (event) {
    const rect =
      settingsDialog.getBoundingClientRect();

    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (!inside) {
      settingsDialog.close();
    }
  }
);


// ==========================================
// SAVE SETTINGS
// ==========================================

settingsForm.addEventListener(
  "submit",
  function (event) {
    event.preventDefault();

    saveSettings();

    closeSettings();

    showNotice("Settings saved.");
  }
);


// ==========================================
// NOTICE
// ==========================================

function showNotice(message) {
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
  notice.style.boxShadow =
    "0 8px 25px rgba(0,0,0,0.15)";

  document.body.appendChild(notice);

  setTimeout(function () {
    notice.remove();
  }, 1800);
}


// ==========================================
// ADD MESSAGE
// ==========================================

function addMessage(role, text) {
  welcome.classList.add("hidden");

  const message =
    document.createElement("div");

  message.className =
    "message " + role;

  const content =
    document.createElement("div");

  content.className = "message-content";

  content.textContent = text;

  message.appendChild(content);

  messagesContainer.appendChild(message);

  scrollToBottom();

  return message;
}


// ==========================================
// LOADING MESSAGE
// ==========================================

function addLoadingMessage() {
  welcome.classList.add("hidden");

  const message =
    document.createElement("div");

  message.className =
    "message assistant";

  message.id = "loadingMessage";

  const content =
    document.createElement("div");

  content.className =
    "message-content";

  const loading =
    document.createElement("div");

  loading.className =
    "loading-message";

  for (let i = 0; i < 3; i++) {
    const dot =
      document.createElement("span");

    dot.className = "loading-dot";

    loading.appendChild(dot);
  }

  content.appendChild(loading);

  message.appendChild(content);

  messagesContainer.appendChild(message);

  scrollToBottom();

  return message;
}


function removeLoadingMessage() {
  const loading =
    document.getElementById(
      "loadingMessage"
    );

  if (loading) {
    loading.remove();
  }
}


// ==========================================
// SCROLL
// ==========================================

function scrollToBottom() {
  requestAnimationFrame(function () {
    messagesContainer.scrollTop =
      messagesContainer.scrollHeight;
  });
}


// ==========================================
// TEXTAREA AUTO RESIZE
// ==========================================

function resizeTextarea() {
  messageInput.style.height = "auto";

  const height =
    Math.min(
      messageInput.scrollHeight,
      160
    );

  messageInput.style.height =
    height + "px";
}


messageInput.addEventListener(
  "input",
  resizeTextarea
);


// ==========================================
// ENTER TO SEND
// SHIFT + ENTER = NEW LINE
// ==========================================

messageInput.addEventListener(
  "keydown",
  function (event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      chatForm.requestSubmit();
    }
  }
);


// ==========================================
// CHAT FORM
// ==========================================

chatForm.addEventListener(
  "submit",
  async function (event) {
    event.preventDefault();

    if (isSending) {
      return;
    }

    const prompt =
      messageInput.value.trim();

    if (!prompt) {
      return;
    }

    const apiToken =
      getApiToken();

    if (!apiToken) {
      addMessage(
        "assistant",
        "Please open Settings and enter your Replicate API token first."
      );

      settingsDialog.showModal();

      apiTokenInput.focus();

      return;
    }

    addMessage(
      "user",
      prompt
    );

    messageInput.value = "";

    messageInput.style.height =
      "auto";

    isSending = true;

    sendBtn.disabled = true;

    addLoadingMessage();

    try {
      const response =
        await sendToReplicate(
          prompt,
          apiToken,
          getSystemPrompt()
        );

      removeLoadingMessage();

      const text =
        extractResponseText(
          response
        );

      if (text) {
        addMessage(
          "assistant",
          text
        );
      } else {
        addMessage(
          "assistant",
          "The model returned an empty response."
        );
      }
    } catch (error) {
      removeLoadingMessage();

      addMessage(
        "assistant",
        "Error: " +
          getReadableError(error)
      );
    }

    isSending = false;

    sendBtn.disabled = false;

    messageInput.focus();
  }
);


// ==========================================
// REPLICATE REQUEST
// ==========================================

async function sendToReplicate(
  prompt,
  apiToken,
  systemPrompt
) {
  const body = {
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

  const response =
    await fetch(
      REPLICATE_URL,
      {
        method: "POST",

        headers: {
          "Authorization":
            "Bearer " + apiToken,

          "Content-Type":
            "application/json",

          "Prefer": "wait"
        },

        body:
          JSON.stringify(body)
      }
    );

  let data;

  try {
    data = await response.json();
  } catch (error) {
    throw new Error(
      "Replicate returned an invalid response."
    );
  }

  if (!response.ok) {
    const message =
      data.detail ||
      data.error ||
      data.title ||
      "Request failed with HTTP " +
        response.status;

    throw new Error(message);
  }

  return data;
}


// ==========================================
// EXTRACT RESPONSE
// ==========================================

function extractResponseText(data) {
  if (!data) {
    return "";
  }

  if (
    typeof data.output ===
    "string"
  ) {
    return data.output.trim();
  }

  if (
    Array.isArray(data.output)
  ) {
    return data.output
      .map(function (item) {
        if (
          typeof item ===
          "string"
        ) {
          return item;
        }

        if (
          item &&
          typeof item ===
            "object"
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
    typeof data.output ===
      "object"
  ) {
    return (
      data.output.text ||
      data.output.content ||
      data.output.output ||
      ""
    ).trim();
  }

  if (
    typeof data.text ===
    "string"
  ) {
    return data.text.trim();
  }

  if (
    typeof data.content ===
    "string"
  ) {
    return data.content.trim();
  }

  return "";
}


// ==========================================
// ERROR MESSAGE
// ==========================================

function getReadableError(error) {
  if (!error) {
    return "Something went wrong.";
  }

  const message =
    error.message ||
    String(error);

  const lower =
    message.toLowerCase();

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
    return "The API rate limit was reached. Please wait and try again.";
  }

  if (
    lower.includes("failed to fetch") ||
    lower.includes("network")
  ) {
    return "The request could not reach Replicate. Check your internet connection.";
  }

  return message;
}


// ==========================================
// INITIALIZE APP
// ==========================================

loadSettings();

messageInput.focus();


// ==========================================
// ESCAPE KEY
// ==========================================

document.addEventListener(
  "keydown",
  function (event) {
    if (
      event.key === "Escape" &&
      settingsDialog.open
    ) {
      settingsDialog.close();
    }
  }
);
```
