(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Absolute SEO URLs once the site is opened from a real origin (helps social previews after deploy) */
  const absolutizeSeo = () => {
    if (!window.location.protocol.startsWith("http")) return;
    const origin = window.location.origin;
    const pathDir = window.location.pathname.replace(/[^/]+$/, "");
    const abs = (path) => new URL(path, origin + pathDir).href;

    document.querySelectorAll('meta[property="og:url"], meta[property="og:image"], meta[name="twitter:image"]').forEach((el) => {
      const value = el.getAttribute("content");
      if (value && !/^https?:\/\//i.test(value)) {
        el.setAttribute("content", abs(value));
      }
    });

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      const href = canonical.getAttribute("href");
      if (href && !/^https?:\/\//i.test(href)) {
        canonical.setAttribute("href", abs(href));
      }
    }
  };
  absolutizeSeo();

  /* Mobile nav */
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");

  const setNavOpen = (open) => {
    if (!header || !toggle || !nav) return;
    header.classList.toggle("is-nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("nav-open", open);
  };

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      setNavOpen(!header.classList.contains("is-nav-open"));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setNavOpen(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setNavOpen(false);
    });

    window.matchMedia("(min-width: 900px)").addEventListener("change", (event) => {
      if (event.matches) setNavOpen(false);
    });
  }

  /* Scroll reveal */
  const revealTargets = document.querySelectorAll(
    ".section, .steps li, .join-list li, .supply-list li, .pay-list li, .member-list li, .tips-list, .callout, .page-hero"
  );

  revealTargets.forEach((el) => el.classList.add("reveal"));

  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  revealTargets.forEach((el) => observer.observe(el));
})();
