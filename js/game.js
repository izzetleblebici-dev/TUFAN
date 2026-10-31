// Game: state machine, fixed-step loop, event handlers that tie the systems together
(function () {
  'use strict';
  const T = window.Tufan, U = T.util, I = T.input, A = T.audio;
  const STEP = 1 / 60;

  class Game {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d');
      this.data = window.TUFAN_DATA;
      T.sprites.init(this.data.sprites);
      this.state = 'title'; this.menuIndex = 0; this.menuRects = [];
      this.debug = false;
      this.acc = 0; this.last = performance.now();
      this.loadLevel(0);            // also used as the title backdrop
      this.titleCam = 0;
      this.bindMouse();
      requestAnimationFrame((ts) => this.frame(ts));
    }

    // ------------------------------------------------------------ setup
    loadLevel(i) {
      this.levelIndex = i;
      const def = this.data.levels[i];
      this.fx = new T.FX();
      this.level = new T.Level(def, this);
      this.player = new T.Player(this.data, def.start || 200);
      this.enemies = [];
      this.combat = new T.Combat();
      this.seeds = new T.Seeds(def.seedQuota);
      this.cam = { x: 0 };
      this.bounds = this.level.bounds();
      this.stats = { time: 0, kills: 0, parries: 0, maxCombo: 0, perfectDodges: 0 };
      this.combo = 0; this.comboT = 0;
      this.hitstop = 0; this.slow = { t: 0, scale: 1 };
      this.hpGhost = this.player.hp;
      this.bannerMsg = null; this.result = null; this.rageWasFull = false;
      I.clearBuffers();
    }
    startLevel(i, withIntro) {
      this.loadLevel(i);
      this.menuIndex = 0;
      if (withIntro) { this.state = 'intro'; this.introStep = 0; }
      else { this.state = 'play'; this.banner(this.level.missionText(), 2.2); A.startAmbient(); }
    }

    // ------------------------------------------------------------ menus
    menuItems() {
      const tx = this.data.text;
      if (this.state === 'title') return [tx.newGame, tx.levelSelect, tx.quit];
      if (this.state === 'select') return this.data.levels.map((l, i) => `${i + 1}. ${l.name}`).concat([tx.mainMenu]);
      if (this.state === 'paused') return [tx.resume, tx.restart, tx.mainMenu];
      if (this.state === 'result') return this.result.kind === 'win' ? [tx.continue, tx.replay, tx.mainMenu] : [tx.retry, tx.mainMenu];
      return [];
    }
    menuSelect(i) {
      A.play('confirm');
      const s = this.state;
      if (s === 'title') {
        if (i === 0) this.startLevel(0, true);
        else if (i === 1) { this.state = 'select'; this.menuIndex = 0; }
        else { this.state = 'quit'; try { window.close(); } catch (e) {} }
      } else if (s === 'select') {
        if (i < this.data.levels.length) this.startLevel(i, true); else this.toTitle();
      }
      else if (s === 'paused') {
        if (i === 0) { this.state = 'play'; I.clearBuffers(); }
        else if (i === 1) this.startLevel(this.levelIndex, false);
        else this.toTitle();
      } else if (s === 'result') {
        const win = this.result.kind === 'win';
        if (win && i === 0) {
          const next = this.levelIndex + 1;
          if (next < this.data.levels.length) this.startLevel(next, true);
          else { this.state = 'ending'; I.clearBuffers(); }
        } else if ((win && i === 1) || (!win && i === 0)) this.startLevel(this.levelIndex, false);
        else this.toTitle();
      }
    }
    toTitle() { A.stopAmbient(); this.loadLevel(0); this.state = 'title'; this.menuIndex = 0; }
    handleMenu() {
      const items = this.menuItems();
      if (!items.length) return;
      if (I.just.up) { this.menuIndex = (this.menuIndex + items.length - 1) % items.length; A.play('menu'); }
      if (I.just.down) { this.menuIndex = (this.menuIndex + 1) % items.length; A.play('menu'); }
      if (I.mouse.moved) {
        this.menuRects.forEach((r, i) => { if (U.overlap({ x: I.mouse.x, y: I.mouse.y, w: 1, h: 1 }, r)) this.menuIndex = i; });
        I.mouse.moved = false;
      }
      const clickHit = I.mouse.clicked && this.menuRects.findIndex((r) => U.overlap({ x: I.mouse.x, y: I.mouse.y, w: 1, h: 1 }, r));
      if (clickHit != null && clickHit !== false && clickHit >= 0) return this.menuSelect(clickHit);
      if (I.just.confirm) this.menuSelect(this.menuIndex);
    }
    bindMouse() {
      const toLocal = (e) => {
        const r = this.canvas.getBoundingClientRect();
        I.mouse.x = ((e.clientX - r.left) / r.width) * T.W; I.mouse.y = ((e.clientY - r.top) / r.height) * T.H;
      };
      this.canvas.addEventListener('mousemove', (e) => { toLocal(e); I.mouse.moved = true; });
      // Left click = heavy attack, right click = Umay's blessing
      this.canvas.addEventListener('mousedown', (e) => {
        A.init(); toLocal(e); this.canvas.focus();
        if (e.button === 0) { I.mouse.clicked = true; if (this.state === 'play') I.fire('heavy'); }
        if (e.button === 2 && this.state === 'play') I.fire('heal');
        e.preventDefault();
      });
      this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    onBlur() { if (this.state === 'play') { this.state = 'paused'; this.menuIndex = 0; } }

    // ------------------------------------------------------------ loop
    frame(ts) {
      const real = Math.min(0.1, (ts - this.last) / 1000); this.last = ts;
      I.update();
      if (I.just.mute) A.toggleMute();
      if (I.just.debug) this.debug = !this.debug;

      switch (this.state) {
        case 'title':
          this.titleCam += real * 40;
          this.cam.x = (this.titleCam % 5000);
          this.level.update(real, this);
          this.handleMenu();
          break;
        case 'intro': {
          this.cam.x = 0;
          const n = (this.level.def.briefing || []).length;
          if (I.just.confirm || I.mouse.clicked) {
            A.play('menu'); this.introStep++;
            if (this.introStep >= n) { this.state = 'play'; I.clearBuffers(); A.startAmbient(); this.banner(this.level.missionText(), 2.2); }
          }
          break;
        }
        case 'play':
          if (I.just.pause) { this.state = 'paused'; this.menuIndex = 0; break; }
          if (I.just.cheatRage) this.player.rage = this.player.rageMax;
          if (I.just.cheatSeed) this.seeds.count++;
          if (this.hitstop > 0) this.hitstop -= real;
          else {
            if (this.slow.t > 0) { this.slow.t -= real; if (this.slow.t <= 0) this.slow.scale = 1; }
            this.acc += real * this.slow.scale;
            let n = 0;
            while (this.acc >= STEP && n < 6) { this.step(STEP); this.acc -= STEP; n++; if (this.hitstop > 0) { this.acc = 0; break; } }
          }
          this.fx.updateReal(real);
          if (this.bannerMsg) { this.bannerMsg.t += real; if (this.bannerMsg.t > this.bannerMsg.dur) this.bannerMsg = null; }
          break;
        case 'paused':
          if (I.just.pause || I.just.back) { this.state = 'play'; I.clearBuffers(); break; }
          this.handleMenu();
          break;
        case 'result':
          this.fx.updateReal(real); this.fx.update(real);
          this.handleMenu();
          break;
        case 'select':
          if (I.just.back) { this.toTitle(); break; }
          this.titleCam += real * 40; this.cam.x = (this.titleCam % 5000); this.level.update(real, this);
          this.handleMenu();
          break;
        case 'ending':
          if (I.just.confirm || I.mouse.clicked) this.toTitle();
          break;
        case 'quit':
          if (I.just.confirm || I.mouse.clicked) this.toTitle();
          break;
      }
      this.render();
      I.endFrame();
      requestAnimationFrame((t) => this.frame(t));
    }

    step(dt) {
      this.stats.time += dt;
      this.bounds = this.level.bounds();
      this.player.update(dt, this);
      for (const e of this.enemies) e.update(dt, this);
      this.separate(dt);
      this.combat.update(dt, this);
      this.seeds.update(dt, this);
      this.level.update(dt, this);
      this.fx.update(dt);
      this.enemies = this.enemies.filter((e) => !e.removed);
      if (this.combo > 0) { this.comboT -= dt; if (this.comboT <= 0) this.combo = 0; }
      this.hpGhost = U.approach(this.hpGhost, this.player.hp, 40 * dt);
      if (this.hpGhost < this.player.hp) this.hpGhost = this.player.hp;
      this.fx.darken = this.player.state === 'ultimate' ? Math.max(0, 1 - Math.abs(this.player.st - 0.35) * 2.5) : Math.max(0, this.fx.darken - dt * 3);
      // camera
      const z = this.level.activeZone;
      let target = this.player.x - T.W * 0.42;
      if (z) target = z.x;
      target = U.clamp(target, 0, this.level.length - T.W);
      this.cam.x = U.lerp(this.cam.x, target, z ? 0.12 : 0.15);
    }
    separate(dt) {
      const es = this.enemies;
      for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) {
        const a = es[i], b = es[j];
        if (!a.alive || !b.alive) continue;
        const dx = b.x - a.x, min = (a.w + b.w) * 0.4;
        if (Math.abs(dx) < min) { const push = (min - Math.abs(dx)) * 4 * dt * (dx < 0 ? -1 : 1); a.x -= push; b.x += push; }
      }
    }

    // ------------------------------------------------------------ events
    banner(text, dur, big) { this.bannerMsg = { text, dur: dur || 1.5, t: 0, big }; }
    addHitstop(ms) { this.hitstop = Math.max(this.hitstop, ms / 1000); }
    addRage(n) {
      const P = this.player;
      P.rage = U.clamp(P.rage + n, 0, P.rageMax);
      if (P.rage >= P.rageMax && !this.rageWasFull) { this.rageWasFull = true; A.play('rageFull'); this.fx.text(P.x, P.y - 130, 'RAGE FULL — SPACE', '#ffd27a', 20, { life: 1.2 }); }
      if (P.rage < P.rageMax) this.rageWasFull = false;
    }
    onPlayerHit(e, r, hit) {
      const fb = this.data.feedback, P = this.player;
      this.addHitstop(fb.hitStopMs);
      this.fx.shake(Math.min(fb.maxShake, r.damage * fb.shakePerDamage));
      const cx = e.x - Math.sign(e.x - P.x) * e.w * 0.3, cy = e.y - e.h * 0.6;
      if (r.blocked) {
        this.fx.sparks(cx, cy, '#9fdcff', 6); A.play('block');
        this.fx.text(e.x, e.y - e.h - 20, r.damage, '#a9b4c8', 20);
        this.addRage(this.data.rage.onBlockedHit);
      } else {
        this.fx.sparks(cx, cy, r.crit ? '#ffffff' : '#ffe08a', hit.heavy ? 16 : 10);
        this.fx.text(e.x, e.y - e.h - 20, r.damage, r.crit ? '#ffd27a' : '#ffffff', r.crit ? 32 : 26);
        A.play(hit.heavy ? 'hitHeavy' : 'hit');
        this.addRage(hit.rage || 4);
      }
      if (r.guardBreak) { this.fx.text(e.x, e.y - e.h - 50, 'GUARD BREAK', '#9fdcff', 24, { life: 1 }); A.play('guardBreak'); this.fx.shake(10); }
      if (r.interrupt) this.fx.text(e.x, e.y - e.h - 50, 'INTERRUPTED', '#ff9ac0', 22, { life: 1 });
      this.combo++; this.comboT = fb.comboResetTime;
      this.stats.maxCombo = Math.max(this.stats.maxCombo, this.combo);
    }
    onPlayerDamaged(dmg) {
      const fb = this.data.feedback, P = this.player;
      this.addHitstop(fb.hitStopMs);
      this.fx.shake(Math.min(fb.maxShake, dmg * fb.shakePerDamage * 1.4));
      this.fx.vignette = 1;
      this.fx.text(P.x, P.y - P.h - 20, '-' + dmg, '#ff6b6b', 26);
      this.fx.sparks(P.x, P.y - 50, '#ff8080', 8);
      this.combo = 0;
      A.play('hurt');
    }
    onParry(hit) {
      const fb = this.data.feedback, P = this.player;
      this.addHitstop(fb.hitStopMs);
      this.slow = { t: fb.parrySlowMoDuration, scale: fb.parrySlowMoScale };
      this.addRage(this.data.rage.onParry);
      this.stats.parries++;
      const cx = P.x + P.facing * 34, cy = hit.kind === 'wave' ? T.GROUND - 20 : P.y - 64;
      this.fx.sparks(cx, cy, '#fff2b0', 22);
      this.fx.ring(cx, cy, 'rgba(255,230,140,', 90, 0.35);
      this.fx.flashScreen('rgba(255,240,200,', 0.12);
      this.fx.shake(8);
      this.fx.text(cx, cy - 40, 'PARRY!', '#fff2b0', 34, { life: 0.9 });
      A.play('parry');
      if (hit.kind === 'melee' && hit.owner) { hit.owner.parried(this); hit.done = true; }
    }
    onPerfectDodge() {
      const P = this.player;
      this.addRage(this.data.rage.onPerfectDodge);
      this.stats.perfectDodges++;
      this.fx.text(P.x, P.y - P.h - 30, 'PERFECT DODGE', '#9fdcff', 20);
    }
    onShieldBlock(hit) {
      const P = this.player;
      this.addHitstop(this.data.feedback.hitStopMs);
      this.fx.sparks(P.x, P.y - 55, '#9fdcff', 14);
      this.fx.ring(P.x, P.y - 55, 'rgba(160,220,255,', 70, 0.3);
      this.fx.text(P.x, P.y - P.h - 30, 'UMAY SHIELDS YOU', '#9fdcff', 20);
      A.play('shield');
    }
    onBlessing() {
      const P = this.player, b = this.data.blessing;
      const heal = Math.round(P.maxHp * b.healPercent);
      P.hp = Math.min(P.maxHp, P.hp + heal);
      P.shield = b.shieldDuration;
      this.fx.sprite('umay', 'bless', P.x - P.facing * 70, P.y + 10, P.facing, 1.0, { scale: 0.75 });
      this.fx.burst('glow', P.x, P.y - 50, 18, { color: '#aee4ff', minSpeed: 40, maxSpeed: 180, g: -200, life: 0.8, minSize: 3, maxSize: 7 });
      this.fx.text(P.x, P.y - P.h - 30, '+' + heal, '#9fffb0', 28);
      A.play('heal');
    }
    onUltimateStart() {
      const P = this.player;
      this.fx.text(P.x, P.y - P.h - 40, this.data.ultimate.name, '#ffd27a', 24, { life: 1.1 });
      this.fx.ring(P.x, P.y - 60, 'rgba(255,220,120,', 140, 0.5);
      A.play('charge');
    }
    ultimateStrike() {
      const u = this.data.ultimate, P = this.player;
      this.fx.flashScreen('rgba(255,245,200,', 0.45);
      this.fx.shake(22);
      A.play('lightning');
      this.fx.lightning(P.x, -20, P.y - 100);
      for (const e of this.enemies) {
        if (!e.canBeHit()) continue;
        if (e.x < this.cam.x - 20 || e.x > this.cam.x + T.W + 20) continue;
        this.fx.lightning(e.x, -20, e.y - e.h * 0.4);
        this.fx.sparks(e.x, e.y - e.h * 0.5, '#fff6c8', 16);
        const wasGuard = e.state === 'guard'; if (wasGuard) e.setState('idle');
        const r = e.receive({ damage: u.damage, kb: 200, guardBreak: true, poiseMul: 3, srcX: e.x - e.facing * 10 }, this);
        if (r) { this.fx.text(e.x, e.y - e.h - 30, r.damage, '#fff2b0', 38); this.combo++; this.comboT = this.data.feedback.comboResetTime; this.stats.maxCombo = Math.max(this.stats.maxCombo, this.combo); }
      }
      for (const pr of this.combat.projectiles) if (pr.owner === 'enemy') pr.dead = true;
      this.combat.waves = [];
    }
    spawnEnemy(type, x, zone) {
      const e = T.createEnemy(type, x, this);
      e.zone = zone || null;
      if (zone) zone.enemies.push(e);
      this.enemies.push(e);
      return e;
    }
    onEnemyKilled(e) {
      this.stats.kills++;
      A.play('death');
      this.fx.smoke(e.x, e.y, 12);
      const n = this.seeds.rollDrop(e, this);
      if (e.isBoss) {
        this.slow = { t: 1.2, scale: 0.25 };
        this.fx.flashScreen('rgba(255,255,255,', 0.4);
        this.fx.shake(20);
      }
      return n;
    }
    onPlayerDeath() { this.showResult('death'); }
    showResult(kind) {
      this.result = { kind, seeds: this.seeds.count, quota: this.seeds.quota };
      this.state = 'result'; this.menuIndex = 0;
      A.stopAmbient();
      if (kind !== 'win') A.play('fail');
    }

    // ------------------------------------------------------------ render
    render() {
      const ctx = this.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, T.W, T.H);
      const sx = this.fx.shakeX, sy = this.fx.shakeY;
      ctx.save(); ctx.translate(sx * 0.3, sy * 0.3);
      this.level.drawBackground(ctx, this.cam);
      ctx.restore();
      ctx.save();
      ctx.translate(Math.round(-this.cam.x + sx), Math.round(sy));
      this.level.drawWorld(ctx, this);
      this.seeds.draw(ctx);
      for (const e of this.enemies) e.draw(ctx, this);
      if (this.state !== 'title' && this.state !== 'select') this.player.draw(ctx);
      this.combat.draw(ctx);
      this.fx.drawWorld(ctx);
      if (this.debug) {
        const b = this.player.body(); ctx.strokeStyle = '#0ff'; ctx.strokeRect(b.x, b.y, b.w, b.h);
        if (this.player.hit) { const h = this.player.hit.box(); ctx.strokeStyle = '#ff0'; ctx.strokeRect(h.x, h.y, h.w, h.h); }
      }
      ctx.restore();
      this.level.drawRain(ctx);
      this.fx.drawScreen(ctx);

      const ui = T.ui;
      if (this.state === 'play' || this.state === 'paused' || this.state === 'result') ui.drawHUD(ctx, this);
      if (this.state === 'title') ui.drawTitle(ctx, this);
      else if (this.state === 'intro') ui.drawIntro(ctx, this);
      else if (this.state === 'paused') ui.drawPause(ctx, this);
      else if (this.state === 'result') ui.drawResult(ctx, this);
      else if (this.state === 'ending') ui.drawEnding(ctx, this);
      else if (this.state === 'select') ui.drawSelect(ctx, this);
      else if (this.state === 'quit') ui.drawQuit(ctx, this);
      if (this.debug) {
        ctx.fillStyle = '#0f0'; ctx.font = '14px monospace'; ctx.textAlign = 'left';
        ctx.fillText(`state ${this.player.state}  x ${this.player.x | 0}  enemies ${this.enemies.length}  slow ${this.slow.scale}`, 16, T.H - 140);
      }
    }
  }

  T.Game = Game;
  window.addEventListener('load', () => { T.game = new Game(document.getElementById('game')); });
})();
