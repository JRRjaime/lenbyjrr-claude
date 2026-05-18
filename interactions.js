/* ─────────────────────────────────────────────────────────
   interactions.js
   - About text: split into chars, light them with scroll
   - About photo: liquid distortion driven by mouse
   - Magnetic buttons (data-magnet)
   ───────────────────────────────────────────────────────── */
(function () {

  // ── about text: char-by-char illumination ───────────────
  const aboutText = document.getElementById("aboutText");
  if (aboutText) {
    const raw = aboutText.textContent;
    aboutText.textContent = "";
    const frag = document.createDocumentFragment();
    for (const ch of raw) {
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = ch;
      frag.appendChild(span);
    }
    aboutText.appendChild(frag);

    const chars = aboutText.querySelectorAll(".char");
    function updateLit() {
      const r = aboutText.getBoundingClientRect();
      const vh = window.innerHeight;
      // Progress is how far the bottom of the block has scrolled past the 70% line
      const start = r.top - vh * 0.85;
      const end   = r.top - vh * 0.15;
      const span  = end - start;
      const prog  = Math.min(1, Math.max(0, -start / Math.max(1, span)));
      const lit = Math.floor(prog * chars.length);
      for (let i = 0; i < chars.length; i++) {
        chars[i].classList.toggle("lit", i < lit);
      }
    }
    window.addEventListener("scroll", updateLit, { passive: true });
    window.addEventListener("resize", updateLit);
    updateLit();
  }

  // ── liquid distortion ──────────────────────────────────
  const target = document.getElementById("liquidTarget");
  const disp   = document.getElementById("disp");
  const turb   = document.getElementById("turb");
  if (target && disp) {
    let raf = null;
    let cur = 0, goal = 0;
    let seedTick = 0;
    target.addEventListener("mousemove", (e) => {
      const r = target.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / r.width;
      const dy = (e.clientY - cy) / r.height;
      goal = Math.min(90, 40 + Math.hypot(dx, dy) * 80);
    });
    target.addEventListener("mouseleave", () => { goal = 0; });
    target.addEventListener("mouseenter", () => { goal = 40; });

    function tick() {
      cur += (goal - cur) * 0.12;
      disp.setAttribute("scale", cur.toFixed(2));
      seedTick++;
      if (cur > 1 && seedTick % 6 === 0) {
        turb.setAttribute("seed", (seedTick % 50).toString());
      }
      raf = requestAnimationFrame(tick);
    }
    tick();
  }

  // ── magnetic buttons ───────────────────────────────────
  const magnets = document.querySelectorAll("[data-magnet]");
  magnets.forEach((el) => {
    const radius = 120;
    let raf = null;
    let tx = 0, ty = 0, cx = 0, cy = 0;

    function loop() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      el.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px)`;
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    }

    window.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const mx = r.left + r.width / 2;
      const my = r.top + r.height / 2;
      const dx = e.clientX - mx;
      const dy = e.clientY - my;
      const dist = Math.hypot(dx, dy);
      if (dist < radius) {
        const f = (1 - dist / radius) * 0.45;
        tx = dx * f; ty = dy * f;
      } else {
        tx = 0; ty = 0;
      }
      if (!raf) raf = requestAnimationFrame(loop);
    });
  });

  // ── parallax tilt on photo placeholders (subtle) ───────
  const phs = document.querySelectorAll(".ph");
  phs.forEach((ph) => {
    ph.addEventListener("mousemove", (e) => {
      const r = ph.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      ph.style.transform = `perspective(800px) rotateX(${(-dy * 3).toFixed(2)}deg) rotateY(${(dx * 3).toFixed(2)}deg) scale(1.01)`;
    });
    ph.addEventListener("mouseleave", () => {
      ph.style.transform = "";
    });
  });

  // ── HERO stage: rotate through 5 atmosphere previews ───
  const frames = [...document.querySelectorAll(".hero-frame")];
  if (frames.length) {
    let idx = 0;
    frames[0].classList.add("is-on");

    // also sync the theme to the visible frame, BUT only while
    // the hero is the dominant section (avoid fighting the scroll observer)
    function advance() {
      frames[idx].classList.remove("is-on");
      idx = (idx + 1) % frames.length;
      frames[idx].classList.add("is-on");
      // only retheme while hero is on screen
      if (window.scrollY < window.innerHeight * 0.4) {
        const key = frames[idx].dataset.key;
        if (window.__themes && key) window.__themes.setTheme(key);
      }
    }
    setInterval(advance, 7000);
  }

  // ── hero clock ─────────────────────────────────────────
  const heroTime = document.getElementById("heroTime");
  if (heroTime) {
    const tick = () => {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      heroTime.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} CET`;
    };
    tick();
    setInterval(tick, 1000);
  }

  // ── scroll reveal: auto-tag cat sections + their children ──
  const cats = document.querySelectorAll(".cat");
  cats.forEach((c) => {
    c.classList.add("reveal");
    const head = c.querySelector(".cat-head");
    if (head) {
      const title = head.querySelector(".cat-title");
      if (title) title.classList.add("reveal-clip");
      const blurb = head.querySelector(".cat-blurb");
      if (blurb) blurb.classList.add("reveal");
      const meta = head.querySelector(".cat-meta");
      if (meta) meta.classList.add("reveal");
    }
    const grid = c.querySelector(".grid, .reel-row");
    if (grid) grid.classList.add("stagger");
    const avd = c.querySelector(".aviation-data");
    if (avd) avd.classList.add("stagger");
  });

  // about + contact
  document.querySelectorAll(".about, .contact").forEach((s) => s.classList.add("reveal"));
  const aboutPhoto = document.querySelector(".about-photo-inner");
  if (aboutPhoto) aboutPhoto.classList.add("reveal-scale");
  const contactTitle = document.querySelector(".contact-title");
  if (contactTitle) contactTitle.classList.add("reveal-clip");
  const form = document.querySelector(".form");
  if (form) form.classList.add("stagger");

  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          revealObs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );
  document.querySelectorAll(".reveal, .reveal-clip, .reveal-scale, .stagger")
    .forEach((el) => revealObs.observe(el));

})();
