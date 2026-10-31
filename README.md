# Tufan — Prototype (5 levels)

Open `index.html` in Chrome, Edge or Firefox. You don't need to install anything or run a build step.

## Controls
| Action | Keyboard | Gamepad |
|---|---|---|
| Move | A / D | Left stick / D-pad |
| Jump (double jump in the air) | W | A |
| Light attack (3-hit combo) | X | X |
| Heavy attack (breaks guard) | Left mouse button | Y |
| Dodge (i-frames) | Shift | B |
| Parry (0.15 s window) | Q | LB |
| Ultimate — Ülgen's Sun Lightning | Space (when rage is full) | LT / RT |
| Umay's blessing (heal + shield) | Right mouse button (or E) | RB |
| Pause | Esc / P | Start |
| Mute | M | — |

Drop through a platform: S + W.

**Test helpers:** F1 shows hitboxes, F2 fills rage, F3 adds one seed.

## Levels
| # | Level | Mission | Seeds | Boss |
|---|---|---|---|---|
| 1 | Mu Defense (tutorial) | Defeat Erlik | 5 | Erlik |
| 2 | Kapadokya | Reach the cave shrine | 8 | Shrine guardians |
| 3 | Mezopotamya | Free the river-valley settlements | 10 | — |
| 4 | Mısır | Defeat the Centaur Khan | 12 | Centaur Khan |
| 5 | Göbeklitepe | Defeat Erlik, plant the last Tree | 15 | Erlik (stronger) |

Winning a level offers Continue to the next one; after Göbeklitepe the ending plays. The title screen also has Bölüm Seç (level select).
Each level's zones, enemies, platforms, palette, briefing and hints are in `js/data.js`; backgrounds are in `js/backgrounds.js`.

## Reading the enemies
- **Gold ✦** above an enemy, projectile or ground wave: you can parry it.
- **Red !**: you can't parry it, so dodge or jump.
- **Pink ◆**: the sorcerer is casting. Hit him now for bonus damage and to interrupt the cast.
- **Blue arc**: the enemy is guarding. Use a heavy attack (left click) to break the guard.

## Project structure
```
index.html        canvas + script loading
js/data.js        ALL tuning: stats, seed quotas, missions, hints, sprite sheets, UI text
js/core.js        input (keyboard + gamepad, input buffer), synth sound effects
js/sprites.js     sprite drawing by name; placeholder painters
js/fx.js          hit-stop helpers, shake, particles, damage numbers, lightning
js/combat.js      hit resolution, projectiles, ground waves, parry/reflect
js/player.js      Geser
js/enemies.js     Spawn, Sorcerer, Stone Brute, Captain (2 phases)
js/seeds.js       drop chance, pickup, quota
js/level.js       combat zones, mission, tree planting, background
js/ui.js          HUD and screens
js/game.js        state machine and fixed 60 Hz loop
```

## Hand-painted art in this build
`assets/` holds cut-out paintings of Geser, Erlik (boss), the Gulyabani Sorcerer, the Centaur Archer, Umay and Ülgen, plus Geser's spear (`geser_spear.png`).
Each character is a single painted pose (`"single": true` in `data.js`). The game animates it with transforms (breathing, lean, lunge, recoil, white hit-flash).
Per-sprite settings: `drawHeight` (on-screen height in px), `anchorX` (where the feet are, 0–1 across the image), `shadow`.
Geser's spear (`assets/geser_spear.png`) is drawn over his painting and rotated for each swing (`"weapon": "spear"`). Replace the PNG to restyle it; the grip sits 39% along its length.
The Stone Brute and the Gulyabani Spawn are still placeholder shapes.

## Replacing placeholders with hand-painted sprites
In `js/data.js` → `sprites`, set `"image"` to a sprite sheet path, for example `"assets/geser.png"`.
- Each frame is 128×128 on a transparent background.
- Put one animation on each row. The `row` and `frames` values in each animation entry tell the game where to read.
- Draw the character facing right with its feet at the bottom centre of the frame. The game flips the sprite when the character faces left.

If an image is missing, the game falls back to the placeholder shapes, so you can swap sprites in one at a time.

## Tuning
You can change these in `data.js` without touching the code: seed quotas per level, enemy HP/damage/drop chance, the parry window, hit-stop length, the heal amount and cooldown, and mission and hint text.
