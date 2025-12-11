document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("jwt_token");
            sessionStorage.removeItem("jwt_token");
            window.location.href = "/public/pages/auth/login.html";
        });
    }
});