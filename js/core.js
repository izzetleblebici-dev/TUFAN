// Core: constants, utilities, input (keyboard + gamepad), synth audio
(function () {
  'use strict';
  const T = (window.Tufan = window.Tufan || {});
  T.W = 1280;
  T.H = 720;
  T.GROUND = 620;

  const U = (T.util = {
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
    lerp: (a, b, t) => a + (b - a) * t,
    rand: (a, b) => a + Math.random() * (b - a),
    randRange: (r) => r[0] + Math.random() * (r[1] - r[0]),
    sign: (v) => (v < 0 ? -1 : 1),
    approach: (v, target, d) => (v < target ? Math.min(v + d, target) : Math.max(v - d, target)),
    overlap: (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y,
    easeOut: (t) => 1 - Math.pow(1 - U.clamp(t, 0, 1), 3),
    fmt: (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => (o[k] != null ? o[k] : '')),
  });

  // ------------------------------------------------------------------ INPUT
  const KEYMAP = {
    KeyA: ['left'], KeyD: ['right'], KeyW: ['jump', 'up'], KeyS: ['down'],
    KeyX: ['light'],
    ShiftLeft: ['dodge'], ShiftRight: ['dodge'], KeyQ: ['parry'],
    Space: ['ult', 'confirm'], KeyE: ['heal'],
    Escape: ['pause', 'back'], KeyP: ['pause'], Enter: ['confirm'], NumpadEnter: ['confirm'],
    KeyM: ['mute'], F1: ['debug'], F2: ['cheatRage'], F3: ['cheatSeed'],
  };
  // Standard gamepad layout (Xbox naming)
  const PADMAP = {
    0: ['jump', 'confirm'], 1: ['dodge', 'back'], 2: ['light'], 3: ['heavy'],
    4: ['parry'], 5: ['heal'], 6: ['ult'], 7: ['ult'], 9: ['pause'],
    12: ['up'], 13: ['down'], 14: ['left'], 15: ['right'],
  };
  const PREVENT = new Set(['Space', 'F1', 'F2', 'F3', 'ShiftLeft', 'ShiftRight']);

  const input = (T.input = {
    kb: {}, pad: {}, padPrev: {}, just: {}, pressedAt: {},
    mouse: { x: 0, y: 0, clicked: false, moved: false },
    lastDevice: 'keyboard',
    now: () => performance.now() / 1000,
    fire(action) {
      this.just[action] = true;
      this.pressedAt[action] = this.now();
    },
    held(a) { return !!(this.kb[a] || this.pad[a]); },
    // Buffered press: true if pressed within `win` seconds, then cleared
    consume(a, win) {
      const w = win == null ? 0.14 : win;
      const t = this.pressedAt[a];
      if (t != null && this.now() - t <= w) { this.pressedAt[a] = -99; return true; }
      return false;
    },
    clearBuffers() { this.pressedAt = {}; this.just = {}; },
    update() {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const now = {};
      for (const gp of pads) {
        if (!gp) continue;
        gp.buttons.forEach((b, i) => {
          if ((b.pressed || b.value > 0.5) && PADMAP[i]) PADMAP[i].forEach((a) => (now[a] = true));
        });
        const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
        if (ax < -0.45) now.left = true;
        if (ax > 0.45) now.right = true;
        if (ay < -0.6) now.up = true;
        if (ay > 0.6) now.down = true;
      }
      for (const a in now) if (!this.padPrev[a]) { this.fire(a); this.lastDevice = 'gamepad'; }
      this.padPrev = now;
      this.pad = now;
    },
    endFrame() { this.just = {}; this.mouse.clicked = false; },
  });

  window.addEventListener('keydown', (e) => {
    if (PREVENT.has(e.code)) e.preventDefault();
    T.audio.init();
    const acts = KEYMAP[e.code];
    if (!acts) return;
    acts.forEach((a) => (input.kb[a] = true));
    if (!e.repeat) { acts.forEach((a) => input.fire(a)); input.lastDevice = 'keyboard'; }
  });
  window.addEventListener('keyup', (e) => {
    const acts = KEYMAP[e.code];
    if (acts) acts.forEach((a) => (input.kb[a] = false));
  });
  window.addEventListener('blur', () => { input.kb = {}; if (T.game) T.game.onBlur(); });

  // ------------------------------------------------------------------ AUDIO
  // Small synthesised placeholder sounds (no audio files needed).
  const audio = (T.audio = {
    ctx: null, master: null, muted: false, ambient: null,
    init() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.45;
        this.master.connect(this.ctx.destination);
        const len = this.ctx.sampleRate;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const ch = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
      } catch (err) { this.ctx = null; }
    },
    toggleMute() {
      this.muted = !this.muted;
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.45;
    },
    tone(freq, dur, type, vol, slideTo, delay) {
      if (!this.ctx) return;
      const c = this.ctx, t0 = c.currentTime + (delay || 0);
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(this.master);
      o.start(t0); o.stop(t0 + dur + 0.05);
    },
    noise(dur, vol, ftype, freq, delay, q) {
      if (!this.ctx) return;
      const c = this.ctx, t0 = c.currentTime + (delay || 0);
      const s = c.createBufferSource(); s.buffer = this.noiseBuf;
      const f = c.createBiquadFilter(); f.type = ftype || 'lowpass'; f.frequency.value = freq || 1000; f.Q.value = q || 0.7;
      const g = c.createGain();
      g.gain.setValueAtTime(vol || 0.2, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      s.connect(f); f.connect(g); g.connect(this.master);
      s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.05);
    },
    play(name) {
      if (!this.ctx || this.muted) return;
      switch (name) {
        case 'swing': this.noise(0.10, 0.18, 'highpass', 2600); break;
        case 'swingHeavy': this.noise(0.22, 0.25, 'bandpass', 900, 0, 1.2); break;
        case 'hit': this.tone(140, 0.12, 'square', 0.18, 60); this.noise(0.08, 0.25, 'lowpass', 1800); break;
        case 'hitHeavy': this.tone(90, 0.2, 'square', 0.25, 40); this.noise(0.15, 0.35, 'lowpass', 1200); break;
        case 'block': this.tone(900, 0.08, 'triangle', 0.12, 600); this.noise(0.05, 0.12, 'highpass', 3000); break;
        case 'guardBreak': this.tone(300, 0.25, 'sawtooth', 0.2, 80); this.noise(0.2, 0.3, 'bandpass', 700); break;
        case 'parry': this.tone(1320, 0.5, 'sine', 0.25); this.tone(1980, 0.4, 'sine', 0.15, null, 0.02); this.noise(0.06, 0.2, 'highpass', 4000); break;
        case 'hurt': this.tone(220, 0.2, 'sawtooth', 0.18, 90); break;
        case 'dodge': this.noise(0.15, 0.12, 'bandpass', 1800, 0, 2); break;
        case 'jump': this.tone(300, 0.09, 'triangle', 0.08, 520); break;
        case 'heal': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.45, 'sine', 0.14, null, i * 0.07)); break;
        case 'shield': this.tone(700, 0.25, 'triangle', 0.15, 1100); break;
        case 'lightning': this.noise(0.6, 0.5, 'lowpass', 3000); this.tone(60, 0.7, 'sawtooth', 0.25, 30); this.noise(0.15, 0.4, 'highpass', 5000); break;
        case 'charge': this.tone(200, 0.4, 'sawtooth', 0.12, 900); break;
        case 'seed': this.tone(880, 0.12, 'sine', 0.12, 1320); this.tone(1320, 0.15, 'sine', 0.08, null, 0.06); break;
        case 'cast': this.tone(160, 0.5, 'sine', 0.08, 420); break;
        case 'bolt': this.tone(500, 0.2, 'square', 0.06, 200); break;
        case 'quake': this.tone(50, 0.5, 'sawtooth', 0.3, 30); this.noise(0.5, 0.35, 'lowpass', 400); break;
        case 'death': this.tone(180, 0.5, 'triangle', 0.15, 50); break;
        case 'roar': this.tone(110, 0.9, 'sawtooth', 0.25, 70); this.noise(0.9, 0.2, 'bandpass', 500, 0, 0.8); break;
        case 'tree': [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 1.2, 'sine', 0.12, null, i * 0.18)); break;
        case 'fail': [392, 330, 262].forEach((f, i) => this.tone(f, 0.5, 'triangle', 0.14, null, i * 0.22)); break;
        case 'menu': this.tone(660, 0.06, 'triangle', 0.08); break;
        case 'confirm': this.tone(660, 0.08, 'triangle', 0.1); this.tone(990, 0.12, 'triangle', 0.1, null, 0.06); break;
        case 'rageFull': this.tone(440, 0.3, 'sawtooth', 0.08, 880); break;
      }
    },
    // Ambient wind + water loop for the level
    startAmbient() {
      if (!this.ctx || this.ambient) return;
      const c = this.ctx, nodes = [];
      const mk = (ftype, freq, vol) => {
        const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
        const f = c.createBiquadFilter(); f.type = ftype; f.frequency.value = freq;
        const g = c.createGain(); g.gain.value = vol;
        const lfo = c.createOscillator(), lg = c.createGain();
        lfo.frequency.value = 0.08 + Math.random() * 0.1; lg.gain.value = vol * 0.7;
        lfo.connect(lg); lg.connect(g.gain);
        s.connect(f); f.connect(g); g.connect(this.master);
        s.start(); lfo.start();
        nodes.push(s, lfo);
      };
      mk('bandpass', 500, 0.05);  // wind
      mk('lowpass', 300, 0.06);   // water
      this.ambient = nodes;
    },
    stopAmbient() {
      if (!this.ambient) return;
      this.ambient.forEach((n) => { try { n.stop(); } catch (e) {} });
      this.ambient = null;
    },
  });
})();
