/* ─────────────────────────────────────────────────────────
   modules.js
   - Aviación map: moving plane along routes
   - Semana Santa timeline: interactive day selection
   - Cine player: playhead progress + animated waveform
   - Photo coords badge on hover (grid)
   - Audio visualizer (synthetic bars tied to sound toggle)
   - Stronger cursor snap to interactive elements
   - Liquid filter applied to photos on hover
   ───────────────────────────────────────────────────────── */
(function () {

  /* ─────────── Aviación · plane orbit ─────────── */
  const plane = document.querySelector(".route-plane");
  const arcs  = document.querySelectorAll(".route-arc");
  if (plane && arcs.length) {
    let arcIdx = 0;
    let t = 0;
    function tick() {
      const arc = arcs[arcIdx];
      const len = arc.getTotalLength();
      const p = arc.getPointAtLength(len * t);
      plane.setAttribute("transform", `translate(${p.x},${p.y})`);
      t += 0.0035;
      if (t >= 1) { t = 0; arcIdx = (arcIdx + 1) % arcs.length; }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ─────────── Semana Santa · timeline ─────────── */
  const tlSteps = document.querySelectorAll(".tl-step");
  const tlText = document.getElementById("tlText");
  const TL_LINES = {
    ramos:    "El olor a palma y romero. Aún hay luz en el cielo y la primera bulla del año cruza la Plaza. Disparo a 1/200, f/2.8, ISO 400. Es la única tarde del año en la que todos sonríen.",
    lunes:    "Genoveva en la Bombonera. La gente recién levantada de la siesta de Domingo. Aprendí a esperar el cruce de cera bajo la farola: contraluz lateral, sombras largas.",
    martes:   "Los Estudiantes bajando por San Fernando. La cera derretida marca la huella del paso. Cierro a f/8 y disparo a ras del suelo, en alfombra.",
    miercoles:"El Carmen entrando a la Catedral. Cada año empujo más la sensibilidad para conservar el negro de la noche sin convertirlo en gris.",
    madruga:  "Silencio absoluto al doblar Sierpes. El paso de palio se inclina, los varales rozan los aleros y la Esperanza, a la luz de cien velas, parece que respira. Apago el flash. Sólo queda mirar.",
    viernes:  "La Soledad. La música callada de la madera contra la madera. Tres horas siguiendo el cortejo, manteniendo siempre la distancia justa.",
    sabado:   "Santo Entierro. Toda la ciudad de luto, hasta los muros parecen contener la respiración.",
    resurreccion: "Domingo por la mañana, sol limpio. Cierro la temporada con un retrato del Resucitado contra la fachada blanca. Acaba un año. Empieza el siguiente."
  };
  tlSteps.forEach((s) => {
    s.addEventListener("click", () => {
      tlSteps.forEach((x) => x.classList.remove("is-on"));
      s.classList.add("is-on");
      const d = s.dataset.day;
      if (tlText && TL_LINES[d]) {
        tlText.style.opacity = 0;
        setTimeout(() => {
          tlText.textContent = TL_LINES[d];
          tlText.style.opacity = 1;
        }, 240);
      }
    });
  });

  /* ─────────── Cine · player ─────────── */
  const cpTimeline = document.getElementById("cpTimeline");
  const cpHead     = document.getElementById("cpPlayhead");
  const cpTc       = document.getElementById("cpTc");
  const cpWave     = document.getElementById("cpWave");

  if (cpTimeline && cpHead && cpTc) {
    let pos = 0.18;
    let playing = true;
    let dragging = false;

    function fmtTc(p) {
      const totalSeconds = 184; // 3:04
      const sec = totalSeconds * p;
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      const f = Math.floor((sec * 25) % 25);
      return `00:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}:${String(f).padStart(2,"0")}`;
    }

    function tick() {
      if (playing && !dragging) {
        pos += 0.0008;
        if (pos > 1) pos = 0;
        cpHead.style.left = (pos * 100) + "%";
        cpTc.textContent  = fmtTc(pos);
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    function setPos(e) {
      const r = cpTimeline.getBoundingClientRect();
      pos = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      cpHead.style.left = (pos * 100) + "%";
      cpTc.textContent = fmtTc(pos);
    }
    cpTimeline.addEventListener("mousedown", (e) => { dragging = true; setPos(e); });
    window.addEventListener("mousemove", (e) => { if (dragging) setPos(e); });
    window.addEventListener("mouseup", () => { dragging = false; });

    cpTimeline.addEventListener("dblclick", () => playing = !playing);

    // waveform breathing
    if (cpWave) {
      const bars = [...cpWave.children];
      let phase = 0;
      function wave() {
        phase += 0.05;
        bars.forEach((b, i) => {
          const h = 30 + Math.abs(Math.sin(phase + i * 0.35)) * 60 + Math.random() * 8;
          b.style.height = h + "%";
        });
        requestAnimationFrame(wave);
      }
      requestAnimationFrame(wave);
    }
  }

  /* ─────────── Photo coords badge on hover ─────────── */
  const coordBadge = document.createElement("div");
  coordBadge.className = "coord-badge";
  coordBadge.innerHTML = `<span class="cb-pin">⊕</span><span class="cb-text"></span>`;
  document.body.appendChild(coordBadge);
  const cbText = coordBadge.querySelector(".cb-text");
  let cbVisible = false;

  document.querySelectorAll(".ph").forEach((ph) => {
    ph.addEventListener("mouseenter", () => {
      if (!ph.dataset.lat) return;
      cbText.innerHTML = `${ph.dataset.lat}<br>${ph.dataset.lng}<br><em>${ph.dataset.focal} · ${ph.dataset.ap} · ${ph.dataset.sh}</em>`;
      coordBadge.classList.add("is-on");
      cbVisible = true;
    });
    ph.addEventListener("mouseleave", () => {
      coordBadge.classList.remove("is-on");
      cbVisible = false;
    });
  });
  window.addEventListener("mousemove", (e) => {
    if (!cbVisible) return;
    coordBadge.style.transform = `translate(${e.clientX + 18}px, ${e.clientY + 18}px)`;
  });

  /* ─────────── Audio visualizer (synthetic bars) ─────────── */
  const vizCanvas = document.getElementById("vizCanvas");
  const soundBtn = document.getElementById("sound-toggle");
  if (vizCanvas && soundBtn) {
    const ctx = vizCanvas.getContext("2d");
    let on = false;
    soundBtn.addEventListener("click", () => {
      // toggle one frame after audio.js handles state — use aria-pressed
      requestAnimationFrame(() => {
        on = soundBtn.getAttribute("aria-pressed") === "true";
        document.getElementById("audioViz").classList.toggle("is-on", on);
      });
    });

    const bars = 14;
    const phases = Array.from({ length: bars }, () => Math.random() * Math.PI * 2);
    function draw(t) {
      const w = vizCanvas.width, h = vizCanvas.height;
      ctx.clearRect(0, 0, w, h);
      const fg = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#fff";
      ctx.fillStyle = fg;
      const bw = (w - (bars - 1) * 2) / bars;
      for (let i = 0; i < bars; i++) {
        phases[i] += 0.06 + Math.random() * 0.02;
        let amp = on
          ? (0.4 + Math.abs(Math.sin(phases[i] + i * 0.4)) * 0.5) + Math.random() * 0.15
          : 0.05;
        const bh = Math.max(2, amp * h);
        ctx.fillRect(i * (bw + 2), h - bh, bw, bh);
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  /* ─────────── Liquid filter on grid photos (hover) ─────────── */
  // Re-uses #liquid SVG filter; turn on per-element when hovered, off when not
  document.querySelectorAll(".grid .ph, .reel .reel-frame").forEach((p) => {
    let raf;
    let scale = 0;
    let goal = 0;
    const disp = document.getElementById("disp");

    p.addEventListener("mouseenter", () => {
      goal = 6;
      animate();
    });
    p.addEventListener("mouseleave", () => {
      goal = 0;
    });
    function animate() {
      cancelAnimationFrame(raf);
      const step = () => {
        scale += (goal - scale) * 0.18;
        if (scale > 0.05) p.style.filter = `url(#liquid)`;
        else { p.style.filter = ""; }
        raf = requestAnimationFrame(step);
      };
      step();
    }
  });
  // Note: we intentionally share the #liquid filter (its scale is driven elsewhere).
  // Keep displacement subtle so it doesn't fight the about-photo distortion.

  /* ─────────── Stronger cursor snap (magnetic on photos too) ─────────── */
  // (the cursor itself already grows on .ph hover via mouse.hover detection)
  // Here we just nudge clickable photos slightly toward the cursor (gentle)
  document.querySelectorAll(".ph, .reel, .send, .util-btn, .nav-item").forEach((el) => {
    el.classList.add("snap-target");
  });

})();
