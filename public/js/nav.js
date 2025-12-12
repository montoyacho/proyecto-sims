document.addEventListener("DOMContentLoaded", function () {
    const currentPage = window.location.pathname.split("/").pop();
    const links = document.querySelectorAll('.navbar-vertical .nav-link');
    links.forEach(link => {
        const linkPage = link.getAttribute('href').split("/").pop();
        if (linkPage === currentPage) {
            link.classList.add("active");
            const parentCollapse = link.closest(".collapse");
            if (parentCollapse) {
                parentCollapse.classList.add("show");
                const parentToggle = document.querySelector(`[data-bs-target="#${parentCollapse.id}"]`);
                if (parentToggle) {
                    parentToggle.setAttribute("aria-expanded", "true");
                }
            }
        } else {
            link.classList.remove("active");
        }
    });
});
document.addEventListener("DOMContentLoaded", () => {
    const primerNombre = localStorage.getItem("primer_nombre");
    const primerApellido = localStorage.getItem("primer_apellido");
    const rol = localStorage.getItem("rol");

    const avatar = document.querySelector(".avatar-name");
    if (!avatar) return;
    const span = avatar.querySelector("span");

    // Iniciales
    if (primerNombre && primerApellido) {
        const iniciales =
            primerNombre.charAt(0).toUpperCase() +
            primerApellido.charAt(0).toUpperCase();
        span.textContent = iniciales;
    }

    // Colores por rol
    const colores = {
        "admin": "#fd0dfdff",   // azul
        "operador": "#198754",        // verde
        "consulta": "#ffc107",        // amarillo
        "supervisor": "#6c757d",       // gris
        "soporte": "#0dcaf0"         // celeste
    };

    const color = colores[rol] || "#343a40"; // default gris oscuro
    avatar.style.backgroundColor = color;
    avatar.style.color = "white";
});