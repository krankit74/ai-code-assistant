const savedResponsesList = document.getElementById("savedResponsesList");
const savedMessage = document.getElementById("savedMessage");
const refreshSavedBtn = document.getElementById("refreshSavedBtn");

const searchSaved = document.getElementById("searchSaved");
const filterType = document.getElementById("filterType");
const filterLanguage = document.getElementById("filterLanguage");

let allSavedResponses = [];

async function loadSavedResponses() {
  const token = sessionStorage.getItem("authToken");

  if (!token) {
    savedMessage.textContent =
      "Please login first to view your saved responses.";
    savedResponsesList.innerHTML = "";
    return;
  }

  savedMessage.textContent = "Loading saved responses...";
  savedResponsesList.innerHTML = "";

  try {
    const result = await fetch("http://localhost:3000/api/saved-responses", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await result.json();

    if (result.status === 401) {
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("currentUser");

      alert("Your session has expired. Please login again.");
      window.location.replace("login.html");
      return;
    }

    if (!result.ok) {
      throw new Error(data.message || "Unable to load saved responses");
    }

    if (!data.responses || data.responses.length === 0) {
      savedMessage.textContent =
        "No saved responses yet. Save an AI response first.";
      return;
    }

    savedMessage.textContent = `Found ${data.responses.length} saved response(s).`;

    allSavedResponses = data.responses || [];
    renderFilteredResponses();
  } catch (error) {
    console.error("Load saved responses error:", error);
    savedMessage.textContent = error.message;
  }
}

function renderResponseCards(responses) {
  savedResponsesList.innerHTML = "";

  if (responses.length === 0) {
    savedMessage.textContent = "No matching saved responses found.";
    return;
  }

  savedMessage.textContent = `Showing ${responses.length} saved response(s).`;

  responses.forEach((item) => {
    const card = document.createElement("article");
    card.className = "saved-card";

    const title = document.createElement("h3");
    title.textContent = item.title || `${item.type} - ${item.language}`;

    const meta = document.createElement("p");
    meta.className = "saved-meta";
    meta.textContent = `${item.type} • ${item.language} • ${new Date(item.createdAt).toLocaleString()}`;

    const codeHeading = document.createElement("h4");
    codeHeading.textContent = "Your Code";

    const code = document.createElement("pre");
    code.className = "saved-code";
    code.textContent = item.code;

    const responseHeading = document.createElement("h4");
    responseHeading.textContent = "AI Response";

    const aiResponse = document.createElement("div");
    aiResponse.className = "saved-response";
    aiResponse.textContent = item.response;

    const actions = document.createElement("div");
    actions.className = "saved-card-actions";

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.textContent = "Open in Editor";

    openBtn.addEventListener("click", () => {
      sessionStorage.setItem("openSavedCode", item.code);
      sessionStorage.setItem("openSavedLanguage", item.language);
      sessionStorage.setItem("openSavedResponse", item.response);
      sessionStorage.setItem("openSavedType", item.type);

      window.location.href = "index.html";
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "delete-saved-btn";

    deleteBtn.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to delete this saved response?")) {
        return;
      }

      deleteBtn.disabled = true;
      deleteBtn.textContent = "Deleting...";

      try {
        const result = await fetch(
          `http://localhost:3000/api/saved-responses/${encodeURIComponent(item._id)}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("authToken")}`,
            },
          },
        );

        const data = await result.json();

        if (!result.ok) {
          throw new Error(data.message || "Unable to delete response");
        }

        allSavedResponses = allSavedResponses.filter(
          (saved) => saved._id !== item._id,
        );

        renderFilteredResponses();
      } catch (error) {
        console.error("Delete response error:", error);
        alert(error.message);
        deleteBtn.disabled = false;
        deleteBtn.textContent = "Delete";
      }
    });

    const copyCodeBtn = document.createElement("button");
    copyCodeBtn.type = "button";
    copyCodeBtn.textContent = "Copy Code";

    copyCodeBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(item.code);
        copyCodeBtn.textContent = "Copied!";

        setTimeout(() => {
          copyCodeBtn.textContent = "Copy Code";
        }, 1500);
      } catch (error) {
        copyCodeBtn.textContent = "Copy failed";
      }
    });

    actions.append(openBtn, deleteBtn, copyCodeBtn);

    card.append(
      title,
      meta,
      codeHeading,
      code,
      responseHeading,
      aiResponse,
      actions,
    );

    savedResponsesList.appendChild(card);
  });
}

function renderFilteredResponses() {
  const searchText = searchSaved.value.trim().toLowerCase();
  const selectedType = filterType.value;
  const selectedLanguage = filterLanguage.value;

  const filteredResponses = allSavedResponses.filter((item) => {
    const matchesSearch = [
      item.title,
      item.code,
      item.response,
      item.language,
      item.type,
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(searchText),
    );

    const matchesType = selectedType === "All" || item.type === selectedType;

    const matchesLanguage =
      selectedLanguage === "All" ||
      item.language.toLowerCase() === selectedLanguage.toLowerCase();

    return matchesSearch && matchesType && matchesLanguage;
  });

  renderResponseCards(filteredResponses);
}

searchSaved.addEventListener("input", renderFilteredResponses);
filterType.addEventListener("change", renderFilteredResponses);
filterLanguage.addEventListener("change", renderFilteredResponses);

refreshSavedBtn.addEventListener("click", loadSavedResponses);

loadSavedResponses();
