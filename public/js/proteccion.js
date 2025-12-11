async function verificarSesion() {
    const token = localStorage.getItem("jwt_token");

    // No hay token → enviar al login directamente
    if (!token) {
        window.location.href = "/public/pages/auth/login.html";
        return;
    }

    try {
        const response = await fetch("http://192.168.100.128:8000/auth/validate", {
            method: "GET",
            headers: { "Authorization": "Bearer " + token }
        });

        // Si el backend responde 401 → token inválido o sesión reemplazada
        if (response.status === 401) {

            // Opcional: mostrar mensaje al usuario
            alert("Tu sesión ha expirado o fue iniciada en otro dispositivo.");

            localStorage.removeItem("jwt_token");
            window.location.href = "/public/pages/auth/login.html";
            return;
        }

        // Si la respuesta NO es OK y no es 401 → otro error
        if (!response.ok) {
            console.warn("Error inesperado validando token.");
            localStorage.removeItem("jwt_token");
            window.location.href = "/public/pages/auth/login.html";
            return;
        }

        // Si todo OK → la página continúa normalmente

    } catch (error) {
        console.error("Error verificando sesión:", error);

        // Error de red → no podemos confiar en la sesión
        localStorage.removeItem("jwt_token");
        window.location.href = "/public/pages/auth/login.html";
    }
}

verificarSesion();