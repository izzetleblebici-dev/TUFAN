// =====================================================================
// TUFAN — tuning data
// Everything here can be changed without touching game code.
// The object is written in JSON-compatible syntax, so it can be moved
// into a .json file later (e.g. when the project moves to Unity).
// =====================================================================
window.TUFAN_DATA = {
  "player": {
    "maxHp": 100,
    "width": 40,
    "height": 90,
    "speed": 340,
    "accelGround": 3200,
    "accelAir": 2200,
    "gravity": 2300,
    "jumpVelocity": 860,
    "doubleJump": true,
    "doubleJumpVelocity": 760,
    "coyoteTime": 0.08,
    "inputBuffer": 0.14,
    "light": [
      { "startup": 0.07, "active": 0.09, "recovery": 0.20, "damage": 10, "range": 92,  "height": 80, "knockback": 120, "lunge": 140, "rage": 4 },
      { "startup": 0.07, "active": 0.09, "recovery": 0.20, "damage": 12, "range": 92,  "height": 80, "knockback": 140, "lunge": 140, "rage": 4 },
      { "startup": 0.10, "active": 0.11, "recovery": 0.32, "damage": 18, "range": 112, "height": 70, "knockback": 380, "lunge": 230, "rage": 6 }
    ],
    "heavy": { "startup": 0.30, "active": 0.12, "recovery": 0.38, "damage": 28, "range": 120, "height": 100, "knockback": 540, "lunge": 90, "rage": 8, "guardBreak": true, "poiseMultiplier": 2.5 },
    "dodge": { "duration": 0.30, "speed": 680, "iframes": 0.26, "cooldown": 0.35 },
    "parry": { "window": 0.15, "duration": 0.32, "missLockout": 0.25, "enemyStun": 1.4, "reflectMultiplier": 2.0 },
    "hurt":  { "stun": 0.30, "iframes": 0.80, "knockback": 360 }
  },

  "rage": { "max": 100, "onParry": 25, "onDodge": 3, "onPerfectDodge": 12, "onBlockedHit": 1 },

  "blessing": { "name": "Umay's Blessing", "healPercent": 0.30, "cooldown": 12, "shieldDuration": 5, "castTime": 0.45 },

  "ultimate": { "name": "Ülgen's Sun Lightning", "damage": 90, "castTime": 1.0, "strikeAt": 0.42 },

  "feedback": {
    "hitStopMs": 60,
    "parrySlowMoScale": 0.3,
    "parrySlowMoDuration": 0.45,
    "shakePerDamage": 0.45,
    "maxShake": 20,
    "comboResetTime": 2.0
  },

  "enemies": {
    "minion": {
      "name": "Gulyabani Spawn", "sprite": "minion",
      "hp": 24, "width": 36, "height": 52, "speed": 210, "mass": 1, "poise": 0,
      "seedDropChance": 0.30, "seedCount": 1,
      "attackCooldown": [0.9, 1.6],
      "bite": { "range": 70, "height": 50, "windup": 0.38, "active": 0.14, "recovery": 0.40, "damage": 8, "knockback": 220, "lunge": 360, "parryable": true }
    },
    "sorcerer": {
      "name": "Gulyabani Sorcerer", "sprite": "sorcerer",
      "hp": 70, "width": 44, "height": 100, "speed": 140, "mass": 1.2, "poise": 0,
      "seedDropChance": 0.70, "seedCount": 1,
      "attackCooldown": [1.6, 2.6],
      "preferredRange": [320, 560],
      "castDamageMultiplier": 1.5,
      "interruptStun": 0.8,
      "bolt": { "windup": 0.75, "active": 0.05, "recovery": 0.50, "damage": 12, "knockback": 260, "projectileSpeed": 430, "parryable": true },
      "summon": { "hpThreshold": 0.4, "count": 2, "windup": 1.0, "active": 0.1, "recovery": 0.6 }
    },
    "brute": {
      "name": "Stone Brute", "sprite": "brute",
      "hp": 160, "width": 70, "height": 112, "speed": 85, "mass": 3, "poise": 45,
      "seedDropChance": 0.80, "seedCount": 1,
      "attackCooldown": [1.0, 1.6],
      "guard": { "chance": 0.30, "duration": 1.0, "hits": 4, "breakStun": 1.2 },
      "claw":  { "range": 118, "height": 100, "windup": 0.55, "active": 0.16, "recovery": 0.60, "damage": 18, "knockback": 380, "lunge": 120, "parryable": true },
      "quake": { "windup": 1.0, "active": 0.1, "recovery": 0.9, "damage": 15, "knockback": 300, "waveSpeed": 520, "waveRange": 900, "parryable": true, "minRange": 160, "cooldown": 4 }
    },
    "centaur": {
      "name": "Centaur Archer", "sprite": "centaur",
      "hp": 80, "width": 80, "height": 130, "speed": 230, "mass": 2, "poise": 30,
      "seedDropChance": 0.75, "seedCount": 1,
      "attackCooldown": [1.5, 2.3],
      "preferredRange": [340, 650],
      "shot": { "windup": 0.7, "active": 0.05, "recovery": 0.5, "damage": 12, "knockback": 240, "arrowGravity": 900, "parryable": true }
    },
    "khan": {
      "name": "Centaur Khan", "sprite": "khan", "boss": true,
      "hp": 420, "width": 100, "height": 160, "speed": 250, "mass": 4, "poise": 70,
      "seedDropChance": 1.0, "seedCount": 3,
      "attackCooldown": [0.9, 1.5],
      "preferredRange": [320, 620], "phase2At": 0.5,
      "shot": { "windup": 0.65, "active": 0.05, "recovery": 0.45, "damage": 12, "knockback": 240, "arrowGravity": 900, "parryable": true, "volley": 3, "volleyPhase2": 5, "spread": 110 },
      "charge": { "range": 140, "height": 140, "windup": 0.7, "active": 0.45, "recovery": 0.8, "damage": 22, "knockback": 520, "lunge": 760, "parryable": true, "cooldown": 4 }
    },
    "captain": {
      "name": "Erlik", "sprite": "erlik", "boss": true,
      "hp": 480, "width": 64, "height": 150, "speed": 170, "mass": 4, "poise": 60,
      "seedDropChance": 1.0, "seedCount": 2,
      "attackCooldown": [0.7, 1.2],
      "phase2At": 0.5, "phase2SpeedMultiplier": 1.25, "phase2WindupMultiplier": 0.8,
      "guard": { "chance": 0.25, "duration": 0.8, "hits": 3, "breakStun": 1.0 },
      "slash":  { "range": 155, "height": 110, "windup": 0.45, "active": 0.12, "recovery": 0.25, "damage": 14, "knockback": 300, "lunge": 160, "parryable": true },
      "slash2": { "range": 155, "height": 110, "windup": 0.28, "active": 0.12, "recovery": 0.55, "damage": 16, "knockback": 420, "lunge": 200, "parryable": true },
      "lunge":  { "range": 140, "height": 100, "windup": 0.60, "active": 0.35, "recovery": 0.70, "damage": 20, "knockback": 480, "lunge": 900, "parryable": true, "cooldown": 3 },
      "slam":   { "windup": 0.50, "recovery": 0.90, "damage": 22, "radius": 140, "knockback": 520, "waveDamage": 14, "waveSpeed": 600, "waveRange": 800, "cooldown": 5 }
    },
    "erlik_final": {
      "name": "Erlik", "sprite": "erlik_final", "boss": true,
      "hp": 700, "width": 64, "height": 150, "speed": 170, "mass": 4, "poise": 80,
      "seedDropChance": 1.0, "seedCount": 3,
      "attackCooldown": [0.7, 1.2],
      "phase2At": 0.5, "phase2SpeedMultiplier": 1.25, "phase2WindupMultiplier": 0.8,
      "guard": { "chance": 0.25, "duration": 0.8, "hits": 3, "breakStun": 1.0 },
      "slash":  { "range": 155, "height": 110, "windup": 0.45, "active": 0.12, "recovery": 0.25, "damage": 14, "knockback": 300, "lunge": 160, "parryable": true },
      "slash2": { "range": 155, "height": 110, "windup": 0.28, "active": 0.12, "recovery": 0.55, "damage": 16, "knockback": 420, "lunge": 200, "parryable": true },
      "lunge":  { "range": 140, "height": 100, "windup": 0.60, "active": 0.35, "recovery": 0.70, "damage": 20, "knockback": 480, "lunge": 900, "parryable": true, "cooldown": 3 },
      "slam":   { "windup": 0.50, "recovery": 0.90, "damage": 22, "radius": 140, "knockback": 520, "waveDamage": 14, "waveSpeed": 600, "waveRange": 800, "cooldown": 5 }
    }
  },

  "levels": [
    {
      "id": "mu", "name": "Mu Defense", "theme": "mu", "playable": true, "seedQuota": 5,
      "mission": { "giver": "Ülgen", "text": "Defeat Erlik", "type": "defeatBoss", "target": "captain" },
      "briefing": [
        { "speaker": "Ülgen", "text": "The waters are rising, Geser. The Gulyabani have come for Mu while its people flee." },
        { "speaker": "Ülgen", "text": "Hold the city. Defeat Erlik, lord of the Gulyabani, then plant the Tree of Life on the sacred ground beyond the gate." },
        { "speaker": "Umay",  "text": "I am with you. Call on me (right click) and I will heal you and shield you from one blow." },
        { "speaker": "Ülgen", "text": "The fallen Gulyabani drop seeds. Without 5 seeds the Tree will not take root." }
      ],
      "palette": { "skyTop": "#071636", "skyBottom": "#2f5aa6", "sun": "#f7d77a", "accent": "#f2c14e", "light": "#ffffff", "city": "#c9d6ef", "sea": "#123a7c", "ground": "#d9dde8", "groundDark": "#6f7a93", "trim": "#f2c14e" },
      "start": 220,
      "length": 7800,
      "treeX": 7480,
      "zones": [
        { "x": 1100, "type": "combat", "spawns": [
          { "type": "minion",   "x": 900,  "delay": 0.0 },
          { "type": "minion",   "x": 1050, "delay": 0.4 },
          { "type": "sorcerer", "x": 1160, "delay": 1.2 } ] },
        { "x": 2700, "type": "combat", "spawns": [
          { "type": "brute",  "x": 1000, "delay": 0.0 },
          { "type": "minion", "x": 160,  "delay": 1.8 },
          { "type": "minion", "x": 1120, "delay": 2.4 } ] },
        { "x": 4300, "type": "combat", "spawns": [
          { "type": "sorcerer", "x": 1170, "delay": 0.0 },
          { "type": "brute",    "x": 950,  "delay": 0.6 },
          { "type": "minion",   "x": 150,  "delay": 2.5 },
          { "type": "centaur",  "x": 1150, "delay": 3.2 } ] },
        { "x": 5900, "type": "boss", "spawns": [
          { "type": "captain", "x": 1000, "delay": 0.8 } ] }
      ],
      "platforms": [
        { "x": 1500, "y": 470, "w": 220 }, { "x": 1900, "y": 470, "w": 220 },
        { "x": 3150, "y": 480, "w": 240 }, { "x": 3600, "y": 480, "w": 200 },
        { "x": 4650, "y": 470, "w": 220 }, { "x": 5100, "y": 470, "w": 220 },
        { "x": 6150, "y": 460, "w": 200 }, { "x": 6750, "y": 460, "w": 200 }
      ],
      "hints": [
        { "x": 330,  "text": "A  D  Move     W  Jump (press again in the air to double jump)" },
        { "x": 720,  "text": "X  Light attack — press 3 times for a combo" },
        { "x": 1020, "text": "Q  Parry when an enemy flashes gold ✦  (0.15 s window)" },
        { "x": 2450, "text": "Left click  Heavy attack — breaks a guarding enemy" },
        { "x": 2880, "text": "Shift  Dodge (brief invincibility). Jump or dodge the ground shake" },
        { "x": 4050, "text": "Right click  Umay's blessing: heal 30% + one-hit shield (12 s cooldown)" },
        { "x": 4480, "text": "Hits, parries and dodges fill rage.  SPACE  Ülgen's Sun Lightning" },
        { "x": 5650, "text": "Seeds drop from fallen Gulyabani. You need enough to plant the Tree" },
        { "x": 7250, "text": "The sacred ground — plant the Tree of Life" }
      ]
    },
    {"id": "kapadokya", "name": "Kapadokya", "theme": "kapadokya", "playable": true, "seedQuota": 8, "mission": {"giver": "Ülgen", "text": "Reach the cave shrine", "type": "reachPoint"}, "briefing": [{"speaker": "Ülgen", "text": "The survivors have fled into the underground cities of Kapadokya, but the Gulyabani followed them into the tunnels."}, {"speaker": "Ülgen", "text": "Teach them to farm in the dark: vertical gardens fed by lamplight and stone-water. Then reach the cave shrine."}, {"speaker": "Umay", "text": "The Stone Brutes hide in these tunnels. Break their guard and keep your distance from the ground shake."}, {"speaker": "Ülgen", "text": "Eight seeds will root the Tree inside the shrine."}], "palette": {"skyTop": "#2a170c", "skyBottom": "#a8693a", "sun": "#f3c27a", "accent": "#d99a3d", "light": "#f5e6cc", "city": "#c79a6a", "sea": "#5a3d27", "ground": "#b98c5e", "groundDark": "#6b4a2e", "trim": "#d99a3d", "platform": "#d8b88c"}, "start": 220, "length": 7800, "treeX": 7480, "zones": [{"x": 1100, "type": "combat", "spawns": [{"type": "minion", "x": 900, "delay": 0}, {"type": "minion", "x": 1100, "delay": 0.5}, {"type": "brute", "x": 1000, "delay": 1.4}], "banner": "Gulyabani in the tunnels!"}, {"x": 2700, "type": "combat", "spawns": [{"type": "sorcerer", "x": 1160, "delay": 0}, {"type": "brute", "x": 950, "delay": 0.6}, {"type": "minion", "x": 150, "delay": 2}, {"type": "minion", "x": 1100, "delay": 2.6}]}, {"x": 4300, "type": "combat", "spawns": [{"type": "brute", "x": 1000, "delay": 0}, {"type": "brute", "x": 200, "delay": 1.5}, {"type": "sorcerer", "x": 1170, "delay": 2.2}, {"type": "minion", "x": 1100, "delay": 3.4}]}, {"x": 5900, "type": "combat", "spawns": [{"type": "brute", "x": 1000, "delay": 0}, {"type": "brute", "x": 250, "delay": 0.6}, {"type": "sorcerer", "x": 1170, "delay": 1.6}, {"type": "sorcerer", "x": 120, "delay": 2.6}, {"type": "minion", "x": 1050, "delay": 3.6}], "banner": "The shrine guardians wake!"}], "platforms": [{"x": 1500, "y": 470, "w": 220}, {"x": 1900, "y": 470, "w": 220}, {"x": 3100, "y": 470, "w": 220}, {"x": 3500, "y": 470, "w": 220}, {"x": 4700, "y": 470, "w": 220}, {"x": 5100, "y": 470, "w": 220}, {"x": 6300, "y": 470, "w": 220}, {"x": 6700, "y": 470, "w": 220}, {"x": 1700, "y": 360, "w": 160}, {"x": 3300, "y": 360, "w": 160}, {"x": 4900, "y": 360, "w": 160}, {"x": 6500, "y": 360, "w": 160}], "hints": [{"x": 600, "text": "Vertical gardens: crops grow on terraces deep underground, lit by lamps"}, {"x": 5650, "text": "The cave shrine lies beyond the guardians"}]},
    {"id": "mezopotamya", "name": "Mezopotamya", "theme": "mezopotamya", "playable": true, "seedQuota": 10, "mission": {"giver": "Ülgen", "text": "Free the river-valley settlements", "type": "clearAll"}, "briefing": [{"speaker": "Ülgen", "text": "Between the two rivers, the flood has drowned the old settlements. Gulyabani camps hold the high ground."}, {"speaker": "Ülgen", "text": "Free every settlement. Show the people how to raise their homes above the water and dig canals that carry the flood away."}, {"speaker": "Umay", "text": "Centaur archers ride these plains. Their arrows can be turned back with a parry."}, {"speaker": "Ülgen", "text": "Ten seeds, Geser. The valley must bloom again."}], "palette": {"skyTop": "#16384a", "skyBottom": "#8fbfcf", "sun": "#f0e2a8", "accent": "#5f8f3a", "light": "#eef3e2", "city": "#b28b62", "sea": "#2c6f9a", "ground": "#a37a55", "groundDark": "#5d4430", "trim": "#5f8f3a", "platform": "#c8a878"}, "start": 220, "length": 7800, "treeX": 7480, "zones": [{"x": 1100, "type": "combat", "spawns": [{"type": "centaur", "x": 1150, "delay": 0}, {"type": "minion", "x": 900, "delay": 0.3}, {"type": "minion", "x": 1050, "delay": 0.8}, {"type": "sorcerer", "x": 150, "delay": 1.6}, {"type": "minion", "x": 200, "delay": 2.4}], "banner": "Settlement 1: drive out the Gulyabani!", "clearText": "Settlement freed  →"}, {"x": 2700, "type": "combat", "spawns": [{"type": "centaur", "x": 1150, "delay": 0}, {"type": "centaur", "x": 150, "delay": 1.2}, {"type": "sorcerer", "x": 1000, "delay": 2.0}], "banner": "Settlement 2: archers on the plain!", "clearText": "Settlement freed  →"}, {"x": 4300, "type": "combat", "spawns": [{"type": "brute", "x": 1000, "delay": 0}, {"type": "centaur", "x": 1180, "delay": 0.8}, {"type": "sorcerer", "x": 150, "delay": 1.8}, {"type": "minion", "x": 1100, "delay": 2.8}, {"type": "minion", "x": 200, "delay": 3.2}], "banner": "Settlement 3!", "clearText": "Settlement freed  →"}, {"x": 5900, "type": "combat", "spawns": [{"type": "centaur", "x": 1150, "delay": 0}, {"type": "centaur", "x": 120, "delay": 0.8}, {"type": "brute", "x": 950, "delay": 1.4}, {"type": "brute", "x": 300, "delay": 2.2}, {"type": "sorcerer", "x": 1100, "delay": 3.0}, {"type": "minion", "x": 600, "delay": 3.8}], "banner": "The last settlement!", "clearText": "Settlement freed  →"}], "platforms": [{"x": 1500, "y": 470, "w": 220}, {"x": 1900, "y": 470, "w": 220}, {"x": 3100, "y": 470, "w": 220}, {"x": 3500, "y": 470, "w": 220}, {"x": 4700, "y": 470, "w": 220}, {"x": 5100, "y": 470, "w": 220}, {"x": 6300, "y": 470, "w": 220}, {"x": 6700, "y": 470, "w": 220}], "hints": [{"x": 600, "text": "Raised homes and canals keep the next flood away"}, {"x": 2450, "text": "Turn the centaurs’ arrows back with a parry (Q)"}]},
    {"id": "misir", "name": "Mısır", "theme": "misir", "playable": true, "seedQuota": 12, "mission": {"giver": "Ülgen", "text": "Defeat the Centaur Khan and save the Nile cities", "type": "defeatBoss"}, "briefing": [{"speaker": "Ülgen", "text": "The Nile cities are under siege. Erlik has sent the Centaur Khan to hold the river."}, {"speaker": "Ülgen", "text": "Break the siege, save the granaries, and plant the Tree where the river meets the desert."}, {"speaker": "Umay", "text": "The Khan looses arrows in volleys and charges when you come close. Parry the charge and strike back."}, {"speaker": "Ülgen", "text": "Twelve seeds. Store the harvest well; drought follows the flood."}], "palette": {"skyTop": "#5a2e14", "skyBottom": "#f3b45e", "sun": "#ff9a3c", "accent": "#e8c062", "light": "#fff1cf", "city": "#d9b56a", "sea": "#1f8c8c", "ground": "#e3c27c", "groundDark": "#9a7a3e", "trim": "#1f8c8c", "platform": "#f0d9a0"}, "start": 220, "length": 9300, "treeX": 8980, "zones": [{"x": 1100, "type": "combat", "spawns": [{"type": "sorcerer", "x": 1150, "delay": 0}, {"type": "sorcerer", "x": 150, "delay": 1.0}, {"type": "minion", "x": 1000, "delay": 1.8}, {"type": "minion", "x": 250, "delay": 2.4}], "banner": "The siege of the river gate!"}, {"x": 2600, "type": "combat", "spawns": [{"type": "centaur", "x": 1150, "delay": 0}, {"type": "centaur", "x": 150, "delay": 0.8}, {"type": "brute", "x": 1000, "delay": 1.6}, {"type": "minion", "x": 600, "delay": 2.6}]}, {"x": 4100, "type": "combat", "spawns": [{"type": "brute", "x": 1000, "delay": 0}, {"type": "brute", "x": 250, "delay": 0.8}, {"type": "sorcerer", "x": 1170, "delay": 1.6}, {"type": "centaur", "x": 120, "delay": 2.4}, {"type": "minion", "x": 900, "delay": 3.2}, {"type": "minion", "x": 400, "delay": 3.6}], "banner": "Defend the granaries!"}, {"x": 5600, "type": "combat", "spawns": [{"type": "sorcerer", "x": 1170, "delay": 0}, {"type": "centaur", "x": 150, "delay": 0.8}, {"type": "brute", "x": 1000, "delay": 1.6}, {"type": "minion", "x": 700, "delay": 2.6}, {"type": "minion", "x": 300, "delay": 3.0}]}, {"x": 7100, "type": "boss", "spawns": [{"type": "khan", "x": 1050, "delay": 0.8}, {"type": "minion", "x": 1150, "delay": 8}, {"type": "minion", "x": 150, "delay": 14}]}], "platforms": [{"x": 1500, "y": 470, "w": 220}, {"x": 1900, "y": 470, "w": 220}, {"x": 3000, "y": 470, "w": 220}, {"x": 3400, "y": 470, "w": 220}, {"x": 4500, "y": 470, "w": 220}, {"x": 4900, "y": 470, "w": 220}, {"x": 6000, "y": 470, "w": 220}, {"x": 6400, "y": 470, "w": 220}, {"x": 7500, "y": 470, "w": 220}, {"x": 7900, "y": 470, "w": 220}], "hints": [{"x": 600, "text": "Granaries keep the harvest safe through the drought after the flood"}, {"x": 6950, "text": "The Centaur Khan waits at the river’s edge"}]},
    {"id": "gobeklitepe", "name": "Göbeklitepe", "theme": "gobeklitepe", "playable": true, "seedQuota": 15, "mission": {"giver": "Ülgen", "text": "Defeat Erlik and plant the last Tree of Life", "type": "defeatBoss"}, "briefing": [{"speaker": "Ülgen", "text": "This is the oldest temple of humankind, Geser. Here the last Tree of Life will stand."}, {"speaker": "Ülgen", "text": "Erlik himself waits among the stone pillars. He is stronger than when you met him in Mu."}, {"speaker": "Umay", "text": "I am with you to the end."}, {"speaker": "Ülgen", "text": "Gather fifteen seeds. As long as this Tree lives, your people live."}], "palette": {"skyTop": "#0d0a1f", "skyBottom": "#5b3f80", "sun": "#e8ddff", "accent": "#9c8cc9", "light": "#e8e3f5", "city": "#5d5a66", "sea": "#2a2440", "ground": "#8a8794", "groundDark": "#4a4752", "trim": "#9c8cc9", "platform": "#a9a5b4"}, "start": 220, "length": 10800, "treeX": 10480, "zones": [{"x": 1100, "type": "combat", "spawns": [{"type": "brute", "x": 1000, "delay": 0}, {"type": "brute", "x": 250, "delay": 1.0}, {"type": "minion", "x": 1100, "delay": 1.8}, {"type": "minion", "x": 150, "delay": 2.4}], "banner": "The temple is overrun!"}, {"x": 2600, "type": "combat", "spawns": [{"type": "sorcerer", "x": 1170, "delay": 0}, {"type": "sorcerer", "x": 130, "delay": 0.8}, {"type": "centaur", "x": 1100, "delay": 1.8}, {"type": "minion", "x": 600, "delay": 2.8}]}, {"x": 4100, "type": "combat", "spawns": [{"type": "centaur", "x": 1150, "delay": 0}, {"type": "centaur", "x": 150, "delay": 0.8}, {"type": "brute", "x": 1000, "delay": 1.6}, {"type": "brute", "x": 300, "delay": 2.4}]}, {"x": 5600, "type": "combat", "spawns": [{"type": "sorcerer", "x": 1170, "delay": 0}, {"type": "brute", "x": 1000, "delay": 0.6}, {"type": "centaur", "x": 150, "delay": 1.6}, {"type": "minion", "x": 800, "delay": 2.4}, {"type": "minion", "x": 400, "delay": 2.8}, {"type": "minion", "x": 1100, "delay": 3.4}]}, {"x": 7100, "type": "combat", "spawns": [{"type": "brute", "x": 1000, "delay": 0}, {"type": "brute", "x": 250, "delay": 0.6}, {"type": "sorcerer", "x": 1170, "delay": 1.4}, {"type": "sorcerer", "x": 130, "delay": 2.2}, {"type": "centaur", "x": 1100, "delay": 3.2}], "banner": "Erlik’s last guard!"}, {"x": 8600, "type": "boss", "spawns": [{"type": "erlik_final", "x": 1000, "delay": 0.8}, {"type": "minion", "x": 1150, "delay": 9}, {"type": "minion", "x": 150, "delay": 16}]}], "platforms": [{"x": 1500, "y": 470, "w": 220}, {"x": 1900, "y": 470, "w": 220}, {"x": 3000, "y": 470, "w": 220}, {"x": 3400, "y": 470, "w": 220}, {"x": 4500, "y": 470, "w": 220}, {"x": 4900, "y": 470, "w": 220}, {"x": 6000, "y": 470, "w": 220}, {"x": 6400, "y": 470, "w": 220}, {"x": 7500, "y": 470, "w": 220}, {"x": 7900, "y": 470, "w": 220}, {"x": 9000, "y": 470, "w": 220}, {"x": 9400, "y": 470, "w": 220}], "hints": [{"x": 600, "text": "Göbeklitepe: the oldest temple, carved from stone with animal reliefs"}, {"x": 8450, "text": "Erlik waits at the heart of the temple"}]}
  ],

  "sprites": {
    "_comment": "Set 'image' to a sprite sheet path (128x128 frames, transparent background). One row per animation. Leave image null to use placeholder shapes.",
    "geser": { "image": "assets/geser.png", "single": true, "drawHeight": 190, "anchorX": 0.47, "shadow": 0.22, "weapon": "spear", "weaponImage": "geser_spear", "weaponHand": [0.17, -0.47], "frameWidth": 128, "frameHeight": 128, "anims": {
      "idle": { "row": 0, "frames": 6, "fps": 8 },  "run": { "row": 1, "frames": 8, "fps": 14 },
      "jump": { "row": 2, "frames": 4, "fps": 10, "loop": false }, "fall": { "row": 3, "frames": 2, "fps": 8 },
      "attack1": { "row": 4, "frames": 5 }, "attack2": { "row": 5, "frames": 5 }, "attack3": { "row": 6, "frames": 5 },
      "heavy": { "row": 7, "frames": 8 }, "parry": { "row": 8, "frames": 4 }, "dodge": { "row": 9, "frames": 4 },
      "hurt": { "row": 10, "frames": 3 }, "death": { "row": 11, "frames": 8 },
      "blessing": { "row": 12, "frames": 6 }, "ultimate": { "row": 13, "frames": 10 } } },
    "umay":     { "image": "assets/umay.png", "single": true, "drawHeight": 230, "anchorX": 0.5, "frameWidth": 128, "frameHeight": 128, "anims": { "appear": { "row": 0, "frames": 6 }, "bless": { "row": 1, "frames": 8 }, "fade": { "row": 2, "frames": 4 } } },
    "ulgen":    { "image": "assets/ulgen.png", "single": true, "drawHeight": 200, "anchorX": 0.4, "frameWidth": 128, "frameHeight": 128, "anims": { "idle": { "row": 0, "frames": 6, "fps": 6 } } },
    "minion":   { "image": null, "frameWidth": 128, "frameHeight": 128, "anims": { "idle": { "row": 0, "frames": 4, "fps": 8 }, "move": { "row": 1, "frames": 6, "fps": 12 }, "attack": { "row": 2, "frames": 6 }, "hurt": { "row": 3, "frames": 4 }, "death": { "row": 4, "frames": 6 }, "dropSeed": { "row": 5, "frames": 4 } } },
    "sorcerer": { "image": "assets/sorcerer.png", "single": true, "drawHeight": 170, "anchorX": 0.55, "shadow": 0.3, "frameWidth": 128, "frameHeight": 128, "anims": { "idle": { "row": 0, "frames": 6, "fps": 8 }, "move": { "row": 1, "frames": 6, "fps": 10 }, "attack": { "row": 2, "frames": 8 }, "hurt": { "row": 3, "frames": 4 }, "death": { "row": 4, "frames": 8 }, "dropSeed": { "row": 5, "frames": 4 } } },
    "brute":    { "image": null, "frameWidth": 128, "frameHeight": 128, "anims": { "idle": { "row": 0, "frames": 6, "fps": 6 }, "move": { "row": 1, "frames": 8, "fps": 8 }, "attack": { "row": 2, "frames": 8 }, "hurt": { "row": 3, "frames": 4 }, "death": { "row": 4, "frames": 8 }, "dropSeed": { "row": 5, "frames": 4 } } },
    "erlik":    { "image": "assets/erlik.png", "single": true, "drawHeight": 280, "anchorX": 0.3, "shadow": 0.25, "frameWidth": 128, "frameHeight": 128, "anims": { "idle": { "row": 0, "frames": 6, "fps": 8 }, "move": { "row": 1, "frames": 8, "fps": 12 }, "attack": { "row": 2, "frames": 8 }, "hurt": { "row": 3, "frames": 4 }, "death": { "row": 4, "frames": 8 }, "dropSeed": { "row": 5, "frames": 4 } } },
    "centaur":  { "image": "assets/centaur.png", "single": true, "drawHeight": 215, "anchorX": 0.44, "shadow": 0.35, "frameWidth": 128, "frameHeight": 128, "anims": { "idle": { "row": 0, "frames": 6 }, "move": { "row": 1, "frames": 8 }, "attack": { "row": 2, "frames": 8 }, "hurt": { "row": 3, "frames": 4 }, "death": { "row": 4, "frames": 8 }, "dropSeed": { "row": 5, "frames": 4 } } },
    "geser_spear": { "image": "assets/geser_spear.png", "_comment": "Geser's spear, drawn over his painting; grip at gripX" },
    "khan":     { "image": "assets/centaur.png", "single": true, "drawHeight": 270, "anchorX": 0.44, "shadow": 0.35, "aura": "rgba(255,200,80,0.45)" },
    "erlik_final": { "image": "assets/erlik.png", "single": true, "drawHeight": 310, "anchorX": 0.3, "shadow": 0.25, "aura": "rgba(150,70,255,0.45)" },
    "seed":     { "image": null, "frameWidth": 32,  "frameHeight": 32,  "anims": { "idle": { "row": 0, "frames": 4, "fps": 8 } } },
    "tree":     { "image": null, "frameWidth": 256, "frameHeight": 256, "anims": { "grow": { "row": 0, "frames": 8 } } }
  },

  "text": {
    "title": "TUFAN",
    "subtitle": "Prototype — 5 levels",
    "newGame": "Yeni Oyun",
    "quit": "Çıkış",
    "resume": "Devam Et",
    "restart": "Restart Level",
    "mainMenu": "Main Menu",
    "retry": "Retry",
    "replay": "Play Again",
    "seeds": "Seeds",
    "mission": "Mission",
    "pressToContinue": "Enter / click — continue",
    "treePlanted": "The Tree of Life has taken root",
    "seedFailTitle": "The Tree could not take root",
    "seedFailBody": "You collected {have} of {need} seeds. Fallen Gulyabani drop seeds — defeat them and gather every seed before reaching the sacred ground. The level restarts from the beginning.",
    "deathTitle": "Geser has fallen",
    "deathBody": "Health reached zero. The level restarts from the beginning.",
    "nextLevel": "Next: {name}",
    "finalLevel": "The journey is complete.",
    "levelSelect": "Bölüm Seç",
    "continue": "Continue",
    "ending": "The last Tree of Life stands on Göbeklitepe. As long as it lives, the people of Mu live on.",
    "quitBody": "Görüşmek üzere. (You can close this tab.)"
  }
};
