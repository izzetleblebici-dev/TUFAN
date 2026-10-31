// HUD and screens (title, intro, pause, results, ending)
(function () {
  'use strict';
  const T = window.Tufan, U = T.util;
  const SERIF = 'Georgia, "Times New Roman", serif';
  const GOLD = '#f2c14e';

  function panel(ctx, x, y, w, h, a) {
    ctx.fillStyle = `rgba(8,16,40,${a == null ? 0.82 : a})`; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.strokeStyle = 'rgba(242,193,78,0.35)'; ctx.strokeRect(x + 5.5, y + 5.5, w - 11, h - 11);
  }
  function bar(ctx, x, y, w, h, k, c1, c2, ghost) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    if (ghost != null) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x, y, w * ghost, h); }
    const gr = ctx.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
    ctx.fillStyle = gr; ctx.fillRect(x, y, w * U.clamp(k, 0, 1), h);
    ctx.strokeStyle = 'rgba(242,193,78,0.8)'; ctx.lineWidth = 1; ctx.strokeRect(x - 2.5, y - 2.5, w + 5, h + 5);
  }
  function text(ctx, s, x, y, size, color, align, weight) {
    ctx.font = `${weight || 'bold'} ${size}px ${SERIF}`; ctx.textAlign = align || 'left';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.strokeText(s, x, y);
    ctx.fillStyle = color || '#fff'; ctx.fillText(s, x, y);
  }
  function wrap(ctx, s, x, y, maxW, lh, size, color, align) {
    ctx.font = `${size}px ${SERIF}`; ctx.textAlign = align || 'left'; ctx.fillStyle = color || '#fff';
    const words = s.split(' '); let line = '', yy = y;
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; }
      else line = test;
    }
    if (line) ctx.fillText(line, x, yy);
    return yy;
  }

  const UI = (T.ui = {
    // Menu: returns item rects for mouse picking
    menu(ctx, items, index, cx, y) {
      const rects = [];
      items.forEach((it, i) => {
        const yy = y + i * 64, sel = i === index, w = 340, h = 50;
        const r = { x: cx - w / 2, y: yy - 34, w, h };
        rects.push(r);
        ctx.fillStyle = sel ? 'rgba(242,193,78,0.22)' : 'rgba(8,16,40,0.6)'; ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = sel ? GOLD : 'rgba(242,193,78,0.35)'; ctx.lineWidth = 2; ctx.strokeRect(r.x, r.y, r.w, r.h);
        text(ctx, (sel ? '◆  ' : '') + it + (sel ? '  ◆' : ''), cx, yy, 26, sel ? '#fff4d6' : '#c9d3ea', 'center');
      });
      return rects;
    },

    drawHUD(ctx, g) {
      const P = g.player, lv = g.level, d = g.data;
      // ---- top-left: health + rage
      text(ctx, 'HP', 24, 40, 18, '#ffd9d9');
      bar(ctx, 64, 26, 300, 18, P.hp / P.maxHp, '#ff6b6b', '#a81e2a', g.hpGhost / P.maxHp);
      text(ctx, `${Math.ceil(P.hp)}/${P.maxHp}`, 370, 41, 15, '#fff');
      if (P.shield > 0) text(ctx, '🛡 Shield', 440, 41, 15, '#9fdcff');
      const full = P.rage >= P.rageMax;
      text(ctx, 'RAGE', 14, 72, 14, '#ffd27a');
      const pulse = full ? 0.5 + Math.sin(performance.now() / 120) * 0.5 : 0;
      bar(ctx, 64, 60, 240, 12, P.rage / P.rageMax, full ? `rgb(255,${200 + pulse * 55},${120 + pulse * 100})` : '#ffb347', '#c45a12');
      if (full) text(ctx, 'SPACE', 314, 72, 14, '#fff2b0');

      // ---- top-right: level, seeds, mission
      const rx = T.W - 24;
      text(ctx, lv.def.name, rx, 40, 24, '#fff4d6', 'right');
      const met = g.seeds.count >= g.seeds.quota;
      const sc = 1 + g.seeds.pulse * 0.25;
      ctx.save(); ctx.translate(rx, 72); ctx.scale(sc, sc);
      text(ctx, `${d.text.seeds} ${g.seeds.count}/${g.seeds.quota}`, 0, 0, 20, met ? '#b9ff8a' : '#e9f5c8', 'right');
      ctx.restore();
      T.sprites.draw(ctx, 'seed', 'idle', performance.now() / 1000, rx - 150 - (g.seeds.count >= 10 ? 12 : 0), 65, 1, {});
      text(ctx, (lv.missionDone ? '✓ ' : '◇ ') + lv.missionText(), rx, 100, 16, lv.missionDone ? '#b9ff8a' : '#c9d3ea', 'right', '600');

      // ---- bottom-left: portrait, Umay cooldown, ultimate
      const by = T.H - 70;
      ctx.save();
      ctx.beginPath(); ctx.arc(60, by, 40, 0, Math.PI * 2); ctx.fillStyle = 'rgba(8,16,40,0.85)'; ctx.fill();
      ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.stroke(); ctx.clip();
      T.sprites.draw(ctx, 'geser', 'idle', 0, 58, by + 122, 1, { scale: 1.0, noShadow: true });
      ctx.restore();
      this.icon(ctx, 140, by + 10, 'E', 'Umay', 1 - P.healCd / d.blessing.cooldown, P.healCd > 0 ? Math.ceil(P.healCd) + '' : null, '#9fdcff');
      this.icon(ctx, 210, by + 10, 'SPACE', 'Ultimate', P.rage / P.rageMax, null, '#ffd27a', full);

      // ---- bottom-center: combo counter
      if (g.combo >= 2) {
        const k = U.clamp(g.comboT / d.feedback.comboResetTime, 0, 1);
        ctx.globalAlpha = 0.4 + k * 0.6;
        text(ctx, `${g.combo}`, T.W / 2, T.H - 52, 44 + Math.min(20, g.combo), '#fff2b0', 'center');
        text(ctx, 'COMBO', T.W / 2, T.H - 24, 16, GOLD, 'center');
        ctx.globalAlpha = 1;
      }

      // ---- boss bar
      const boss = g.enemies.find((e) => e.isBoss && e.alive);
      if (boss) {
        const w = 560, x = T.W / 2 - w / 2;
        text(ctx, boss.d.name + (boss.phase2 ? '  — Phase 2' : ''), T.W / 2, 138, 20, boss.phase2 ? '#ff8a8a' : '#fff4d6', 'center');
        bar(ctx, x, 148, w, 14, boss.hp / boss.maxHp, '#b44cff', '#4a1170');
        ctx.fillStyle = '#fff'; ctx.fillRect(x + w * boss.d.phase2At - 1, 146, 2, 18);
      }

      // ---- banner
      if (g.bannerMsg) {
        const b = g.bannerMsg, a = U.clamp(Math.min(b.t / 0.15, (b.dur - b.t) / 0.3), 0, 1);
        ctx.globalAlpha = a;
        ctx.font = `bold ${b.big ? 40 : 28}px ${SERIF}`;
        const w = ctx.measureText(b.text).width + 80;
        panel(ctx, T.W / 2 - w / 2, 190, w, b.big ? 70 : 56, 0.7);
        text(ctx, b.text, T.W / 2, b.big ? 238 : 228, b.big ? 40 : 28, b.big ? '#ffb0b0' : '#fff4d6', 'center');
        ctx.globalAlpha = 1;
      }
      if (T.audio.muted) text(ctx, 'muted (M)', T.W - 24, T.H - 20, 14, '#aaa', 'right');
    },
    icon(ctx, x, y, key, label, k, num, color, ready) {
      const r = 26;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(8,16,40,0.85)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * U.clamp(k, 0, 1)); ctx.closePath();
      ctx.fillStyle = color + (k >= 1 ? 'cc' : '55'); ctx.fill();
      ctx.strokeStyle = k >= 1 ? '#fff' : GOLD; ctx.lineWidth = ready ? 4 : 2; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
      text(ctx, num || key, x, y + 6, num ? 20 : key.length > 1 ? 11 : 18, '#fff', 'center');
      text(ctx, label, x, y + r + 18, 12, '#c9d3ea', 'center', '600');
    },

    // ------------------------------------------------------------ screens
    drawTitle(ctx, g) {
      ctx.fillStyle = 'rgba(4,10,30,0.45)'; ctx.fillRect(0, 0, T.W, T.H);
      const t = performance.now() / 1000;
      ctx.save(); ctx.shadowColor = 'rgba(255,210,110,0.8)'; ctx.shadowBlur = 30;
      text(ctx, g.data.text.title, T.W / 2, 220, 120, GOLD, 'center');
      ctx.restore();
      text(ctx, g.data.text.subtitle, T.W / 2, 268, 22, '#c9d3ea', 'center', '600');
      T.sprites.draw(ctx, 'geser', 'idle', t, 230, 600, 1, { scale: 1.5 });
      T.sprites.draw(ctx, 'erlik', 'idle', t, 1060, 600, -1, { scale: 1.2 });
      g.menuRects = this.menu(ctx, g.menuItems(), g.menuIndex, T.W / 2, 350);
      this.controls(ctx, 560);
      text(ctx, 'If keys don\'t respond, click the game once.', T.W / 2, 700, 13, '#7d869c', 'center', '600');
    },
    controls(ctx, y) {
      const rows = [
        'A D Move    W Jump    S Down    X Light attack    Left click Heavy attack    Shift Dodge',
        'Q Parry    Right click Umay\'s blessing    Space Ultimate    Esc Pause    M Mute',
        'Gamepad: A jump · X light · Y heavy · B dodge · LB parry · RB heal · Triggers ultimate',
      ];
      rows.forEach((r, i) => text(ctx, r, T.W / 2, y + i * 26, 16, '#aebbd8', 'center', '600'));
    },
    drawIntro(ctx, g) {
      const lines = g.level.def.briefing || [];
      const step = Math.min(g.introStep, lines.length - 1);
      const line = lines[step];
      ctx.fillStyle = 'rgba(4,10,30,0.55)'; ctx.fillRect(0, 0, T.W, T.H);
      const t = performance.now() / 1000;
      const speaker = line ? line.speaker : 'Ülgen';
      const isUmay = speaker === 'Umay';
      T.sprites.draw(ctx, isUmay ? 'umay' : 'ulgen', isUmay ? 'bless' : 'idle', t, 250, 560 + Math.sin(t * 2) * 6, 1, { scale: 1.8 });
      panel(ctx, 430, 150, 760, 380);
      text(ctx, 'Level ' + (g.levelIndex + 1) + ' — ' + g.level.def.name, 470, 200, 30, GOLD);
      text(ctx, speaker, 470, 250, 22, isUmay ? '#9fdcff' : '#ffd27a');
      if (line) wrap(ctx, line.text, 470, 290, 680, 32, 24, '#f1f4fb');
      ctx.fillStyle = 'rgba(242,193,78,0.3)'; ctx.fillRect(470, 400, 680, 2);
      text(ctx, g.data.text.mission + ':  ' + g.level.def.mission.text, 470, 438, 22, '#fff4d6');
      text(ctx, `${g.data.text.seeds} required:  ${g.level.def.seedQuota}`, 470, 472, 20, '#b9ff8a');
      text(ctx, `${step + 1}/${lines.length}    ${g.data.text.pressToContinue}`, 1150, 515, 16, '#aebbd8', 'right', '600');
    },
    drawPause(ctx, g) {
      ctx.fillStyle = 'rgba(4,10,30,0.65)'; ctx.fillRect(0, 0, T.W, T.H);
      text(ctx, 'Paused', T.W / 2, 220, 56, GOLD, 'center');
      g.menuRects = this.menu(ctx, g.menuItems(), g.menuIndex, T.W / 2, 320);
      this.controls(ctx, 560);
    },
    drawResult(ctx, g) {
      const r = g.result, tx = g.data.text;
      ctx.fillStyle = 'rgba(4,10,30,0.7)'; ctx.fillRect(0, 0, T.W, T.H);
      panel(ctx, 290, 100, 700, 520);
      let title, body, color;
      if (r.kind === 'win') { title = tx.treePlanted; color = '#b9ff8a'; const nx = g.data.levels[g.levelIndex + 1]; body = nx ? U.fmt(tx.nextLevel, { name: nx.name }) : tx.finalLevel; }
      else if (r.kind === 'seedFail') { title = tx.seedFailTitle; color = '#ffb07a'; body = U.fmt(tx.seedFailBody, { have: r.seeds, need: r.quota }); }
      else { title = tx.deathTitle; color = '#ff8a8a'; body = tx.deathBody; }
      text(ctx, title, T.W / 2, 175, 36, color, 'center');
      wrap(ctx, body, T.W / 2, 225, 600, 30, 21, '#e8ecf6', 'center');
      const s = g.stats;
      const stats = [`${tx.seeds}: ${r.seeds}/${r.quota}`, `Defeated: ${s.kills}`, `Parries: ${s.parries}`, `Best combo: ${s.maxCombo}`, `Time: ${Math.floor(s.time / 60)}:${String(Math.floor(s.time % 60)).padStart(2, '0')}`];
      stats.forEach((st, i) => text(ctx, st, T.W / 2, 300 + i * 24, 18, '#c9d3ea', 'center', '600'));
      const items = g.menuItems();
      g.menuRects = this.menu(ctx, items, g.menuIndex, T.W / 2, items.length > 2 ? 470 : 512);
    },
    drawSelect(ctx, g) {
      ctx.fillStyle = 'rgba(4,10,30,0.65)'; ctx.fillRect(0, 0, T.W, T.H);
      text(ctx, g.data.text.levelSelect, T.W / 2, 110, 48, GOLD, 'center');
      g.menuRects = this.menu(ctx, g.menuItems(), g.menuIndex, T.W / 2, 190);
      const L = g.data.levels[g.menuIndex];
      if (L) {
        text(ctx, L.mission.text, T.W / 2, 600, 20, '#fff4d6', 'center', '600');
        text(ctx, `${g.data.text.seeds} required: ${L.seedQuota}`, T.W / 2, 630, 18, '#b9ff8a', 'center', '600');
      }
      text(ctx, 'Esc — back', T.W / 2, 690, 14, '#7d869c', 'center', '600');
    },
    drawEnding(ctx, g) {
      ctx.fillStyle = 'rgba(4,10,30,0.6)'; ctx.fillRect(0, 0, T.W, T.H);
      T.sprites.draw(ctx, 'tree', 'grow', performance.now() / 1000, T.W / 2, 520, 1, { p: 1, scale: 1.2 });
      wrap(ctx, g.data.text.ending, T.W / 2, 590, 900, 34, 26, '#fff4d6', 'center');
      text(ctx, g.data.text.pressToContinue, T.W / 2, 690, 16, '#aebbd8', 'center', '600');
    },
    drawQuit(ctx, g) {
      ctx.fillStyle = '#040a1e'; ctx.fillRect(0, 0, T.W, T.H);
      text(ctx, g.data.text.title, T.W / 2, 300, 80, GOLD, 'center');
      text(ctx, g.data.text.quitBody, T.W / 2, 380, 24, '#c9d3ea', 'center', '600');
      text(ctx, g.data.text.pressToContinue, T.W / 2, 440, 16, '#7d869c', 'center', '600');
    },
  });
})();
