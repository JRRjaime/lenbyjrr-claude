/* ─────────────────────────────────────────────────────────
   contact-sheet.js
   Builds an analog-style 35mm contact sheet:
   - Every .ph[data-src] becomes one tiny frame
   - Sequential frame number + sprocket holes
   - Date stamp + grease-pencil approval marks on hover
   - Click to open the same lightbox the grids use
   ───────────────────────────────────────────────────────── */
(function () {
  const root = document.getElementById("contactSheet");
  if (!root) return;

  // Gather every photo on the page that has a real src
  const phs = [...document.querySelectorAll(".ph[data-src]")];

  // Build into "strips" of 6 frames (like a real 35mm contact sheet)
  // Each strip gets its own sprocket-hole bar + footer code.
  const PER_STRIP = 6;
  const strips = [];
  for (let i = 0; i < phs.length; i += PER_STRIP) {
    strips.push(phs.slice(i, i + PER_STRIP));
  }

  let frameNo = 1;
  strips.forEach((stripPhs, sIdx) => {
    const strip = document.createElement("div");
    strip.className = "cs-strip";

    // Top sprocket bar
    const sprocketTop = document.createElement("div");
    sprocketTop.className = "cs-sprocket";
    for (let i = 0; i < 20; i++) sprocketTop.appendChild(document.createElement("i"));
    strip.appendChild(sprocketTop);

    // Frame row
    const row = document.createElement("div");
    row.className = "cs-row";
    stripPhs.forEach((ph) => {
      const frame = document.createElement("button");
      frame.className = "cs-frame";
      const cat = (ph.closest("[data-theme-anchor]")?.dataset.themeAnchor) || "nature";
      frame.classList.add("cs-cat-" + cat);

      const num = String(frameNo).padStart(2, "0") + (Math.random() < 0.18 ? "A" : "");
      frame.innerHTML = `
        <span class="cs-num">${num}</span>
        <span class="cs-img" style="background-image:url('${ph.dataset.src}')"></span>
        <span class="cs-mark cs-mark-tl"></span>
        <span class="cs-mark cs-mark-tr"></span>
        <span class="cs-mark cs-mark-bl"></span>
        <span class="cs-mark cs-mark-br"></span>
        <span class="cs-tag">${ph.querySelector(".ph-label")?.textContent || ""}</span>
        <span class="cs-date">${ph.dataset.date || ""} · ${ph.dataset.time || ""}</span>
        <span class="cs-circle"></span>
        <span class="cs-cross"></span>
      `;
      // sprinkle "approval circles" or "X marks" on some frames like a real
      // photographer's grease-pencil — based on seed parity
      const seed = parseInt(ph.style.getPropertyValue("--seed") || frameNo, 10);
      if (seed % 5 === 0) frame.classList.add("cs-pick");
      else if (seed % 11 === 0) frame.classList.add("cs-reject");

      // open the existing lightbox by simulating a click on the source .ph
      frame.addEventListener("click", () => ph.click());
      row.appendChild(frame);
      frameNo++;
    });
    strip.appendChild(row);

    // Bottom sprocket bar
    const sprocketBot = document.createElement("div");
    sprocketBot.className = "cs-sprocket";
    for (let i = 0; i < 20; i++) sprocketBot.appendChild(document.createElement("i"));
    strip.appendChild(sprocketBot);

    // Strip footer (KODAK PORTRA 400 5008 etc.)
    const foot = document.createElement("div");
    foot.className = "cs-strip-foot";
    const films = ["KODAK PORTRA 400", "ILFORD HP5 PLUS 400", "FUJI PRO 400H", "KODAK TRI-X 400", "CINESTILL 800T"];
    foot.innerHTML = `
      <span>${films[sIdx % films.length]} · ${String(sIdx + 1).padStart(2,"0")}</span>
      <span class="cs-strip-arrow">→</span>
      <span>FRAME ${(sIdx*PER_STRIP+1).toString().padStart(2,"0")}–${Math.min((sIdx+1)*PER_STRIP, phs.length).toString().padStart(2,"0")}</span>
    `;
    strip.appendChild(foot);

    root.appendChild(strip);
  });
})();
