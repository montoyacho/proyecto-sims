async function verificarSesion() {
    const token = localStorage.getItem("jwt_token");
    if (!token) {
        window.location.href = "/public/pages/auth/login.html";
        return;
    }
    try {
        const response = await fetch("http://localhost:8000/auth/validate", { 
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });
        if (!response.ok) {
            localStorage.removeItem("jwt_token");
            window.location.href = "/public/pages/auth/login.html";
        }
    } catch (error) {
        console.error("Error verificando sesión:", error);
        window.location.href = "/public/pages/auth/login.html";
    }
}
verificarSesion();