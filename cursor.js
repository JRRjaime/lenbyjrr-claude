/* ─────────────────────────────────────────────────────────
   cursor.js  ·  custom cursor + per-theme particle trail
   Vanilla canvas, requestAnimationFrame loop.
   Five emitters: dust, ember, contrail, neon, timecode.
   ───────────────────────────────────────────────────────── */
(function () {
  const canvas = document.getElementById("fx");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width  = window.innerWidth  + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  // ─── input ───────────────────────────────────────────────
  const mouse = { x: -1000, y: -1000, px: -1000, py: -1000, vx: 0, vy: 0, down: false, over: false, hover: false };
  window.addEventListener("mousemove", (e) => {
    mouse.over = true;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    // detect interactive hover for sizing
    const el = document.elementFromPoint(e.clientX, e.clientY);
    mouse.hover = !!(el && el.closest("a,button,input,textarea,select,[data-magnet]"));
  }, { passive: true });
  window.addEventListener("mouseleave", () => { mouse.over = false; });
  window.addEventListener("mousedown",  () => { mouse.down  = true;  });
  window.addEventListener("mouseup",    () => { mouse.down  = false; });

  // ─── theme palette + emitter selection ──────────────────
  let theme = "nature";
  const PALETTE = {
    nature:   { ring: "#6b6555", dot: "#c79a4a", trail: ["#d8c08a", "#a48a55", "#efe2bd"] },
    holy:     { ring: "#e9e0c8", dot: "#ffb14a", trail: ["#ffc56b", "#e87a2a", "#fff3c2"] },
    aviation: { ring: "#dfe8f1", dot: "#7dd2ff", trail: ["#cfe6ff", "#9ec4e8", "#ffffff"] },
    urban:    { ring: "#e6e4df", dot: "#ff3b6b", trail: ["#ff3b6b", "#36c5ff", "#fff148"] },
    cine:     { ring: "#f1f1ee", dot: "#ff5a36", trail: ["#ff5a36", "#ffffff", "#9aa0a6"] },
  };

  window.addEventListener("themechange", (e) => { theme = e.detail.theme; });

  // ─── particles ───────────────────────────────────────────
  const particles = [];
  const MAX = 600;

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function emit() {
    if (!mouse.over) return;
    if (particles.length > MAX) return;
    const pal = PALETTE[theme];
    const speed = Math.hypot(mouse.x - mouse.px, mouse.y - mouse.py);

    if (theme === "nature") {
      // dust motes drifting up + sideways
      const n = Math.min(2, Math.ceil(speed / 18));
      for (let i = 0; i < n + 1; i++) {
        particles.push({
          k: "nature",
          x: mouse.x + rnd(-8, 8),
          y: mouse.y + rnd(-8, 8),
          vx: rnd(-0.15, 0.15),
          vy: rnd(-0.35, -0.05),
          r: rnd(0.8, 2.4),
          life: 0, max: rnd(1600, 2800),
          c: pal.trail[Math.floor(Math.random() * pal.trail.length)],
          blur: rnd(0, 1),
        });
      }
    } else if (theme === "holy") {
      // ember + flicker sparks falling under gravity
      const n = Math.min(3, Math.ceil(speed / 14));
      for (let i = 0; i < n + 1; i++) {
        particles.push({
          k: "holy",
          x: mouse.x + rnd(-4, 4),
          y: mouse.y + rnd(-2, 6),
          vx: rnd(-0.2, 0.2),
          vy: rnd(-0.6, -0.1),
          g: 0.012,
          r: rnd(1.0, 2.2),
          life: 0, max: rnd(900, 1600),
          c: pal.trail[Math.floor(Math.random() * pal.trail.length)],
          flick: rnd(0.6, 1),
        });
      }
    } else if (theme === "aviation") {
      // condensation trail — sample-along-segment
      const dx = mouse.x - mouse.px, dy = mouse.y - mouse.py;
      const steps = Math.min(12, Math.ceil(speed / 4));
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        particles.push({
          k: "aviation",
          x: mouse.px + dx * t + rnd(-1.2, 1.2),
          y: mouse.py + dy * t + rnd(-1.2, 1.2),
          vx: rnd(-0.04, 0.04),
          vy: rnd(-0.04, 0.04),
          r: rnd(2.5, 5.5),
          life: 0, max: rnd(1100, 1900),
          c: "#ffffff",
        });
      }
    } else if (theme === "urban") {
      // light streaks: long-tail particles that travel away with motion vector
      const dx = mouse.x - mouse.px, dy = mouse.y - mouse.py;
      const n = Math.min(2, Math.ceil(speed / 22));
      for (let i = 0; i < n + 1; i++) {
        particles.push({
          k: "urban",
          x: mouse.x, y: mouse.y,
          vx: dx * 0.18 + rnd(-0.4, 0.4),
          vy: dy * 0.18 + rnd(-0.4, 0.4),
          len: rnd(14, 38),
          life: 0, max: rnd(500, 900),
          c: pal.trail[Math.floor(Math.random() * pal.trail.length)],
        });
      }
    } else if (theme === "cine") {
      // pixel grid + timecode glyphs
      const n = Math.min(3, Math.ceil(speed / 14));
      for (let i = 0; i < n; i++) {
        particles.push({
          k: "cine-px",
          x: mouse.x + Math.round(rnd(-22, 22) / 2) * 2,
          y: mouse.y + Math.round(rnd(-22, 22) / 2) * 2,
          r: 2,
          life: 0, max: rnd(500, 900),
          c: pal.trail[Math.floor(Math.random() * pal.trail.length)],
        });
      }
      // occasional glyph
      if (Math.random() < 0.06) {
        const glyphs = ["00:00:14:02","REC ●","◢","◣","FX3","f/2.8","1/250s","ISO 400"];
        particles.push({
          k: "cine-tc",
          x: mouse.x + rnd(16, 30),
          y: mouse.y + rnd(-10, 14),
          vx: rnd(-0.2, 0.2),
          vy: rnd(-0.15, -0.05),
          life: 0, max: 1100,
          text: glyphs[Math.floor(Math.random() * glyphs.length)],
          c: pal.dot,
        });
      }
    }
  }

  // ─── draw ────────────────────────────────────────────────
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(50, now - last); last = now;

    // motion vector for emitters
    mouse.vx = mouse.x - mouse.px;
    mouse.vy = mouse.y - mouse.py;

    emit();

    // soft trail decay — clear instead of full clear for some categories
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    const pal = PALETTE[theme];

    // ── update + draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life > p.max) { particles.splice(i, 1); continue; }
      const t = p.life / p.max;

      if (p.k === "nature") {
        p.x += p.vx; p.y += p.vy;
        p.vx += rnd(-0.012, 0.012);
        p.vy += rnd(-0.005, 0.002);
        const a = (1 - t) * 0.75;
        ctx.globalCompositeOperation = "lighter";
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        g.addColorStop(0, `rgba(255, 226, 160, ${a})`);
        g.addColorStop(1, "rgba(255, 226, 160, 0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255,243,200,${a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.6, 0, Math.PI * 2); ctx.fill();
      }

      else if (p.k === "holy") {
        p.x += p.vx; p.y += p.vy;
        p.vy += p.g; p.vx *= 0.99;
        const flick = 0.5 + Math.random() * 0.5;
        const a = (1 - t) * p.flick * flick;
        ctx.globalCompositeOperation = "lighter";
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        g.addColorStop(0, `rgba(255,180,80,${a})`);
        g.addColorStop(0.5, `rgba(220,80,30,${a * 0.5})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255,235,180,${a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.5, 0, Math.PI * 2); ctx.fill();
      }

      else if (p.k === "aviation") {
        p.x += p.vx; p.y += p.vy;
        p.r *= 1.006;
        const a = Math.sin(t * Math.PI) * 0.35;
        ctx.globalCompositeOperation = "source-over";
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(255,255,255,${a})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }

      else if (p.k === "urban") {
        p.x += p.vx; p.y += p.vy;
        const a = (1 - t) * 0.9;
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = p.c;
        ctx.lineWidth = 1.6;
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * (p.len / 6), p.y - p.vy * (p.len / 6));
        ctx.stroke();
        // glow head
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 8);
        g.addColorStop(0, p.c);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }

      else if (p.k === "cine-px") {
        const a = 1 - t;
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = p.c;
        ctx.globalAlpha = a;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
        ctx.globalAlpha = 1;
      }

      else if (p.k === "cine-tc") {
        p.x += p.vx; p.y += p.vy;
        const a = (1 - t) * 0.9;
        ctx.globalCompositeOperation = "source-over";
        ctx.font = "10px ui-monospace, 'JetBrains Mono', monospace";
        ctx.fillStyle = p.c;
        ctx.globalAlpha = a;
        ctx.fillText(p.text, p.x, p.y);
        ctx.globalAlpha = 1;
      }
    }

    // ── cursor itself (drawn on top) ────────────────────────
    if (mouse.over) {
      ctx.globalCompositeOperation = "source-over";
      drawCursor(pal);
    }

    // smooth previous-position
    mouse.px += (mouse.x - mouse.px) * 0.35;
    mouse.py += (mouse.y - mouse.py) * 0.35;

    requestAnimationFrame(frame);
  }

  function drawCursor(pal) {
    const x = mouse.x, y = mouse.y;
    const hover = mouse.hover;
    const baseR = hover ? 22 : 14;

    ctx.save();

    if (theme === "nature") {
      // soft ring + tiny center dot
      ctx.strokeStyle = pal.ring;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, baseR, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = pal.dot;
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
    }

    else if (theme === "holy") {
      // candle flame teardrop — flickers
      const flick = 0.85 + Math.sin(performance.now() * 0.02) * 0.05 + Math.random() * 0.08;
      const h = (hover ? 22 : 16) * flick;
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(x, y - h * 0.2, 0, x, y - h * 0.2, h * 1.8);
      g.addColorStop(0, "rgba(255,220,140,0.95)");
      g.addColorStop(0.3, "rgba(255,160,60,0.55)");
      g.addColorStop(1, "rgba(180,40,10,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y - h * 0.2, h * 0.55, h * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
      // bright core
      ctx.fillStyle = "rgba(255,245,210,0.95)";
      ctx.beginPath();
      ctx.ellipse(x, y - h * 0.1, h * 0.18, h * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    else if (theme === "aviation") {
      // arrowhead / chevron pointing along motion
      const ang = Math.atan2(mouse.vy, mouse.vx) || 0;
      const r = hover ? 18 : 12;
      ctx.translate(x, y); ctx.rotate(ang);
      ctx.strokeStyle = pal.ring;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(-r, -r * 0.55);
      ctx.lineTo(r, 0);
      ctx.lineTo(-r, r * 0.55);
      ctx.stroke();
      ctx.fillStyle = pal.dot;
      ctx.beginPath(); ctx.arc(r * 0.3, 0, 2, 0, Math.PI * 2); ctx.fill();
    }

    else if (theme === "urban") {
      // pulsing geometric square ring + crosshair
      const pulse = 1 + Math.sin(performance.now() * 0.006) * 0.07;
      const r = (hover ? 18 : 12) * pulse;
      ctx.strokeStyle = pal.ring;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.9;
      ctx.strokeRect(x - r, y - r, r * 2, r * 2);
      ctx.beginPath();
      ctx.moveTo(x - r - 4, y); ctx.lineTo(x - r + 4, y);
      ctx.moveTo(x + r - 4, y); ctx.lineTo(x + r + 4, y);
      ctx.moveTo(x, y - r - 4); ctx.lineTo(x, y - r + 4);
      ctx.moveTo(x, y + r - 4); ctx.lineTo(x, y + r + 4);
      ctx.stroke();
      ctx.fillStyle = pal.dot;
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }

    else if (theme === "cine") {
      // viewfinder reticle with corner brackets + tiny rec dot
      const r = hover ? 28 : 20;
      ctx.strokeStyle = pal.ring;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.85;
      const c = 8;
      // corners
      ctx.beginPath();
      // tl
      ctx.moveTo(x - r, y - r + c); ctx.lineTo(x - r, y - r); ctx.lineTo(x - r + c, y - r);
      // tr
      ctx.moveTo(x + r - c, y - r); ctx.lineTo(x + r, y - r); ctx.lineTo(x + r, y - r + c);
      // br
      ctx.moveTo(x + r, y + r - c); ctx.lineTo(x + r, y + r); ctx.lineTo(x + r - c, y + r);
      // bl
      ctx.moveTo(x - r + c, y + r); ctx.lineTo(x - r, y + r); ctx.lineTo(x - r, y + r - c);
      ctx.stroke();
      // center crosshair
      ctx.beginPath();
      ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y);
      ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4);
      ctx.stroke();
      // rec dot
      const blink = (performance.now() / 600) % 1 < 0.5;
      if (blink) {
        ctx.fillStyle = pal.dot;
        ctx.beginPath(); ctx.arc(x + r + 8, y - r + 4, 2.6, 0, Math.PI * 2); ctx.fill();
      }
    }

    ctx.restore();
  }

  requestAnimationFrame(frame);
})();
