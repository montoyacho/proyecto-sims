// ===============================
// VALIDAR SESIÓN EXISTENTE
// ===============================
async function validarSesionLogin() {
    const token = localStorage.getItem("jwt_token");
    if (!token) return;

    try {
        const response = await fetch("http://192.168.100.128:8000/auth/validate", {
            method: "GET",
            headers: { "Authorization": "Bearer " + token }
        });

        if (response.ok) {
            // Token válido → continuar al dashboard
            window.location.href = "/public/pages/supportdesk/support-desk.html";
        } else {
            // Token inválido → borrar
            localStorage.removeItem("jwt_token");
        }
    } catch (e) {
        console.warn("Token inválido o error de conexión.");
        localStorage.removeItem("jwt_token");
    }
}
document.addEventListener("DOMContentLoaded", validarSesionLogin);


// ===============================
// LOGIN
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("login-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const correo = document.getElementById("split-login-email").value;
        const contraseña = document.getElementById("split-login-password").value;

        try {
            const response = await fetch("http://192.168.100.128:8000/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ correo, contraseña })
            });

            const data = await response.json();

            // -----------------------------
            // Manejo de errores del backend
            // -----------------------------
            if (!response.ok) {
                if (response.status === 400) {
                    alert("Usuario o contraseña incorrectos");
                }
                else if (response.status === 401) {
                    alert("Sesión inválida o expirada.");
                }
                else {
                    alert(data.detail || "Error desconocido al iniciar sesión.");
                }
                return;
            }

            // -----------------------------
            // LOGIN EXITOSO
            // -----------------------------
            localStorage.setItem("jwt_token", data.token);
            window.location.href = "/public/pages/supportdesk/support-desk.html";

        } catch (error) {
            console.error("Error:", error);
            alert("Error de conexión con el servidor");
        }
    });
});
