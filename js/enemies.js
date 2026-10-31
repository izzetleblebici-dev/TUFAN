// Enemies: shared base + Gulyabani Spawn, Sorcerer, Stone Brute, Captain (boss)
(function () {
  'use strict';
  const T = window.Tufan, U = T.util;

  class Enemy {
    constructor(type, x, g) {
      const d = g.data.enemies[type];
      this.type = type; this.d = d; this.sprite = d.sprite || type;
      this.x = x; this.y = T.GROUND; this.vx = 0; this.vy = 0;
      this.w = d.width; this.h = d.height;
      this.hp = this.maxHp = d.hp;
      this.facing = -1; this.state = 'spawn'; this.st = 0; this.t = Math.random() * 5;
      this.flash = 0; this.alive = true; this.removed = false; this.invuln = false;
      this.poise = d.poise || 0; this.cd = U.rand(0.4, 1.0);
      this.hit = null; this.atk = null; this.guardHits = 0; this.lastSeenAtk = -1;
      this.isBoss = !!d.boss;
      g.fx.smoke(x, T.GROUND, 14);
    }
    body() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }
    canBeHit() { return this.alive && this.state !== 'spawn' && !this.invuln; }
    setState(s) { this.state = s; this.st = 0; }
    face(px) { this.facing = px > this.x ? 1 : -1; }
    speedMult() { return 1; }
    windupMult() { return 1; }

    startAttack(a, name) {
      this.atk = Object.assign({ name: name || a.name || 'attack' }, a);
      this.atk.windup = (a.windup || 0.3) * this.windupMult();
      this.hit = null;
      this.vx = 0;
      this.setState('windup');
      if (this.atk.cast) T.audio.play('cast');
    }
    beginActive(g) {
      const a = this.atk;
      if (a.onActive) a.onActive.call(this, g);
      if (a.damage && a.range) {
        const self = this;
        this.hit = {
          owner: this, kind: 'melee', damage: a.damage, kb: a.knockback, parryable: a.parryable !== false, done: false, srcX: this.x,
          box() { const f = self.facing; return { x: f > 0 ? self.x - 10 : self.x - a.range + 10, y: self.y - (a.height || self.h), w: a.range, h: a.height || self.h }; },
        };
        T.audio.play(a.damage >= 16 ? 'swingHeavy' : 'swing');
      }
    }
    // Player-facing guard reaction (used by brute and captain)
    tryGuard(g) {
      const P = g.player, gd = this.d.guard;
      if (!gd) return false;
      if ((P.state === 'attack' || P.state === 'heavy') && P.attackId !== this.lastSeenAtk && Math.abs(P.x - this.x) < 190) {
        this.lastSeenAtk = P.attackId;
        if (Math.random() < gd.chance) {
          this.face(P.x); this.setState('guard'); this.guardT = gd.duration; this.guardHits = gd.hits; this.vx = 0;
          return true;
        }
      }
      return false;
    }

    update(dt, g) {
      this.st += dt; this.t += dt; this.flash = Math.max(0, this.flash - dt); this.cd -= dt;
      const P = g.player;
      switch (this.state) {
        case 'spawn': if (this.st > 0.55) this.setState('idle'); break;
        case 'dying': if (this.st > 0.9) this.removed = true; break;
        case 'stunned': if (this.st >= this.stunT) this.setState('idle'); break;
        case 'hurt': if (this.st >= this.hurtT) this.setState('idle'); break;
        case 'guard': if (this.st >= this.guardT) this.setState('idle'); break;
        case 'windup':
          if (this.st < this.atk.windup * 0.6) this.face(P.x);
          if (this.st >= this.atk.windup) { this.setState('active'); this.beginActive(g); }
          break;
        case 'active':
          if (this.atk.lunge) this.vx = this.facing * this.atk.lunge;
          if (!this.atk.manual && this.st >= (this.atk.active || 0.1)) { this.hit = null; this.vx = 0; this.setState('recover'); }
          break;
        case 'recover':
          if (this.st >= (this.atk.recovery || 0.4)) {
            const next = this.atk.next;
            this.atk = null;
            if (next && this.alive) this.startAttack(next, next.name);
            else { this.setState('idle'); this.cd = U.randRange(this.d.attackCooldown); }
          }
          break;
        default:
          if (P.alive) this.think(dt, g); else { this.vx = 0; this.state = 'idle'; }
      }
      this.physics(dt, g);
    }
    physics(dt, g) {
      if (this.state !== 'active' && this.state !== 'move' && !this.knock) this.vx = U.approach(this.vx, 0, 1400 * dt);
      if (this.knock) { this.knock = Math.max(0, this.knock - dt); this.vx = U.approach(this.vx, 0, 1800 * dt); }
      this.vy += 2300 * dt;
      this.x += this.vx * dt; this.y += this.vy * dt;
      this.onGround = false;
      if (this.y >= T.GROUND) { this.y = T.GROUND; this.vy = 0; this.onGround = true; }
      const b = g.bounds;
      this.x = U.clamp(this.x, b.min + this.w / 2, b.max - this.w / 2);
    }
    // ------------------------------------------------------ taking damage
    receive(hit, g) {
      if (!this.canBeHit()) return null;
      const d = this.d;
      let dmg = hit.damage;
      const res = { damage: 0, blocked: false, guardBreak: false, crit: false, interrupt: false };
      const fromFront = Math.sign(hit.srcX - this.x) === this.facing;
      if (this.state === 'guard' && fromFront) {
        if (hit.guardBreak) {
          res.guardBreak = true; dmg *= 1.2;
          this.hit = null; this.atk = null; this.setState('stunned'); this.stunT = d.guard.breakStun;
        } else {
          dmg *= 0.15; res.blocked = true; this.guardHits--;
          if (this.guardHits <= 0) { res.guardBreak = true; this.setState('stunned'); this.stunT = d.guard.breakStun * 0.7; }
        }
      }
      if (this.state === 'stunned' && !res.guardBreak) { dmg *= 1.5; res.crit = true; }
      if (this.state === 'windup' && this.atk && this.atk.cast) {
        dmg *= d.castDamageMultiplier || 1.5; res.crit = true; res.interrupt = true;
        this.atk = null; this.hit = null; this.setState('stunned'); this.stunT = d.interruptStun || 0.8;
      }
      dmg = Math.max(1, Math.round(dmg));
      this.hp -= dmg; res.damage = dmg; this.flash = 0.09;

      // knockback + stagger
      if (!res.blocked) {
        const dir = Math.sign(this.x - hit.srcX) || 1;
        this.vx = dir * (hit.kb || 100) / (d.mass || 1); this.knock = 0.18;
        if (d.poise > 0) {
          this.poise -= dmg * (hit.poiseMul || 1);
          if (this.poise <= 0 && this.state !== 'stunned' && this.state !== 'roar') {
            this.poise = d.poise; this.hit = null; this.atk = null; this.setState('hurt'); this.hurtT = 0.45;
          }
        } else if (this.state !== 'stunned') {
          this.hit = null; this.atk = null; this.setState('hurt'); this.hurtT = 0.28;
        }
      }
      if (this.hp <= 0) this.die(g);
      else this.afterDamage(g);
      return res;
    }
    afterDamage() {}
    parried(g) {
      this.hit = null; this.atk = null; this.vx = 0;
      this.setState('stunned'); this.stunT = g.data.player.parry.enemyStun; this.flash = 0.15;
    }
    die(g) {
      this.alive = false; this.hit = null; this.atk = null; this.hp = 0;
      this.setState('dying');
      g.onEnemyKilled(this);
    }

    // ------------------------------------------------------ drawing
    animInfo() {
      const s = this.state, a = this.atk;
      if (s === 'windup') return { anim: 'attack', phase: 'windup', p: this.st / a.windup, atk: a.name };
      if (s === 'active') return { anim: 'attack', phase: 'active', p: Math.min(1, this.st / (a.active || 0.1)), atk: a.name };
      if (s === 'recover') return { anim: 'attack', phase: 'recover', p: this.st / (a.recovery || 0.4), atk: a.name };
      if (s === 'hurt' || s === 'stunned') return { anim: 'hurt' };
      if (s === 'dying') return { anim: 'death', p: Math.min(1, this.st / 0.8) };
      if (s === 'move') return { anim: 'move' };
      if (s === 'roar') return { anim: 'roar' };
      return { anim: 'idle' };
    }
    draw(ctx, g) {
      const info = this.animInfo();
      const alpha = this.state === 'spawn' ? this.st / 0.55 : this.state === 'dying' ? 1 - this.st / 0.9 : 1;
      T.sprites.draw(ctx, this.sprite, info.anim, this.t, this.x, this.y, this.facing, {
        p: info.p != null ? info.p : null, phase: info.phase, atk: info.atk, flash: this.flash, alpha, phase2: this.phase2,
      });
      const { glow } = T.sprites.helpers;
      // telegraph: gold ✦ = parryable, red ! = dodge it
      if (this.state === 'windup' && this.st > this.atk.windup - 0.32) {
        const parryable = this.atk.parryable !== false && !this.atk.cast;
        const hx = this.x + this.facing * this.w * 0.6, hy = this.y - this.h - 18;
        ctx.font = 'bold 30px serif'; ctx.textAlign = 'center';
        if (this.atk.cast) { ctx.fillStyle = '#ff7aa0'; ctx.fillText('◆', this.x, hy); }
        else if (parryable) { glow(ctx, hx, hy - 10, 30, 'rgba(255,220,110,0.9)', 0.8); ctx.fillStyle = '#fff2b0'; ctx.fillText('✦', hx, hy); }
        else { ctx.fillStyle = '#ff4040'; ctx.fillText('!', hx, hy); }
      }
      if (this.state === 'guard') {
        ctx.strokeStyle = 'rgba(120,200,255,0.8)'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(this.x, this.y - this.h / 2, this.h * 0.6, this.facing > 0 ? -0.9 : Math.PI - 0.9, this.facing > 0 ? 0.9 : Math.PI + 0.9); ctx.stroke();
      }
      if (this.state === 'stunned') {
        ctx.fillStyle = '#ffe28a'; ctx.font = '18px serif'; ctx.textAlign = 'center';
        for (let i = 0; i < 3; i++) { const a = this.t * 5 + i * 2.1; ctx.fillText('★', this.x + Math.cos(a) * 22, this.y - this.h - 14 + Math.sin(a) * 6); }
      }
      // small health bar (boss uses the HUD bar)
      if (!this.isBoss && this.alive && this.hp < this.maxHp) {
        const bw = Math.max(40, this.w), bx = this.x - bw / 2, by = this.y - this.h - 12;
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(bx - 1, by - 1, bw + 2, 6);
        ctx.fillStyle = '#e04848'; ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), 4);
      }
      if (g.debug) {
        const b = this.body(); ctx.strokeStyle = '#0f0'; ctx.lineWidth = 1; ctx.strokeRect(b.x, b.y, b.w, b.h);
        if (this.hit && !this.hit.done) { const hb = this.hit.box(); ctx.strokeStyle = '#f00'; ctx.strokeRect(hb.x, hb.y, hb.w, hb.h); }
      }
    }
  }

  // ---------------------------------------------------------- Gulyabani Spawn
  class Minion extends Enemy {
    think(dt, g) {
      const P = g.player, dist = Math.abs(P.x - this.x), a = this.d.bite;
      this.face(P.x);
      if (dist > a.range - 8) { this.vx = this.facing * this.d.speed; this.state = 'move'; }
      else { this.state = 'idle'; if (this.cd <= 0) this.startAttack(a, 'bite'); }
    }
  }

  // ------------------------------------------------------- Gulyabani Sorcerer
  class Sorcerer extends Enemy {
    think(dt, g) {
      const P = g.player, d = this.d, dist = Math.abs(P.x - this.x);
      this.face(P.x);
      if (!this.summoned && this.hp <= this.maxHp * d.summon.hpThreshold) {
        this.summoned = true;
        this.startAttack(Object.assign({ cast: true, onActive(gm) {
          for (let i = 0; i < d.summon.count; i++) {
            const sx = this.x + (i % 2 ? 1 : -1) * (70 + i * 30);
            gm.spawnEnemy('minion', sx, this.zone);
          }
          gm.fx.text(this.x, this.y - this.h - 30, 'SUMMON', '#ff7aa0', 22);
        } }, d.summon), 'summon');
        return;
      }
      const [near, far] = d.preferredRange;
      const b = g.bounds;
      const cornered = (this.x < b.min + 80 && P.x > this.x) || (this.x > b.max - 80 && P.x < this.x);
      if (dist < near && !cornered) { this.vx = -this.facing * d.speed; this.state = 'move'; }
      else if (dist > far) { this.vx = this.facing * d.speed; this.state = 'move'; }
      else { this.state = 'idle'; }
      if (this.cd <= 0 && dist < 950) {
        const bolt = d.bolt;
        this.startAttack(Object.assign({ cast: true, onActive(gm) {
          const sx = this.x + this.facing * 40, sy = this.y - 90;
          const tx = gm.player.x, ty = gm.player.y - 50;
          const ang = Math.atan2(ty - sy, tx - sx);
          gm.combat.spawnProjectile({ x: sx, y: sy, vx: Math.cos(ang) * bolt.projectileSpeed, vy: Math.sin(ang) * bolt.projectileSpeed, damage: bolt.damage, kb: bolt.knockback, parryable: bolt.parryable, owner: 'enemy' });
          T.audio.play('bolt');
        } }, bolt), 'cast');
      }
    }
  }

  // ------------------------------------------------------------- Stone Brute
  class Brute extends Enemy {
    constructor(type, x, g) { super(type, x, g); this.quakeCd = 1.5; }
    think(dt, g) {
      const P = g.player, d = this.d, dist = Math.abs(P.x - this.x);
      this.quakeCd -= dt;
      this.face(P.x);
      if (this.tryGuard(g)) return;
      if (this.cd <= 0) {
        if (dist < d.claw.range - 10) { this.startAttack(d.claw, 'claw'); return; }
        if (dist >= d.quake.minRange && dist < 750 && this.quakeCd <= 0) {
          const q = d.quake;
          this.quakeCd = q.cooldown;
          this.startAttack(Object.assign({ parryable: false, onActive(gm) {
            for (const dir of [-1, 1]) gm.combat.spawnWave({ x: this.x + dir * 40, dir, speed: q.waveSpeed, range: q.waveRange, damage: q.damage, kb: q.knockback, parryable: q.parryable });
            gm.fx.shake(12); gm.fx.dust(this.x, T.GROUND, 16); T.audio.play('quake');
          } }, q), 'quake');
          return;
        }
      }
      if (dist > d.claw.range - 20) { this.vx = this.facing * d.speed; this.state = 'move'; }
      else this.state = 'idle';
    }
  }

  // ----------------------------------------------------------- Centaur Archer
  // Mounted archer: keeps its distance, retreats when approached, fires arcing arrows.
  class Centaur extends Enemy {
    think(dt, g) {
      const P = g.player, d = this.d, dist = Math.abs(P.x - this.x);
      this.face(P.x);
      const [near, far] = d.preferredRange, b = g.bounds;
      const cornered = (this.x < b.min + 90 && P.x > this.x) || (this.x > b.max - 90 && P.x < this.x);
      if (dist < near && !cornered) { this.vx = -this.facing * d.speed; this.state = 'move'; }
      else if (dist > far) { this.vx = this.facing * d.speed * 0.7; this.state = 'move'; }
      else this.state = 'idle';
      if (this.cd <= 0 && dist < 950 && (dist >= near * 0.6 || cornered)) {
        const sh = d.shot;
        this.startAttack(Object.assign({ onActive(gm) {
          const sx = this.x + this.facing * 50, sy = this.y - 120;
          const tx = gm.player.x, ty = gm.player.y - 50;
          const T2 = U.clamp(Math.abs(tx - sx) / 620, 0.55, 1.3), gr = sh.arrowGravity;
          const vx = (tx - sx) / T2, vy = (ty - sy - 0.5 * gr * T2 * T2) / T2;
          gm.combat.spawnProjectile({ x: sx, y: sy, vx, vy, g: gr, arrow: true, r: 10, damage: sh.damage, kb: sh.knockback, parryable: sh.parryable, owner: 'enemy' });
          T.audio.play('swing');
        } }, sh), 'shot');
      }
    }
  }

  // --------------------------------------------------------------- Centaur Khan
  // Boss of Mısır: arrow volleys from range, a galloping charge up close, faster in phase 2.
  class Khan extends Enemy {
    constructor(type, x, g) { super(type, x, g); this.chargeCd = 2; this.phase2 = false; }
    windupMult() { return this.phase2 ? 0.8 : 1; }
    afterDamage(g) {
      if (!this.phase2 && this.hp <= this.maxHp * this.d.phase2At) {
        this.phase2 = true;
        g.fx.text(this.x, this.y - this.h - 40, 'PHASE 2', '#ffcc50', 34, { life: 1.2 });
        g.banner(this.d.name + ' rages — more arrows, faster charges!', 2.2);
        T.audio.play('roar'); g.fx.shake(12);
      }
    }
    think(dt, g) {
      const P = g.player, d = this.d, dist = Math.abs(P.x - this.x);
      this.chargeCd -= dt;
      this.face(P.x);
      const [near, far] = d.preferredRange, b = g.bounds;
      const cornered = (this.x < b.min + 110 && P.x > this.x) || (this.x > b.max - 110 && P.x < this.x);
      if (this.cd <= 0 && dist < 260 && this.chargeCd <= 0) {
        this.chargeCd = d.charge.cooldown * (this.phase2 ? 0.7 : 1);
        this.startAttack(d.charge, 'charge'); return;
      }
      if (dist < near && !cornered) { this.vx = -this.facing * d.speed; this.state = 'move'; }
      else if (dist > far) { this.vx = this.facing * d.speed * 0.7; this.state = 'move'; }
      else this.state = 'idle';
      if (this.cd <= 0 && dist < 1000) {
        const sh = d.shot, n = this.phase2 ? sh.volleyPhase2 : sh.volley;
        this.startAttack(Object.assign({ onActive(gm) {
          const sx = this.x + this.facing * 60, sy = this.y - 170;
          for (let i = 0; i < n; i++) {
            const off = (i - (n - 1) / 2) * sh.spread;
            const tx = gm.player.x + off, ty = gm.player.y - 50;
            const T2 = U.clamp(Math.abs(tx - sx) / 620, 0.55, 1.4), gr = sh.arrowGravity;
            const vx = (tx - sx) / T2, vy = (ty - sy - 0.5 * gr * T2 * T2) / T2;
            gm.combat.spawnProjectile({ x: sx, y: sy, vx, vy, g: gr, arrow: true, r: 10, damage: sh.damage, kb: sh.knockback, parryable: sh.parryable, owner: 'enemy' });
          }
          T.audio.play('swingHeavy');
        } }, sh), 'shot');
      }
    }
  }

  // --------------------------------------------------------- Gulyabani Captain
  class Captain extends Enemy {
    constructor(type, x, g) {
      super(type, x, g);
      this.phase2 = false; this.lungeCd = 2; this.slamCd = 1.5;
      const d = this.d;
      this.combo = Object.assign({}, d.slash, { name: 'slash', next: Object.assign({}, d.slash2, { name: 'slash2' }) });
    }
    speedMult() { return this.phase2 ? this.d.phase2SpeedMultiplier : 1; }
    windupMult() { return this.phase2 ? this.d.phase2WindupMultiplier : 1; }
    afterDamage(g) {
      if (!this.phase2 && this.hp <= this.maxHp * this.d.phase2At) {
        this.hit = null; this.atk = null; this.invuln = true; this.vx = 0;
        this.setState('roar'); this.roared = false;
      }
    }
    update(dt, g) {
      if (this.state === 'roar') {
        this.st += dt; this.t += dt; this.flash = Math.max(0, this.flash - dt);
        if (!this.roared && this.st > 0.35) {
          this.roared = true; this.phase2 = true;
          g.fx.shake(16); g.fx.ring(this.x, this.y - 60, 'rgba(255,60,60,', 320, 0.6); g.fx.flashScreen('rgba(255,40,40,', 0.25);
          g.fx.text(this.x, this.y - this.h - 40, 'PHASE 2', '#ff5050', 34, { life: 1.2 });
          T.audio.play('roar');
          const P = g.player;
          if (Math.abs(P.x - this.x) < 300 && P.alive) { P.vx = Math.sign(P.x - this.x || 1) * 700; P.vy = -300; P.onGround = false; }
          g.banner(this.d.name + ' is enraged — watch for the ground slam!', 2.2);
        }
        if (this.st > 1.3) { this.invuln = false; this.setState('idle'); this.cd = 0.4; }
        this.physics(dt, g);
        return;
      }
      if (this.state === 'active' && this.atk && this.atk.name === 'slam') {
        this.st += dt; this.t += dt; this.flash = Math.max(0, this.flash - dt);
        this.vy += 2300 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
        const b = g.bounds; this.x = U.clamp(this.x, b.min + this.w / 2, b.max - this.w / 2);
        if (this.y >= T.GROUND && this.st > 0.15) { this.y = T.GROUND; this.vy = 0; this.vx = 0; this.slamImpact(g); }
        return;
      }
      super.update(dt, g);
    }
    slamImpact(g) {
      const s = this.d.slam, P = g.player;
      g.fx.shake(18); g.fx.dust(this.x, T.GROUND, 24); g.fx.ring(this.x, T.GROUND - 10, 'rgba(255,140,80,', s.radius * 1.4, 0.4);
      T.audio.play('quake');
      if (Math.abs(P.x - this.x) < s.radius && P.y > T.GROUND - 70) {
        P.receive({ owner: this, kind: 'slam', damage: s.damage, kb: s.knockback, parryable: false, srcX: this.x }, g);
      }
      for (const dir of [-1, 1]) g.combat.spawnWave({ x: this.x + dir * 50, dir, speed: s.waveSpeed, range: s.waveRange, damage: s.waveDamage, kb: 300, parryable: true });
      this.setState('recover');
    }
    think(dt, g) {
      const P = g.player, d = this.d, dist = Math.abs(P.x - this.x);
      this.lungeCd -= dt; this.slamCd -= dt;
      this.face(P.x);
      if (this.tryGuard(g)) return;
      if (this.cd <= 0) {
        if (this.phase2 && this.slamCd <= 0 && dist < 700) {
          this.slamCd = d.slam.cooldown;
          const self = this;
          this.startAttack(Object.assign({ manual: true, parryable: false, onActive(gm) {
            const tx = U.clamp(gm.player.x, gm.bounds.min + 60, gm.bounds.max - 60);
            self.vy = -1050; self.vx = (tx - self.x) / 0.85; self.slamTarget = tx;
            gm.fx.dust(self.x, T.GROUND, 10);
          } }, d.slam), 'slam');
          return;
        }
        if (dist < d.slash.range - 10) { this.startAttack(this.combo, 'slash'); return; }
        if (dist < 650 && this.lungeCd <= 0) { this.lungeCd = d.lunge.cooldown; this.startAttack(d.lunge, 'lunge'); return; }
      }
      if (dist > d.slash.range - 25) { this.vx = this.facing * d.speed * this.speedMult(); this.state = 'move'; }
      else this.state = 'idle';
    }
    draw(ctx, g) {
      if (this.state === 'active' && this.atk && this.atk.name === 'slam' && this.slamTarget != null) {
        ctx.fillStyle = 'rgba(255,60,40,0.35)';
        ctx.beginPath(); ctx.ellipse(this.slamTarget, T.GROUND, this.d.slam.radius, 14, 0, 0, Math.PI * 2); ctx.fill();
      }
      super.draw(ctx, g);
    }
  }

  const CLASSES = { minion: Minion, sorcerer: Sorcerer, brute: Brute, captain: Captain, erlik_final: Captain, centaur: Centaur, khan: Khan };
  T.createEnemy = (type, x, g) => new (CLASSES[type] || Enemy)(type, x, g);
  T.Enemy = Enemy;
})();
