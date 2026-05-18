/* ─────────────────────────────────────────────────────────
   themes.js  ·  category switcher
   - changes html[data-theme]
   - updates tab title + favicon
   - drives the ticker
   - tells the cursor + audio modules to retune
   ───────────────────────────────────────────────────────── */
(function () {
  const THEMES = {
    nature:   { idx: "01 / 04", name: "Naturaleza",     tab: "Lensbyjrr | Naturaleza 🌿",     favicon: "🌿" },
    holy:     { idx: "02 / 04", name: "Semana Santa",   tab: "Lensbyjrr | Semana Santa 🕯️",   favicon: "🕯️" },
    aviation: { idx: "03 / 04", name: "Aviación",       tab: "Lensbyjrr | Aviación ✈️",       favicon: "✈️" },
    urban:    { idx: "04 / 04", name: "Urbano",         tab: "Lensbyjrr | Urbano 🏙️",         favicon: "🏙️" },
  };

  let current = "nature";

  function makeFavicon(emoji) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d");
    ctx.font = "52px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, 32, 36);
    return c.toDataURL("image/png");
  }

  function setFavicon(emoji) {
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = makeFavicon(emoji);
  }

  function setTheme(theme, opts = {}) {
    if (!THEMES[theme] || theme === current) return;
    const t = THEMES[theme];
    document.documentElement.dataset.theme = theme;
    document.title = t.tab;
    setFavicon(t.favicon);

    // ticker
    const idx  = document.querySelector(".ticker-idx");
    const name = document.querySelector(".ticker-name");
    if (idx)  idx.textContent  = t.idx;
    if (name) {
      name.textContent = t.name;
      name.className = "ticker-name tag--" + theme;
    }

    // active state on nav
    document.querySelectorAll(".nav-item").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.theme === theme);
    });

    current = theme;
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme, scrollDriven: !!opts.scrollDriven } }));
  }

  // initial favicon
  setFavicon(THEMES.nature.favicon);
  document.documentElement.dataset.theme = "nature";

  // nav clicks → scroll into view, theme will update via observer
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.theme;
      const anchor = document.querySelector(`[data-theme-anchor="${target}"]`);
      if (anchor) {
        anchor.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        // hero: scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      setTheme(target);
    });
  });

  // scroll-driven: whichever section is mostly in viewport wins
  const anchors = [...document.querySelectorAll("[data-theme-anchor]")];
  let pendingTheme = null;
  let pendingTimer = null;

  function queueTheme(t) {
    if (!t || t === current) { pendingTheme = null; return; }
    if (pendingTheme === t) return;
    pendingTheme = t;
    clearTimeout(pendingTimer);
    // wait a beat — if the user is still scrolling fast through sections,
    // we don't change theme repeatedly. Only commit if the same section
    // is still dominant after the delay.
    pendingTimer = setTimeout(() => {
      // re-check dominance at commit time
      let bestRatio = 0, bestTheme = null;
      anchors.forEach((a) => {
        const r = a.getBoundingClientRect();
        const vh = window.innerHeight;
        const top = Math.max(0, r.top);
        const bot = Math.min(vh, r.bottom);
        const ratio = Math.max(0, bot - top) / vh;
        if (ratio > bestRatio) { bestRatio = ratio; bestTheme = a.dataset.themeAnchor; }
      });
      if (bestTheme && bestRatio > 0.5) setTheme(bestTheme, { scrollDriven: true });
      pendingTheme = null;
    }, 380);
  }

  const obs = new IntersectionObserver(
    () => {
      let bestRatio = 0, bestTheme = null;
      anchors.forEach((a) => {
        const r = a.getBoundingClientRect();
        const vh = window.innerHeight;
        const top = Math.max(0, r.top);
        const bot = Math.min(vh, r.bottom);
        const ratio = Math.max(0, bot - top) / vh;
        if (ratio > bestRatio) { bestRatio = ratio; bestTheme = a.dataset.themeAnchor; }
      });
      if (bestTheme && bestRatio > 0.5) queueTheme(bestTheme);
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] }
  );
  anchors.forEach((a) => obs.observe(a));

  // when above all sections (hero), default to nature
  window.addEventListener("scroll", () => {
    if (window.scrollY < 200) queueTheme("nature");
  }, { passive: true });

  // expose
  window.__themes = { setTheme, get current() { return current; } };
})();
