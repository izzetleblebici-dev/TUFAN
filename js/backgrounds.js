// Level backgrounds: one painter per level theme (parallax layers) + weather
(function () {
  'use strict';
  const T = window.Tufan, U = T.util;
  const H = () => T.sprites.helpers;
  const wrap = (x, span) => ((x % span) + span) % span;

  // Deterministic random so each level always looks the same
  function rng(seed) { let s = seed; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }

  function sky(ctx, p, cam, o) {
    const W = T.W, Hh = T.H;
    const g = ctx.createLinearGradient(0, 0, 0, Hh);
    g.addColorStop(0, p.skyTop); g.addColorStop(0.75, p.skyBottom); g.addColorStop(1, p.skyBottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
    if (o.sun !== false) {
      const sx = W * (o.sunX || 0.72) - cam.x * 0.02, sy = o.sunY || 170, r = o.sunR || 46;
      H().glow(ctx, sx, sy, r * 4.8, p.sun + '88');
      ctx.fillStyle = p.sun; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
    if (o.clouds) {
      ctx.fillStyle = o.clouds;
      for (let i = 0; i < 9; i++) {
        const x = wrap(i * 260 - cam.x * 0.05, W + 400) - 200;
        ctx.beginPath(); ctx.ellipse(x, 70 + (i % 3) * 30, 200, 40, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  function hills(ctx, cam, par, baseY, amp, color, seed) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, T.H);
    for (let x = 0; x <= T.W + 20; x += 20) {
      const wx = x + cam.x * par + seed * 1000;
      ctx.lineTo(x, baseY - Math.sin(wx * 0.004) * amp - Math.sin(wx * 0.011 + 1) * amp * 0.4);
    }
    ctx.lineTo(T.W, T.H); ctx.fill();
  }
  function water(ctx, cam, y, color, lines) {
    ctx.fillStyle = color; ctx.fillRect(0, y, T.W, T.H - y);
    ctx.strokeStyle = lines; ctx.lineWidth = 2;
    for (let row = 0; row < 4; row++) {
      ctx.beginPath();
      const yy = y + 10 + row * 22, ph = performance.now() / 700 + row;
      for (let x = 0; x <= T.W; x += 20) ctx.lineTo(x, yy + Math.sin(x * 0.02 + ph - cam.x * 0.004 * (row + 1)) * 4);
      ctx.stroke();
    }
  }
  // repeat a list of props across the world at a given parallax
  function each(list, span, cam, par, fn) {
    for (const it of list) {
      const sx = wrap(it.x - cam.x * par, span) - 300;
      if (sx < -400 || sx > T.W + 400) continue;
      fn(sx, it);
    }
  }

  const themes = {};

  // ------------------------------------------------------------- Mu (flood)
  themes.mu = {
    init(L) {
      const r = rng(7);
      L.bg = {
        spires: Array.from({ length: 40 }, (_, i) => ({ x: i * 160 + r() * 80, h: 90 + r() * 160, w: 26 + r() * 30 })),
        columns: Array.from({ length: 30 }, (_, i) => ({ x: i * 260 + r() * 100, h: 120 + r() * 120, broken: r() < 0.4 })),
      };
    },
    draw(L, ctx, cam) {
      const p = L.pal, { glow } = H();
      sky(ctx, p, cam, { clouds: 'rgba(10,20,50,0.35)' });
      each(L.bg.spires, 6400, cam, 0.2, (sx, s) => {
        const base = 470;
        ctx.fillStyle = p.city; ctx.globalAlpha = 0.55;
        ctx.fillRect(sx, base - s.h, s.w, s.h);
        ctx.beginPath(); ctx.moveTo(sx - 4, base - s.h); ctx.lineTo(sx + s.w / 2, base - s.h - 50); ctx.lineTo(sx + s.w + 4, base - s.h); ctx.fill();
        ctx.fillStyle = p.accent; ctx.fillRect(sx, base - s.h + 12, s.w, 4);
        ctx.globalAlpha = 1;
      });
      const tx = 900 - cam.x * 0.2;
      if (tx > -200 && tx < T.W + 200) {
        ctx.fillStyle = p.city; ctx.globalAlpha = 0.75;
        ctx.fillRect(tx, 120, 40, 360);
        ctx.beginPath(); ctx.moveTo(tx - 10, 120); ctx.lineTo(tx + 20, 30); ctx.lineTo(tx + 50, 120); ctx.fill();
        ctx.globalAlpha = 1; glow(ctx, tx + 20, 40, 40, 'rgba(255,230,140,0.8)');
      }
      water(ctx, cam, 470, p.sea, 'rgba(200,230,255,0.35)');
      each(L.bg.columns, 7800, cam, 0.6, (sx, c) => {
        ctx.fillStyle = '#b8c2d8'; ctx.globalAlpha = 0.55;
        const top = T.GROUND - 10 - c.h;
        ctx.fillRect(sx, top, 30, c.h);
        ctx.fillStyle = p.accent; ctx.fillRect(sx - 6, top - 8, 42, 8);
        if (!c.broken) { ctx.fillStyle = '#b8c2d8'; ctx.fillRect(sx - 4, top - 18, 38, 10); }
        ctx.globalAlpha = 1;
      });
    },
    weather: 'rain',
  };

  // ------------------------------------------------- Kapadokya (underground)
  themes.kapadokya = {
    init(L) {
      const r = rng(11);
      L.bg = {
        chimneys: Array.from({ length: 34 }, (_, i) => ({ x: i * 190 + r() * 90, h: 150 + r() * 170, w: 50 + r() * 40, win: Math.floor(r() * 3), lit: r() < 0.5 })),
        niches: Array.from({ length: 22 }, (_, i) => ({ x: i * 360 + r() * 120, y: 300 + r() * 140, w: 130 + r() * 60 })),
        drips: Array.from({ length: 60 }, (_, i) => ({ x: i * 50 + r() * 30, h: 18 + r() * 50 })),
      };
    },
    draw(L, ctx, cam) {
      const p = L.pal, { glow } = H();
      sky(ctx, p, cam, { sunX: 0.3, sunY: 140, sunR: 40 });
      hills(ctx, cam, 0.1, 470, 30, '#8a5d38', 1);
      // fairy chimneys with carved doors and windows
      each(L.bg.chimneys, 6460, cam, 0.25, (sx, c) => {
        const base = 520, top = base - c.h;
        ctx.fillStyle = p.city;
        ctx.beginPath(); ctx.moveTo(sx, base); ctx.quadraticCurveTo(sx + 4, top + 30, sx + c.w * 0.5, top); ctx.quadraticCurveTo(sx + c.w - 4, top + 30, sx + c.w, base); ctx.fill();
        ctx.fillStyle = '#4a3020'; ctx.beginPath(); ctx.ellipse(sx + c.w * 0.5, top + 4, c.w * 0.32, 12, 0, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < c.win + 1; i++) {
          const wy = top + 50 + i * 38, wx = sx + c.w * 0.5 - 7;
          ctx.fillStyle = c.lit && i === 0 ? '#ffcf6a' : '#3a2416';
          ctx.beginPath(); ctx.ellipse(wx + 7, wy, 7, 10, 0, 0, Math.PI * 2); ctx.fill();
          if (c.lit && i === 0) glow(ctx, wx + 7, wy, 26, 'rgba(255,200,90,0.6)');
        }
      });
      // tunnel wall with lit vertical-farming niches
      hills(ctx, cam, 0.45, 560, 12, '#6b4a2e', 3);
      each(L.bg.niches, 7920, cam, 0.55, (sx, n) => {
        ctx.fillStyle = '#2e1d12'; ctx.fillRect(sx, n.y, n.w, 90);
        ctx.fillStyle = '#4a3020'; ctx.fillRect(sx - 6, n.y - 8, n.w + 12, 8);
        for (let r = 0; r < 3; r++) {
          ctx.fillStyle = '#5c3b22'; ctx.fillRect(sx + 6, n.y + 24 + r * 26, n.w - 12, 4);
          for (let k = 0; k < n.w - 20; k += 14) { ctx.fillStyle = r % 2 ? '#6fbf4a' : '#8fd65c'; ctx.beginPath(); ctx.ellipse(sx + 14 + k, n.y + 18 + r * 26, 5, 7, 0, 0, Math.PI * 2); ctx.fill(); }
        }
        glow(ctx, sx + n.w / 2, n.y + 10, 60, 'rgba(255,200,110,0.55)');
      });
      // rock ceiling with stalactites
      ctx.fillStyle = '#3d2818'; ctx.fillRect(0, 0, T.W, 36);
      each(L.bg.drips, 3000, cam, 0.9, (sx, d) => {
        ctx.beginPath(); ctx.moveTo(sx - 12, 34); ctx.lineTo(sx, 34 + d.h); ctx.lineTo(sx + 12, 34); ctx.fill();
      });
    },
    weather: 'dust',
  };

  // ------------------------------------------- Mezopotamya (river valley)
  themes.mezopotamya = {
    init(L) {
      const r = rng(23);
      L.bg = {
        ziggurats: Array.from({ length: 8 }, (_, i) => ({ x: i * 820 + r() * 300, w: 260 + r() * 140, steps: 3 + Math.floor(r() * 2) })),
        houses: Array.from({ length: 40 }, (_, i) => ({ x: i * 170 + r() * 60, w: 60 + r() * 50, h: 40 + r() * 40, roof: r() < 0.5 })),
        palms: Array.from({ length: 26 }, (_, i) => ({ x: i * 300 + r() * 160, h: 120 + r() * 70 })),
        reeds: Array.from({ length: 80 }, (_, i) => ({ x: i * 40 + r() * 20, h: 20 + r() * 26 })),
      };
    },
    draw(L, ctx, cam) {
      const p = L.pal;
      sky(ctx, p, cam, { clouds: 'rgba(255,255,255,0.25)', sunX: 0.8, sunY: 130 });
      hills(ctx, cam, 0.08, 430, 20, '#b8a07a', 2);
      each(L.bg.ziggurats, 6560, cam, 0.18, (sx, z) => {
        const base = 460, sh = 34;
        for (let i = 0; i < z.steps; i++) {
          const w = z.w * (1 - i * 0.22);
          ctx.fillStyle = i % 2 ? '#9a7550' : '#a98460';
          ctx.fillRect(sx + (z.w - w) / 2, base - (i + 1) * sh, w, sh);
        }
        ctx.fillStyle = '#7d5a3a'; ctx.fillRect(sx + z.w / 2 - 10, base - z.steps * sh - 20, 20, 20);
      });
      water(ctx, cam, 480, p.sea, 'rgba(220,240,255,0.35)');
      each(L.bg.houses, 6800, cam, 0.4, (sx, h) => {
        const base = 520;
        ctx.fillStyle = p.city; ctx.fillRect(sx, base - h.h, h.w, h.h);
        ctx.fillStyle = '#6f4f33'; ctx.fillRect(sx + h.w * 0.4, base - h.h * 0.55, h.w * 0.2, h.h * 0.55);
        if (h.roof) { ctx.fillStyle = '#c8a878'; ctx.fillRect(sx - 4, base - h.h - 6, h.w + 8, 6); }
      });
      each(L.bg.reeds, 3200, cam, 0.6, (sx, r) => {
        ctx.strokeStyle = '#5f8f3a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(sx, 560); ctx.lineTo(sx - 4, 560 - r.h); ctx.moveTo(sx + 6, 560); ctx.lineTo(sx + 10, 560 - r.h * 0.8); ctx.stroke();
      });
      each(L.bg.palms, 7800, cam, 0.7, (sx, pm) => palm(ctx, sx, T.GROUND - 8, pm.h, '#6b4a2e', '#4f8f3a'));
    },
    weather: 'drizzle',
  };
  function palm(ctx, x, base, h, trunk, leaf) {
    ctx.strokeStyle = trunk; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + 18, base - h * 0.5, x + 8, base - h); ctx.stroke();
    ctx.fillStyle = leaf;
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.55;
      ctx.save(); ctx.translate(x + 8, base - h); ctx.rotate(a);
      ctx.beginPath(); ctx.ellipse(34, 0, 38, 9, 0.25, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }

  // --------------------------------------------------------- Mısır (Nile)
  themes.misir = {
    init(L) {
      const r = rng(31);
      L.bg = {
        pyramids: Array.from({ length: 7 }, (_, i) => ({ x: i * 900 + r() * 300, w: 300 + r() * 220 })),
        obelisks: Array.from({ length: 18 }, (_, i) => ({ x: i * 440 + r() * 200, h: 140 + r() * 80 })),
        palms: Array.from({ length: 22 }, (_, i) => ({ x: i * 360 + r() * 200, h: 110 + r() * 60 })),
      };
    },
    draw(L, ctx, cam) {
      const p = L.pal;
      sky(ctx, p, cam, { sunX: 0.62, sunY: 200, sunR: 70 });
      hills(ctx, cam, 0.06, 450, 14, '#d9a95a', 4);
      each(L.bg.pyramids, 6300, cam, 0.16, (sx, py) => {
        const base = 470, h = py.w * 0.62;
        ctx.fillStyle = '#c9934a'; ctx.beginPath(); ctx.moveTo(sx, base); ctx.lineTo(sx + py.w / 2, base - h); ctx.lineTo(sx + py.w, base); ctx.fill();
        ctx.fillStyle = '#a8763a'; ctx.beginPath(); ctx.moveTo(sx + py.w / 2, base - h); ctx.lineTo(sx + py.w, base); ctx.lineTo(sx + py.w * 0.62, base); ctx.fill();
        ctx.fillStyle = '#f2d98a'; ctx.beginPath(); ctx.moveTo(sx + py.w * 0.44, base - h * 0.88); ctx.lineTo(sx + py.w / 2, base - h); ctx.lineTo(sx + py.w * 0.56, base - h * 0.88); ctx.fill();
      });
      water(ctx, cam, 490, p.sea, 'rgba(220,255,250,0.35)');
      each(L.bg.obelisks, 7920, cam, 0.45, (sx, o) => {
        const base = 540;
        ctx.fillStyle = '#d9b56a'; ctx.beginPath(); ctx.moveTo(sx, base); ctx.lineTo(sx + 6, base - o.h); ctx.lineTo(sx + 14, base - o.h - 16); ctx.lineTo(sx + 22, base - o.h); ctx.lineTo(sx + 28, base); ctx.fill();
        ctx.fillStyle = '#9a7a3e'; for (let k = 0; k < 4; k++) ctx.fillRect(sx + 11, base - o.h + 20 + k * 24, 6, 10);
      });
      each(L.bg.palms, 7920, cam, 0.7, (sx, pm) => palm(ctx, sx, T.GROUND - 8, pm.h, '#7a5530', '#3f8f4a'));
    },
    weather: 'sand',
  };

  // ----------------------------------------------------- Göbeklitepe (dusk)
  themes.gobeklitepe = {
    init(L) {
      const r = rng(43);
      L.bg = {
        stars: Array.from({ length: 140 }, () => ({ x: r() * T.W, y: r() * 380, s: 0.6 + r() * 1.8, ph: r() * 6 })),
        pillars: Array.from({ length: 30 }, (_, i) => ({ x: i * 260 + r() * 120, h: 150 + r() * 70, relief: Math.floor(r() * 3) })),
        far: Array.from({ length: 24 }, (_, i) => ({ x: i * 300 + r() * 150, h: 70 + r() * 40 })),
      };
    },
    draw(L, ctx, cam) {
      const p = L.pal, t = performance.now() / 1000;
      sky(ctx, p, cam, { sunX: 0.25, sunY: 120, sunR: 34 });
      for (const s of L.bg.stars) {
        ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.8 + s.ph));
        ctx.fillStyle = '#fff6e0'; ctx.fillRect(wrap(s.x - cam.x * 0.01, T.W), s.y, s.s, s.s);
      }
      ctx.globalAlpha = 1;
      hills(ctx, cam, 0.1, 470, 40, '#3b2d52', 5);
      each(L.bg.far, 7200, cam, 0.25, (sx, f) => tPillar(ctx, sx, 500, f.h, 0.6, '#5d5a66', -1));
      hills(ctx, cam, 0.35, 545, 16, '#4a4060', 6);
      each(L.bg.pillars, 7800, cam, 0.6, (sx, pl) => tPillar(ctx, sx, T.GROUND - 6, pl.h, 1, '#8a8794', pl.relief));
    },
    weather: 'fireflies',
  };
  // T-shaped carved pillar (the Göbeklitepe silhouette), with a simple animal relief
  function tPillar(ctx, x, base, h, s, color, relief) {
    const w = 34 * s, cap = 90 * s;
    ctx.fillStyle = color;
    ctx.fillRect(x - w / 2, base - h, w, h);
    ctx.fillRect(x - cap / 2, base - h - 22 * s, cap, 26 * s);
    if (relief < 0) return;
    ctx.strokeStyle = 'rgba(40,30,60,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath();
    const ry = base - h * 0.55;
    if (relief === 0) { ctx.moveTo(x - 10, ry); ctx.lineTo(x + 10, ry); ctx.moveTo(x - 6, ry); ctx.lineTo(x - 8, ry + 10); ctx.moveTo(x + 6, ry); ctx.lineTo(x + 8, ry + 10); ctx.moveTo(x + 10, ry); ctx.lineTo(x + 13, ry - 6); }
    else if (relief === 1) { ctx.arc(x, ry, 8, 0, Math.PI * 2); ctx.moveTo(x, ry - 8); ctx.lineTo(x, ry - 16); }
    else { ctx.moveTo(x - 10, ry - 8); ctx.quadraticCurveTo(x, ry + 10, x + 10, ry - 8); ctx.moveTo(x - 4, ry + 4); ctx.lineTo(x - 4, ry + 14); ctx.moveTo(x + 4, ry + 4); ctx.lineTo(x + 4, ry + 14); }
    ctx.stroke();
  }

  // --------------------------------------------------------------- weather
  const weather = {
    init(L) {
      L.particles = Array.from({ length: 90 }, () => ({ x: Math.random() * T.W, y: Math.random() * T.H, s: U.rand(500, 800), ph: Math.random() * 6 }));
    },
    update(L, dt) {
      const kind = L.theme.weather;
      for (const r of L.particles) {
        if (kind === 'rain' || kind === 'drizzle') { r.y += r.s * dt; r.x -= r.s * 0.18 * dt; }
        else if (kind === 'dust') { r.y += 12 * dt; r.x += Math.sin(r.ph + r.y * 0.01) * 10 * dt; }
        else if (kind === 'sand') { r.x -= r.s * 0.5 * dt; r.y += Math.sin(r.ph + r.x * 0.01) * 20 * dt; }
        else if (kind === 'fireflies') { r.ph += dt; r.x += Math.cos(r.ph * 0.7) * 14 * dt; r.y += Math.sin(r.ph) * 10 * dt; }
        if (r.y > T.H) { r.y = -10; r.x = Math.random() * (T.W + 200); }
        if (r.x < -50) { r.x = T.W + 40; r.y = Math.random() * T.H; }
      }
    },
    draw(L, ctx) {
      const kind = L.theme.weather;
      if (kind === 'rain' || kind === 'drizzle') {
        ctx.strokeStyle = kind === 'rain' ? 'rgba(190,215,255,0.28)' : 'rgba(210,225,255,0.18)'; ctx.lineWidth = 1.2; ctx.beginPath();
        const n = kind === 'rain' ? 90 : 40;
        for (let i = 0; i < n; i++) { const r = L.particles[i]; ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - 4, r.y + 16); }
        ctx.stroke();
      } else if (kind === 'dust') {
        ctx.fillStyle = 'rgba(255,220,160,0.35)';
        for (const r of L.particles) ctx.fillRect(r.x, r.y, 2, 2);
      } else if (kind === 'sand') {
        ctx.strokeStyle = 'rgba(255,225,160,0.3)'; ctx.lineWidth = 1; ctx.beginPath();
        for (const r of L.particles) { ctx.moveTo(r.x, r.y); ctx.lineTo(r.x + 18, r.y); }
        ctx.stroke();
      } else if (kind === 'fireflies') {
        const { glow } = H();
        for (let i = 0; i < 30; i++) { const r = L.particles[i]; glow(ctx, r.x, r.y * 0.8 + 100, 8, 'rgba(255,240,150,0.9)', 0.5 + 0.5 * Math.sin(r.ph * 3)); }
      }
    },
  };

  T.backgrounds = { themes, weather };
})();
