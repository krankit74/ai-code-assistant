const codeInput = document.getElementById("codeInput");
const explainBtn = document.getElementById("explainBtn");
const debugBtn = document.getElementById("debugBtn");
const optimizeBtn = document.getElementById("optimizeBtn");
const response = document.getElementById("response");

const saveResponseBtn = document.getElementById("saveResponseBtn");
const saveMessage = document.getElementById("saveMessage");

// Latest AI response ki details
let latestAIResponse = null;

const lineNumbers = document.getElementById("lineNumbers");
const clearBtn = document.getElementById("clearBtn");

const languageSelect = document.getElementById("languageSelect");

const historyList = document.getElementById("historyList");

const clearHistoryBtn = document.getElementById("clearHistoryBtn");

function saveToHistory(type, code, language) {
  const history = JSON.parse(localStorage.getItem("codeHistory")) || [];

  const item = {
    id: Date.now(),
    type: type,
    code: code,
    language: language,
    time: new Date().toLocaleTimeString(),
  };

  history.unshift(item);

  // Keep only the latest 10
  if (history.length > 10) {
    history.pop();
  }

  localStorage.setItem("codeHistory", JSON.stringify(history));

  renderHistory();
}

function prepareSaveResponse(type, code, language, aiResponse) {
  latestAIResponse = {
    type: type,
    code: code,
    language: language,
    response: aiResponse,
  };

  if (saveResponseBtn) {
    saveResponseBtn.hidden = false;
  }

  if (saveMessage) {
    saveMessage.textContent = "";
  }
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem("codeHistory")) || [];

  if (history.length === 0) {
    historyList.innerHTML = `
            <div class="empty-history">
                No analyses yet
            </div>
        `;

    return;
  }

  historyList.innerHTML = history
    .map((item) => {
      const preview = item.code.replace(/\s+/g, " ").substring(0, 70);

      return `
            <div class="history-item">

                <div class="history-type">
                    ${getHistoryIcon(item.type)}
                    <strong>${item.type}</strong>
                </div>

                <div class="history-code">
                    ${escapeHTML(preview)}
                </div>

                <div class="history-meta">
                    ${item.language}
                    •
                    ${item.time}
                </div>

            </div>
        `;
    })
    .join("");
}

function getHistoryIcon(type) {
  if (type === "Explain") {
    return "✦";
  }

  if (type === "Debug") {
    return "⚡";
  }

  if (type === "Optimize") {
    return "↗";
  }

  return "•";
}

clearHistoryBtn.addEventListener("click", function () {
  localStorage.removeItem("codeHistory");

  renderHistory();
});

function updateLineNumbers() {
  const lines = codeInput.value.split("\n").length;

  let numbers = "";

  for (let i = 1; i <= lines; i++) {
    numbers += i + "<br>";
  }

  lineNumbers.innerHTML = numbers;
}

codeInput.addEventListener("input", updateLineNumbers);
updateLineNumbers();

codeInput.addEventListener("keydown", function (event) {
  if (event.key === "Tab") {
    event.preventDefault();

    const start = codeInput.selectionStart;
    const end = codeInput.selectionEnd;

    codeInput.value =
      codeInput.value.substring(0, start) +
      "    " +
      codeInput.value.substring(end);

    codeInput.selectionStart = start + 4;
    codeInput.selectionEnd = start + 4;

    updateLineNumbers();
  }
});

clearBtn.addEventListener("click", function () {
  codeInput.value = "";

  response.textContent = "";

  updateLineNumbers();

  codeInput.focus();
});

explainBtn.addEventListener("click", async function () {
  const code = codeInput.value;

  // Don't send empty code
  if (code.trim() === "") {
    showLoading("Please enter some code first.");
    return;
  }

  // Disable button while AI is working
  explainBtn.disabled = true;
  explainBtn.textContent = "Analyzing...";

  // Show loading message
  showLoading("AI is analyzing your code...");

  try {
    console.log("Code from frontend:");
    console.log(code);

    const result = await fetch("http://localhost:3000/api/explain", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        code: code,
        language: languageSelect.value,
      }),
    });

    const data = await result.json();

    console.log("Response from backend:");
    console.log(data);

    if (data.explanation) {
      response.innerHTML = formatAIResponse(
        data.explanation,
        languageSelect.value,
      );

      prepareSaveResponse(
        "Explain",
        code,
        languageSelect.value,
        data.explanation,
      );

      saveToHistory("Explain", code, languageSelect.value);

      document.querySelectorAll("#response pre code").forEach((block) => {
        hljs.highlightElement(block);
      });
    } else {
      showLoading("Something went wrong.");
    }
  } catch (error) {
    console.error("Frontend error:", error);

    showLoading("Unable to connect to the backend.");
  } finally {
    // Enable button again
    explainBtn.disabled = false;
    explainBtn.textContent = "Explain";
  }
});

