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
  const moreToggle = document.getElementById("nav-more-toggle");
  const moreCluster = moreToggle?.closest(".nav-cluster--more");

  const setMoreOpen = (open) => {
    if (!moreToggle || !moreCluster) return;
    moreCluster.classList.toggle("is-open", open);
    moreToggle.setAttribute("aria-expanded", open ? "true" : "false");
  };

  const setNavOpen = (open) => {
    if (!header || !toggle || !nav) return;
    header.classList.toggle("is-nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("nav-open", open);
    if (!open) setMoreOpen(false);
  };

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      setNavOpen(!header.classList.contains("is-nav-open"));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        setNavOpen(false);
        setMoreOpen(false);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (moreCluster?.classList.contains("is-open")) {
          setMoreOpen(false);
          moreToggle?.focus();
          return;
        }
        setNavOpen(false);
      }
    });

    window.matchMedia("(min-width: 980px)").addEventListener("change", (event) => {
      if (event.matches) setNavOpen(false);
      else setMoreOpen(false);
    });
  }

  if (moreToggle && moreCluster) {
    moreToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      setMoreOpen(!moreCluster.classList.contains("is-open"));
    });

    document.addEventListener("click", (event) => {
      if (!moreCluster.classList.contains("is-open")) return;
      if (moreCluster.contains(event.target)) return;
      setMoreOpen(false);
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
