# 🐧 THE PENGUIN: BEYOND THE DOOR

A fully playable **3D First-Person Adventure/Psychological Horror Game** built to run directly in any modern desktop browser.

🎮 **[PLAY LIVE ON GITHUB PAGES](https://saltymother.github.io/penguin-beyond-the-door/)** 🎮  
📱 *Full Mobile & Tablet support with on-screen virtual analog joystick and touch action buttons!*

---

## 🎮 CORE CONCEPT & STORY

You control an anthropomorphic operative penguin armed with a high-caliber firearm (**PEN-9 Tactical Carbine**). 
The expedition begins deep inside a dense, atmospheric, realistic forest. As you advance along the winding trail, the natural ambience distorts, fog thickens, and hostile spectral **Shadow Lurkers** emerge.

At the terminus of the trail stands an **Ancient Monolithic Door** etched with glowing non-euclidean geometric glyphs. Opening it triggers a continuous dimensional rift that plunges you into an infinite surreal horror reality inspired by the **Backrooms**, massive **Megalophobia** colossal chambers, and subterranean **Poolrooms**.

---

## 🕹️ CONTROLS (Desktop & Mobile)

| Action | Desktop Keyboard/Mouse | Mobile Touchscreen |
|---|---|---|
| **Movement** | `W` `A` `S` `D` | Virtual Analog Joystick (Left thumb) |
| **Tactical Sprint** | `Shift` (Drains Stamina) | `⚡ SPRINT` Button (Toggle) |
| **Jump / Vault** | `Space` | `🦘 JUMP` Button |
| **Look Around** | `Mouse` (Pointer Lock) | Drag / Swipe Right Side of Screen |
| **Fire PEN-9** | `Left Mouse Button` | `🎯 FIRE` Button |
| **Aim Down Sights (ADS)** | `Right Mouse Button` | `🔍 ADS` Button |
| **Tactical Reload** | `R` | `🔄 RELOAD` Button |
| **Interact / Open Door** | `E` | `🚪 USE [E]` Button |
| **Toggle 1st / 3rd Person** | `V` | `📷 1P/3P` Button |
| **Pause / Resume** | `Esc` | `⏸ PAUSE` Button |

---

## 🌟 KEY FEATURES

1. **Detailed 3D Anthropomorphic Penguin**:
   - Dark charcoal feather coat, downy white chest/belly plumage, tapered orange beak, webbed feet with claws, expressive eyes.
   - Comprehensive procedural skeletal animation state machine: Idle, Walk waddle, Sprint lean, Jump tuck, Landing impact, ADS lock, Gun recoil kickback, Multi-stage reload, Damage flinch, and Death collapse.
   - Dynamic shadow casting.

2. **Dual Perspective Camera**:
   - **First-Person View (FPV)**: Immersive eye-level view with weapon rig, holographic reflex optic, dynamic weapon sway, walking bobbing, and muzzle flash.
   - **Third-Person View (TPV)**: Over-the-shoulder view showing the entire penguin model actively running, aiming, and firing.

3. **Gun & Ballistics System**:
   - First-person tactical carbine model with holographic sight reticle dot, muzzle brake, extended magazine, and under-barrel tactical flashlight.
   - Recoil spring-damper, dynamic muzzle flash light, crossed-quad flash sprite, barrel smoke puff particles, and yellow bullet tracers.
   - Raycast hitscan with impact sparks on stone/metal and violet bursts on entities.
   - Ammunition management (12/60) with 3-stage reload audio and animation.

4. **Shadow Lurker AI**:
   - Spectral dark humanoid entities with glowing violet eyes.
   - Autonomous states: `Patrol`, `Aggro / Chase`, `Claw Melee Attack`, `Stagger / Hit Reaction`, and `Death Dissolution`.
   - Slain enemies dissolve into dark smoke and drop tactical ammo crates.

5. **Interconnected Multi-Zone Environment**:
   - **The Primeval Forest**: Instanced pine trees, rocky outcrops, fallen logs, sunbeams, dirt path, drifting spore particles.
   - **The Ancient Monolith Door**: 6.5m basalt archway with glowing cyan geometric runes and swirling dimensional portal.
   - **The Backrooms (Level 0)**: Yellow damask wallpaper, damp carpet, acoustic ceiling tiles, 60Hz buzzing fluorescent light fixtures.
   - **The Megalopolis (Megalophobia)**: 200m high void, 120m Giant Door, 80m towering Colossus Titan, cyclopean pillars, floating polyhedra.
   - **The Submerged Poolrooms**: Pale cyan ceramic tiles, sunken bath basins, shallow wading water with splashing footsteps.
   - **The Celestial Gateway**: Grand final escape rift leading back to reality.

6. **100% Self-Contained Procedural Web Audio Engine**:
   - Multi-layer gunshots (transient noise crack + sub-bass punch + mechanical clink).
   - Footsteps adapted to surface (crunch on dirt, dull thud on carpet, crisp ceramic click, fluid water splash).
   - Zone-specific soundscapes (forest wind & birds, 60Hz fluorescent hum, sub-bass 32Hz cathedral drone, echoing cavernous water drips).

---

## 🚀 HOW TO RUN

Open `index.html` directly in any modern desktop web browser (Chrome, Edge, Safari, Firefox), or launch the local server:

```bash
python3 server.py
```

Then visit `http://localhost:8080`.
