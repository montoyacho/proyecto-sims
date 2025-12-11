async function validarSesionLogin() {
    const token = localStorage.getItem("jwt_token");
    if (!token) return;

    try {
        const response = await fetch("http://127.0.0.1:8000/auth/validate", {
            method: "GET",
            headers: { "Authorization": "Bearer " + token }
        });
        if (response.ok) {
            window.location.href = "/public/pages/supportdesk/support-desk.html";
        }
    } catch (e) {
        console.warn("Token inválido o error de conexión.");
    }
}
document.addEventListener("DOMContentLoaded", validarSesionLogin);

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("login-form");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const correo = document.getElementById("split-login-email").value;
        const contraseña = document.getElementById("split-login-password").value;
        try {
            const response = await fetch("http://127.0.0.1:8000/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ correo, contraseña })
            });
            const data = await response.json();
            if (!response.ok) {
                alert(data.detail || "Error en inicio de sesión");
                return;
            }
            localStorage.setItem("jwt_token", data.token);
            window.location.href = "/public/pages/supportdesk/support-desk.html";
        } catch (error) {
            console.error("Error:", error);
            alert("Error de conexión con el servidor");
        }
    });
});