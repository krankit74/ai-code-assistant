const API_URL = "http://localhost:3000/api/auth";

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("authMessage");
const submitBtn = document.getElementById("submitBtn");

function showMessage(text, type = "error") {
  message.textContent = text;
  message.className = `auth-message ${type}`;
}

async function sendAuthRequest(endpoint, payload) {
  const response = await fetch(`${API_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

// Registration
if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      showMessage("Passwords do not match.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account...";
    showMessage("");

    try {
      const data = await sendAuthRequest("register", {
        name,
        email,
        password,
      });

      showMessage(data.message + " Redirecting to sign in...", "success");

      registerForm.reset();

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1000);
    } catch (error) {
      showMessage(error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Create account";
    }
  });
}

// Login
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    submitBtn.disabled = true;
    submitBtn.textContent = "Signing in...";
    showMessage("");

    try {
      const data = await sendAuthRequest("login", {
        email,
        password,
      });

      // Keep the JWT in sessionStorage for this browser tab.
      sessionStorage.setItem("authToken", data.token);
      sessionStorage.setItem("currentUser", JSON.stringify(data.user));

      showMessage("Login successful!", "success");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 300);
    } catch (error) {
      showMessage(error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign in";
    }
  });
}
