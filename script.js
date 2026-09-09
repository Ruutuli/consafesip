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

  /* Back to top */
  const backToTop = document.querySelector(".back-to-top");
  if (backToTop) {
    const toggleBackToTop = () => {
      backToTop.classList.toggle("is-visible", window.scrollY > 420);
    };
    toggleBackToTop();
    window.addEventListener("scroll", toggleBackToTop, { passive: true });
  }

  /* Share site */
  const shareBtn = document.getElementById("share-site");
  const shareMenu = document.getElementById("share-menu");
  const shareCopy = document.getElementById("share-copy");
  const shareStatus = document.getElementById("share-status");

  const sharePayload = () => {
    const url = shareBtn?.dataset.shareUrl || "https://consafesip.info/";
    const title = shareBtn?.dataset.shareTitle || "Con Safe Sip";
    const text =
      shareBtn?.dataset.shareText || "Cover your drink. Watch your friends. Free drink covers & drink-spiking awareness for cons, parties, & meetups.";
    const image = shareBtn?.dataset.shareImage || "assets/og-share.jpg";
    return { url, title, text, image };
  };

  const setShareStatus = (message) => {
    if (!shareStatus) return;
    shareStatus.textContent = message;
    if (message) {
      window.clearTimeout(setShareStatus._timer);
      setShareStatus._timer = window.setTimeout(() => {
        shareStatus.textContent = "";
      }, 2800);
    }
  };

  const setShareMenuOpen = (open) => {
    if (!shareMenu || !shareBtn) return;
    shareMenu.hidden = !open;
    shareBtn.setAttribute("aria-expanded", open ? "true" : "false");
  };

  const getShareImageFile = async () => {
    const { image } = sharePayload();
    const response = await fetch(image);
    if (!response.ok) throw new Error("Could not load share image");
    const blob = await response.blob();
    return new File([blob], "con-safe-sip-share.jpg", {
      type: blob.type || "image/jpeg",
    });
  };

  const buildNativeShareData = async () => {
    const { url, title, text } = sharePayload();
    const base = { title, text: `${text} ${url}`, url };
    try {
      const file = await getShareImageFile();
      const withFile = { ...base, files: [file] };
      if (navigator.canShare?.(withFile)) return withFile;
    } catch {
      /* fall through to text/url share */
    }
    return base;
  };

  const copyShareLink = async ({ quiet = false } = {}) => {
    const { url, text } = sharePayload();
    const clipboardText = `${text} ${url}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(clipboardText);
      } else {
        const input = document.createElement("input");
        input.value = clipboardText;
        input.setAttribute("readonly", "");
        input.style.position = "absolute";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      if (!quiet) setShareStatus("Copied — paste it with the graphic!");
      return true;
    } catch {
      if (!quiet) setShareStatus("Couldn’t copy — try selecting the URL.");
      return false;
    }
  };

  const downloadShareImage = async ({ quiet = false } = {}) => {
    const { image } = sharePayload();
    try {
      const response = await fetch(image);
      if (!response.ok) throw new Error("fetch failed");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "con-safe-sip-share.jpg";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      if (!quiet) setShareStatus("Graphic saved — post it with your caption!");
      return true;
    } catch {
      /* Fallback: open the image so the user can save it */
      window.open(image, "_blank", "noopener,noreferrer");
      if (!quiet) setShareStatus("Opened graphic — save/share from there.");
      return false;
    }
  };

  const shareToInstagram = async () => {
    await copyShareLink({ quiet: true });
    await downloadShareImage({ quiet: true });
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    setShareStatus("Caption copied & graphic saved — open Instagram and paste when you post!");
  };

  if (shareBtn) {
    shareBtn.setAttribute("aria-expanded", "false");
    if (shareMenu) shareBtn.setAttribute("aria-controls", "share-menu");

    /* Always show the menu — desktop Web Share often fails/cancels silently */
    shareBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      setShareMenuOpen(Boolean(shareMenu?.hidden));
    });

    shareMenu?.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setShareMenuOpen(false));
    });

    shareCopy?.addEventListener("click", async () => {
      await copyShareLink();
      setShareMenuOpen(false);
    });

    const shareInstagram = document.getElementById("share-instagram");
    shareInstagram?.addEventListener("click", async () => {
      await shareToInstagram();
      setShareMenuOpen(false);
    });

    const shareDownload = document.getElementById("share-download");
    shareDownload?.addEventListener("click", async () => {
      await downloadShareImage();
      setShareMenuOpen(false);
    });

    const shareNative = document.getElementById("share-native");
    if (shareNative && typeof navigator.share === "function") {
      shareNative.hidden = false;
      shareNative.addEventListener("click", async () => {
        try {
          setShareStatus("Preparing graphic…");
          const data = await buildNativeShareData();
          await navigator.share(data);
          setShareStatus("Thanks for sharing!");
          setShareMenuOpen(false);
        } catch (err) {
          if (err && err.name === "AbortError") {
            setShareStatus("");
            return;
          }
          setShareStatus("Pick a network below, or download the graphic.");
        }
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setShareMenuOpen(false);
    });

    document.addEventListener("click", (event) => {
      if (!shareMenu || shareMenu.hidden) return;
      const root = shareBtn.closest(".footer-share");
      if (root && !root.contains(event.target)) setShareMenuOpen(false);
    });
  }

  /* Media kit print */
  const printKit = document.getElementById("print-media-kit");
  if (printKit) {
    printKit.addEventListener("click", () => window.print());
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
