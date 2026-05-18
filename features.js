/* ─────────────────────────────────────────────────────────
   features.js
   - Intro / loading screen
   - Lightbox with EXIF + GEO
   - Curtain transition between categories
   - Intensity panel
   - ES / EN toggle
   - Easter egg: type LENS → roll mode
   - Shutter sound on photo click
   ───────────────────────────────────────────────────────── */
(function () {

  /* ───────────────────────── INTRO ─────────────────────── */
  const intro = document.getElementById("intro");
  const introNum = document.getElementById("introNum");
  const introMsg = document.getElementById("introMsg");
  const introSkip = document.getElementById("introSkip");
  const introRows = [...document.querySelectorAll(".intro-row")];

  function dismissIntro() {
    intro.classList.add("is-out");
    setTimeout(() => { intro.style.display = "none"; intro.setAttribute("aria-hidden", "true"); }, 1400);
  }

  function runIntro() {
    if (sessionStorage.getItem("introDone") || !intro) {
      if (intro) intro.style.display = "none";
      return;
    }
    let i = 0;
    const stepMs = 480;
    const tick = () => {
      if (i >= introRows.length) {
        if (introMsg) introMsg.textContent = "listo";
        if (introNum) introNum.textContent = "05";
        setTimeout(() => {
          sessionStorage.setItem("introDone", "1");
          dismissIntro();
        }, 500);
        return;
      }
      introRows[i].classList.add("is-on");
      if (introNum) introNum.textContent = String(i + 1).padStart(2, "0");
      const msgs = ["cargando viento + pájaros", "cargando cera + cornetas", "cargando turbinas", "cargando lluvia + neón", "cargando dron + timecode"];
      if (introMsg) introMsg.textContent = msgs[i];
      i++;
      setTimeout(tick, stepMs);
    };
    setTimeout(tick, 200);
    if (introSkip) introSkip.addEventListener("click", () => { sessionStorage.setItem("introDone", "1"); dismissIntro(); });
    // Hard timeout: dismiss after 4s no matter what (failsafe)
    setTimeout(() => { if (intro && !intro.classList.contains("is-out")) dismissIntro(); }, 4000);
  }
  if (intro) runIntro();

  /* ───────────────────────── LIGHTBOX ─────────────────────── */
  const lightbox = document.getElementById("lightbox");
  const lbPhoto  = document.getElementById("lightboxPhoto");
  const lbLabel  = document.getElementById("lightboxLabel");
  const lbCounter = document.getElementById("lbCounter");
  const lbFields = {
    cam:  document.getElementById("lbCam"),
    lens: document.getElementById("lbLens"),
    focal: document.getElementById("lbFocal"),
    ap:   document.getElementById("lbAp"),
    sh:   document.getElementById("lbSh"),
    iso:  document.getElementById("lbIso"),
    lat:  document.getElementById("lbLat"),
    lng:  document.getElementById("lbLng"),
    alt:  document.getElementById("lbAlt"),
    date: document.getElementById("lbDate"),
    time: document.getElementById("lbTime"),
  };

  // Auto-fill EXIF for any .ph that doesn't have explicit data
  const phs = [...document.querySelectorAll(".ph")];
  const CAMS = [
    { cam: "SONY α7 IV",   lens: "FE 24-70 GM II" },
    { cam: "SONY α7 IV",   lens: "FE 70-200 GM II" },
    { cam: "SONY α7 IV",   lens: "FE 16-35 GM II" },
    { cam: "SONY α7 IV",   lens: "FE 200-600 G" },
    { cam: "FUJIFILM X-T5",lens: "XF 23 f/1.4 R" },
  ];
  const seedRand = (s) => () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

  phs.forEach((ph, idx) => {
    const seed = parseInt(ph.style.getPropertyValue("--seed") || (idx + 1), 10);
    const r = seedRand(seed * 17 + 3);
    if (!ph.dataset.cam) {
      const c = CAMS[Math.floor(r() * CAMS.length)];
      ph.dataset.cam = c.cam;
      ph.dataset.lens = c.lens;
      const focals = [24, 35, 50, 70, 85, 105, 135, 200, 400, 600];
      ph.dataset.focal = focals[Math.floor(r() * focals.length)] + "mm";
      const aps = ["f/1.4","f/1.8","f/2.0","f/2.8","f/4","f/5.6","f/8","f/11"];
      ph.dataset.ap = aps[Math.floor(r() * aps.length)];
      const shs = ["1/30s","1/60s","1/125s","1/250s","1/500s","1/1000s","2.5s","30s"];
      ph.dataset.sh = shs[Math.floor(r() * shs.length)];
      ph.dataset.iso = String([100,200,400,800,1600,3200,6400][Math.floor(r() * 7)]);
    }
    if (!ph.dataset.lat) {
      ph.dataset.lat = (35 + r() * 8).toFixed(4) + "° N";
      ph.dataset.lng = (r() * 10).toFixed(4) + "° W";
      ph.dataset.alt = Math.floor(r() * 1500) + " m";
      ph.dataset.date = `2024·${String(Math.floor(r() * 12) + 1).padStart(2,"0")}·${String(Math.floor(r() * 28) + 1).padStart(2,"0")}`;
      ph.dataset.time = `${String(Math.floor(r() * 24)).padStart(2,"0")}:${String(Math.floor(r() * 60)).padStart(2,"0")}`;
    }
    ph.classList.add("ph--clickable");
    ph.addEventListener("click", (e) => {
      // If the click landed inside an empty <image-slot>, let the slot
      // open the file picker — don't hijack with the lightbox.
      const slot = ph.querySelector("image-slot");
      if (slot && !slot.hasAttribute("data-filled")) return;
      openLightbox(idx);
    });
  });

  let lbIdx = 0;
  function openLightbox(idx) {
    lbIdx = idx;
    fillLb(idx);
    lightbox.classList.add("is-on");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    playShutter();
  }
  function closeLightbox() {
    lightbox.classList.remove("is-on");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  function fillLb(idx) {
    const p = phs[idx];
    lbPhoto.style.setProperty("--seed", p.style.getPropertyValue("--seed"));
    lbLabel.textContent = p.querySelector(".ph-label")?.textContent || "";
    lbFields.cam.textContent   = p.dataset.cam;
    lbFields.lens.textContent  = p.dataset.lens;
    lbFields.focal.textContent = p.dataset.focal;
    lbFields.ap.textContent    = p.dataset.ap;
    lbFields.sh.textContent    = p.dataset.sh;
    lbFields.iso.textContent   = p.dataset.iso;
    lbFields.lat.textContent   = p.dataset.lat;
    lbFields.lng.textContent   = p.dataset.lng;
    lbFields.alt.textContent   = p.dataset.alt;
    lbFields.date.textContent  = p.dataset.date;
    lbFields.time.textContent  = p.dataset.time;
    lbCounter.textContent = String(idx + 1).padStart(2,"0") + " / " + String(phs.length).padStart(2,"0");
    // marcha block — show only if this photo has one
    const marchaBlock = document.getElementById("lbMarchaBlock");
    const marchaEl = document.getElementById("lbMarcha");
    if (p.dataset.marcha && marchaBlock && marchaEl) {
      marchaBlock.style.display = "";
      marchaEl.textContent = p.dataset.marcha;
    } else if (marchaBlock) {
      marchaBlock.style.display = "none";
    }
    // copy class for aspect ratio
    lbPhoto.className = "lightbox-photo " + [...p.classList].filter(c => c.startsWith("ph--") && c !== "ph--clickable").join(" ");
  }
  document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
  document.getElementById("lightboxPrev").addEventListener("click", () => { lbIdx = (lbIdx - 1 + phs.length) % phs.length; fillLb(lbIdx); playShutter(0.4); });
  document.getElementById("lightboxNext").addEventListener("click", () => { lbIdx = (lbIdx + 1) % phs.length; fillLb(lbIdx); playShutter(0.4); });
  window.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("is-on")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft")  { lbIdx = (lbIdx - 1 + phs.length) % phs.length; fillLb(lbIdx); playShutter(0.4); }
    if (e.key === "ArrowRight") { lbIdx = (lbIdx + 1) % phs.length; fillLb(lbIdx); playShutter(0.4); }
  });

  /* ───────────────────────── SHUTTER SOUND ─────────────────────── */
  let shutterCtx;
  function playShutter(vol = 0.6) {
    try {
      shutterCtx = shutterCtx || new (window.AudioContext || window.webkitAudioContext)();
      const ctx = shutterCtx;
      // first click (mirror up)
      const click1 = () => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const f = ctx.createBiquadFilter();
        f.type = "bandpass"; f.frequency.value = 1800; f.Q.value = 4;
        o.type = "square"; o.frequency.value = 60;
        g.gain.setValueAtTime(0.001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
        o.connect(f).connect(g).connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + 0.05);

        // noise burst layer
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
        const n = ctx.createBufferSource(); n.buffer = buf;
        const ng = ctx.createGain(); ng.gain.value = vol * 0.4;
        const nh = ctx.createBiquadFilter(); nh.type = "highpass"; nh.frequency.value = 1200;
        n.connect(nh).connect(ng).connect(ctx.destination);
        n.start();
      };
      click1();
      setTimeout(click1, 90); // second click (mirror down)
    } catch (_) {}
  }
  window.__playShutter = playShutter;

  /* ───────────────────────── CURTAIN TRANSITION ─────────────────────── */
  const curtain = document.getElementById("curtain");
  const curtainName = curtain.querySelector(".curtain-name");

  const THEME_LABEL = {
    nature: "Naturaleza", holy: "Semana Santa", aviation: "Aviación",
    urban: "Urbano", cine: "Cine & Dron"
  };

  let curtainBusy = false;
  function playCurtain(theme) {
    if (curtainBusy) return;
    curtainBusy = true;
    curtain.className = "curtain curtain--" + theme + " is-in";
    curtainName.className = "curtain-name tag--" + theme;
    curtainName.textContent = THEME_LABEL[theme] || "";
    // wipe-in: ~1.1s, hold name visible ~700ms, wipe-out ~1.2s
    setTimeout(() => { curtain.classList.add("is-mid"); }, 700);
    setTimeout(() => { curtain.classList.remove("is-in"); curtain.classList.add("is-out"); }, 1500);
    setTimeout(() => { curtain.className = "curtain"; curtainBusy = false; }, 2800);
  }

  // Trigger curtain ONLY when the nav button is clicked (not on scroll-driven changes).
  // Use capture phase so we run before themes.js mutates the data-theme attribute,
  // and track the last curtain theme locally to avoid re-running when scroll
  // observer momentarily reasserts the same theme.
  let lastCurtainTheme = null;
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const t = btn.dataset.theme;
      if (t && t !== lastCurtainTheme) {
        lastCurtainTheme = t;
        playCurtain(t);
      }
    }, { capture: true });
  });

  /* ───────────────────────── INTENSITY PANEL ─────────────────────── */
  const intBtn = document.getElementById("intensity-btn");
  const intPanel = document.getElementById("intensityPanel");
  if (intBtn) {
    intBtn.addEventListener("click", () => {
      intPanel.classList.toggle("is-on");
    });
    document.querySelectorAll(".int-opt").forEach((b) => {
      b.addEventListener("click", () => {
        document.querySelectorAll(".int-opt").forEach((x) => x.classList.remove("is-on"));
        b.classList.add("is-on");
        const v = b.dataset.int;
        document.documentElement.dataset.intensity = v;
        // update dots
        const dotMap = { subtle: 1, normal: 2, immersive: 3 };
        const n = dotMap[v];
        intBtn.querySelectorAll(".intensity-dots i").forEach((d, i) => d.classList.toggle("on", i < n));
        // close panel after a moment
        setTimeout(() => intPanel.classList.remove("is-on"), 400);
      });
    });
    // click outside to close
    document.addEventListener("click", (e) => {
      if (!intPanel.classList.contains("is-on")) return;
      if (e.target.closest("#intensityPanel") || e.target.closest("#intensity-btn")) return;
      intPanel.classList.remove("is-on");
    });
  }

  /* ───────────────────────── i18n ─────────────────────── */
  const STR = {
    es: {
      sound: "sonido", intensity: "intensidad",
      intensity_title: "Intensidad de la atmósfera",
      int_subtle: "Sutil", int_subtle_desc: "menos partículas, audio bajo",
      int_normal: "Normal", int_normal_desc: "ajuste recomendado",
      int_immersive: "Inmersiva", int_immersive_desc: "todo al máximo",
    },
    en: {
      sound: "sound", intensity: "intensity",
      intensity_title: "Atmosphere intensity",
      int_subtle: "Subtle", int_subtle_desc: "fewer particles, low audio",
      int_normal: "Normal", int_normal_desc: "recommended preset",
      int_immersive: "Immersive", int_immersive_desc: "everything cranked",
    },
  };
  const langBtn = document.getElementById("lang-btn");
  let lang = "es";
  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const k = el.dataset.i18n;
      if (STR[lang][k]) el.textContent = STR[lang][k];
    });
    if (!langBtn) return;
    langBtn.querySelector(".lang-cur").textContent = lang.toUpperCase();
    langBtn.querySelector(".lang-alt").textContent = (lang === "es" ? "EN" : "ES").toUpperCase();
  }
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      lang = (lang === "es" ? "en" : "es");
      applyLang();
    });
  }

  /* ───────────────────────── EASTER EGG: LENS ─────────────────────── */
  let buffer = "";
  const roll = document.getElementById("rollMode");
  const rollStrip = document.getElementById("rollStrip");
  const rollNo = document.getElementById("rollNo");
  const rollName = document.getElementById("rollName");
  const rollShutter = document.getElementById("rollShutter");
  let rollIdx = 0;
  const rollSet = []; // populated when triggered

  function buildRoll() {
    rollStrip.innerHTML = "";
    const cats = ["nature","holy","aviation","urban","cine"];
    rollSet.length = 0;
    cats.forEach((c) => {
      const cat = document.querySelector(".cat--" + c);
      // For Cine & Dron we don't have .ph children — fall back to .reel-frame
      const pick = cat?.querySelector(".ph") || cat?.querySelector(".reel-frame");
      if (!pick) return;
      const label = pick.querySelector(".ph-label")?.textContent
                 || pick.parentElement?.querySelector("h3")?.textContent
                 || "—";
      const d = document.createElement("div");
      d.className = "roll-frame tag-bg--" + c;
      d.style.setProperty("--seed", pick.style.getPropertyValue("--seed"));
      d.innerHTML = `
        <span class="roll-tag tag--${c}">${THEME_LABEL[c]}</span>
        <span class="roll-cap">${label}</span>`;
      rollStrip.appendChild(d);
      rollSet.push({ cat: c, label, time: pick.dataset.time || "" });
    });
  }
  function showRollFrame(i) {
    rollIdx = (i + rollSet.length) % rollSet.length;
    rollStrip.style.transform = `translateX(${-rollIdx * 100}vw)`;
    rollNo.textContent = String(rollIdx + 1).padStart(2,"0") + " / " + String(rollSet.length).padStart(2,"0");
    const s = rollSet[rollIdx];
    rollName.textContent = `${THEME_LABEL[s.cat]} · ${s.label}`;
    // shutter flash
    rollShutter.classList.remove("is-on");
    void rollShutter.offsetWidth;
    rollShutter.classList.add("is-on");
    playShutter(0.5);
  }
  function openRoll() {
    buildRoll();
    roll.classList.add("is-on");
    roll.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    showRollFrame(0);
  }
  function closeRoll() {
    roll.classList.remove("is-on");
    roll.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  window.addEventListener("keydown", (e) => {
    // skip if typing in form
    if (e.target.matches("input, textarea, select")) return;
    if (roll.classList.contains("is-on")) {
      if (e.key === "Escape") closeRoll();
      if (e.key === "ArrowRight") showRollFrame(rollIdx + 1);
      if (e.key === "ArrowLeft")  showRollFrame(rollIdx - 1);
      return;
    }
    buffer = (buffer + e.key.toLowerCase()).slice(-4);
    if (buffer === "lens") {
      buffer = "";
      openRoll();
    }
  });
  // tap-corner mobile trigger: 4 taps in 1.5s on the brand
  const brand = document.querySelector(".brand");
  let brandTaps = 0, brandTimer = null;
  brand?.addEventListener("click", (e) => {
    brandTaps++;
    clearTimeout(brandTimer);
    brandTimer = setTimeout(() => brandTaps = 0, 1500);
    if (brandTaps >= 4) {
      brandTaps = 0;
      e.preventDefault();
      openRoll();
    }
  });

})();
