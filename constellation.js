/* ─────────────────────────────────────────────────────────
   constellation.js  ·  every photo is a star
   - Reads .ph[data-src][data-lat][data-lng]
   - Projects lat/lng → SVG xy (linear, padded)
   - Twinkling dots, hover tooltip with thumbnail
   - Click → triggers the source .ph click (opens lightbox)
   ───────────────────────────────────────────────────────── */
(function () {
  const svg = document.getElementById("cnstSvg");
  if (!svg) return;
  const W = 1200, H = 620, PAD = 80;
  const starsG  = document.getElementById("cnstStars");
  const linesG  = document.getElementById("cnstLines");
  const labelG  = document.getElementById("cnstLabels");
  const bgG     = document.getElementById("cnstBg");
  const tip     = document.getElementById("cnstTip");
  const tipThumb = document.getElementById("cnstTipThumb");
  const tipLoc  = document.getElementById("cnstTipLoc");
  const tipCap  = document.getElementById("cnstTipCap");
  const tipDate = document.getElementById("cnstTipDate");
  const counter = document.getElementById("cnstCount");
  const minLatEl = document.getElementById("cnstMin");
  const maxLatEl = document.getElementById("cnstMax");

  // Collect photos with valid coords
  function parseCoord(s) {
    if (!s) return null;
    const m = s.match(/([\d.]+)°\s*([NSEW])/i);
    if (!m) return null;
    const v = parseFloat(m[1]);
    const sign = /[SW]/i.test(m[2]) ? -1 : 1;
    return v * sign;
  }
  const photos = [...document.querySelectorAll(".ph[data-src][data-lat][data-lng]")]
    .map((p) => ({
      el: p,
      lat: parseCoord(p.dataset.lat),
      lng: parseCoord(p.dataset.lng),
      src: p.dataset.src,
      caption: p.querySelector(".ph-label")?.textContent || "",
      date: p.dataset.date || "",
      time: p.dataset.time || "",
      cat: p.closest("[data-theme-anchor]")?.dataset.themeAnchor || "nature",
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

  if (!photos.length) return;

  // Determine bounding box, with slight inflation
  const lats = photos.map((p) => p.lat);
  const lngs = photos.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const padFactor = 0.18;
  const dLat = (maxLat - minLat) || 1;
  const dLng = (maxLng - minLng) || 1;
  const bLat = [minLat - dLat * padFactor, maxLat + dLat * padFactor];
  const bLng = [minLng - dLng * padFactor, maxLng + dLng * padFactor];

  function project(lat, lng) {
    // longitude → x (linear), inverted latitude → y
    // Mercator-ish would be ideal but linear is fine for this scale
    const x = PAD + ((lng - bLng[0]) / (bLng[1] - bLng[0])) * (W - PAD * 2);
    const y = PAD + (1 - (lat - bLat[0]) / (bLat[1] - bLat[0])) * (H - PAD * 2);
    return { x, y };
  }

  // ── Decorative tiny background stars ──
  const rand = (() => {
    let s = 27;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  })();
  for (let i = 0; i < 220; i++) {
    const c = document.createElementNS(svg.namespaceURI, "circle");
    c.setAttribute("cx", rand() * W);
    c.setAttribute("cy", rand() * H);
    const r = rand() * 0.9 + 0.2;
    c.setAttribute("r", r);
    c.setAttribute("fill", "rgba(255,255,255," + (0.15 + rand() * 0.4) + ")");
    bgG.appendChild(c);
  }

  // ── City reference points ──
  const CITIES = [
    { name: "GRANADA", lat: 37.1773, lng: -3.5985 },
    { name: "SEVILLA", lat: 37.3886, lng: -5.9823 },
    { name: "MADRID",  lat: 40.4168, lng: -3.7038 },
    { name: "BRAGA",   lat: 41.5503, lng: -8.4203 },
    { name: "TÁNGER",  lat: 35.7595, lng: -5.8340 },
    { name: "LISBOA",  lat: 38.7223, lng: -9.1393 },
  ];
  CITIES.forEach((c) => {
    const p = project(c.lat, c.lng);
    if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) return;
    const dot = document.createElementNS(svg.namespaceURI, "circle");
    dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y);
    dot.setAttribute("r", 1.8);
    dot.setAttribute("fill", "rgba(255,255,255,0.32)");
    labelG.appendChild(dot);
    const t = document.createElementNS(svg.namespaceURI, "text");
    t.setAttribute("x", p.x + 9);
    t.setAttribute("y", p.y + 4);
    t.setAttribute("fill", "rgba(255,255,255,0.32)");
    t.setAttribute("font-family", "JetBrains Mono, monospace");
    t.setAttribute("font-size", "10");
    t.setAttribute("letter-spacing", "0.18em");
    t.textContent = c.name;
    labelG.appendChild(t);
  });

  // ── Constellation lines (connect within same category to nearest neighbour) ──
  const byCat = {};
  photos.forEach((p) => { (byCat[p.cat] ||= []).push(p); });
  Object.values(byCat).forEach((arr) => {
    // sort by lat then lng for stable nearest-neighbour line
    arr.sort((a, b) => (a.lat - b.lat) || (a.lng - b.lng));
    for (let i = 0; i < arr.length - 1; i++) {
      const a = project(arr[i].lat,   arr[i].lng);
      const b = project(arr[i+1].lat, arr[i+1].lng);
      const line = document.createElementNS(svg.namespaceURI, "line");
      line.setAttribute("x1", a.x); line.setAttribute("y1", a.y);
      line.setAttribute("x2", b.x); line.setAttribute("y2", b.y);
      line.setAttribute("class", "cnst-link cnst-link--" + arr[i].cat);
      linesG.appendChild(line);
    }
  });

  // ── Each photo is a star ──
  const CAT_COLOR = {
    nature:   "#d8c08a",
    holy:     "#ffae3a",
    aviation: "#7dd2ff",
    urban:    "#ff6b8a",
  };

  // Group nearby photos so multiple at the same spot offset slightly
  // (Granada cluster, e.g.)
  const placed = [];
  photos.forEach((ph) => {
    let { x, y } = project(ph.lat, ph.lng);
    // collision check — nudge if too close to an existing one
    for (let i = 0; i < placed.length; i++) {
      const p = placed[i];
      const dx = x - p.x, dy = y - p.y;
      const d = Math.hypot(dx, dy);
      if (d < 14) {
        // push outwards in a small spiral
        const ang = Math.atan2(dy || rand() - 0.5, dx || rand() - 0.5);
        x = p.x + Math.cos(ang) * 14;
        y = p.y + Math.sin(ang) * 14;
      }
    }
    placed.push({ x, y });

    const g = document.createElementNS(svg.namespaceURI, "g");
    g.setAttribute("class", "cnst-star cnst-star--" + ph.cat);
    g.setAttribute("transform", `translate(${x.toFixed(1)},${y.toFixed(1)})`);
    g.setAttribute("data-loc", buildLocLabel(ph.lat, ph.lng));

    const glow = document.createElementNS(svg.namespaceURI, "circle");
    glow.setAttribute("r", 14);
    glow.setAttribute("fill", "url(#starGlow)");
    glow.setAttribute("class", "cnst-star-glow");
    g.appendChild(glow);

    const core = document.createElementNS(svg.namespaceURI, "circle");
    core.setAttribute("r", 2.4);
    core.setAttribute("fill", CAT_COLOR[ph.cat] || "#fff");
    core.setAttribute("class", "cnst-star-core");
    g.appendChild(core);

    // hit area
    const hit = document.createElementNS(svg.namespaceURI, "circle");
    hit.setAttribute("r", 18);
    hit.setAttribute("fill", "transparent");
    hit.style.cursor = "none";
    g.appendChild(hit);

    g.addEventListener("mouseenter", () => showTip(ph, x, y));
    g.addEventListener("mouseleave", hideTip);
    g.addEventListener("click", () => ph.el.click());

    // staggered twinkle phase
    g.style.setProperty("--ph", (rand() * Math.PI * 2).toFixed(2));
    g.style.setProperty("--td", (3 + rand() * 4).toFixed(2) + "s");

    starsG.appendChild(g);
  });

  // ── Stats footer ──
  counter.textContent = photos.length;
  minLatEl.textContent = minLat.toFixed(1);
  maxLatEl.textContent = maxLat.toFixed(1);

  // ── Tooltip ──
  let tipTimer = null;
  function showTip(ph, sx, sy) {
    tipThumb.style.backgroundImage = `url("${ph.src}")`;
    tipLoc.textContent = ph.cat.toUpperCase() + " · " + buildLocLabel(ph.lat, ph.lng);
    tipCap.textContent = ph.caption;
    tipDate.textContent = (ph.date + " · " + ph.time).trim();

    // position tip relative to the SVG container
    const svgRect = svg.getBoundingClientRect();
    const scaleX = svgRect.width  / W;
    const scaleY = svgRect.height / H;
    const px = sx * scaleX;
    const py = sy * scaleY;
    tip.style.left = px + "px";
    tip.style.top  = py + "px";
    tip.classList.add("is-on");
    clearTimeout(tipTimer);
  }
  function hideTip() {
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => tip.classList.remove("is-on"), 80);
  }

  function buildLocLabel(lat, lng) {
    return `${lat.toFixed(2)}°${lat >= 0 ? "N" : "S"} ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? "E" : "W"}`;
  }
})();
