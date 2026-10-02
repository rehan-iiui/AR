const MODEL_URL =
"https://api.replicate.com/v1/models/openai/gpt-4.1-nano/predictions";

// ======================================================
// ELEMENTS
// ======================================================

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

const welcome = document.getElementById("welcome");

// ======================================================
// CHAT HISTORY
// ======================================================

let chatHistory = [];

// ======================================================
// LOAD SAVED SETTINGS
// ======================================================

function loadSettings() {
apiToken.value =
localStorage.getItem("replicateApiToken") || "";

systemPrompt.value =
localStorage.getItem("systemPrompt") || "";
}

// ======================================================
// SAVE SETTINGS
// ======================================================

function saveSettings() {
const token = apiToken.value.trim();
const prompt = systemPrompt.value.trim();

localStorage.setItem(
"replicateApiToken",
token
);

localStorage.setItem(
"systemPrompt",
prompt
);
}

// ======================================================
// GET API TOKEN
// ======================================================

function getApiToken() {
return (
localStorage.getItem("replicateApiToken") || ""
).trim();
}

// ======================================================
// GET SYSTEM PROMPT
// ======================================================

function getSystemPrompt() {
return (
localStorage.getItem("systemPrompt") || ""
).trim();
}

// ======================================================
// OPEN SETTINGS
// ======================================================

settingsBtn.addEventListener("click", function () {
  settingsDialog.showModal();
});


// ======================================================
// CLOSE SETTINGS
// ======================================================

closeSettingsBtn.addEventListener(
"click",
function () {
settingsDialog.close();
}
);

cancelSettingsBtn.addEventListener(
"click",
function () {
settingsDialog.close();
}
);

// ======================================================
// SAVE SETTINGS FORM
// ======================================================

settingsForm.addEventListener(
"submit",
function (event) {
event.preventDefault();

```
saveSettings();

settingsDialog.close();
```

}
);

// ======================================================
// CLOSE DIALOG WHEN CLICKING OUTSIDE
// ======================================================

settingsDialog.addEventListener(
"click",
function (event) {
const rect =
settingsDialog.getBoundingClientRect();

```
const clickedOutside =
  event.clientX < rect.left ||
  event.clientX > rect.right ||
  event.clientY < rect.top ||
  event.clientY > rect.bottom;

if (clickedOutside) {
  settingsDialog.close();
}
```

}
);

// ======================================================
// ADD MESSAGE
// ======================================================

function addMessage(text, sender) {
const message =
document.createElement("div");

message.className =
"message " + sender;

const bubble =
document.createElement("div");

bubble.className =
"message-content";

bubble.textContent = text;

message.appendChild(bubble);

messages.appendChild(message);

if (welcome) {
welcome.classList.add("hidden");
}

scrollToBottom();

return message;
}

// ======================================================
// ADD LOADING MESSAGE
// ======================================================

function addLoadingMessage() {
const message =
document.createElement("div");

message.className =
"message assistant";

const loading =
document.createElement("div");

loading.className =
"loading-message";

loading.innerHTML = `     <span class="loading-dot"></span>     <span class="loading-dot"></span>     <span class="loading-dot"></span>
  `;

message.appendChild(loading);

messages.appendChild(message);

scrollToBottom();

return message;
}

// ======================================================
// SCROLL TO BOTTOM
// ======================================================

function scrollToBottom() {
requestAnimationFrame(
function () {
messages.scrollTop =
messages.scrollHeight;
}
);
}

// ======================================================
// SHOW ERROR
// ======================================================

function showError(message) {
addMessage(
"⚠ " + message,
"assistant"
);
}

// ======================================================
// SEND REQUEST TO REPLICATE
// ======================================================

