// Level system: combat zones (arena locks), spawns, mission tracking, tree planting, background
(function () {
  'use strict';
  const T = window.Tufan, U = T.util;

  class Level {
    constructor(def, g) {
      this.def = def;
      this.pal = def.palette;
      this.length = def.length || 6000;
      this.platforms = def.platforms || [];
      this.hints = def.hints || [];
      this.treeX = def.treeX || this.length - 300;
      this.zones = (def.zones || []).map((z) => Object.assign({ state: 'waiting', enemies: [], pending: [] }, z));
      this.activeZone = null;
      this.missionDone = false;
      this.planting = null;   // {t, success}
      this.treeGrowth = 0;
      this.theme = T.backgrounds.themes[def.theme || def.id] || T.backgrounds.themes.mu;
      this.theme.init(this);
      T.backgrounds.weather.init(this);
    }

    // mission progress text for the HUD, e.g. "Free the settlements (2/4)"
    missionText() {
      const m = this.def.mission;
      if (m.type === 'clearAll') {
        const done = this.zones.filter((z) => z.state === 'cleared').length;
        return `${m.text} (${done}/${this.zones.length})`;
      }
      return m.text;
    }

    bounds() {
      if (this.activeZone) return { min: this.activeZone.x, max: this.activeZone.x + T.W };
      return { min: 0, max: this.length };
    }

    update(dt, g) {
      const P = g.player;
      // trigger zones
      for (const z of this.zones) {
        if (z.state === 'waiting' && !this.activeZone && P.x > z.x + 380) {
          z.state = 'active'; this.activeZone = z;
          z.pending = z.spawns.map((s) => Object.assign({ t: s.delay || 0 }, s));
          if (z.type === 'boss') { const bt = (z.spawns.find((sp) => g.data.enemies[sp.type].boss) || {}).type; g.banner(bt ? g.data.enemies[bt].name : 'Boss', 2.0, true); T.audio.play('roar'); }
          else g.banner(z.banner || 'The Gulyabani attack!', 1.6);
        }
        if (z.state === 'active') {
          for (const s of z.pending) {
            s.t -= dt;
            if (s.t <= 0 && !s.done) { s.done = true; g.spawnEnemy(s.type, z.x + s.x, z); }
          }
          z.pending = z.pending.filter((s) => !s.done);
          if (z.pending.length === 0 && z.enemies.every((e) => !e.alive)) {
            z.state = 'cleared'; this.activeZone = null;
            g.seeds.list.forEach((sd) => { sd.magnet = true; });  // gather every seed left in the cleared area
            if (z.type === 'boss') this.onMissionTarget(g);
            else if (this.def.mission.type === 'clearAll' && this.zones.every((q) => q.state === 'cleared')) this.onMissionTarget(g);
            else g.banner(z.clearText || 'Area cleared  →', 1.6);
          }
        }
      }
      // mission: reach point
      if (this.def.mission.type === 'reachPoint' && !this.missionDone && P.x > this.treeX - 200) this.onMissionTarget(g);

      // tree planting at the sacred ground
      if (!this.planting && P.alive && P.x > this.treeX - 70 && !this.activeZone) {
        if (!this.missionDone) { if (!this.warned) { this.warned = true; g.banner('Complete Ülgen\'s mission first', 2); } }
        else this.startPlanting(g);
      }
      if (this.planting) {
        const pl = this.planting; pl.t += dt;
        if (pl.success) {
          this.treeGrowth = U.clamp(pl.t / 2.6, 0, 1);
          if (Math.random() < 0.5) g.fx.burst('glow', this.treeX + U.rand(-80, 80), T.GROUND - U.rand(0, 260 * this.treeGrowth), 1, { color: '#f7e27a', g: -120, minSpeed: 10, maxSpeed: 60, life: 1 });
          if (pl.t > 3.4 && !pl.reported) { pl.reported = true; g.showResult('win'); }
        } else if (pl.t > 1.8 && !pl.reported) { pl.reported = true; g.showResult('seedFail'); }
      }
      T.backgrounds.weather.update(this, dt);
    }
    onMissionTarget(g) {
      if (this.missionDone) return;
      this.missionDone = true;
      g.banner('Mission complete — plant the Tree of Life  →', 2.6);
    }
    startPlanting(g) {
      const P = g.player, ok = g.seeds.count >= g.seeds.quota;
      P.locked = true; P.vx = 0;
      this.planting = { t: 0, success: ok };
      if (ok) {
        g.banner('Geser plants the Tree of Life', 2.5);
        T.audio.play('tree');
        g.fx.ring(this.treeX, T.GROUND - 20, 'rgba(255,240,150,', 220, 0.9);
      } else {
        g.banner(`Seeds ${g.seeds.count}/${g.seeds.quota} — not enough for the Tree to take root`, 2.2);
        g.seeds.pulse = 1; T.audio.play('fail');
      }
    }

    // ------------------------------------------------------------ drawing
    drawBackground(ctx, cam) { this.theme.draw(this, ctx, cam); }
    drawWorld(ctx, g) {
      const p = this.pal, cx = g.cam.x;
      // ground
      ctx.fillStyle = p.ground; ctx.fillRect(cx - 50, T.GROUND, T.W + 100, T.H - T.GROUND);
      ctx.fillStyle = p.trim; ctx.fillRect(cx - 50, T.GROUND, T.W + 100, 5);
      ctx.fillStyle = p.groundDark;
      const start = Math.floor((cx - 50) / 96) * 96;
      for (let x = start; x < cx + T.W + 100; x += 96) { ctx.fillRect(x, T.GROUND + 5, 2, T.H); ctx.fillRect(x + 48, T.GROUND + 40, 2, T.H); }
      ctx.fillRect(cx - 50, T.GROUND + 40, T.W + 100, 2);
      // puddles (flooded levels only)
      ctx.fillStyle = 'rgba(120,180,255,0.35)';
      if (this.theme.weather === 'rain' || this.theme.weather === 'drizzle') for (let x = Math.floor(cx / 700) * 700; x < cx + T.W + 700; x += 700) { ctx.beginPath(); ctx.ellipse(x + 250, T.GROUND + 18, 70, 6, 0, 0, Math.PI * 2); ctx.fill(); }
      // platforms
      for (const pl of this.platforms) {
        if (pl.x > cx + T.W || pl.x + pl.w < cx) continue;
        ctx.fillStyle = p.platform || '#eef1f7'; ctx.fillRect(pl.x, pl.y, pl.w, 18);
        ctx.fillStyle = p.trim; ctx.fillRect(pl.x, pl.y, pl.w, 4);
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(pl.x, pl.y + 18, pl.w, 6);
      }
      // zone gates (glowing barriers while a zone is locked)
      if (this.activeZone) {
        const z = this.activeZone, t = performance.now() / 300;
        for (const gx of [z.x, z.x + T.W]) {
          const gr = ctx.createLinearGradient(gx - 30, 0, gx + 30, 0);
          gr.addColorStop(0, 'rgba(120,40,160,0)'); gr.addColorStop(0.5, `rgba(150,60,200,${0.45 + Math.sin(t) * 0.15})`); gr.addColorStop(1, 'rgba(120,40,160,0)');
          ctx.fillStyle = gr; ctx.fillRect(gx - 30, 0, 60, T.GROUND);
        }
      }
      // tutorial hint tablets
      ctx.textAlign = 'center';
      // only the hint closest to the player is shown, so tablets never overlap
      let near = null, nd = 1e9;
      if (g.state === 'play' || g.state === 'paused') for (const h of this.hints) { const dd = Math.abs(g.player.x - h.x); if (dd < nd) { nd = dd; near = h; } }
      for (const h of near && nd < 520 ? [near] : []) {
        const dist = nd, a = U.clamp(1 - (dist - 200) / 320, 0, 1);
        ctx.globalAlpha = a;
        ctx.font = '600 18px Georgia, serif';
        const w = ctx.measureText(h.text).width + 36;
        ctx.fillStyle = 'rgba(12,22,48,0.78)'; ctx.fillRect(h.x - w / 2, T.GROUND - 250, w, 40);
        ctx.strokeStyle = p.accent; ctx.lineWidth = 2; ctx.strokeRect(h.x - w / 2, T.GROUND - 250, w, 40);
        ctx.fillStyle = '#fff4d6'; ctx.fillText(h.text, h.x, T.GROUND - 224);
        ctx.fillStyle = '#7d869c'; ctx.fillRect(h.x - 3, T.GROUND - 210, 6, 210);
        ctx.globalAlpha = 1;
      }
      // sacred ground + tree of life
      const tX = this.treeX;
      if (tX > cx - 400 && tX < cx + T.W + 400) {
        const { glow } = T.sprites.helpers;
        if (this.def.id === 'kapadokya') {
          // the cave shrine: a carved rock arch with lamplight inside
          ctx.fillStyle = '#4a3020'; ctx.beginPath(); ctx.moveTo(tX - 230, T.GROUND); ctx.lineTo(tX - 230, T.GROUND - 300); ctx.quadraticCurveTo(tX, T.GROUND - 470, tX + 230, T.GROUND - 300); ctx.lineTo(tX + 230, T.GROUND); ctx.fill();
          ctx.fillStyle = '#20140c'; ctx.beginPath(); ctx.moveTo(tX - 170, T.GROUND); ctx.lineTo(tX - 170, T.GROUND - 250); ctx.quadraticCurveTo(tX, T.GROUND - 400, tX + 170, T.GROUND - 250); ctx.lineTo(tX + 170, T.GROUND); ctx.fill();
          glow(ctx, tX - 130, T.GROUND - 220, 40, 'rgba(255,200,90,0.8)'); glow(ctx, tX + 130, T.GROUND - 220, 40, 'rgba(255,200,90,0.8)');
        }
        glow(ctx, tX, T.GROUND, 160, 'rgba(255,230,140,0.55)', 0.6 + Math.sin(performance.now() / 400) * 0.2);
        ctx.fillStyle = '#8a7a5a';
        for (let i = -3; i <= 3; i++) { ctx.fillRect(tX + i * 34 - 10, T.GROUND - 34 + Math.abs(i) * 4, 20, 34 - Math.abs(i) * 4); }
        ctx.fillStyle = '#f2c14e'; ctx.fillRect(tX - 120, T.GROUND - 2, 240, 4);
        if (this.treeGrowth > 0) T.sprites.draw(ctx, 'tree', 'grow', performance.now() / 1000, tX, T.GROUND, 1, { p: this.treeGrowth });
      }
    }
    drawRain(ctx) { T.backgrounds.weather.draw(this, ctx); }
  }
  T.Level = Level;
})();
