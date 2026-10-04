/**
 * THE PENGUIN: BEYOND THE DOOR
 * Game Director & Main Application Loop
 * Orchestrates Level Progression, State Machine, HUD,
 * Menus, Settings, and Dimensional Transitions.
 */

class GameDirector {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.state = 'menu'; // 'menu', 'playing', 'paused', 'transition', 'gameover', 'victory'

    // Scene & Renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Subsystems
    this.world = new WorldBuilder(this.scene);
    this.player = new PlayerController(this.camera, this.scene, this.canvas);
    this.enemyManager = new EnemyManager(this.scene);

    // Progression & Stats
    this.currentLevel = 1;
    this.shotsFired = 0;
    this.enemiesDefeated = 0;
    this.startTime = 0;
    this.elapsedTime = 0;

    // Clock
    this.clock = new THREE.Clock();

    // DOM UI Elements
    this.initUiElements();
    this.initEvents();

    // Setup initial forest spawns
    this.setupLevelSpawns(1);

    // Initial zone environment
    this.world.setZoneEnvironment('forest');
  }

  initUiElements() {
    // Menus
    this.menuOverlay = document.getElementById('main-menu');
    this.pauseOverlay = document.getElementById('pause-menu');
    this.gameOverOverlay = document.getElementById('game-over-menu');
    this.victoryOverlay = document.getElementById('victory-menu');
    this.settingsModal = document.getElementById('settings-modal');
    this.controlsModal = document.getElementById('controls-modal');
    this.chaptersModal = document.getElementById('chapters-modal');

    // HUD
    this.hudContainer = document.getElementById('hud-container');
    this.healthBar = document.getElementById('hud-health-fill');
    this.healthText = document.getElementById('hud-health-text');
    this.staminaBar = document.getElementById('hud-stamina-fill');
    this.ammoText = document.getElementById('hud-ammo-text');
    this.weaponText = document.getElementById('hud-weapon-name');
    this.objectiveBanner = document.getElementById('hud-objective-text');
    this.objectiveSub = document.getElementById('hud-objective-sub');
    this.interactionPrompt = document.getElementById('interaction-prompt');
    this.damageVignette = document.getElementById('damage-vignette');
    this.screenFade = document.getElementById('screen-fade');
    this.compassIndicator = document.getElementById('compass-tape');
  }

  initEvents() {
    window.addEventListener('resize', () => this.onWindowResize());

    // Main Menu Buttons
    document.getElementById('btn-play').addEventListener('click', () => {
      this.startGame();
    });

    document.getElementById('btn-chapters').addEventListener('click', () => {
      this.openModal(this.chaptersModal);
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
      this.openModal(this.settingsModal);
    });

    document.getElementById('btn-controls').addEventListener('click', () => {
      this.openModal(this.controlsModal);
    });

    // Pause Menu Buttons
    document.getElementById('btn-resume').addEventListener('click', () => {
      this.resumeGame();
    });

    document.getElementById('btn-pause-settings').addEventListener('click', () => {
      this.openModal(this.settingsModal);
    });

    document.getElementById('btn-pause-controls').addEventListener('click', () => {
      this.openModal(this.controlsModal);
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
      this.restartCheckpoint();
    });

    document.getElementById('btn-quit-menu').addEventListener('click', () => {
      this.returnToMenu();
    });

    // Game Over & Victory
    document.getElementById('btn-retry').addEventListener('click', () => {
      this.restartCheckpoint();
    });

    document.getElementById('btn-victory-restart').addEventListener('click', () => {
      this.returnToMenu();
    });

    // Modal Close Buttons
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });

    // Chapter Select Buttons
    document.querySelectorAll('.chapter-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const targetLevel = parseInt(card.dataset.level, 10);
        this.jumpToLevel(targetLevel);
        this.chaptersModal.classList.remove('active');
      });
    });

    // Settings inputs
    const sensInput = document.getElementById('setting-sensitivity');
    if (sensInput) {
      sensInput.addEventListener('input', (e) => {
        this.player.mouseSensitivity = parseFloat(e.target.value) * 0.001;
      });
    }

    const masterVol = document.getElementById('setting-master-vol');
    if (masterVol) {
      masterVol.addEventListener('input', (e) => {
        window.gameAudio.setMasterVolume(parseFloat(e.target.value));
      });
    }

    const sfxVol = document.getElementById('setting-sfx-vol');
    if (sfxVol) {
      sfxVol.addEventListener('input', (e) => {
        window.gameAudio.setSfxVolume(parseFloat(e.target.value));
      });
    }

    const musicVol = document.getElementById('setting-music-vol');
    if (musicVol) {
      musicVol.addEventListener('input', (e) => {
        window.gameAudio.setMusicVolume(parseFloat(e.target.value));
      });
    }

    const camSelect = document.getElementById('setting-camera-mode');
    if (camSelect) {
      camSelect.addEventListener('change', (e) => {
        if (this.player.cameraMode !== e.target.value) {
          this.player.toggleCameraMode();
        }
      });
    }

    // Escape Key for Pause
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.state === 'playing') {
          this.pauseGame();
        } else if (this.state === 'paused') {
          this.resumeGame();
        }
      }
    });

    // Pointer lock change detection (only on desktop non-touch devices)
    document.addEventListener('pointerlockchange', () => {
      const isTouch = ('ontouchstart' in window) && window.innerWidth <= 900;
      if (!isTouch && document.pointerLockElement !== this.canvas && this.state === 'playing') {
        this.pauseGame();
      }
    });
  }

  openModal(modal) {
    window.gameAudio.playUiClick();
    modal.classList.add('active');
  }

  startGame() {
    window.gameAudio.ensureContext();
    window.gameAudio.playUiClick();
    this.menuOverlay.classList.remove('active');
    this.hudContainer.classList.add('active');
    this.state = 'playing';
    this.startTime = performance.now();

    const isTouch = ('ontouchstart' in window) && window.innerWidth <= 900;
    if (!isTouch) {
      try { this.canvas.requestPointerLock(); } catch (e) {}
    }
    this.setObjective('LEVEL 1: THE PRIMEVAL FOREST', 'Follow the winding dirt path deeper into the woods.');
  }

  pauseGame() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.pauseOverlay.classList.add('active');
    try { document.exitPointerLock(); } catch (e) {}
  }

  resumeGame() {
    if (this.state !== 'paused') return;
    this.pauseOverlay.classList.remove('active');
    this.state = 'playing';
    const isTouch = ('ontouchstart' in window) && window.innerWidth <= 900;
    if (!isTouch) {
      try { this.canvas.requestPointerLock(); } catch (e) {}
    }
  }

  returnToMenu() {
    this.state = 'menu';
    this.pauseOverlay.classList.remove('active');
    this.gameOverOverlay.classList.remove('active');
    this.victoryOverlay.classList.remove('active');
    this.hudContainer.classList.remove('active');
    this.menuOverlay.classList.add('active');
    document.exitPointerLock();

    // Reset player to start
    this.jumpToLevel(1);
  }

  restartCheckpoint() {
    this.gameOverOverlay.classList.remove('active');
    this.pauseOverlay.classList.remove('active');
    this.player.health = this.player.maxHealth;
    this.player.isDead = false;
    this.player.penguin.isDead = false;
    this.player.penguin.deathProgress = 0;
    this.state = 'playing';
    this.canvas.requestPointerLock();

    this.jumpToLevel(this.currentLevel);
  }

  jumpToLevel(lvl) {
    this.currentLevel = lvl;
    this.enemyManager.clear();

    if (lvl === 1) {
      // The Forest Start
      this.world.setZoneEnvironment('forest');
      this.player.teleport(new THREE.Vector3(0, 0.1, -60));
      this.player.yaw = 0;
      this.setupLevelSpawns(1);
      this.setObjective('LEVEL 1: THE PRIMEVAL FOREST', 'Follow the winding dirt path deeper into the woods.');
    } else if (lvl === 2) {
      // The Forest Stalkers
      this.world.setZoneEnvironment('forest');
      this.player.teleport(new THREE.Vector3(0, 0.1, 10));
      this.player.yaw = 0;
      this.setupLevelSpawns(2);
      this.setObjective('LEVEL 2: THE SHADOW STALKERS', 'Hostiles detected! Eliminate entities blocking the path.');
    } else if (lvl === 3) {
      // The Ancient Monolith Door
      this.world.setZoneEnvironment('forest');
      this.player.teleport(new THREE.Vector3(0, 0.1, 62));
      this.player.yaw = 0;
      this.setupLevelSpawns(3);
      this.setObjective('LEVEL 3: THE STRANGE MONOLITH', 'Approach the towering stone door in the clearing.');
    } else if (lvl === 4) {
      // Backrooms Level 0
      this.world.setZoneEnvironment('backrooms');
      const offset = this.world.zones.backrooms;
      this.player.teleport(new THREE.Vector3(offset.x, offset.y + 0.1, offset.z));
      this.player.yaw = 0;
      this.setupLevelSpawns(4);
      this.setObjective('LEVEL 4: THE YELLOW LIMINALITY', 'Follow the glowing green guidance trail and exit signs to the portal.');
    } else if (lvl === 5) {
      // Megalopolis Colossal Void
      this.world.setZoneEnvironment('megalopolis');
      const offset = this.world.zones.megalopolis;
      this.player.teleport(new THREE.Vector3(offset.x, offset.y + 0.1, offset.z - 60));
      this.player.yaw = 0;
      this.setupLevelSpawns(5);
      this.setObjective('LEVEL 5: THE COLOSSAL VOID', 'Traverse the cyclopean avenue beneath the towering Colossus.');
    } else if (lvl === 6) {
      // The Poolrooms
      this.world.setZoneEnvironment('poolrooms');
      const offset = this.world.zones.poolrooms;
      this.player.teleport(new THREE.Vector3(offset.x, offset.y + 0.1, offset.z - 30));
      this.player.yaw = 0;
      this.setupLevelSpawns(6);
      this.setObjective('LEVEL 6: THE SUBMERGED BATHS', 'Wade through the aquatic chambers toward the celestial beacon.');
    }
  }

  setupLevelSpawns(level) {
    if (level === 1) {
      // 1 gentle scout further down
      this.enemyManager.spawnEnemy(new THREE.Vector3(4, 0, -10), 12);
    } else if (level === 2) {
      // 3 forest stalkers
      this.enemyManager.spawnEnemy(new THREE.Vector3(-6, 0, 20), 10);
      this.enemyManager.spawnEnemy(new THREE.Vector3(8, 0, 35), 12);
      this.enemyManager.spawnEnemy(new THREE.Vector3(0, 0, 48), 10);
    } else if (level === 4) {
      // Backrooms Level 0: Zero monsters (pure atmospheric liminal exploration)
    } else if (level === 5) {
      // Megalopolis void entities
      const m = this.world.zones.megalopolis;
      this.enemyManager.spawnEnemy(new THREE.Vector3(m.x - 30, m.y, m.z), 25);
      this.enemyManager.spawnEnemy(new THREE.Vector3(m.x + 30, m.y, m.z), 25);
    } else if (level === 6) {
      // Poolrooms entities
      const p = this.world.zones.poolrooms;
      this.enemyManager.spawnEnemy(new THREE.Vector3(p.x - 15, p.y, p.z), 15);
      this.enemyManager.spawnEnemy(new THREE.Vector3(p.x + 15, p.y, p.z + 10), 15);
    }
  }

  setObjective(mainText, subText) {
    this.objectiveBanner.textContent = mainText;
    this.objectiveSub.textContent = subText;
    window.gameAudio.playObjectiveChime();

    // Pulse animation
    this.objectiveBanner.parentElement.classList.remove('pulse');
    void this.objectiveBanner.parentElement.offsetWidth; // trigger reflow
    this.objectiveBanner.parentElement.classList.add('pulse');
  }

  handleInteraction(item) {
    if (item.action === 'open_ancient_door') {
      item.isOpen = true;
      this.world.doorOpening = true;
      window.gameAudio.playDoorOpen();
      this.triggerDimensionalTransition('backrooms', () => {
        this.jumpToLevel(4);
      });
    } else if (item.action === 'enter_megalopolis') {
      this.triggerDimensionalTransition('megalopolis', () => {
        this.jumpToLevel(5);
      });
    } else if (item.action === 'enter_poolrooms') {
      this.triggerDimensionalTransition('poolrooms', () => {
        this.jumpToLevel(6);
      });
    } else if (item.action === 'take_ammo') {
      item.isCollected = true;
      item.mesh.visible = false;
      this.player.gun.addAmmo(item.ammoAmount || 20);
      window.gameAudio.playReload();
    } else if (item.action === 'final_victory') {
      this.triggerVictorySequence();
    }
  }

  /**
   * Dramatic dimensional transition screen fade & sound warp
   */
  triggerDimensionalTransition(targetZone, callback) {
    this.state = 'transition';
    window.gameAudio.playPortalTransition();

    // Fade to pitch black with distortion
    this.screenFade.classList.add('active');

    setTimeout(() => {
      if (callback) callback();
      this.world.setZoneEnvironment(targetZone);

      setTimeout(() => {
        this.screenFade.classList.remove('active');
        this.state = 'playing';
      }, 600);
    }, 1800);
  }

  onPlayerHurt() {
    this.damageVignette.classList.add('flash');
    setTimeout(() => {
      this.damageVignette.classList.remove('flash');
    }, 280);
  }

  onPlayerDead() {
    this.state = 'gameover';
    document.exitPointerLock();
    setTimeout(() => {
      this.gameOverOverlay.classList.add('active');
    }, 1200);
  }

  triggerVictorySequence() {
    this.state = 'victory';
    document.exitPointerLock();
    window.gameAudio.playObjectiveChime();

    // Calculate elapsed time
    const totalSecs = Math.floor((performance.now() - this.startTime) / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const timeFormatted = `${mins}m ${secs}s`;

    document.getElementById('stat-time').textContent = timeFormatted;
    document.getElementById('stat-ammo').textContent = this.player.gun.reserveAmmo;

    setTimeout(() => {
      this.victoryOverlay.classList.add('active');
    }, 1000);
  }

  updateHUD() {
    // Health bar
    const hpPct = Math.max(0, (this.player.health / this.player.maxHealth) * 100);
    this.healthBar.style.width = `${hpPct}%`;
    this.healthText.textContent = `${Math.ceil(this.player.health)} / 100`;

    // Stamina bar
    const stPct = Math.max(0, (this.player.stamina / this.player.maxStamina) * 100);
    this.staminaBar.style.width = `${stPct}%`;

    // Ammo
    this.ammoText.textContent = `${this.player.gun.ammo} / ${this.player.gun.reserveAmmo}`;
    this.weaponText.textContent = 'PEN-9 CARBINE';

    // Interaction prompt
    if (this.player.activeInteractable) {
      this.interactionPrompt.textContent = this.player.activeInteractable.prompt;
      this.interactionPrompt.classList.add('active');
    } else {
      this.interactionPrompt.classList.remove('active');
    }

    // Compass direction
    const deg = Math.round((-this.player.yaw * 180 / Math.PI) % 360);
    const normalizedDeg = (deg < 0) ? deg + 360 : deg;
    this.compassIndicator.style.transform = `translateX(${-normalizedDeg * 2}px)`;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Main Engine Loop (Target 60 FPS)
   */
  startLoop() {
    const animate = () => {
      requestAnimationFrame(animate);

      const dt = Math.min(this.clock.getDelta(), 0.1);

      if (this.state === 'playing' || this.state === 'transition') {
        const inWater = this.world.isInWater(this.player.position);

        // Update player
        this.player.update(dt, this.world.colliders, this.world.interactables, inWater);

        // Update enemies
        this.enemyManager.update(dt, this.player.position, (damage) => {
          this.player.takeDamage(damage);
        });

        // Update world animations
        this.world.update(dt, this.player.position);

        // Dynamic objective triggers based on progression in forest
        if (this.currentLevel === 1 && this.player.position.z > 5) {
          this.currentLevel = 2;
          this.setObjective('LEVEL 2: THE SHADOW STALKERS', 'Hostiles detected in the fog! Neutralize threats.');
        } else if (this.currentLevel === 2 && this.player.position.z > 55) {
          this.currentLevel = 3;
          this.setObjective('LEVEL 3: THE ANCIENT MONOLITH', 'Approach the towering stone door and open it [E].');
        }

        // Update HUD
        this.updateHUD();
      }

      // Render 3D Scene
      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }
}

// Bootstrap once window DOM loads
window.addEventListener('DOMContentLoaded', () => {
  window.gameDirector = new GameDirector();
  window.gameDirector.startLoop();
});
