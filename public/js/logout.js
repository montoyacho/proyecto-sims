document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logout-btn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();

            const token = localStorage.getItem("jwt_token");

            try {
                if (token) {
                    await fetch("http://192.168.100.128:8000/auth/logout", {
                        method: "POST",
                        headers: {
                            "Authorization": "Bearer " + token
                        }
                    });
                }
            } catch (error) {
                console.warn("Error comunicando logout al servidor:", error);
            }

            // Limpiar siempre el navegador
            localStorage.removeItem("jwt_token");
            sessionStorage.removeItem("jwt_token");

            // Redirigir al login
            window.location.href = "/public/pages/auth/login.html";
        });
    }
});