async function sendToReplicate(userText) {
const token =
getApiToken();

if (!token) {
throw new Error(
"No API token was found. Open Settings and enter your Replicate API token."
);
}

// ----------------------------------------------------
// Build conversation
// ----------------------------------------------------

const messagesForApi = [
...chatHistory,
{
role: "user",
content: userText
}
];

// ----------------------------------------------------
// Add system prompt if one exists
// ----------------------------------------------------

const system =
getSystemPrompt();

const finalMessages = [];

if (system) {
finalMessages.push({
role: "system",
content: system
});
}

finalMessages.push(
...messagesForApi
);

// ----------------------------------------------------
// Request body
// ----------------------------------------------------

const requestBody = {
input: {
messages: finalMessages,
temperature: 1,
top_p: 1,
frequency_penalty: 0,
presence_penalty: 0,
max_completion_tokens: 2000,
image_input: []
}
};

console.log(
"Sending request to Replicate..."
);

let response;

// ----------------------------------------------------
// SEND REQUEST
// ----------------------------------------------------

try {
response =
await fetch(
MODEL_URL,
{
method: "POST",

```
      headers: {
        "Authorization":
          "Bearer " + token,

        "Content-Type":
          "application/json",

        "Prefer":
          "wait"
      },

      body:
        JSON.stringify(
          requestBody
        )
    }
  );
```

} catch (error) {

```
console.error(
  "Fetch error:",
  error
);

throw new Error(
  "The browser could not complete the connection to Replicate. Check the Console for the exact browser error."
);
```

}

// ----------------------------------------------------
// READ RESPONSE
// ----------------------------------------------------

const responseText =
await response.text();

let data = null;

try {

```
data =
  responseText
    ? JSON.parse(responseText)
    : null;
```

} catch (error) {

```
console.error(
  "Invalid JSON response:",
  responseText
);

throw new Error(
  "Replicate returned an invalid response."
);
```

}

// ----------------------------------------------------
// API ERROR
// ----------------------------------------------------

if (!response.ok) {

```
console.error(
  "Replicate API error:",
  {
    status:
      response.status,

    data:
      data
  }
);


const detail =
  data &&
  (
    data.detail ||
    data.error ||
    data.title
  );


if (detail) {
  throw new Error(
    response.status +
    ": " +
    detail
  );
}


throw new Error(
  "Replicate request failed with HTTP " +
  response.status +
  "."
);
```

}

console.log(
"Replicate response:",
data
);

// ----------------------------------------------------
// EXTRACT RESPONSE
// ----------------------------------------------------

const answer =
extractOutput(data);

if (!answer) {
throw new Error(
"Replicate completed the request but returned no text."
);
}

return answer;
}

// ======================================================
// EXTRACT MODEL OUTPUT
// ======================================================

function extractOutput(data) {

if (!data) {
return "";
}

// Array output

if (Array.isArray(data.output)) {

```
return data.output
  .map(
    function (part) {

      if (
        typeof part ===
        "string"
      ) {
        return part;
      }

      return String(part);
    }
  )
  .join("");
```

}

// String output

if (
typeof data.output ===
"string"
) {
return data.output;
}

// Object output

if (
data.output &&
typeof data.output ===
"object"
) {

```
if (
  typeof data.output.text ===
  "string"
) {
  return data.output.text;
}


if (
  typeof data.output.content ===
  "string"
) {
  return data.output.content;
}
```

}

// Other possible format

if (
typeof data.text ===
"string"
) {
return data.text;
}

return "";
}

// ======================================================
// FRIENDLY ERROR
// ======================================================

function getFriendlyError(error) {

const message =
error &&
error.message
? error.message
: String(error);

const lower =
message.toLowerCase();

// ----------------------------------------------------
// 401
// ----------------------------------------------------

if (
lower.includes("401") ||
lower.includes("unauthorized") ||
lower.includes("invalid token") ||
lower.includes("authentication")
) {

```
return (
  "Your Replicate API token appears to be invalid. Please check the token in Settings."
);
```

}

// ----------------------------------------------------
// 403
// ----------------------------------------------------

if (
lower.includes("403") ||
lower.includes("forbidden") ||
lower.includes("permission")
) {

```
return (
  "Replicate refused the request because the token does not have permission to use this model."
);
```

}

// ----------------------------------------------------
// 429
// ----------------------------------------------------

if (
lower.includes("429") ||
lower.includes("rate limit") ||
lower.includes("too many requests")
) {

```
return (
  "Too many requests were sent. Please wait a moment and try again."
);
```

}

// ----------------------------------------------------
// 400
// ----------------------------------------------------

if (
lower.includes("400") ||
lower.includes("bad request")
) {

```
return (
  "Replicate rejected the request. Check the API input and model settings."
);
```

}

// ----------------------------------------------------
// SERVER ERRORS
// ----------------------------------------------------

if (
lower.includes("500") ||
lower.includes("502") ||
lower.includes("503") ||
lower.includes("504")
) {

```
return (
  "Replicate's server returned an error. Please wait a moment and try again."
);
```

}

// ----------------------------------------------------
// BROWSER CONNECTION ERROR
// ----------------------------------------------------

if (
lower.includes("failed to fetch") ||
lower.includes("networkerror") ||
lower.includes("network error")
) {

```
return (
  "The browser could not complete the connection to Replicate. Your internet may still be working normally. Check the Console for the exact browser error."
);
```

}

return message;
}

// ======================================================
// CHAT FORM
// ======================================================

chatForm.addEventListener(
"submit",
async function (event) {

```
event.preventDefault();


const text =
  messageInput.value.trim();


if (!text) {
  return;
}


// --------------------------------------------------
// Check token
// --------------------------------------------------

const token =
  getApiToken();


if (!token) {

  settingsDialog.showModal();

  apiToken.focus();

  return;
}


// --------------------------------------------------
// Add user message
// --------------------------------------------------

addMessage(
  text,
  "user"
);


messageInput.value = "";

messageInput.style.height =
  "auto";


sendBtn.disabled = true;

messageInput.disabled = true;


// --------------------------------------------------
// Loading
// --------------------------------------------------

const loadingMessage =
  addLoadingMessage();


try {

  const answer =
    await sendToReplicate(
      text
    );


  loadingMessage.remove();


  if (
    !answer ||
    !answer.trim()
  ) {

    showError(
      "The model returned an empty response."
    );

    return;
  }


  // ------------------------------------------------
  // Display answer
  // ------------------------------------------------

  addMessage(
    answer.trim(),
    "assistant"
  );


  // ------------------------------------------------
  // Save history
  // ------------------------------------------------

  chatHistory.push({
    role: "user",
    content: text
  });


  chatHistory.push({
    role: "assistant",
    content: answer.trim()
  });


  console.log(
    "Chat history:",
    chatHistory
  );

} catch (error) {

  loadingMessage.remove();


  console.error(
    "Chat request failed:",
    error
  );


  showError(
    getFriendlyError(error)
  );

} finally {

  sendBtn.disabled = false;

  messageInput.disabled = false;

  messageInput.focus();
}
```

}
);

// ======================================================
// TEXTAREA AUTO RESIZE
// ======================================================

messageInput.addEventListener(
"input",
function () {

```
this.style.height =
  "auto";

this.style.height =
  Math.min(
    this.scrollHeight,
    160
  ) + "px";
```

}
);

// ======================================================
// ENTER TO SEND
// SHIFT + ENTER = NEW LINE
// ======================================================

messageInput.addEventListener(
"keydown",
function (event) {

```
if (
  event.key === "Enter" &&
  !event.shiftKey
) {

  event.preventDefault();

  chatForm.requestSubmit();
}
```

}
);

// ======================================================
// ESCAPE CLOSES SETTINGS
// ======================================================

document.addEventListener(
"keydown",
function (event) {

```
if (
  event.key === "Escape" &&
  settingsDialog.open
) {

  settingsDialog.close();
}
```

}
);

// ======================================================
// START APP
// ======================================================

loadSettings();
