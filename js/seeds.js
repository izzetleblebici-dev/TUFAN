// Seed system: drops from enemies (per-enemy chance), pickup with magnet, quota tracking
(function () {
  'use strict';
  const T = window.Tufan, U = T.util;

  class Seeds {
    constructor(quota) {
      this.list = [];
      this.count = 0;
      this.quota = quota;
      this.pulse = 0;
    }
    // Rolls the enemy's drop chance. Returns number of seeds dropped.
    rollDrop(enemy, g) {
      const d = enemy.d;
      if (Math.random() >= (d.seedDropChance || 0)) return 0;
      const n = d.seedCount || 1;
      for (let i = 0; i < n; i++) {
        this.list.push({ x: enemy.x, y: enemy.y - enemy.h * 0.5, vx: U.rand(-170, 170), vy: U.rand(-680, -460), t: 0, magnet: false });
      }
      g.fx.ring(enemy.x, enemy.y - enemy.h * 0.5, 'rgba(160,255,120,', 60, 0.4);
      return n;
    }
    update(dt, g) {
      const P = g.player;
      for (const s of this.list) {
        s.t += dt;
        const dx = P.x - s.x, dy = P.y - 45 - s.y, dist = Math.hypot(dx, dy) || 1;
        if (!s.magnet && s.t > 0.45 && dist < 180 && P.alive) s.magnet = true;
        if (s.magnet) {
          const sp = 500 + s.t * 600;
          s.x += (dx / dist) * sp * dt; s.y += (dy / dist) * sp * dt;
        } else {
          s.vy += 1800 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 1 - 1.5 * dt;
          if (s.y >= T.GROUND - 12) { s.y = T.GROUND - 12; s.vy = -s.vy * 0.35; s.vx *= 0.6; if (Math.abs(s.vy) < 60) s.vy = 0; }
          const b = g.bounds; s.x = U.clamp(s.x, b.min + 10, b.max - 10);
        }
        if (s.t > 0.3 && dist < 36 && P.alive) { s.got = true; this.collect(g, s); }
      }
      this.list = this.list.filter((s) => !s.got);
      this.pulse = Math.max(0, this.pulse - dt * 2);
    }
    collect(g, s) {
      this.count++;
      this.pulse = 1;
      g.fx.burst('glow', s.x, s.y, 8, { color: '#b9ff8a', minSpeed: 60, maxSpeed: 200, g: -100, life: 0.5, minSize: 3, maxSize: 6 });
      g.fx.text(s.x, s.y - 20, '+1 seed', '#b9ff8a', 18);
      T.audio.play('seed');
      if (this.count === this.quota) g.banner('Enough seeds for the Tree of Life!', 2.2);
    }
    draw(ctx) {
      for (const s of this.list) T.sprites.draw(ctx, 'seed', 'idle', s.t, s.x, s.y, 1, {});
    }
  }
  T.Seeds = Seeds;
})();
