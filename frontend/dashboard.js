const welcomeMessage = document.getElementById("welcomeMessage");
const totalSaved = document.getElementById("totalSaved");
const totalExplain = document.getElementById("totalExplain");
const totalDebug = document.getElementById("totalDebug");
const totalOptimize = document.getElementById("totalOptimize");
const languageStats = document.getElementById("languageStats");
const recentActivity = document.getElementById("recentActivity");

async function loadDashboard() {
  const token = sessionStorage.getItem("authToken");
  const currentUser = JSON.parse(
    sessionStorage.getItem("currentUser") || "null",
  );

  if (!token) {
    welcomeMessage.textContent = "Please login first";
    recentActivity.textContent =
      "Login to view your dashboard and saved responses.";
    languageStats.textContent = "Login required.";
    return;
  }

  if (currentUser?.name) {
    welcomeMessage.textContent = `Welcome back, ${currentUser.name}!`;
  }

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
      throw new Error(data.message || "Unable to load dashboard");
    }

    const responses = data.responses || [];

    totalSaved.textContent = responses.length;
    totalExplain.textContent = responses.filter(
      (item) => item.type === "Explain",
    ).length;
    totalDebug.textContent = responses.filter(
      (item) => item.type === "Debug",
    ).length;
    totalOptimize.textContent = responses.filter(
      (item) => item.type === "Optimize",
    ).length;

    // Programming language statistics
    languageStats.innerHTML = "";

    if (responses.length === 0) {
      languageStats.textContent = "No language statistics yet.";
    } else {
      const counts = {};

      responses.forEach((item) => {
        const language = item.language || "Unknown";
        counts[language] = (counts[language] || 0) + 1;
      });

      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([language, count]) => {
          const card = document.createElement("div");
          card.className = "language-stat";

          const name = document.createElement("strong");
          name.textContent = language;

          const amount = document.createElement("span");
          amount.textContent = `${count} saved response(s)`;

          card.append(name, amount);
          languageStats.appendChild(card);
        });
    }

    // Latest five saved responses
    recentActivity.innerHTML = "";

    if (responses.length === 0) {
      recentActivity.textContent =
        "No saved responses yet. Start by saving an AI response.";
    } else {
      responses.slice(0, 5).forEach((item) => {
        const card = document.createElement("div");
        card.className = "activity-item";

        const title = document.createElement("strong");
        title.textContent = item.title || `${item.type} - ${item.language}`;

        const meta = document.createElement("p");
        meta.textContent = `${item.type} • ${item.language} • ${new Date(
          item.createdAt,
        ).toLocaleString()}`;

        card.append(title, meta);
        recentActivity.appendChild(card);
      });
    }
  } catch (error) {
    console.error("Dashboard error:", error);
    totalSaved.textContent = "—";
    recentActivity.textContent = error.message;
    languageStats.textContent = "Unable to load statistics.";
  }
}

loadDashboard();

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", () => {
  const confirmed = confirm("Are you sure you want to logout?");

  if (!confirmed) {
    return;
  }

  // Login session data clear karo
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("currentUser");

  // Login page par redirect karo
  window.location.href = "login.html";
});
