// Combat system: resolves player hits, enemy hits, projectiles and ground waves.
// Characters only *declare* hitboxes; this module decides what connects.
(function () {
  'use strict';
  const T = window.Tufan, U = T.util;

  class Combat {
    constructor() {
      this.projectiles = [];
      this.waves = [];
    }
    spawnProjectile(o) {
      this.projectiles.push(Object.assign({ r: 12, life: 3, t: 0, owner: 'enemy', parryable: true, kind: 'projectile', kb: 240, trail: 0 }, o));
    }
    spawnWave(o) {
      this.waves.push(Object.assign({ t: 0, travelled: 0, h: 36, w: 34, parryable: true, kind: 'wave', kb: 300 }, o));
    }

    update(dt, g) {
      const P = g.player;
      const pBody = P.body();

      // ---- Player melee -> enemies
      if (P.hit) {
        const hb = P.hit.box();
        for (const e of g.enemies) {
          if (!e.canBeHit() || P.hit.hitSet.has(e)) continue;
          if (U.overlap(hb, e.body())) {
            P.hit.hitSet.add(e);
            const r = e.receive({ damage: P.hit.damage, kb: P.hit.kb, guardBreak: P.hit.guardBreak, poiseMul: P.hit.poiseMul, srcX: P.x }, g);
            if (r) g.onPlayerHit(e, r, P.hit);
          }
        }
      }

      // ---- Enemy melee -> player
      for (const e of g.enemies) {
        const h = e.hit;
        if (!h || h.done) continue;
        h.srcX = e.x;
        if (U.overlap(h.box(), pBody)) {
          const res = P.receive(h, g);
          if (res && res !== 'dodged' && res !== 'immune') h.done = true;
        }
      }

      // ---- Projectiles
      for (const pr of this.projectiles) {
        pr.t += dt;
        if (pr.g) pr.vy += pr.g * dt;
        pr.x += pr.vx * dt; pr.y += pr.vy * dt;
        if (!pr.arrow && Math.random() < 0.6) g.fx.add({ type: 'glow', x: pr.x, y: pr.y, vx: 0, vy: 0, g: 0, life: 0.25, size: pr.r * 0.9, color: pr.owner === 'player' ? '#ffe28a' : '#ff4a6a' });
        if (pr.t > pr.life || pr.y > T.GROUND || pr.x < g.cam.x - 200 || pr.x > g.cam.x + T.W + 200) { pr.dead = true; continue; }
        const box = { x: pr.x - pr.r, y: pr.y - pr.r, w: pr.r * 2, h: pr.r * 2 };
        if (pr.owner === 'enemy') {
          if (U.overlap(box, pBody)) {
            pr.srcX = pr.x;
            const res = P.receive(pr, g);
            if (res === 'parried') {
              // Reflect back at the enemies
              pr.owner = 'player'; pr.vx = -pr.vx * 1.6; pr.vy = -Math.abs(pr.vy) * 0.2; pr.g = 0;
              pr.damage *= g.data.player.parry.reflectMultiplier; pr.t = 0;
            } else if (res && res !== 'dodged' && res !== 'immune') {
              pr.dead = true; g.fx.sparks(pr.x, pr.y, '#ff6a8a', 8);
            }
          }
        } else {
          for (const e of g.enemies) {
            if (!e.canBeHit()) continue;
            if (U.overlap(box, e.body())) {
              const r = e.receive({ damage: pr.damage, kb: 300, guardBreak: false, poiseMul: 2, srcX: pr.x - Math.sign(pr.vx) * 50 }, g);
              if (r) g.onPlayerHit(e, r, { rage: 6, heavy: true, reflected: true });
              pr.dead = true; g.fx.sparks(pr.x, pr.y, '#ffe08a', 14);
              break;
            }
          }
        }
      }
      this.projectiles = this.projectiles.filter((p) => !p.dead);

      // ---- Ground waves (Stone Brute quake, Captain slam)
      for (const w of this.waves) {
        const step = w.speed * dt;
        w.x += w.dir * step; w.travelled += step; w.t += dt;
        if (Math.random() < 0.7) g.fx.dust(w.x, T.GROUND, 1, -w.dir);
        if (w.travelled > w.range) { w.dead = true; continue; }
        if (w.hitDone) continue;
        const box = { x: w.x - w.w / 2, y: T.GROUND - w.h, w: w.w, h: w.h };
        if (U.overlap(box, pBody)) {
          w.srcX = w.x;
          const res = P.receive(w, g);
          if (res === 'parried') { w.dead = true; g.fx.dust(w.x, T.GROUND, 10); }
          else if (res && res !== 'dodged' && res !== 'immune') w.hitDone = true;
        }
      }
      this.waves = this.waves.filter((w) => !w.dead);
    }

    draw(ctx) {
      const { circ, glow } = T.sprites.helpers;
      for (const pr of this.projectiles) {
        if (pr.arrow) {
          const ang = Math.atan2(pr.vy, pr.vx);
          ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(ang);
          if (pr.owner === 'player') glow(ctx, 0, 0, 22, 'rgba(255,220,120,0.9)', 0.7);
          ctx.strokeStyle = '#2b3d52'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(12, 0); ctx.stroke();
          ctx.fillStyle = '#9fe6f2'; ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(8, -6); ctx.lineTo(8, 6); ctx.fill();
          ctx.fillStyle = '#4fb3c9'; ctx.fillRect(-28, -4, 7, 8);
          ctx.restore();
          if (pr.owner === 'enemy' && pr.parryable) { ctx.fillStyle = 'rgba(255,215,90,0.9)'; ctx.font = 'bold 16px serif'; ctx.textAlign = 'center'; ctx.fillText('✦', pr.x, pr.y - 18); }
          continue;
        }
        const c = pr.owner === 'player' ? 'rgba(255,220,120,0.95)' : 'rgba(255,50,90,0.95)';
        glow(ctx, pr.x, pr.y, pr.r * 3, c, 0.8);
        circ(ctx, pr.x, pr.y, pr.r * 0.7, '#fff');
        // gold parry glint on parryable incoming projectiles
        if (pr.owner === 'enemy' && pr.parryable) {
          ctx.fillStyle = 'rgba(255,215,90,0.9)'; ctx.font = 'bold 16px serif'; ctx.textAlign = 'center';
          ctx.fillText('✦', pr.x, pr.y - pr.r - 8);
        }
      }
      for (const w of this.waves) {
        const k = 1 - w.travelled / w.range;
        ctx.fillStyle = `rgba(255,120,60,${(0.55 * k + 0.2).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(w.x - w.w / 2, T.GROUND); ctx.lineTo(w.x - w.w / 4, T.GROUND - w.h * 0.7);
        ctx.lineTo(w.x + w.dir * 4, T.GROUND - w.h); ctx.lineTo(w.x + w.w / 4, T.GROUND - w.h * 0.6);
        ctx.lineTo(w.x + w.w / 2, T.GROUND); ctx.fill();
        if (w.parryable) { ctx.fillStyle = 'rgba(255,215,90,0.9)'; ctx.font = 'bold 16px serif'; ctx.textAlign = 'center'; ctx.fillText('✦', w.x, T.GROUND - w.h - 8); }
      }
    }
  }
  T.Combat = Combat;
})();
