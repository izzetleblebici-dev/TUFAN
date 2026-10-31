// Geser — player character: movement, combos, heavy, dodge, parry, blessing, ultimate
(function () {
  'use strict';
  const T = window.Tufan, U = T.util;
  const FREE = new Set(['idle', 'run', 'jump', 'fall']);

  class Player {
    constructor(data, x) {
      this.data = data; this.d = data.player;
      this.x = x; this.y = T.GROUND; this.vx = 0; this.vy = 0;
      this.w = this.d.width; this.h = this.d.height;
      this.facing = 1; this.onGround = true;
      this.maxHp = this.d.maxHp; this.hp = this.maxHp;
      this.rage = 0; this.rageMax = data.rage.max;
      this.state = 'idle'; this.st = 0; this.t = 0;
      this.comboStep = 0; this.queued = false; this.atk = null; this.curHit = null; this.hit = null;
      this.attackId = 0;
      this.jumps = 1; this.coyote = 0; this.jumpCut = true; this.dropT = 0; this.airDodge = true;
      this.dodgeCd = 0; this.healCd = 0; this.parryLock = 0; this.shield = 0; this.iframes = 0;
      this.locked = false; this.deathReported = false; this.effectDone = false;
    }
    get alive() { return this.state !== 'dead'; }
    body() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }
    setState(s) { this.state = s; this.st = 0; this.effectDone = false; }

    // ------------------------------------------------------------ actions
    startAttack(step, g) {
      const I = T.input;
      const dir = (I.held('right') ? 1 : 0) - (I.held('left') ? 1 : 0);
      if (dir) this.facing = dir;
      this.comboStep = step;
      this.atk = this.d.light[step];
      this.queued = false;
      this.setState('attack');
      this.attackId++;
      this.makeHit(this.atk, false);
      if (this.onGround) this.vx = this.facing * this.atk.lunge;
      T.audio.play('swing');
    }
    startHeavy() {
      const I = T.input;
      const dir = (I.held('right') ? 1 : 0) - (I.held('left') ? 1 : 0);
      if (dir) this.facing = dir;
      this.atk = this.d.heavy;
      this.setState('heavy');
      this.attackId++;
      this.makeHit(this.atk, true);
    }
    makeHit(a, heavy) {
      const self = this;
      this.curHit = {
        damage: a.damage, kb: a.knockback, rage: a.rage, heavy,
        guardBreak: !!a.guardBreak, poiseMul: a.poiseMultiplier || 1, hitSet: new Set(),
        box() {
          const f = self.facing;
          return { x: f > 0 ? self.x - 12 : self.x - a.range + 12, y: self.y - a.height - 8, w: a.range, h: a.height + 8 };
        },
      };
    }

    tryActions(g, free) {
      const I = T.input, d = this.d, buf = d.inputBuffer, s = this.state;
      const recovering = (s === 'attack' && this.st >= this.atk.startup + this.atk.active) ||
                         (s === 'heavy' && this.st >= this.atk.startup + this.atk.active + 0.08);
      if (!free && !recovering) return false;

      if (this.rage >= this.rageMax && I.consume('ult', buf)) {
        this.rage = 0; this.setState('ultimate'); this.vx = 0; this.vy = Math.min(this.vy, 0);
        g.onUltimateStart(); return true;
      }
      if (this.healCd <= 0 && I.consume('heal', buf)) {
        this.setState('blessing'); this.healCd = g.data.blessing.cooldown; return true;
      }
      if (this.dodgeCd <= 0 && (this.onGround || this.airDodge) && I.consume('dodge', buf)) {
        const dir = (I.held('right') ? 1 : 0) - (I.held('left') ? 1 : 0);
        this.dodgeDir = dir || this.facing; this.facing = this.dodgeDir;
        if (!this.onGround) this.airDodge = false;
        this.setState('dodge'); this.iframes = d.dodge.iframes; this.vy = 0;
        g.addRage(g.data.rage.onDodge);
        g.fx.dust(this.x, this.y, 5, -this.dodgeDir); T.audio.play('dodge');
        return true;
      }
      if (this.parryLock <= 0 && I.consume('parry', buf)) {
        this.setState('parry'); this.parried = false; return true;
      }
      if (I.consume('heavy', buf)) { this.startHeavy(); return true; }
      if (free && I.consume('light', buf)) { this.startAttack(0, g); return true; }
      return false;
    }

    // ------------------------------------------------------------ update
    update(dt, g) {
      const I = T.input, d = this.d;
      this.st += dt; this.t += dt;
      this.iframes = Math.max(0, this.iframes - dt);
      this.dodgeCd = Math.max(0, this.dodgeCd - dt);
      this.healCd = Math.max(0, this.healCd - dt);
      this.parryLock = Math.max(0, this.parryLock - dt);
      this.shield = Math.max(0, this.shield - dt);
      this.dropT = Math.max(0, this.dropT - dt);
      if (this.onGround) { this.coyote = d.coyoteTime; this.airDodge = true; this.jumps = d.doubleJump ? 1 : 0; }
      else this.coyote -= dt;

      let dir = (I.held('right') ? 1 : 0) - (I.held('left') ? 1 : 0);
      if (this.locked) dir = 0;
      this.hit = null;

      if (this.state === 'dead') {
        this.physics(dt, g, 0);
        if (this.st > 1.6 && !this.deathReported) { this.deathReported = true; g.onPlayerDeath(); }
        return;
      }

      let free = FREE.has(this.state);
      if (!this.locked && this.tryActions(g, free)) free = FREE.has(this.state);

      switch (this.state) {
        case 'attack': {
          const a = this.atk;
          if (I.consume('light', d.inputBuffer)) this.queued = true;
          if (this.st >= a.startup && this.st < a.startup + a.active) {
            this.hit = this.curHit;
            if (!this.effectDone) {
              this.effectDone = true;
              const arcs = [[-2.2, 0.7], [0.9, -1.9], [-0.25, 0.25]];
              const [a0, a1] = arcs[this.comboStep];
              g.fx.slash(this.x + this.facing * 14, this.y - 62, this.facing, this.comboStep === 2 ? 92 : 74, a0, a1);
            }
          }
          if (this.st >= a.startup + a.active && this.queued && this.comboStep < 2) { this.startAttack(this.comboStep + 1, g); break; }
          if (this.st >= a.startup + a.active + a.recovery) this.setState(this.onGround ? 'idle' : 'fall');
          break;
        }
        case 'heavy': {
          const a = this.atk;
          if (this.st >= a.startup * 0.6 && !this.chargeSnd) { this.chargeSnd = true; T.audio.play('swingHeavy'); }
          if (this.st >= a.startup && this.st < a.startup + a.active) {
            this.hit = this.curHit;
            if (!this.effectDone) {
              this.effectDone = true;
              if (this.onGround) this.vx = this.facing * a.lunge;
              g.fx.slash(this.x + this.facing * 10, this.y - 70, this.facing, 104, -2.9, 1.0, 'rgba(120,210,255,', 16);
              g.fx.shake(4);
            }
          }
          if (this.st >= a.startup + a.active + a.recovery) { this.chargeSnd = false; this.setState(this.onGround ? 'idle' : 'fall'); }
          break;
        }
        case 'dodge':
          if (this.st >= d.dodge.duration) { this.dodgeCd = d.dodge.cooldown; this.setState(this.onGround ? 'idle' : 'fall'); }
          else if (Math.random() < 0.5) g.fx.add({ type: 'sprite', name: 'geser', anim: 'dodge', x: this.x, y: this.y, facing: this.facing, life: 0.18, o: { tint: 'rgba(120,190,255,0.6)', alpha: 0.4 } });
          break;
        case 'parry':
          if (this.st >= d.parry.duration) { this.parryLock = d.parry.missLockout; this.setState(this.onGround ? 'idle' : 'fall'); }
          break;
        case 'hurt':
          if (this.st >= d.hurt.stun) this.setState(this.onGround ? 'idle' : 'fall');
          break;
        case 'blessing':
          if (!this.effectDone && this.st >= 0.15) { this.effectDone = true; g.onBlessing(); }
          if (this.st >= g.data.blessing.castTime) this.setState('idle');
          break;
        case 'ultimate': {
          const u = g.data.ultimate;
          if (!this.effectDone && this.st >= u.strikeAt) { this.effectDone = true; g.ultimateStrike(); }
          if (this.st >= u.castTime) { this.setState('idle'); this.iframes = 0.3; }
          break;
        }
      }

      // jumping (free states only)
      if (FREE.has(this.state) && !this.locked && I.consume('jump', d.inputBuffer)) {
        if (I.held('down') && this.onGround && this.y < T.GROUND - 1) { this.dropT = 0.25; this.y += 2; this.onGround = false; }
        else if (this.coyote > 0) { this.vy = -d.jumpVelocity; this.coyote = 0; this.jumpCut = false; this.onGround = false; g.fx.dust(this.x, this.y, 4); T.audio.play('jump'); }
        else if (this.jumps > 0) { this.jumps--; this.vy = -d.doubleJumpVelocity; this.jumpCut = false; g.fx.ring(this.x, this.y - 10, 'rgba(180,220,255,', 40, 0.25); T.audio.play('jump'); }
      }
      if (!this.jumpCut && !I.held('jump') && this.vy < -250) { this.vy *= 0.5; this.jumpCut = true; }

      this.physics(dt, g, dir);

      // free-state animation selection
      if (FREE.has(this.state)) {
        this.state = this.onGround ? (Math.abs(this.vx) > 25 ? 'run' : 'idle') : this.vy < 0 ? 'jump' : 'fall';
      }
    }

    physics(dt, g, dir) {
      const d = this.d, s = this.state;
      const noGrav = (s === 'dodge' && !this.onGround) || (s === 'ultimate' && !this.onGround && this.st < 0.6);
      if (!noGrav) this.vy += d.gravity * (this.vy > 0 ? 1.3 : 1) * dt;
      else this.vy = 0;
      this.vy = Math.min(this.vy, 1500);

      if (FREE.has(s)) {
        const accel = this.onGround ? d.accelGround : d.accelAir;
        this.vx = U.approach(this.vx, dir * d.speed, accel * dt);
        if (dir) this.facing = dir;
      } else if (s === 'dodge') {
        this.vx = this.dodgeDir * d.dodge.speed * (this.st < d.dodge.duration * 0.7 ? 1 : 0.45);
      } else {
        this.vx = U.approach(this.vx, 0, (this.onGround ? 2000 : 600) * dt);
      }

      const prevY = this.y;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      const b = g.bounds;
      this.x = U.clamp(this.x, b.min + this.w / 2, b.max - this.w / 2);

      const wasAir = !this.onGround;
      this.onGround = false;
      if (this.y >= T.GROUND) { this.y = T.GROUND; this.vy = 0; this.onGround = true; }
      else if (this.vy >= 0 && this.dropT <= 0) {
        for (const p of g.level.platforms) {
          if (prevY <= p.y + 1 && this.y >= p.y && this.x > p.x - 6 && this.x < p.x + p.w + 6) {
            this.y = p.y; this.vy = 0; this.onGround = true; break;
          }
        }
      }
      if (wasAir && this.onGround && prevY < this.y - 0.1 + 0) g.fx.dust(this.x, this.y, 3);
    }

    // ------------------------------------------------------------ damage
    // Returns 'parried' | 'dodged' | 'shield' | 'hit' | 'immune' | null
    receive(hit, g) {
      if (this.state === 'dead') return null;
      if (this.state === 'ultimate') return 'immune';
      if (this.state === 'parry' && this.st <= this.d.parry.window && hit.parryable) {
        const dx = hit.srcX - this.x;
        if (Math.sign(dx) === this.facing || Math.abs(dx) < 26) {
          g.onParry(hit);
          this.setState('idle'); this.iframes = 0.22;
          return 'parried';
        }
      }
      if (this.iframes > 0) {
        if (this.state === 'dodge' && !hit.perfectDodged) { hit.perfectDodged = true; g.onPerfectDodge(); }
        return 'dodged';
      }
      if (this.shield > 0) {
        this.shield = 0; this.iframes = 0.4;
        g.onShieldBlock(hit);
        return 'shield';
      }
      this.hp = Math.max(0, this.hp - hit.damage);
      const dir = Math.sign(this.x - hit.srcX) || -this.facing;
      this.vx = dir * (hit.kb || this.d.hurt.knockback);
      this.vy = -260; this.onGround = false;
      g.onPlayerDamaged(hit.damage, hit);
      if (this.hp <= 0) { this.setState('dead'); this.vx *= 0.5; }
      else { this.setState('hurt'); this.iframes = this.d.hurt.iframes; }
      return 'hit';
    }

    // ------------------------------------------------------------ draw
    draw(ctx) {
      let anim = this.state, p = null;
      const s = this.state;
      if (s === 'attack') { anim = 'attack' + (this.comboStep + 1); const a = this.atk; p = this.st / (a.startup + a.active + a.recovery); }
      else if (s === 'heavy') { const a = this.atk; p = this.st / (a.startup + a.active + a.recovery); }
      else if (s === 'dodge') p = this.st / this.d.dodge.duration;
      else if (s === 'dead') { anim = 'death'; p = Math.min(1, this.st / 0.8); }
      else if (s === 'ultimate') p = this.st / 1.0;
      else if (s === 'blessing' || s === 'parry' || s === 'hurt') p = Math.min(1, this.st / 0.4);
      const blink = this.iframes > 0 && (s === 'hurt' || FREE.has(s)) && Math.floor(this.t * 20) % 2 === 0;
      T.sprites.draw(ctx, 'geser', anim, this.t, this.x, this.y, this.facing, {
        p, alpha: s === 'dodge' ? 0.55 : blink ? 0.45 : 1, shield: this.shield > 0,
      });
      if (s === 'parry' && this.st <= this.d.parry.window) {
        const { glow } = T.sprites.helpers;
        glow(ctx, this.x + this.facing * 26, this.y - 66, 40, 'rgba(255,230,140,0.9)', 0.7);
      }
    }
  }
  T.Player = Player;
})();
