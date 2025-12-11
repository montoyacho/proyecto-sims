document.addEventListener("DOMContentLoaded", function () {
    // URL actual (solo el nombre del archivo)
    const currentPage = window.location.pathname.split("/").pop();

    // Seleccionamos todos los links del menú vertical
    const links = document.querySelectorAll('.navbar-vertical .nav-link');

    links.forEach(link => {
        const linkPage = link.getAttribute('href').split("/").pop();

        // Si el link coincide con la página actual → activar
        if (linkPage === currentPage) {
            link.classList.add("active");

            // Si pertenece a un menú colapsable → abrir el menú padre
            const parentCollapse = link.closest(".collapse");
            if (parentCollapse) {
                parentCollapse.classList.add("show");

                // Abrir también el dropdown-indicator
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