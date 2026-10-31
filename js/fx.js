// Juice: particles, floating text, screen shake, flashes, lightning, slashes
(function () {
  'use strict';
  const T = window.Tufan, U = T.util, H = () => T.sprites.helpers;

  class FX {
    constructor() {
      this.parts = [];
      this.texts = [];
      this.shakeMag = 0;
      this.shakeX = 0; this.shakeY = 0;
      this.flash = null;   // {t, dur, color}
      this.vignette = 0;   // red damage vignette
      this.darken = 0;     // ultimate build-up darkness
    }
    // ------------------------------------------------------------- spawners
    add(p) { p.t = 0; p.life = p.life || 0.5; this.parts.push(p); return p; }
    burst(type, x, y, n, o) {
      o = o || {};
      for (let i = 0; i < n; i++) {
        const a = o.angle != null ? o.angle + U.rand(-o.spread, o.spread) : U.rand(0, Math.PI * 2);
        const sp = U.rand(o.minSpeed || 120, o.maxSpeed || 420);
        this.add({ type, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: U.rand(0.2, o.life || 0.45), size: U.rand(o.minSize || 2, o.maxSize || 5), color: o.color, g: o.g != null ? o.g : 600, drag: o.drag || 2 });
      }
    }
    sparks(x, y, color, n) { this.burst('spark', x, y, n || 10, { color: color || '#ffe08a', minSpeed: 200, maxSpeed: 650, life: 0.3, g: 400 }); }
    dust(x, y, n, dir) {
      for (let i = 0; i < (n || 6); i++) this.add({ type: 'dust', x: x + U.rand(-10, 10), y: y - U.rand(0, 6), vx: (dir || U.rand(-1, 1)) * U.rand(30, 160), vy: U.rand(-90, -20), life: U.rand(0.35, 0.7), size: U.rand(6, 14), g: -40, drag: 3, color: 'rgba(220,220,230,' });
    }
    water(x, y, n) { this.burst('drop', x, y, n || 8, { color: '#8fd3ff', angle: -Math.PI / 2, spread: 0.9, minSpeed: 150, maxSpeed: 420, g: 1400, life: 0.6, minSize: 2, maxSize: 4 }); }
    smoke(x, y, n) {
      for (let i = 0; i < (n || 10); i++) this.add({ type: 'dust', x: x + U.rand(-30, 30), y: y - U.rand(0, 100), vx: U.rand(-40, 40), vy: U.rand(-80, -20), life: U.rand(0.5, 0.9), size: U.rand(10, 22), g: -30, drag: 2, color: 'rgba(40,20,60,' });
    }
    slash(x, y, facing, radius, a0, a1, color, width) {
      this.add({ type: 'slash', x, y, facing, radius, a0, a1, color: color || 'rgba(255,240,200,', width: width || 10, life: 0.14 });
    }
    ring(x, y, color, maxR, life) { this.add({ type: 'ring', x, y, color: color || 'rgba(255,230,140,', maxR: maxR || 80, life: life || 0.35 }); }
    lightning(x, topY, bottomY, color) {
      const pts = []; let cx = x + U.rand(-30, 30);
      for (let y = topY; y < bottomY; y += U.rand(28, 52)) { pts.push([cx, y]); cx = x + U.rand(-34, 34); }
      pts.push([x, bottomY]);
      this.add({ type: 'bolt', x, y: bottomY, pts, life: 0.4, color: color || '#fff6c8' });
    }
    sprite(name, anim, x, y, facing, life, o) { this.add({ type: 'sprite', name, anim, x, y, facing, life, o: o || {} }); }
    text(x, y, str, color, size, o) {
      o = o || {};
      this.texts.push({ x: x + U.rand(-10, 10), y, str: String(str), color: color || '#fff', size: size || 26, t: 0, life: o.life || 0.8, vy: o.vy != null ? o.vy : -90 });
    }
    shake(m) { this.shakeMag = Math.max(this.shakeMag, m); }
    flashScreen(color, dur) { this.flash = { t: 0, dur: dur || 0.2, color: color || 'rgba(255,255,255,' }; }

    // ------------------------------------------------------------- updates
    update(dt) { // simulation time (frozen during hit-stop)
      for (const p of this.parts) {
        p.t += dt;
        if (p.vx != null) {
          p.vx -= p.vx * (p.drag || 0) * dt;
          p.vy += (p.g || 0) * dt;
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.type === 'drop' && p.y > T.GROUND) p.t = p.life;
        }
      }
      this.parts = this.parts.filter((p) => p.t < p.life);
      for (const s of this.texts) { s.t += dt; s.y += s.vy * dt; s.vy *= 1 - 2.5 * dt; }
      this.texts = this.texts.filter((s) => s.t < s.life);
    }
    updateReal(dt) { // real time (keeps running in hit-stop)
      this.shakeMag = Math.max(0, this.shakeMag - this.shakeMag * 9 * dt - 6 * dt);
      this.shakeX = (Math.random() * 2 - 1) * this.shakeMag;
      this.shakeY = (Math.random() * 2 - 1) * this.shakeMag;
      if (this.flash) { this.flash.t += dt; if (this.flash.t >= this.flash.dur) this.flash = null; }
      this.vignette = Math.max(0, this.vignette - dt * 2);
    }

    // ------------------------------------------------------------- drawing
    drawWorld(ctx) {
      const { circ } = H();
      for (const p of this.parts) {
        const k = 1 - p.t / p.life;
        switch (p.type) {
          case 'spark':
            ctx.strokeStyle = p.color; ctx.globalAlpha = k; ctx.lineWidth = p.size * 0.7;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); ctx.stroke();
            ctx.globalAlpha = 1; break;
          case 'drop': ctx.globalAlpha = k; circ(ctx, p.x, p.y, p.size, p.color); ctx.globalAlpha = 1; break;
          case 'glow': ctx.globalAlpha = k; circ(ctx, p.x, p.y, p.size * (0.5 + k * 0.5), p.color); ctx.globalAlpha = 1; break;
          case 'dust': circ(ctx, p.x, p.y, p.size * (1.4 - k * 0.6), p.color + (0.45 * k).toFixed(3) + ')'); break;
          case 'slash': {
            ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.facing, 1);
            ctx.strokeStyle = p.color + (0.85 * k).toFixed(3) + ')'; ctx.lineWidth = p.width * k + 2; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.arc(0, 0, p.radius, p.a0, p.a1, p.a1 < p.a0); ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,' + (0.9 * k).toFixed(3) + ')'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, p.radius, p.a0, p.a1, p.a1 < p.a0); ctx.stroke();
            ctx.restore(); break;
          }
          case 'ring':
            ctx.strokeStyle = p.color + k.toFixed(3) + ')'; ctx.lineWidth = 4 * k + 1;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.maxR * (1 - k * k), 0, Math.PI * 2); ctx.stroke(); break;
          case 'bolt': {
            ctx.save(); ctx.globalAlpha = k;
            for (const [w, c] of [[16, 'rgba(255,220,120,0.35)'], [7, p.color], [2.5, '#ffffff']]) {
              ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.beginPath();
              p.pts.forEach((pt, i) => (i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])));
              ctx.stroke();
            }
            ctx.restore(); break;
          }
          case 'sprite': {
            const fadeIn = U.clamp(p.t / 0.15, 0, 1), fadeOut = U.clamp((p.life - p.t) / 0.25, 0, 1);
            const anim = p.t < 0.15 ? 'appear' : p.life - p.t < 0.25 ? 'fade' : p.anim;
            T.sprites.draw(ctx, p.name, anim, p.t, p.x, p.y - Math.sin(p.t * 3) * 6, p.facing, Object.assign({ alpha: Math.min(fadeIn, fadeOut) * 0.9, p: p.t / p.life }, p.o));
            break;
          }
        }
      }
      ctx.textAlign = 'center';
      for (const s of this.texts) {
        const k = 1 - s.t / s.life, sc = s.t < 0.08 ? 1.5 - s.t * 6 : 1;
        ctx.globalAlpha = U.clamp(k * 2, 0, 1);
        ctx.font = `bold ${Math.round(s.size * sc)}px Georgia, serif`;
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeText(s.str, s.x, s.y); ctx.fillStyle = s.color; ctx.fillText(s.str, s.x, s.y);
      }
      ctx.globalAlpha = 1;
    }
    drawScreen(ctx) {
      if (this.darken > 0) { ctx.fillStyle = `rgba(5,5,20,${(this.darken * 0.55).toFixed(3)})`; ctx.fillRect(0, 0, T.W, T.H); }
      if (this.vignette > 0) {
        const g = ctx.createRadialGradient(T.W / 2, T.H / 2, T.H * 0.35, T.W / 2, T.H / 2, T.H * 0.85);
        g.addColorStop(0, 'rgba(180,0,0,0)'); g.addColorStop(1, `rgba(180,0,0,${(this.vignette * 0.6).toFixed(3)})`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, T.W, T.H);
      }
      if (this.flash) {
        const k = 1 - this.flash.t / this.flash.dur;
        ctx.fillStyle = this.flash.color + (k * 0.85).toFixed(3) + ')'; ctx.fillRect(0, 0, T.W, T.H);
      }
    }
  }
  T.FX = FX;
})();
