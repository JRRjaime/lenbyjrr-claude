/* ─────────────────────────────────────────────────────────
   audio.js  ·  per-category ambient bed, all synthesized
   - Wind (noise + lowpass LFO)        → nature
   - Procession (kick + bell tail)     → holy
   - Jet rumble (saw + filtered noise) → aviation
   - City pulse (rain + traffic hum)   → urban
   - Drone hum (high pad + ticks)      → cine
   Toggle via #sound-toggle.
   ───────────────────────────────────────────────────────── */
(function () {
  const btn = document.getElementById("sound-toggle");
  if (!btn) return;

  let ctx, master, theme = "nature", on = false;
  let currentBed = null;
  let crossfadeMs = 2200;

  function ensureCtx() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }

  // ── reusable helpers ────────────────────────────────────
  function noiseBuffer(duration = 2) {
    const len = ctx.sampleRate * duration;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function newBed() {
    const out = ctx.createGain();
    out.gain.value = 0;
    out.connect(master);
    return { out, nodes: [], lfos: [], started: [] };
  }

  // ── beds per theme ──────────────────────────────────────
  function bedNature() {
    const bed = newBed();
    // wind: pink-ish noise → lowpass with LFO
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(4);
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 600;
    lp.Q.value = 1.2;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.1;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 380;
    lfo.connect(lfoGain).connect(lp.frequency);
    const g = ctx.createGain(); g.gain.value = 0.35;
    src.connect(lp).connect(g).connect(bed.out);
    src.start(); lfo.start();
    bed.started.push(src, lfo);

    // gentle bird chirps (very sparse)
    const chirp = () => {
      if (currentBed !== bed) return;
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      const f = 1800 + Math.random() * 1600;
      o.frequency.setValueAtTime(f, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(f * 1.4, ctx.currentTime + 0.12);
      og.gain.setValueAtTime(0.0001, ctx.currentTime);
      og.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
      og.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      o.connect(og).connect(bed.out);
      o.start();
      o.stop(ctx.currentTime + 0.2);
      setTimeout(chirp, 2400 + Math.random() * 5000);
    };
    setTimeout(chirp, 1500);
    return bed;
  }

  function bedHoly() {
    const bed = newBed();
    // sub rumble (low pad)
    const o1 = ctx.createOscillator(); o1.type = "sine"; o1.frequency.value = 55;
    const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = 82.4;
    const g  = ctx.createGain(); g.gain.value = 0.18;
    o1.connect(g); o2.connect(g); g.connect(bed.out);
    o1.start(); o2.start();
    bed.started.push(o1, o2);

    // distant bell + foot-step thump
    const step = () => {
      if (currentBed !== bed) return;
      // kick-ish step
      const k = ctx.createOscillator(); const kg = ctx.createGain();
      k.frequency.setValueAtTime(120, ctx.currentTime);
      k.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.18);
      kg.gain.setValueAtTime(0.001, ctx.currentTime);
      kg.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.01);
      kg.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
      k.connect(kg).connect(bed.out); k.start(); k.stop(ctx.currentTime + 0.3);

      // far cornet / bell shimmer (rare)
      if (Math.random() < 0.18) {
        const b = ctx.createOscillator(); const bg = ctx.createGain();
        b.type = "triangle";
        b.frequency.value = 220 + Math.random() * 60;
        bg.gain.setValueAtTime(0.0001, ctx.currentTime);
        bg.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.05);
        bg.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.6);
        const conv = ctx.createBiquadFilter(); conv.type = "lowpass"; conv.frequency.value = 1200;
        b.connect(conv).connect(bg).connect(bed.out);
        b.start(); b.stop(ctx.currentTime + 1.7);
      }
      setTimeout(step, 1200 + Math.random() * 380);
    };
    setTimeout(step, 600);
    return bed;
  }

  function bedAviation() {
    const bed = newBed();
    // sawtooth pad (engine fundamentals) very low
    const o1 = ctx.createOscillator(); o1.type = "sawtooth"; o1.frequency.value = 70;
    const o2 = ctx.createOscillator(); o2.type = "sawtooth"; o2.frequency.value = 71.5; // beating
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 240;
    const g  = ctx.createGain(); g.gain.value = 0.08;
    o1.connect(lp); o2.connect(lp); lp.connect(g).connect(bed.out);
    o1.start(); o2.start();
    bed.started.push(o1, o2);

    // rushing-air noise
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(4); src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 800; bp.Q.value = 0.6;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain(); lfoG.gain.value = 600;
    lfo.connect(lfoG).connect(bp.frequency);
    const sg = ctx.createGain(); sg.gain.value = 0.12;
    src.connect(bp).connect(sg).connect(bed.out);
    src.start(); lfo.start();
    bed.started.push(src, lfo);
    return bed;
  }

  function bedUrban() {
    const bed = newBed();
    // rain on asphalt: filtered noise
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(4); src.loop = true;
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1800;
    const g = ctx.createGain(); g.gain.value = 0.18;
    src.connect(hp).connect(g).connect(bed.out);
    src.start();
    bed.started.push(src);

    // distant traffic hum
    const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = 60;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 200;
    const og = ctx.createGain(); og.gain.value = 0.06;
    o.connect(lp).connect(og).connect(bed.out);
    o.start();
    bed.started.push(o);

    // occasional siren ping or car-pass
    const pass = () => {
      if (currentBed !== bed) return;
      const o = ctx.createOscillator(); const og = ctx.createGain();
      o.type = "sine";
      const f = 380 + Math.random() * 180;
      o.frequency.setValueAtTime(f, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(f * 0.6, ctx.currentTime + 1.6);
      og.gain.setValueAtTime(0.0001, ctx.currentTime);
      og.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 0.4);
      og.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
      o.connect(og).connect(bed.out);
      o.start(); o.stop(ctx.currentTime + 2);
      setTimeout(pass, 6000 + Math.random() * 9000);
    };
    setTimeout(pass, 3000);
    return bed;
  }

  function bedCine() {
    const bed = newBed();
    // high tech drone hum
    const o1 = ctx.createOscillator(); o1.type = "sine"; o1.frequency.value = 220;
    const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = 330;
    const g  = ctx.createGain(); g.gain.value = 0.06;
    o1.connect(g); o2.connect(g); g.connect(bed.out);
    o1.start(); o2.start();
    bed.started.push(o1, o2);

    // tick / data blip
    const tick = () => {
      if (currentBed !== bed) return;
      const o = ctx.createOscillator(); const og = ctx.createGain();
      o.type = "square"; o.frequency.value = 2200 + Math.random() * 600;
      og.gain.setValueAtTime(0.0001, ctx.currentTime);
      og.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + 0.005);
      og.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
      o.connect(og).connect(bed.out);
      o.start(); o.stop(ctx.currentTime + 0.08);
      setTimeout(tick, 1100 + Math.random() * 1800);
    };
    setTimeout(tick, 500);

    // soft noise floor
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(4); src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1200;
    const sg = ctx.createGain(); sg.gain.value = 0.025;
    src.connect(lp).connect(sg).connect(bed.out);
    src.start();
    bed.started.push(src);
    return bed;
  }

  const FACTORIES = {
    nature: bedNature, holy: bedHoly, aviation: bedAviation, urban: bedUrban, cine: bedCine,
  };

  function fadeIn(g) {
    const now = ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(1, now + crossfadeMs / 1000);
  }
  function fadeOutAndStop(bed) {
    if (!bed) return;
    const now = ctx.currentTime;
    bed.out.gain.cancelScheduledValues(now);
    bed.out.gain.setValueAtTime(bed.out.gain.value, now);
    bed.out.gain.linearRampToValueAtTime(0, now + crossfadeMs / 1000);
    setTimeout(() => {
      bed.started.forEach((n) => { try { n.stop(); } catch (_) {} });
      try { bed.out.disconnect(); } catch (_) {}
    }, crossfadeMs + 200);
  }

  function switchTo(t) {
    theme = t;
    if (!on || !ctx) return;
    const old = currentBed;
    const next = FACTORIES[t]();
    currentBed = next;
    fadeIn(next.out.gain);
    fadeOutAndStop(old);
  }

  function setOn(v) {
    on = v;
    btn.setAttribute("aria-pressed", String(v));
    if (v) {
      ensureCtx();
      ctx.resume?.();
      // fade master in
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.linearRampToValueAtTime(0.6, now + 0.8);
      switchTo(theme);
    } else {
      if (!ctx) return;
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.linearRampToValueAtTime(0, now + 0.6);
      setTimeout(() => fadeOutAndStop(currentBed), 700);
      currentBed = null;
    }
  }

  /* ─────────────────────────────────────────────────────
     MARCHAS PROCESIONALES — synthesized brass band motifs.
     A hovered .ph[data-marcha] cross-fades the holy bed
     out and plays its melody (only while sound is ON).
     ───────────────────────────────────────────────────── */

  // Notes as semitone offsets from A4 (440 Hz)
  function noteHz(semi) { return 440 * Math.pow(2, semi / 12); }

  // Each melody is [[semi, dur(ms)], …] — dur is the beat length.
  // Tempo around 70bpm, beat = 857ms. We scale via tempo factor.
  const MARCHAS = {
    "Cristo de la Alcazaba": {
      // Granada · Manuel Sánchez Rubio · solemn minor descent + dotted figure
      tempo: 0.9,
      notes: [
        // bar 1 — opening call
        [3, 1.0], [3, 0.5], [5, 0.5], [7, 1.0], [3, 1.0],
        // bar 2 — descent
        [5, 0.75], [3, 0.25], [0, 0.5], [-2, 0.5], [-4, 1.5],
        // bar 3 — quiet response
        [-2, 0.5], [0, 0.5], [3, 1.0], [-2, 2.0],
      ],
      key: -5, // root D
      pad: [-17, -10], // bass D2 + A2
      gain: 0.34,
    },
    "Fue azotado": {
      // dark heavy march — Sevilla style, dotted rhythm, fall
      tempo: 0.85,
      notes: [
        [0, 0.75], [-2, 0.25], [-4, 0.5], [-5, 0.5], [-7, 1.0],
        [-5, 0.75], [-7, 0.25], [-9, 0.5], [-10, 0.5], [-12, 1.5],
        [-7, 0.5], [-5, 0.5], [-4, 1.0], [-5, 2.0],
      ],
      key: -2, // root G
      pad: [-19, -12],
      gain: 0.36,
    },
    "Coronación de la Macarena": {
      // bright fanfare opening — Pedro Braña — major-key flourish
      tempo: 1.0,
      notes: [
        [7, 0.5], [7, 0.5], [12, 1.0], [11, 0.5], [9, 0.5],
        [7, 1.0], [4, 1.0],
        [9, 0.5], [11, 0.5], [12, 1.0], [11, 0.5], [9, 0.5],
        [7, 1.0], [12, 2.0],
      ],
      key: -7, // root C5
      pad: [-15, -8],
      gain: 0.34,
    },
  };

  let marchaState = null; // { name, scheduledNodes: [], cleanup }
  let suspendedHolyBed = null;

  function playMarchaNote(at, hz, durSec, peakGain) {
    // Brass-like voice: 3 saw harmonics + bandpass + ADSR
    const o1 = ctx.createOscillator(); o1.type = "sawtooth"; o1.frequency.value = hz;
    const o2 = ctx.createOscillator(); o2.type = "sawtooth"; o2.frequency.value = hz * 1.005;
    const o3 = ctx.createOscillator(); o3.type = "square";   o3.frequency.value = hz;
    const mix = ctx.createGain(); mix.gain.value = 1;
    o1.connect(mix); o2.connect(mix); o3.connect(mix);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = hz * 2.2; bp.Q.value = 1.6;
    const g = ctx.createGain();
    const attack = 0.025, release = Math.min(0.35, durSec * 0.4);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peakGain, at + attack);
    g.gain.setValueAtTime(peakGain, at + Math.max(attack, durSec - release));
    g.gain.exponentialRampToValueAtTime(0.0001, at + durSec);
    mix.connect(bp).connect(g).connect(master);
    o1.start(at); o2.start(at); o3.start(at);
    o1.stop(at + durSec + 0.05);
    o2.stop(at + durSec + 0.05);
    o3.stop(at + durSec + 0.05);
    return [o1, o2, o3];
  }

  function playMarchaDrum(at, peakGain) {
    // soft march snare/kick combo
    const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = 80;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peakGain, at + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
    o.connect(g).connect(master); o.start(at); o.stop(at + 0.2);
    // crisp tick
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/d.length, 2);
    const n = ctx.createBufferSource(); n.buffer = buf;
    const nh = ctx.createBiquadFilter(); nh.type = "highpass"; nh.frequency.value = 2200;
    const ng = ctx.createGain(); ng.gain.value = peakGain * 0.5;
    n.connect(nh).connect(ng).connect(master); n.start(at);
    return [o, n];
  }

  function startMarcha(name) {
    if (!on || !ctx) return;
    if (marchaState && marchaState.name === name) return;
    stopMarcha(false); // don't restore bed yet — we replace
    const m = MARCHAS[name];
    if (!m) return;

    // Fade the holy/current bed out (keep nodes alive to restore quickly)
    if (currentBed) {
      const now = ctx.currentTime;
      currentBed.out.gain.cancelScheduledValues(now);
      currentBed.out.gain.setValueAtTime(currentBed.out.gain.value, now);
      currentBed.out.gain.linearRampToValueAtTime(0, now + 0.45);
      suspendedHolyBed = currentBed;
      currentBed = null;
    }

    // Build a continuous-looped sequence ~30s, then loop again.
    const beat = 0.9 / m.tempo; // seconds per beat unit
    let t = ctx.currentTime + 0.15;
    const all = [];
    const totalLoopLen = m.notes.reduce((s, n) => s + n[1] * beat, 0) + 1.0;

    function scheduleOnce(startT) {
      let cursor = startT;
      // pad / bass drone
      const pad = ctx.createOscillator(); pad.type = "sine";
      pad.frequency.value = noteHz(m.pad[0] + m.key);
      const pad2 = ctx.createOscillator(); pad2.type = "sine";
      pad2.frequency.value = noteHz(m.pad[1] + m.key);
      const pg = ctx.createGain(); pg.gain.value = 0;
      pg.gain.setValueAtTime(0, cursor);
      pg.gain.linearRampToValueAtTime(0.08, cursor + 0.8);
      pg.gain.setValueAtTime(0.08, cursor + totalLoopLen - 0.8);
      pg.gain.linearRampToValueAtTime(0, cursor + totalLoopLen);
      pad.connect(pg); pad2.connect(pg); pg.connect(master);
      pad.start(cursor); pad2.start(cursor);
      pad.stop(cursor + totalLoopLen + 0.1);
      pad2.stop(cursor + totalLoopLen + 0.1);
      all.push(pad, pad2);

      // melody
      m.notes.forEach(([semi, durBeats]) => {
        const dur = durBeats * beat;
        const hz = noteHz(semi + m.key);
        const nodes = playMarchaNote(cursor, hz, dur, m.gain);
        all.push(...nodes);
        // soft drum on each beat
        if (durBeats >= 1) playMarchaDrum(cursor, 0.1);
        cursor += dur;
      });
      return cursor;
    }

    // schedule 3 consecutive loops so it sounds continuous; we restart on
    // each hover anyway
    let endT = scheduleOnce(t);
    endT = scheduleOnce(endT);
    endT = scheduleOnce(endT);

    marchaState = {
      name,
      nodes: all,
      stopAt: endT,
    };
  }

  function stopMarcha(restoreBed = true) {
    if (marchaState) {
      const now = ctx.currentTime;
      marchaState.nodes.forEach((n) => {
        try {
          if (n.stop) n.stop(now + 0.4);
        } catch (_) {}
      });
      marchaState = null;
    }
    if (restoreBed && suspendedHolyBed && on) {
      currentBed = suspendedHolyBed;
      suspendedHolyBed = null;
      const now = ctx.currentTime;
      currentBed.out.gain.cancelScheduledValues(now);
      currentBed.out.gain.setValueAtTime(currentBed.out.gain.value, now);
      currentBed.out.gain.linearRampToValueAtTime(1, now + 0.9);
    } else if (!restoreBed) {
      // discard; will be re-created when theme settles
    }
  }

  // Wire up hover on .ph[data-marcha] — only does anything when sound is ON
  function bindMarchas() {
    document.querySelectorAll(".ph[data-marcha]").forEach((ph) => {
      ph.addEventListener("mouseenter", () => {
        if (!on) return;
        startMarcha(ph.dataset.marcha);
      });
      ph.addEventListener("mouseleave", () => {
        if (!on) return;
        stopMarcha(true);
      });
    });
  }
  // Defer until DOM is ready (audio.js loads after DOMContentLoaded in practice)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindMarchas);
  } else {
    bindMarchas();
  }

  // expose
  window.__marchas = { start: startMarcha, stop: stopMarcha };

  btn.addEventListener("click", () => setOn(!on));
  window.addEventListener("themechange", (e) => switchTo(e.detail.theme));
})();
