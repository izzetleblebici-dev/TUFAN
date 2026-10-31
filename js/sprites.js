// Sprite system. Code always refers to sprites by NAME + ANIMATION.
// If data.sprites[name].image points to a sprite sheet, frames are drawn from it.
// Otherwise a placeholder painter (shapes and colours) is used.
(function () {
  'use strict';
  const T = window.Tufan, U = T.util;

  const S = (T.sprites = {
    defs: {}, images: {},
    init(defs) {
      this.defs = defs || {};
      for (const name in this.defs) {
        const d = this.defs[name];
        if (!d || !d.image) continue;
        const img = new Image();
        img.onload = () => (img.ok = true);
        img.onerror = () => console.warn('[Tufan] Missing sprite sheet, using placeholder:', d.image);
        img.src = d.image;
        this.images[name] = img;
      }
    },
    // x,y = feet position. facing = 1 right, -1 left.
    // opts: p (0..1 progress for one-shot anims), flash, alpha, scale, tint, phase, ...
    draw(ctx, name, anim, time, x, y, facing, opts) {
      opts = opts || {};
      const d = this.defs[name], img = this.images[name];
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));
      if (opts.alpha != null) ctx.globalAlpha *= U.clamp(opts.alpha, 0, 1);
      const sc = opts.scale || 1;
      ctx.scale((facing || 1) * sc, sc);
      if (img && img.ok && d.single) {
        drawSingle(ctx, img, d, anim, time, opts.p != null ? opts.p : 0, opts);
      } else if (img && img.ok && d.anims && d.anims[anim]) {
        const a = d.anims[anim], fw = d.frameWidth || 128, fh = d.frameHeight || 128;
        let f;
        if (opts.p != null) f = Math.min(a.frames - 1, Math.floor(opts.p * a.frames));
        else {
          f = Math.floor(time * (a.fps || 12));
          f = a.loop === false ? Math.min(f, a.frames - 1) : f % a.frames;
        }
        if (opts.flash > 0) ctx.filter = 'brightness(3.5)';
        ctx.drawImage(img, ((a.col || 0) + f) * fw, (a.row || 0) * fh, fw, fh, -fw / 2, -fh + (d.footOffset || 0), fw, fh);
      } else {
        (P[name] || P.unknown)(ctx, anim, time, opts.p != null ? opts.p : 0, opts);
      }
      ctx.restore();
    },
  });

  // ------------------------------------------------- single painted image
  // One hand-painted pose per character; motion comes from transforms
  // (breathing, lean, lunge, recoil) pivoting at the feet.
  const silhouettes = new Map();
  function silhouette(img, color) {
    const key = img.src + '|' + color;
    if (silhouettes.has(key)) return silhouettes.get(key);
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    silhouettes.set(key, c);
    return c;
  }
  function pose(anim, t, p, o) {
    const ps = { rot: 0, dx: 0, dy: 0, sx: 1, sy: 1 };
    const e = U.easeOut;
    switch (anim) {
      case 'idle': case 'appear': case 'bless': case 'fade':
        ps.sy = 1 + Math.sin(t * 3) * 0.015; ps.sx = 1 - Math.sin(t * 3) * 0.008; break;
      case 'run': case 'move':
        ps.dy = -Math.abs(Math.sin(t * 12)) * 6; ps.rot = 0.07; ps.sy = 1 - Math.abs(Math.cos(t * 12)) * 0.03; break;
      case 'jump': ps.sy = 1.05; ps.sx = 0.96; ps.rot = 0.05; break;
      case 'fall': ps.sy = 0.98; ps.sx = 1.02; break;
      case 'attack1': case 'attack2': {
        const k = p < 0.25 ? -p / 0.25 : Math.sin(Math.min(1, (p - 0.25) / 0.5) * Math.PI);
        ps.rot = k * 0.14; ps.dx = k * 10; break;
      }
      case 'attack3': { const k = Math.sin(Math.min(1, p * 1.5) * Math.PI); ps.rot = 0.12 * k; ps.dx = 22 * k; ps.sx = 1 + 0.05 * k; break; }
      case 'heavy':
        if (p < 0.4) { ps.rot = -0.18 * e(p / 0.4); ps.dx = -8 * e(p / 0.4); ps.sy = 1 + 0.04 * e(p / 0.4); }
        else { const k = 1 - e((p - 0.4) / 0.6); ps.rot = 0.22 * k; ps.dx = 18 * k; ps.sy = 1 - 0.05 * k; }
        break;
      case 'parry': ps.rot = -0.08; ps.dx = -4; break;
      case 'dodge': ps.rot = 0.35; ps.sy = 0.82; ps.sx = 1.08; break;
      case 'hurt': ps.rot = -0.16; ps.dx = -8; break;
      case 'death': ps.rot = -Math.min(1.4, p * 1.8); ps.dy = 0; break;
      case 'blessing': ps.dy = -6; ps.sy = 1.03; break;
      case 'ultimate': ps.dy = -10 - Math.sin(p * Math.PI) * 10; ps.sy = 1.05; break;
      case 'roar': ps.sy = 1.06; ps.sx = 1.04; ps.dx = (Math.random() - 0.5) * 6; break;
      case 'attack': {
        if (o.phase === 'windup') { ps.rot = -0.12 * e(o.p); ps.dx = -10 * e(o.p); ps.sy = 1 + 0.04 * e(o.p); if (o.atk === 'slam') { ps.sy = 0.88; ps.sx = 1.08; } }
        else if (o.phase === 'active') { ps.rot = 0.16; ps.dx = 16; ps.sy = 0.97; }
        else if (o.phase === 'recover') { const k = 1 - o.p; ps.rot = 0.16 * k; ps.dx = 16 * k; }
        break;
      }
    }
    return ps;
  }
  function drawSingle(ctx, img, d, anim, t, p, o) {
    const H = d.drawHeight || 160, W = H * img.naturalWidth / img.naturalHeight;
    const ax = (d.anchorX != null ? d.anchorX : 0.5) * W;
    const ps = pose(anim, t, p, o);
    // ground shadow
    if (!o.noShadow && anim !== 'jump' && anim !== 'fall') {
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath(); ctx.ellipse(0, -2, (d.shadow || 0.3) * H, 7, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (o.phase2) glow(ctx, 0, -H * 0.45, H * 0.65, 'rgba(255,40,40,0.45)');
    if (d.aura && !o.tint) glow(ctx, 0, -H * 0.45, H * 0.6, d.aura, 0.7 + Math.sin(t * 3) * 0.2);
    ctx.save();
    ctx.translate(ps.dx, ps.dy);
    ctx.rotate(ps.rot);
    ctx.scale(ps.sx, ps.sy);
    const x0 = -ax, y0 = -H + (d.footOffset || 0);
    if (o.tint) ctx.drawImage(silhouette(img, o.tint), x0, y0, W, H);
    else {
      ctx.drawImage(img, x0, y0, W, H);
      if (o.phase2) { ctx.globalAlpha *= 0.25; ctx.drawImage(silhouette(img, '#ff2020'), x0, y0, W, H); ctx.globalAlpha /= 0.25; }
      if (o.flash > 0) { ctx.globalAlpha *= 0.55; ctx.drawImage(silhouette(img, '#ffffff'), x0, y0, W, H); }
    }
    if (d.weapon === 'spear' && !o.tint) heroWeapon(ctx, anim, t, p, o, d.weaponHand || [0.16, -0.45], H);
    if (o.shield) { ctx.strokeStyle = 'rgba(150,220,255,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -H * 0.42, H * 0.36, H * 0.55, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }
  // Geser's golden dragon-headed spear, drawn over the painted body so swings read clearly
  function heroWeapon(ctx, anim, t, p, o, hand, H) {
    let wAng = -1.25, wExt = 0;
    switch (anim) {
      case 'run': wAng = -0.6; break;
      case 'jump': wAng = -1.6; break;
      case 'fall': wAng = -1.0; break;
      case 'attack1': wAng = ease(p * 1.3, -2.4, 0.8); break;
      case 'attack2': wAng = ease(p * 1.3, 0.9, -2.0); break;
      case 'attack3': wAng = -0.05; wExt = Math.sin(Math.min(1, p * 1.6) * Math.PI) * 36; break;
      case 'heavy': wAng = p < 0.4 ? U.lerp(-1.4, -3.4, p / 0.4) : ease((p - 0.4) / 0.25, -3.4, 1.15); break;
      case 'parry': wAng = -1.5; break;
      case 'dodge': wAng = 0.25; break;
      case 'hurt': wAng = -0.4; break;
      case 'death': wAng = 0.4; break;
      case 'blessing': case 'ultimate': wAng = -1.57; break;
    }
    const C = tint(o), s = H / 175;
    ctx.save();
    ctx.translate(hand[0] * H, hand[1] * H);
    const sp = S.images.geser_spear;
    if (sp && sp.ok) {
      // hand-painted spear image, held at its wrapped grip (39% along the shaft)
      const len = H * 0.82, h = len * sp.naturalHeight / sp.naturalWidth, gx = 0.39 * len;
      ctx.rotate(wAng);
      ctx.drawImage(sp, -gx + wExt * s, -h / 2, len, h);
      if (o.flash > 0) { ctx.globalAlpha *= 0.55; ctx.drawImage(silhouette(sp, '#ffffff'), -gx + wExt * s, -h / 2, len, h); }
      ctx.restore();
      return;
    }
    ctx.scale(s, s); ctx.rotate(wAng);
    rr(ctx, -16 + wExt, -3, 84, 6, 3, C('#f2c14e'));
    ctx.strokeStyle = 'rgba(60,40,10,0.7)'; ctx.lineWidth = 1; ctx.strokeRect(-16 + wExt, -3, 84, 6);
    poly(ctx, [[64 + wExt, -10], [84 + wExt, -4], [92 + wExt, 0], [84 + wExt, 5], [64 + wExt, 10]], C('#d9a531'));
    if (!(o.flash > 0)) glow(ctx, 98 + wExt, 0, 24, 'rgba(95,200,255,0.9)', 0.8 + Math.sin(t * 20) * 0.2);
    circ(ctx, 96 + wExt, 0, 6, C('#bfeaff'));
    ctx.restore();
  }

  // ---------------------------------------------------------- drawing helpers
  const tint = (o) => (c) => (o.flash > 0 ? '#ffffff' : o.tint || c);
  function rr(ctx, x, y, w, h, r, c) {
    ctx.fillStyle = c; ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.fill();
  }
  function poly(ctx, pts, c) {
    if (c) ctx.fillStyle = c;
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath(); ctx.fill();
  }
  function circ(ctx, x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  function limb(ctx, x, y, ang, len, w, c) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); rr(ctx, -w / 2, 0, w, len, w / 2, c); ctx.restore();
  }
  function glow(ctx, x, y, r, c, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save(); ctx.globalAlpha *= a == null ? 1 : a; ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  const ease = (p, a, b) => U.lerp(a, b, U.easeOut(p));
  S.helpers = { rr, poly, circ, glow, limb };

  // Weapon angle for a generic melee enemy, based on attack phase
  function swingAngle(o, rest, up, down) {
    if (o.phase === 'windup') return ease(o.p, rest, up);
    if (o.phase === 'active') return ease(o.p * 1.4, up, down);
    if (o.phase === 'recover') return U.lerp(down, rest, o.p);
    return rest;
  }

  const P = {};
  P.unknown = (ctx) => { rr(ctx, -20, -80, 40, 80, 6, '#ff00ff'); };

  // --------------------------------------------------------- ERMİŞTİBEG
  P.geser = function (ctx, anim, t, p, o) {
    const C = tint(o);
    let bob = 0, lean = 0, legA = 0, wAng = -1.25, wExt = 0, squash = 1;
    switch (anim) {
      case 'idle': bob = Math.sin(t * 3.5) * 1.5; break;
      case 'run': legA = Math.sin(t * 16) * 0.7; bob = -Math.abs(Math.sin(t * 16)) * 3; lean = 0.12; wAng = -0.6; break;
      case 'jump': legA = 0.4; wAng = -1.6; break;
      case 'fall': legA = -0.3; wAng = -1.0; break;
      case 'attack1': wAng = ease(p * 1.3, -2.4, 0.8); lean = 0.1; break;
      case 'attack2': wAng = ease(p * 1.3, 0.9, -2.0); lean = 0.1; break;
      case 'attack3': wAng = -0.05; wExt = Math.sin(Math.min(1, p * 1.6) * Math.PI) * 36; lean = 0.2; break;
      case 'heavy':
        if (p < 0.4) { wAng = U.lerp(-1.4, -3.4, p / 0.4); lean = -0.15; }
        else { wAng = ease((p - 0.4) / 0.25, -3.4, 1.15); lean = 0.25; }
        break;
      case 'parry': wAng = -1.5; lean = -0.06; break;
      case 'dodge': squash = 0.72; lean = 0.5; wAng = 0.25; break;
      case 'hurt': lean = -0.35; wAng = -0.4; break;
      case 'death': lean = -Math.min(1.5, p * 2.2); wAng = 0.4; break;
      case 'blessing': wAng = -1.57; bob = -4; break;
      case 'ultimate': wAng = -1.62; bob = -6 - Math.sin(p * Math.PI) * 6; break;
    }
    ctx.save();
    ctx.rotate(lean); ctx.scale(1, squash); ctx.translate(0, bob);
    // cape
    poly(ctx, [[-6, -84], [-30, -26 + Math.sin(t * 6) * 4], [-8, -30]], C('#dfe7f5'));
    // legs
    limb(ctx, -6, -40, legA, 40, 10, C('#1d3b94'));
    limb(ctx, 6, -40, -legA, 40, 10, C('#2a5bd7'));
    // torso armour
    rr(ctx, -15, -86, 30, 50, 8, C('#2a5bd7'));
    rr(ctx, -5, -82, 10, 34, 3, C('#eef3fb'));
    ctx.fillStyle = C('#f2c14e'); ctx.fillRect(-15, -46, 30, 5);
    // winged shoulder piece
    poly(ctx, [[-2, -84], [-34, -104], [-22, -88], [-38, -90], [-12, -74]], C('#ffffff'));
    // head + golden helm
    circ(ctx, 1, -98, 11, C('#f0d0b0'));
    poly(ctx, [[-12, -100], [1, -122], [13, -100]], C('#f2c14e'));
    ctx.fillStyle = C('#1a2a55'); ctx.fillRect(4, -100, 6, 3);
    // weapon: golden shaft with dragon head and blue flame
    ctx.save();
    ctx.translate(12, -66); ctx.rotate(wAng);
    rr(ctx, -12 + wExt, -3, 76, 6, 3, C('#f2c14e'));
    poly(ctx, [[60 + wExt, -9], [80 + wExt, -4], [86 + wExt, 0], [80 + wExt, 5], [60 + wExt, 9]], C('#d9a531'));
    if (!(o.flash > 0)) glow(ctx, 92 + wExt, 0, 22, 'rgba(95,200,255,0.9)', 0.8 + Math.sin(t * 20) * 0.2);
    circ(ctx, 90 + wExt, 0, 6, C('#bfeaff'));
    ctx.restore();
    if (anim === 'parry' && !(o.flash > 0)) glow(ctx, 30, -70, 46, 'rgba(255,220,120,0.8)', 0.6);
    if (o.shield) { ctx.strokeStyle = 'rgba(150,220,255,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -55, 42, 66, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  };

  // ----------------------------------------------------------- UMAY (NPC)
  P.umay = function (ctx, anim, t, p, o) {
    const C = tint(o);
    glow(ctx, 0, -90, 110, 'rgba(160,220,255,0.55)');
    // wings
    for (const s of [-1, 1]) poly(ctx, [[0, -100], [s * 90, -150 + Math.sin(t * 3) * 6], [s * 70, -80], [s * 50, -60]], C('rgba(210,235,255,0.85)'));
    // cloak + body
    poly(ctx, [[-24, -110], [24, -110], [38, 0], [-38, 0]], C('#1e3a78'));
    rr(ctx, -14, -120, 28, 60, 8, C('#cfe7ff'));
    // four arms
    for (const s of [-1, 1]) { limb(ctx, s * 14, -108, s * -0.9, 40, 7, C('#cfe7ff')); limb(ctx, s * 14, -96, s * -0.4, 36, 7, C('#cfe7ff')); }
    circ(ctx, 0, -132, 12, C('#e4f2ff'));
    // horned dragon crown
    poly(ctx, [[-12, -140], [-22, -166], [-4, -146], [4, -146], [22, -166], [12, -140]], C('#9fd2ff'));
    circ(ctx, 0, -104, 5, C('#2f7bff'));
  };

  // ---------------------------------------------------------- ÜLGEN (NPC)
  P.ulgen = function (ctx, anim, t, p, o) {
    const C = tint(o);
    glow(ctx, 0, -90, 120, 'rgba(255,215,120,0.5)');
    poly(ctx, [[-6, -110], [-60, -140 + Math.sin(t * 2) * 4], [-40, -100], [-50, -80]], C('#f5d27a'));
    rr(ctx, -20, -118, 40, 76, 8, C('#e0b14a'));
    limb(ctx, -9, -44, 0.05, 44, 12, C('#b8862d'));
    limb(ctx, 9, -44, -0.05, 44, 12, C('#b8862d'));
    circ(ctx, 0, -130, 13, C('#f2d4b4'));
    for (let i = -2; i <= 2; i++) poly(ctx, [[i * 6 - 3, -140], [i * 9, -168 + Math.abs(i) * 6], [i * 6 + 3, -140]], C('#fff1c4'));
    // rune tablet
    rr(ctx, 16, -106, 30, 40, 3, C('#9a9aa6'));
    ctx.fillStyle = C('#4a4a58');
    for (let i = 0; i < 4; i++) ctx.fillRect(21, -100 + i * 9, 18, 2);
    // sword with cyan star pommel
    ctx.save(); ctx.translate(-24, -70); ctx.rotate(0.3);
    rr(ctx, -3, 0, 6, 60, 2, C('#dfe6ee')); circ(ctx, 0, -4, 5, C('#6ff3ff')); ctx.restore();
  };

  // ------------------------------------------------------- GULYABANI SPAWN
  P.minion = function (ctx, anim, t, p, o) {
    const C = tint(o);
    let lean = 0.35, bob = Math.sin(t * 8) * 2, arm = 0.6;
    if (anim === 'move') { bob = -Math.abs(Math.sin(t * 14)) * 4; lean = 0.5; }
    if (anim === 'attack') { arm = swingAngle(o, 0.6, -1.8, 1.2); lean = o.phase === 'windup' ? 0.1 : 0.8; }
    if (anim === 'hurt') lean = -0.3;
    if (anim === 'death') lean = -p * 1.4;
    ctx.save(); ctx.rotate(lean); ctx.translate(0, bob);
    limb(ctx, -8, -20, 0.3, 20, 7, C('#2d3b33'));
    limb(ctx, 8, -20, -0.3, 20, 7, C('#2d3b33'));
    ctx.fillStyle = C('#3e5446'); ctx.beginPath(); ctx.ellipse(0, -32, 18, 18, 0, 0, Math.PI * 2); ctx.fill();
    circ(ctx, 10, -46, 11, C('#4b6656'));
    limb(ctx, 10, -36, arm, 22, 6, C('#2d3b33'));
    circ(ctx, 14, -48, 2.6, C('#ff3030')); circ(ctx, 7, -48, 2.2, C('#ff3030'));
    ctx.restore();
  };

  // ----------------------------------------------------- GULYABANI SORCERER
  P.sorcerer = function (ctx, anim, t, p, o) {
    const C = tint(o);
    const float = Math.sin(t * 2.5) * 3;
    let staff = -1.4, raise = 0;
    if (anim === 'attack') { staff = o.phase === 'windup' ? ease(o.p, -1.4, -2.2) : -0.5; raise = o.phase === 'windup' ? o.p : 0; }
    if (anim === 'hurt') staff = -0.8;
    ctx.save();
    if (anim === 'death') { ctx.rotate(-p * 0.6); ctx.scale(1, 1 - p * 0.5); }
    ctx.translate(0, float);
    // robe
    poly(ctx, [[-10, -96], [10, -96], [30, 0], [-30, 0]], C('#2b1a3f'));
    poly(ctx, [[-30, 0], [-20, -10], [-10, 0], [0, -8], [10, 0], [20, -10], [30, 0]], C('#1a0f28'));
    // hood
    poly(ctx, [[-16, -92], [2, -122], [18, -92], [10, -80], [-8, -80]], C('#22132f'));
    circ(ctx, 6, -96, 2.6, C('#ff2a2a')); circ(ctx, -1, -96, 2.4, C('#ff2a2a'));
    // golden trident staff
    ctx.save(); ctx.translate(14, -70); ctx.rotate(staff);
    rr(ctx, -2, -3, 86, 5, 2, C('#e3b341'));
    poly(ctx, [[84, -12], [100, -10], [86, -3]], C('#e3b341'));
    poly(ctx, [[84, 12], [100, 10], [86, 3]], C('#e3b341'));
    poly(ctx, [[84, -3], [104, 0], [84, 3]], C('#e3b341'));
    if (raise > 0 && !(o.flash > 0)) glow(ctx, 100, 0, 18 + raise * 26, 'rgba(255,60,90,0.95)', 0.5 + raise * 0.5);
    ctx.restore();
    ctx.restore();
  };

  // ------------------------------------------------------------ STONE BRUTE
  P.brute = function (ctx, anim, t, p, o) {
    const C = tint(o);
    let bob = Math.sin(t * 2) * 1.5, arm = 0.3, arm2 = -0.2, legA = 0;
    if (anim === 'move') { legA = Math.sin(t * 6) * 0.35; bob = -Math.abs(Math.sin(t * 6)) * 3; }
    if (anim === 'attack') {
      if (o.atk === 'quake') { const a = o.phase === 'windup' ? ease(o.p, 0.3, -2.8) : o.phase === 'active' ? 1.2 : U.lerp(1.2, 0.3, o.p); arm = a; arm2 = a; }
      else { arm = swingAngle(o, 0.3, -2.4, 1.4); }
    }
    if (anim === 'hurt') bob = 3;
    ctx.save();
    if (anim === 'death') { ctx.rotate(p * 0.25); ctx.translate(0, p * 30); }
    ctx.translate(0, bob);
    limb(ctx, -16, -42, legA, 42, 18, C('#5f6470'));
    limb(ctx, 16, -42, -legA, 42, 18, C('#6c717d'));
    rr(ctx, -34, -104, 68, 66, 14, C('#8a8f99'));
    rr(ctx, -26, -98, 22, 18, 5, C('#a0a5ae')); rr(ctx, 4, -98, 22, 18, 5, C('#a0a5ae'));
    // conical helmet
    circ(ctx, 6, -110, 16, C('#7b808a'));
    poly(ctx, [[-14, -112], [8, -150], [26, -112]], C('#666b75'));
    circ(ctx, 12, -110, 3, C('#ff3030')); circ(ctx, 2, -110, 3, C('#ff3030'));
    // arms with claws
    for (const [ax, a] of [[-30, arm2], [30, arm]]) {
      ctx.save(); ctx.translate(ax, -92); ctx.rotate(a);
      rr(ctx, -9, 0, 18, 52, 8, C('#767b86'));
      poly(ctx, [[-9, 50], [-12, 68], [-3, 54], [2, 70], [5, 54], [12, 66], [9, 50]], C('#d8d8d8'));
      ctx.restore();
    }
    if (anim === 'attack' && o.atk === 'quake' && o.phase === 'windup' && !(o.flash > 0)) glow(ctx, 0, -60, 90, 'rgba(255,60,40,0.6)', o.p);
    ctx.restore();
  };

  // -------------------------------------------------------- GULYABANI CAPTAIN
  P.captain = function (ctx, anim, t, p, o) {
    const C = tint(o);
    const ph2 = o.phase2;
    let bob = Math.sin(t * 3) * 1.5, sw = -1.0, legA = 0;
    if (anim === 'move') { legA = Math.sin(t * 12) * 0.5; bob = -Math.abs(Math.sin(t * 12)) * 3; sw = -0.4; }
    if (anim === 'attack') {
      if (o.atk === 'lunge') sw = o.phase === 'windup' ? ease(o.p, -0.4, 0.15) : 0.0;
      else if (o.atk === 'slam') sw = -2.4;
      else if (o.atk === 'slash2') sw = swingAngle(o, -1.0, 1.4, -2.0);
      else sw = swingAngle(o, -1.0, -2.8, 1.2);
    }
    if (anim === 'roar') { bob = -4; sw = -2.2; }
    ctx.save();
    if (anim === 'death') { ctx.rotate(-p * 1.2); }
    ctx.translate(0, bob);
    if (ph2 && !(o.flash > 0)) glow(ctx, 0, -70, 120, 'rgba(255,40,40,0.45)');
    // spiked wings
    for (let i = 0; i < 4; i++) poly(ctx, [[-8, -100], [-50 - i * 10, -150 + i * 22], [-20, -90 + i * 6]], C(i % 2 ? '#141621' : '#20232f'));
    limb(ctx, -10, -50, legA, 50, 14, C('#171a24'));
    limb(ctx, 10, -50, -legA, 50, 14, C('#1f2230'));
    rr(ctx, -22, -112, 44, 66, 9, C('#252938'));
    poly(ctx, [[-22, -112], [-34, -126], [-14, -110]], C('#353a4d'));
    poly(ctx, [[22, -112], [34, -126], [14, -110]], C('#353a4d'));
    circ(ctx, 4, -122, 13, C('#2c3042'));
    // spiked crown
    for (let i = -2; i <= 2; i++) poly(ctx, [[i * 6 - 3, -132], [i * 7 + 4, -152 - (i === 0 ? 6 : 0)], [i * 6 + 5, -132]], C('#4b5068'));
    circ(ctx, 9, -122, 2.8, C(ph2 ? '#ff2020' : '#ff6a6a')); circ(ctx, 1, -122, 2.6, C(ph2 ? '#ff2020' : '#ff6a6a'));
    // lightning greatsword
    ctx.save(); ctx.translate(16, -86); ctx.rotate(sw);
    rr(ctx, -6, -4, 14, 8, 2, C('#4b5068'));
    poly(ctx, [[8, -7], [120, -4], [134, 0], [120, 4], [8, 7]], C('#3a7fd0'));
    if (!(o.flash > 0)) {
      ctx.strokeStyle = 'rgba(160,230,255,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(10, 0);
      for (let x = 20; x <= 130; x += 12) ctx.lineTo(x, (Math.random() - 0.5) * 8);
      ctx.stroke();
      glow(ctx, 70, 0, 50, 'rgba(90,180,255,0.4)');
    }
    ctx.restore();
    ctx.restore();
  };

  P.erlik = P.captain; P.erlik_final = P.captain;
  P.khan = (...a) => P.centaur(...a);
  P.centaur = function (ctx, anim, t, p, o) {
    const C = tint(o);
    rr(ctx, -50, -80, 90, 40, 14, C('#1d3550'));
    for (const lx of [-40, -20, 15, 32]) limb(ctx, lx, -45, Math.sin(t * 10 + lx) * (anim === 'move' ? 0.5 : 0.05), 45, 9, C('#16283d'));
    rr(ctx, 20, -140, 28, 64, 8, C('#24466b'));
    circ(ctx, 34, -150, 11, C('#3a5fb0'));
    ctx.strokeStyle = C('#cfe8ee'); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(52, -112, 30, -1.3, 1.3); ctx.stroke();
  };

  // ------------------------------------------------------------------ SEED
  P.seed = function (ctx, anim, t) {
    glow(ctx, 0, 0, 22, 'rgba(180,255,120,0.8)', 0.6 + Math.sin(t * 6) * 0.3);
    ctx.save(); ctx.rotate(Math.sin(t * 3) * 0.4);
    ctx.fillStyle = '#7bd24a'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2e27a'; ctx.beginPath(); ctx.ellipse(-2, -3, 2.5, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  // ------------------------------------------------------------- TREE OF LIFE
  // p = growth 0..1
  P.tree = function (ctx, anim, t, p) {
    const g = U.easeOut(p);
    if (g <= 0) return;
    glow(ctx, 0, -160 * g, 260 * g, 'rgba(255,230,140,0.45)');
    ctx.fillStyle = '#6b4a2e';
    ctx.beginPath(); ctx.moveTo(-18 * g, 0); ctx.quadraticCurveTo(-6 * g, -90 * g, -10 * g, -170 * g);
    ctx.lineTo(10 * g, -170 * g); ctx.quadraticCurveTo(6 * g, -90 * g, 18 * g, 0); ctx.fill();
    ctx.strokeStyle = '#6b4a2e'; ctx.lineWidth = 8 * g; ctx.lineCap = 'round';
    for (const [a, l] of [[-0.9, 80], [0.8, 90], [-0.4, 60], [0.3, 70]]) {
      ctx.beginPath(); ctx.moveTo(0, -130 * g); ctx.lineTo(Math.sin(a) * l * g, -130 * g - Math.cos(a) * l * g); ctx.stroke();
    }
    const leaves = [[0, -220, 80], [-70, -190, 60], [70, -195, 62], [-40, -250, 50], [45, -248, 52], [0, -275, 40]];
    for (const [x, y, r] of leaves) {
      glow(ctx, x * g, y * g, r * g * 1.5, 'rgba(140,255,140,0.35)');
      circ(ctx, x * g, y * g, r * g, '#3f9a4a');
      circ(ctx, x * g - r * 0.25 * g, y * g - r * 0.25 * g, r * 0.6 * g, '#5cc061');
    }
    for (let i = 0; i < 10; i++) {
      const a = i * 0.63 + t * 0.6, rad = 90 * g;
      circ(ctx, Math.cos(a) * rad, -200 * g + Math.sin(a * 1.3) * rad * 0.7, 3, '#f7e27a');
    }
  };
})();
