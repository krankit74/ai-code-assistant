(function protectPage() {
  const token = sessionStorage.getItem("authToken");

  if (!token) {
    const currentPage = window.location.pathname.split("/").pop();

    // Login page par redirect karte waqt requested page yaad rakho
    if (currentPage !== "login.html") {
      sessionStorage.setItem("redirectAfterLogin", currentPage);
    }

    window.location.replace("login.html");
  }
})();
