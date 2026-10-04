/**
 * THE PENGUIN: BEYOND THE DOOR
 * Audio Engine - Complete Web Audio API Procedural Synthesizer
 * 100% self-contained, zero external asset dependencies, zero 404s.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.ambienceGain = null;
    
    this.masterVolume = 0.8;
    this.sfxVolume = 0.9;
    this.musicVolume = 0.6;
    
    this.isMuted = false;
    this.isInitialized = false;
    
    // Ambient sound nodes
    this.currentZone = 'none';
    this.activeAmbienceNodes = [];
    this.ambienceInterval = null;
    this.flickerInterval = null;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('Web Audio API not supported.');
        return;
      }
      this.ctx = new AudioContextClass();
      
      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      
      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
      
      // Music / Ambience Gain
      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.ambienceGain.connect(this.masterGain);

      this.isInitialized = true;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn('Could not initialize Web Audio:', e);
    }
  }

  ensureContext() {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.ambienceGain && this.ctx) {
      this.ambienceGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  }

  // --- PROCEDURAL SOUND GENERATORS ---

  /**
   * Gunshot: Punchy crack + low-end thud + sub bass drop + mechanical slide rattle
   */
  playGunshot(silenced = false) {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Noise transient (gunshot crack)
    const bufferSize = this.ctx.sampleRate * 0.35;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.05));
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = silenced ? 'lowpass' : 'bandpass';
    noiseFilter.frequency.setValueAtTime(silenced ? 600 : 1800, now);
    noiseFilter.Q.setValueAtTime(2.0, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(silenced ? 0.4 : 1.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noiseSource.start(now);

    // 2. Punch sub-bass sine drop
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(silenced ? 100 : 180, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.25);

    oscGain.gain.setValueAtTime(silenced ? 0.3 : 1.0, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.3);

    // 3. Shell casing clink after short delay
    setTimeout(() => {
      this.playCasingDrop();
    }, 140 + Math.random() * 60);
  }

  /**
   * Shell casing bouncing on ground
   */
  playCasingDrop() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const pitch = 2200 + Math.random() * 800;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.8, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Dry fire click when ammo is empty
   */
  playDryFire() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Reload sequence: mag eject, mag insert, slide rack
   */
  playReload() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Stage 1: Mag release (immediate)
    this.playMechanicalClick(now, 450, 0.06, 0.35);

    // Stage 2: Mag insert (0.5s)
    setTimeout(() => {
      if (!this.ctx) return;
      const t2 = this.ctx.currentTime;
      this.playMechanicalClick(t2, 700, 0.08, 0.5);
      this.playMechanicalClick(t2 + 0.06, 320, 0.12, 0.6);
    }, 550);

    // Stage 3: Slide rack back and forward (1.1s)
    setTimeout(() => {
      if (!this.ctx) return;
      const t3 = this.ctx.currentTime;
      this.playMechanicalClick(t3, 1100, 0.1, 0.45);
      this.playMechanicalClick(t3 + 0.15, 620, 0.12, 0.7);
    }, 1100);
  }

  playMechanicalClick(time, freq, dur, volume) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, time + dur);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, time);
    filter.Q.setValueAtTime(3.0, time);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + dur);
  }

  /**
   * Footsteps adapted for surface: dirt, carpet, tile, water
   */
  playFootstep(surface = 'dirt', isSprint = false) {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const vol = isSprint ? 0.35 : 0.2;

    if (surface === 'water') {
      // Fluid splash
      this.playWaterSplash(0.4);
      return;
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    if (surface === 'carpet') {
      // Muffled low thud
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90 + Math.random() * 20, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.1);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, now);
      gain.gain.setValueAtTime(vol * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    } else if (surface === 'tile') {
      // Crisp click on ceramic
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400 + Math.random() * 400, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(vol * 0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    } else {
      // Dirt / leaves: gritty low thump with noise
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120 + Math.random() * 30, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.11);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playWaterSplash(scale = 0.5) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const bufLen = this.ctx.sampleRate * 0.25;
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800 + Math.random() * 300, now);
    filter.Q.setValueAtTime(1.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(scale * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    src.start(now);
  }

  /**
   * Jump & Landing sounds
   */
  playJump() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.15);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playLand() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Bullet Impact sounds
   */
  playBulletImpact(type = 'dirt') {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (type === 'metal' || type === 'ricochet') {
      // High-pitched ricochet ping
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(3000 + Math.random() * 1500, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'flesh' || type === 'enemy') {
      // Deep biological impact thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.16);
    } else {
      // Wood/stone dull crack
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(260 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }

  /**
   * Enemy Sounds: Lurker roar, attack, hurt, death
   */
  playEnemyAlert() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(240, now + 0.4);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.8);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, now);
    filter.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.9);
  }

  playEnemyAttack() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Rapid whoosh / swipe
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.2);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playEnemyHurt() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.18);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playEnemyDie() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.9);
    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 1.0);
  }

  /**
   * Player damage / pain
   */
  playPlayerDamage() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Heartbeat thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.28);

    // Muffled gasp / noise
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(220, now);
    osc2.frequency.exponentialRampToValueAtTime(80, now + 0.3);
    gain2.gain.setValueAtTime(0.4, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(now);
    osc2.stop(now + 0.36);
  }

  /**
   * Door Opening: deep stone grinding drone
   */
  playDoorOpen() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.linearRampToValueAtTime(45, now + 1.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.65, now + 0.4);
    gain.gain.linearRampToValueAtTime(0.6, now + 1.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 2.1);
  }

  /**
   * Dimensional Portal Transition: Cosmic riser + bass rumble + dimensional warp
   */
  playPortalTransition() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Riser
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(80, now);
    osc1.frequency.exponentialRampToValueAtTime(1200, now + 2.2);

    gain1.gain.setValueAtTime(0.01, now);
    gain1.gain.linearRampToValueAtTime(0.5, now + 1.8);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 2.6);

    // Sub-bass drop
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(220, now + 1.8);
    osc2.frequency.exponentialRampToValueAtTime(28, now + 3.2);

    gain2.gain.setValueAtTime(0.0, now);
    gain2.gain.setValueAtTime(0.85, now + 1.85);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(now + 1.8);
    osc2.stop(now + 3.6);
  }

  /**
   * UI Click
   */
  playUiClick() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * Objective Complete chime
   */
  playObjectiveChime() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.08);
      gain.gain.setValueAtTime(0.18, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.45);
    });
  }

  // --- AMBIENCE SYSTEM BY ENVIRONMENT ZONE ---

  /**
   * Transition Ambience to a specific game zone:
   * 'forest', 'backrooms', 'megalophobia', 'poolrooms', 'victory'
   */
  setAmbienceZone(zone) {
    if (this.currentZone === zone) return;
    this.ensureContext();
    this.stopAmbience();
    this.currentZone = zone;

    if (!this.ctx) return;

    if (zone === 'forest') {
      this.startForestAmbience();
    } else if (zone === 'backrooms') {
      this.startBackroomsAmbience();
    } else if (zone === 'megalophobia') {
      this.startMegalophobiaAmbience();
    } else if (zone === 'poolrooms') {
      this.startPoolroomsAmbience();
    }
  }

  stopAmbience() {
    if (this.ambienceInterval) {
      clearInterval(this.ambienceInterval);
      this.ambienceInterval = null;
    }
    if (this.flickerInterval) {
      clearInterval(this.flickerInterval);
      this.flickerInterval = null;
    }
    this.activeAmbienceNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    this.activeAmbienceNodes = [];
  }

  /**
   * Forest Ambience: gentle wind + procedural bird chirps & cricket hum
   */
  startForestAmbience() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Wind filtered noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }
    const windSource = this.ctx.createBufferSource();
    windSource.buffer = noiseBuffer;
    windSource.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.setValueAtTime(320, now);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.25, now);

    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.ambienceGain);
    windSource.start(now);

    this.activeAmbienceNodes.push(windSource, windGain, windFilter);

    // Low tree rustle LFO
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.15, now);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(120, now);
    lfo.connect(lfoGain);
    lfoGain.connect(windFilter.frequency);
    lfo.start(now);
    this.activeAmbienceNodes.push(lfo, lfoGain);

    // Randomized distant bird chirp / cricket interval
    this.ambienceInterval = setInterval(() => {
      if (Math.random() > 0.4) {
        this.playProceduralBird();
      }
    }, 4500);
  }

  playProceduralBird() {
    if (!this.ctx || this.currentZone !== 'forest') return;
    const now = this.ctx.currentTime;
    const baseFreq = 2200 + Math.random() * 800;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.linearRampToValueAtTime(baseFreq + 500, now + 0.05);
    osc.frequency.linearRampToValueAtTime(baseFreq - 200, now + 0.12);
    osc.frequency.linearRampToValueAtTime(baseFreq + 300, now + 0.18);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ambienceGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Backrooms Ambience: 60Hz and 120Hz electrical fluorescent light buzzing
   */
  startBackroomsAmbience() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 60 Hz hum
    const osc60 = this.ctx.createOscillator();
    osc60.type = 'sawtooth';
    osc60.frequency.setValueAtTime(60, now);

    const filter60 = this.ctx.createBiquadFilter();
    filter60.type = 'bandpass';
    filter60.frequency.setValueAtTime(120, now);
    filter60.Q.setValueAtTime(5.0, now);

    const gain60 = this.ctx.createGain();
    gain60.gain.setValueAtTime(0.28, now);

    osc60.connect(filter60);
    filter60.connect(gain60);
    gain60.connect(this.ambienceGain);
    osc60.start(now);

    // 120 Hz buzz overtone
    const osc120 = this.ctx.createOscillator();
    osc120.type = 'square';
    osc120.frequency.setValueAtTime(120, now);

    const gain120 = this.ctx.createGain();
    gain120.gain.setValueAtTime(0.12, now);

    osc120.connect(gain120);
    gain120.connect(this.ambienceGain);
    osc120.start(now);

    this.activeAmbienceNodes.push(osc60, filter60, gain60, osc120, gain120);

    // Occasional fluorescent flicker dropout / crackle
    this.flickerInterval = setInterval(() => {
      if (Math.random() < 0.25) {
        this.playLightFlicker();
      }
    }, 6000);
  }

  playLightFlicker() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(240, now);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.setValueAtTime(0.01, now + 0.04);
    gain.gain.setValueAtTime(0.18, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ambienceGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * Megalophobia Ambience: Sub-bass 32Hz cathedral drone + cavern reverb sweep
   */
  startMegalophobiaAmbience() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(32, now);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.5, now);

    subOsc.connect(subGain);
    subGain.connect(this.ambienceGain);
    subOsc.start(now);

    // Eerie resonant drone
    const droneOsc = this.ctx.createOscillator();
    droneOsc.type = 'triangle';
    droneOsc.frequency.setValueAtTime(64, now);

    const droneFilter = this.ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(200, now);

    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.3, now);

    droneOsc.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(this.ambienceGain);
    droneOsc.start(now);

    this.activeAmbienceNodes.push(subOsc, subGain, droneOsc, droneFilter, droneGain);

    // Creepy distant metallic moan
    this.ambienceInterval = setInterval(() => {
      if (Math.random() < 0.4) {
        this.playDistantEchoMoan();
      }
    }, 7000);
  }

  playDistantEchoMoan() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.linearRampToValueAtTime(110, now + 1.5);
    osc.frequency.linearRampToValueAtTime(65, now + 3.0);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(180, now);
    filter.Q.setValueAtTime(6.0, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambienceGain);

    osc.start(now);
    osc.stop(now + 3.3);
  }

  /**
   * Poolrooms Ambience: Cavernous echo delay + randomized water drips
   */
  startPoolroomsAmbience() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Gentle watery background hum
    const humOsc = this.ctx.createOscillator();
    humOsc.type = 'sine';
    humOsc.frequency.setValueAtTime(85, now);

    const humGain = this.ctx.createGain();
    humGain.gain.setValueAtTime(0.18, now);

    humOsc.connect(humGain);
    humGain.connect(this.ambienceGain);
    humOsc.start(now);

    this.activeAmbienceNodes.push(humOsc, humGain);

    // Periodic dripping sounds echoing in the cavernous pool
    this.ambienceInterval = setInterval(() => {
      this.playWaterDrip();
    }, 2800);
  }

  playWaterDrip() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const pitch = 1400 + Math.random() * 600;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ambienceGain);
    osc.start(now);
    osc.stop(now + 0.18);

    // Echo reflection 0.22s later
    setTimeout(() => {
      if (!this.ctx || this.currentZone !== 'poolrooms') return;
      const tEcho = this.ctx.currentTime;
      const oscEcho = this.ctx.createOscillator();
      const gainEcho = this.ctx.createGain();
      oscEcho.type = 'sine';
      oscEcho.frequency.setValueAtTime(pitch * 0.95, tEcho);
      gainEcho.gain.setValueAtTime(0.08, tEcho);
      gainEcho.gain.exponentialRampToValueAtTime(0.001, tEcho + 0.14);
      oscEcho.connect(gainEcho);
      gainEcho.connect(this.ambienceGain);
      oscEcho.start(tEcho);
      oscEcho.stop(tEcho + 0.16);
    }, 220);
  }
}

// Global audio engine singleton
window.gameAudio = new SoundEngine();