debugBtn.addEventListener("click", async function () {
  const code = codeInput.value;

  // Check if code is empty
  if (code.trim() === "") {
    showLoading("Please enter some code first.");
    return;
  }

  // Disable button
  debugBtn.disabled = true;
  debugBtn.textContent = "Debugging...";

  // Loading message
  showLoading("AI is debugging your code...");

  try {
    console.log("Code sent for debugging:");
    console.log(code);

    const result = await fetch("http://localhost:3000/api/debug", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        code: code,
        language: languageSelect.value,
      }),
    });

    const data = await result.json();

    console.log("Debug response from backend:");
    console.log(data);

    if (data.debug) {
      response.innerHTML = formatAIResponse(data.debug, languageSelect.value);

      prepareSaveResponse("Debug", code, languageSelect.value, data.debug);

      saveToHistory("Debug", code, languageSelect.value);

      document.querySelectorAll("#response pre code").forEach((block) => {
        hljs.highlightElement(block);
      });
    } else {
      showLoading("Something went wrong.");
    }
  } catch (error) {
    console.error("Debug frontend error:", error);

    showLoading("Unable to connect to the backend.");
  } finally {
    debugBtn.disabled = false;
    debugBtn.textContent = "Debug";
  }
});

optimizeBtn.addEventListener("click", async function () {
  const code = codeInput.value;

  if (code.trim() === "") {
    showLoading("Please enter some code first.");
    return;
  }

  optimizeBtn.disabled = true;
  optimizeBtn.textContent = "Optimizing...";

  showLoading("AI is analyzing your code for improvements...");

  try {
    console.log("Code sent for optimization:");
    console.log(code);

    const result = await fetch("http://localhost:3000/api/optimize", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        code: code,
        language: languageSelect.value,
      }),
    });

    const data = await result.json();

    console.log("Optimization response from backend:");
    console.log(data);

    if (data.optimization) {
      response.innerHTML = formatAIResponse(
        data.optimization,
        languageSelect.value,
      );

      prepareSaveResponse(
        "Optimize",
        code,
        languageSelect.value,
        data.optimization,
      );
      saveToHistory("Optimize", code, languageSelect.value);
      document.querySelectorAll("#response pre code").forEach((block) => {
        hljs.highlightElement(block);
      });
    } else {
      showLoading("Something went wrong.");
    }
  } catch (error) {
    console.error("Optimize frontend error:", error);

    showLoading("Unable to connect to the backend.");
  } finally {
    optimizeBtn.disabled = false;
    optimizeBtn.textContent = "Optimize";
  }
});

