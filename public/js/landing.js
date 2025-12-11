document.addEventListener("DOMContentLoaded", () => {
      const counters = document.querySelectorAll(".counter");

      const animationSpeed = 500; 

      const animateCounter = (el) => {
        const endValue = +el.getAttribute("data-end");
        const suffix = el.getAttribute("data-suffix") || "";
        const increment = endValue / animationSpeed;

        const update = () => {
          let current = +el.innerText.replace(suffix, "");

          if (current < endValue) {
            el.innerText = Math.ceil(current + increment) + suffix;
            requestAnimationFrame(update);
          } else {
            el.innerText = endValue + suffix;
          }
        };

        update();
      };

      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      counters.forEach(counter => observer.observe(counter));
    });