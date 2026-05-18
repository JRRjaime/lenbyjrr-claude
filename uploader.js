/* ─────────────────────────────────────────────────────────
   uploader.js
   - Injects an <image-slot> inside every photo placeholder
     (.ph in grids, .reel-frame in cine, .about-photo-inner,
     .hero-frame-art) so the user can drag-and-drop their
     real photos. Drops persist via the image-slot sidecar.
   - Bridges to the lightbox: when a slot is filled, the
     lightbox shows the user's real image instead of the
     decorative placeholder.
   ───────────────────────────────────────────────────────── */
(function () {

  // Helper: get a stable id for a host element
  function idFor(el, prefix, i) {
    if (el.dataset.slotId) return el.dataset.slotId;
    const seed = el.style.getPropertyValue("--seed") || "";
    const id = `${prefix}-${seed || i}`;
    el.dataset.slotId = id;
    return id;
  }

  // Insert an image-slot that fills its parent
  function inject(host, id, placeholder) {
    if (host.querySelector("image-slot")) return host.querySelector("image-slot");
    const slot = document.createElement("image-slot");
    slot.setAttribute("id", id);
    slot.setAttribute("shape", "rect");
    slot.setAttribute("fit", "cover");
    slot.setAttribute("placeholder", placeholder || "Arrastra tu foto aquí");
    if (host.dataset.src) slot.setAttribute("src", host.dataset.src);
    slot.style.position = "absolute";
    slot.style.inset = "0";
    slot.style.width = "100%";
    slot.style.height = "100%";
    slot.style.display = "block";
    host.appendChild(slot);
    // Mark host as "has real photo" so the placeholder treatment is hidden
    // (image-slot fires no event until the host omelette fetch resolves —
    // and `src` doesn't toggle data-filled — so we drive it via a class).
    if (host.dataset.src) host.classList.add("has-default-src");
    return slot;
  }

  // GRID photos
  const phs = [...document.querySelectorAll(".ph")];
  phs.forEach((ph, i) => {
    const label = ph.querySelector(".ph-label")?.textContent || "";
    const id = idFor(ph, "ph", i + 1);
    inject(ph, id, label);
  });

  // Cine reels
  document.querySelectorAll(".reel-frame").forEach((rf, i) => {
    const label = rf.parentElement?.querySelector("h3")?.textContent || "Vídeo";
    const id = idFor(rf, "reel", i + 1);
    inject(rf, id, "Frame de " + label);
  });

  // Cine player big monitor
  document.querySelectorAll(".cp-frame").forEach((cp, i) => {
    inject(cp, idFor(cp, "cine-monitor", i + 1), "Frame principal");
  });

  // Hero stage previews (5)
  document.querySelectorAll(".hero-frame-art").forEach((hf, i) => {
    inject(hf, idFor(hf, "hero", i + 1), "Foto de portada");
  });

  // About self-portrait
  const aboutInner = document.getElementById("liquidTarget");
  if (aboutInner) {
    inject(aboutInner, "about-self", "Autorretrato");
  }

  /* ────────────── LIGHTBOX BRIDGE ──────────────
     When opening the lightbox for a .ph, we want to show the user's
     real image (if dropped). We do this by reading the <image-slot>
     part="image" element's src.
  */
  const lbPhoto = document.getElementById("lightboxPhoto");
  if (lbPhoto) {
    function readSlotSrc(host) {
      const slot = host.querySelector("image-slot");
      if (!slot || !slot.shadowRoot) {
        return host.dataset.src || null;
      }
      const img = slot.shadowRoot.querySelector("img[part='image']");
      if (img && img.style.display !== "none" && img.src) return img.src;
      return host.dataset.src || null;
    }

    let lastPh = null;
    document.querySelectorAll(".ph").forEach((ph) => {
      ph.addEventListener("click", () => { lastPh = ph; }, true);
    });

    function applyToLightbox() {
      if (!lastPh) return;
      const src = readSlotSrc(lastPh);
      if (src) {
        lbPhoto.style.backgroundImage = `url("${src}")`;
        lbPhoto.style.backgroundSize = "cover";
        lbPhoto.style.backgroundPosition = "center";
        lbPhoto.classList.add("has-real");
      } else {
        lbPhoto.style.backgroundImage = "";
        lbPhoto.classList.remove("has-real");
      }
    }

    // Hook the explicit moments features.js opens/changes the lightbox:
    // - any click on a .ph
    // - prev / next buttons
    // - arrow keys
    document.querySelectorAll(".ph").forEach((ph) => {
      ph.addEventListener("click", () => setTimeout(applyToLightbox, 30));
    });
    ["lightboxPrev","lightboxNext"].forEach((bid) => {
      const b = document.getElementById(bid);
      if (b) b.addEventListener("click", () => {
        const counter = document.getElementById("lbCounter")?.textContent || "";
        const m = counter.match(/^(\d+)/);
        if (m) {
          const idx = parseInt(m[1], 10) - 1;
          lastPh = phs[idx];
          applyToLightbox();
        }
      });
    });
    window.addEventListener("keydown", (e) => {
      if (!document.getElementById("lightbox").classList.contains("is-on")) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        setTimeout(() => {
          const counter = document.getElementById("lbCounter")?.textContent || "";
          const m = counter.match(/^(\d+)/);
          if (m) {
            const idx = parseInt(m[1], 10) - 1;
            lastPh = phs[idx];
            applyToLightbox();
          }
        }, 30);
      }
    });
  }

  /* ────────────── HINT BAR ──────────────
     Show a small hint on first visit explaining drag-and-drop.
  */
  if (!localStorage.getItem("uploadHinted")) {
    const hint = document.createElement("div");
    hint.className = "upload-hint";
    hint.innerHTML = `
      <span class="uh-icon">↓</span>
      <span class="uh-text">Arrastra tus fotos sobre cualquier hueco — se guardarán automáticamente.</span>
      <button class="uh-close" aria-label="Cerrar">✕</button>
    `;
    document.body.appendChild(hint);
    hint.querySelector(".uh-close").addEventListener("click", () => {
      hint.classList.add("is-out");
      setTimeout(() => hint.remove(), 600);
      localStorage.setItem("uploadHinted", "1");
    });
    setTimeout(() => hint.classList.add("is-in"), 1200);
    setTimeout(() => {
      if (hint.parentNode) {
        hint.classList.add("is-out");
        setTimeout(() => hint.remove(), 600);
      }
    }, 14000);
  }

})();