function formatAIResponse(text, language) {
  const codeBlocks = [];

  // 1. Extract fenced code blocks first
  let formatted = text.replace(
    /```(?:javascript|js)?\s*([\s\S]*?)```/g,
    function (match, code) {
      const placeholder = `___CODE_BLOCK_${codeBlocks.length}___`;

      codeBlocks.push(createCodeBlock(match, code, language));

      return placeholder;
    },
  );

  // 2. Escape HTML from normal AI text
  formatted = escapeHTML(formatted);

  // 3. Headings
  formatted = formatted
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>");

  // 4. Bold
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // 5. Inline code
  formatted = formatted.replace(
    /`([^`\n]+)`/g,
    '<code class="inline-code">$1</code>',
  );

  // 6. Numbered lists
  formatted = formatted.replace(
    /^\s*(\d+)\.\s+(.*)$/gm,
    '<div class="numbered-item"><span>$1.</span> $2</div>',
  );

  // 7. Bullet lists
  formatted = formatted.replace(
    /^\s*[-*]\s+(.*)$/gm,
    '<div class="bullet-item">• $1</div>',
  );

  // 8. Normal line breaks
  formatted = formatted.replace(/\n/g, "<br>");

  // 9. Restore code blocks
  codeBlocks.forEach(function (block, index) {
    formatted = formatted.replace(`___CODE_BLOCK_${index}___`, block);
  });

  return formatted;
}

function escapeHTML(text) {
  const div = document.createElement("div");

  div.textContent = text;

  return div.innerHTML;
}

function createCodeBlock(match, code, language = "javascript") {
  const cleanCode = code.trim();

  const languageNames = {
    javascript: "JavaScript",
    js: "JavaScript",
    python: "Python",
    java: "Java",
    cpp: "C++",
    c: "C",
    typescript: "TypeScript",
    html: "HTML",
    css: "CSS",
  };

  const displayLanguage = languageNames[language.toLowerCase()] || language;

  const highlightLanguage =
    language.toLowerCase() === "cpp" ? "cpp" : language.toLowerCase();

  return `
        <div class="code-block">

            <div class="code-header">

                <span>${displayLanguage}</span>

                <button
                    type="button"
                    class="copy-btn"
                    data-code="${encodeURIComponent(cleanCode)}"
                >
                    Copy
                </button>

            </div>

            <pre>
                <code class="language-${highlightLanguage}">${escapeHTML(cleanCode)}</code>
            </pre>

        </div>
    `;
}

document.addEventListener("click", async function (event) {
  if (!event.target.classList.contains("copy-btn")) {
    return;
  }

  const button = event.target;

  const code = decodeURIComponent(button.dataset.code);

  try {
    await navigator.clipboard.writeText(code);

    button.textContent = "Copied!";

    setTimeout(() => {
      button.textContent = "Copy";
    }, 1500);
  } catch (error) {
    console.error("Copy failed:", error);

    button.textContent = "Failed";

    setTimeout(() => {
      button.textContent = "Copy";
    }, 1500);
  }
});

function showLoading(message) {
  response.innerHTML = `
        <div class="ai-loading">

            <div class="loading-icon">✦</div>

            <h3>${message}</h3>

            <p>Gemini is analyzing your code...</p>

            <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>

        </div>
    `;
}

renderHistory();

const savedCode = sessionStorage.getItem("openSavedCode");
const savedLanguage = sessionStorage.getItem("openSavedLanguage");
const savedResponse = sessionStorage.getItem("openSavedResponse");
const savedType = sessionStorage.getItem("openSavedType");

if (savedCode !== null) {
  codeInput.value = savedCode;

  if (savedLanguage) {
    languageSelect.value = savedLanguage;
  }

  updateLineNumbers();

  if (savedResponse) {
    response.innerHTML = formatAIResponse(
      savedResponse,
      savedLanguage || languageSelect.value,
    );

    document.querySelectorAll("#response pre code").forEach((block) => {
      hljs.highlightElement(block);
    });

    // Loaded response ko dobara save karne ki details set karo
    prepareSaveResponse(
      savedType || "Explain",
      savedCode,
      savedLanguage || languageSelect.value,
      savedResponse,
    );
  }

  // Temporary data remove karo
  sessionStorage.removeItem("openSavedCode");
  sessionStorage.removeItem("openSavedLanguage");
  sessionStorage.removeItem("openSavedResponse");
  sessionStorage.removeItem("openSavedType");
}

if (saveResponseBtn) {
  saveResponseBtn.addEventListener("click", async function () {
    if (!latestAIResponse) {
      return;
    }

    const token = sessionStorage.getItem("authToken");

    if (!token) {
      if (saveMessage) {
        saveMessage.textContent = "Please login to save your response.";
      }
      return;
    }

    saveResponseBtn.disabled = true;
    saveResponseBtn.textContent = "Saving...";

    try {
      const result = await fetch("http://localhost:3000/api/saved-responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(latestAIResponse),
      });

      const data = await result.json();

      if (!result.ok) {
        throw new Error(data.message || "Unable to save response");
      }

      if (saveMessage) {
        saveMessage.textContent = "Response saved successfully!";
      }
    } catch (error) {
      console.error("Save response error:", error);

      if (saveMessage) {
        saveMessage.textContent = error.message;
      }
    } finally {
      saveResponseBtn.disabled = false;
      saveResponseBtn.textContent = "💾 Save Response";
    }
  });
}
