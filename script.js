const MODEL_URL =
  "https://api.replicate.com/v1/models/openai/gpt-4.1-nano/predictions";

const settingsBtn = document.getElementById("settingsBtn");
const settingsDialog = document.getElementById("settingsDialog");

const settingsForm = document.getElementById("settingsForm");
const apiToken = document.getElementById("apiToken");
const systemPrompt = document.getElementById("systemPrompt");

const closeSettingsBtn =
  document.getElementById("closeSettingsBtn");

const cancelSettingsBtn =
  document.getElementById("cancelSettingsBtn");

const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const sendBtn = document.getElementById("sendBtn");

let chatHistory = [];


// ================================
// LOAD SAVED SETTINGS
// ================================

function loadSettings() {
  const savedToken =
    localStorage.getItem("replicateApiToken") || "";

  const savedSystemPrompt =
    localStorage.getItem("systemPrompt") || "";

  apiToken.value = savedToken;
  systemPrompt.value = savedSystemPrompt;
}


// ================================
// SAVE SETTINGS
// ================================

function saveSettings() {
  const token = apiToken.value.trim();
  const prompt = systemPrompt.value.trim();

  localStorage.setItem("replicateApiToken", token);
  localStorage.setItem("systemPrompt", prompt);
}


// ================================
// OPEN SETTINGS
// ================================

settingsBtn.addEventListener("click", function () {
  settingsDialog.showModal();
});


// ================================
// CLOSE SETTINGS
// ================================

closeSettingsBtn.addEventListener("click", function () {
  settingsDialog.close();
});

cancelSettingsBtn.addEventListener("click", function () {
  settingsDialog.close();
});


// ================================
// SAVE SETTINGS FORM
// ================================

settingsForm.addEventListener("submit", function (event) {
  event.preventDefault();

  saveSettings();

  settingsDialog.close();
});


// ================================
// CLOSE DIALOG WHEN CLICKING OUTSIDE
// ================================

settingsDialog.addEventListener("click", function (event) {
  const rect = settingsDialog.getBoundingClientRect();

  const clickedOutside =
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom;

  if (clickedOutside) {
    settingsDialog.close();
  }
});


// ================================
// CREATE MESSAGE
// ================================

function addMessage(text, sender) {
  const message = document.createElement("div");

  message.className =
    "message " + sender;

  const bubble = document.createElement("div");

  bubble.className = "message-bubble";

  bubble.textContent = text;

  message.appendChild(bubble);

  messages.appendChild(message);

  messages.scrollTop = messages.scrollHeight;

  return message;
}


// ================================
// LOADING MESSAGE
// ================================

function addLoadingMessage() {
  const message = document.createElement("div");

  message.className = "message assistant";

  message.innerHTML = `
    <div class="message-bubble loading">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;

  messages.appendChild(message);

  messages.scrollTop = messages.scrollHeight;

  return message;
}


// ================================
// GET API TOKEN
// ================================

function getApiToken() {
  return (
    localStorage.getItem("replicateApiToken") || ""
  ).trim();
}


// ================================
// GET SYSTEM PROMPT
// ================================

function getSystemPrompt() {
  return (
    localStorage.getItem("systemPrompt") || ""
  ).trim();
}


// ================================
// SHOW ERROR
// ================================

function showError(message) {
  addMessage(message, "assistant");
}


// ================================
// SEND MESSAGE TO REPLICATE
// ================================

async function sendToReplicate(userPrompt) {
  const token = getApiToken();

  if (!token) {
    throw new Error(
      "No API token found. Please open Settings and enter your Replicate API token."
    );
  }

  const system = getSystemPrompt();

  const requestBody = {
    input: {
      top_p: 1,
      prompt: userPrompt,
      messages: chatHistory,
      image_input: [],
      temperature: 1,
      system_prompt: system,
      presence_penalty: 0,
      frequency_penalty: 0,
      max_completion_tokens: 2000
    }
  };

  const response = await fetch(MODEL_URL, {
    method: "POST",

    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
      "Prefer": "wait"
    },

    body: JSON.stringify(requestBody)
  });

  let data;

  try {
    data = await response.json();
  } catch (error) {
    throw new Error(
      "The server returned an invalid response."
    );
  }

  if (!response.ok) {
    let errorMessage =
      data.detail ||
      data.error ||
      data.title ||
      "The API request failed.";

    throw new Error(
      response.status + ": " + errorMessage
    );
  }

  return extractOutput(data);
}


// ================================
// EXTRACT MODEL OUTPUT
// ================================

function extractOutput(data) {
  if (!data) {
    return "";
  }

  if (typeof data.output === "string") {
    return data.output;
  }

  if (Array.isArray(data.output)) {
    return data.output.join("");
  }

  if (
    data.output &&
    typeof data.output === "object"
  ) {
    if (typeof data.output.text === "string") {
      return data.output.text;
    }

    if (
      typeof data.output.content === "string"
    ) {
      return data.output.content;
    }
  }

  if (typeof data.text === "string") {
    return data.text;
  }

  if (
    data.prediction &&
    typeof data.prediction.output === "string"
  ) {
    return data.prediction.output;
  }

  return JSON.stringify(data);
}


// ================================
// ERROR MESSAGE
// ================================

function getFriendlyError(error) {
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
    return "The API token does not have permission to use this model.";
  }

  if (
    lower.includes("429") ||
    lower.includes("rate limit")
  ) {
    return "Too many requests were sent. Please wait a moment and try again.";
  }

  if (
    lower.includes("failed to fetch") ||
    lower.includes("network")
  ) {
    return "Network error. Please check your internet connection.";
  }

  return message;
}


// ================================
// SEND CHAT MESSAGE
// ================================

chatForm.addEventListener(
  "submit",
  async function (event) {
    event.preventDefault();

    const text =
      messageInput.value.trim();

    if (!text) {
      return;
    }

    const token = getApiToken();

    if (!token) {
      settingsDialog.showModal();
      apiToken.focus();
      return;
    }

    addMessage(text, "user");

    messageInput.value = "";

    messageInput.style.height = "auto";

    sendBtn.disabled = true;

    messageInput.disabled = true;

    const loadingMessage =
      addLoadingMessage();

    try {
      const answer =
        await sendToReplicate(text);

      loadingMessage.remove();

      if (!answer || !answer.trim()) {
        showError(
          "The model returned an empty response."
        );
      } else {
        addMessage(
          answer,
          "assistant"
        );

        chatHistory.push({
          role: "user",
          content: text
        });

        chatHistory.push({
          role: "assistant",
          content: answer
        });
      }
    } catch (error) {
      loadingMessage.remove();

      showError(
        getFriendlyError(error)
      );
    } finally {
      sendBtn.disabled = false;

      messageInput.disabled = false;

      messageInput.focus();
    }
  }
);


// ================================
// TEXTAREA AUTO RESIZE
// ================================

messageInput.addEventListener(
  "input",
  function () {
    this.style.height = "auto";

    this.style.height =
      Math.min(
        this.scrollHeight,
        160
      ) + "px";
  }
);


// ================================
// ENTER TO SEND
// SHIFT + ENTER = NEW LINE
// ================================

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


// ================================
// ESCAPE CLOSES SETTINGS
// ================================

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


// ================================
// START APP
// ================================

loadSettings();
